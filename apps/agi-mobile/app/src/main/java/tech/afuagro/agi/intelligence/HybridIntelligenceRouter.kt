package tech.afuagro.agi.intelligence

import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.RoutingDecision
import tech.afuagro.agi.core.model.RoutingStrategy
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.LocalModelEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState

class HybridIntelligenceRouter {

    fun decide(
        prompt: String,
        settings: AgiSettingsState,
        telemetry: HardwareTelemetry,
        activeLocalModel: LocalModelEntity?,
        providers: List<ApiProviderEntity>,
        hasSensitiveLocalAttachment: Boolean = false
    ): RoutingDecision {
        val backendConfigured = settings.agiBackendUrl.isNotBlank() || settings.n8nBaseUrl.isNotBlank()
        val networkAllowsCloud = telemetry.isOnline && !(settings.wifiOnlySync && telemetry.isMetered)
        val cloudPossible = !settings.cloudDisabledCompletely && backendConfigured && networkAllowsCloud

        val localModelName = activeLocalModel?.name ?: "AGI Local Core"
        val cloudModelName = selectCloudModel(prompt, settings.routingStrategy, providers)

        if (settings.cloudDisabledCompletely) {
            return RoutingDecision(
                effectiveMode = IntelligenceMode.LOCAL,
                reason = "Comunicação em nuvem desativada pelo usuário nas configurações de segurança.",
                canExecuteCloud = false,
                canExecuteLocal = true,
                activeModelLabel = localModelName
            )
        }

        return when (settings.intelligenceMode) {
            IntelligenceMode.LOCAL -> RoutingDecision(
                effectiveMode = IntelligenceMode.LOCAL,
                reason = "Modo LOCAL selecionado manualmente (processamento privado no dispositivo).",
                canExecuteCloud = false,
                canExecuteLocal = true,
                activeModelLabel = localModelName
            )

            IntelligenceMode.CLOUD -> {
                if (cloudPossible) {
                    RoutingDecision(
                        effectiveMode = IntelligenceMode.CLOUD,
                        reason = "Modo CLOUD ativo via orquestrador n8n (${settings.routingStrategy.label}).",
                        canExecuteCloud = true,
                        canExecuteLocal = false,
                        activeModelLabel = cloudModelName
                    )
                } else {
                    val cause = when {
                        !telemetry.isOnline -> "Sem conexão com a internet."
                        settings.wifiOnlySync && telemetry.isMetered -> "Dados móveis bloqueados pela política Somente Wi-Fi."
                        !backendConfigured -> "URL do Servidor AGI / n8n não configurada."
                        else -> "Servidor indisponível."
                    }
                    RoutingDecision(
                        effectiveMode = IntelligenceMode.CLOUD,
                        reason = "CLOUD indisponível: $cause",
                        canExecuteCloud = false,
                        canExecuteLocal = false,
                        activeModelLabel = cloudModelName
                    )
                }
            }

            IntelligenceMode.AUTO -> {
                val isComplexPrompt = prompt.length > 220 ||
                    COMPLEX_KEYWORDS.any { prompt.contains(it, ignoreCase = true) }
                val deviceConstrained = telemetry.lowMemory || telemetry.thermalStatusLabel == "Crítica"

                when {
                    hasSensitiveLocalAttachment && !cloudPossible -> RoutingDecision(
                        effectiveMode = IntelligenceMode.LOCAL,
                        reason = "AUTO escolheu LOCAL para proteger anexo local sem nuvem configurada.",
                        canExecuteCloud = false,
                        canExecuteLocal = true,
                        activeModelLabel = localModelName
                    )
                    cloudPossible && (isComplexPrompt || deviceConstrained) -> RoutingDecision(
                        effectiveMode = IntelligenceMode.CLOUD,
                        reason = if (deviceConstrained) {
                            "AUTO encaminhou para CLOUD devido à pressão de RAM/temperatura no dispositivo."
                        } else {
                            "AUTO encaminhou para CLOUD pela complexidade multiagente da solicitação."
                        },
                        canExecuteCloud = true,
                        canExecuteLocal = true,
                        activeModelLabel = cloudModelName
                    )
                    !cloudPossible -> RoutingDecision(
                        effectiveMode = IntelligenceMode.LOCAL,
                        reason = "AUTO alternou para LOCAL (offline ou backend não configurado).",
                        canExecuteCloud = false,
                        canExecuteLocal = true,
                        activeModelLabel = localModelName
                    )
                    else -> RoutingDecision(
                        effectiveMode = IntelligenceMode.LOCAL,
                        reason = "AUTO atendeu localmente (consulta rápida com menor latência e custo zero).",
                        canExecuteCloud = true,
                        canExecuteLocal = true,
                        activeModelLabel = localModelName
                    )
                }
            }

            IntelligenceMode.HYBRID -> {
                if (cloudPossible) {
                    RoutingDecision(
                        effectiveMode = IntelligenceMode.HYBRID,
                        reason = "HYBRID: memória e contexto indexados localmente + execução orquestrada via n8n.",
                        canExecuteCloud = true,
                        canExecuteLocal = true,
                        activeModelLabel = "$localModelName + $cloudModelName"
                    )
                } else {
                    RoutingDecision(
                        effectiveMode = IntelligenceMode.LOCAL,
                        reason = "HYBRID em contingência LOCAL: nuvem indisponível no momento.",
                        canExecuteCloud = false,
                        canExecuteLocal = true,
                        activeModelLabel = localModelName
                    )
                }
            }
        }
    }

    fun selectCloudModel(
        prompt: String,
        strategy: RoutingStrategy,
        providers: List<ApiProviderEntity>
    ): String {
        val enabled = providers.filter { it.isEnabled }.sortedBy { it.priorityOrder }
        if (enabled.isEmpty()) return "Orquestrador Padrão"

        return when (strategy) {
            RoutingStrategy.MANUAL -> enabled.first().defaultModel
            RoutingStrategy.COST -> enabled.minByOrNull { it.costPer1kTokensUsd }?.defaultModel ?: enabled.first().defaultModel
            RoutingStrategy.PERFORMANCE -> {
                enabled.maxByOrNull { it.maxContextTokens }?.defaultModel ?: enabled.first().defaultModel
            }
            RoutingStrategy.SPECIALTY -> {
                val lower = prompt.lowercase()
                when {
                    lower.contains("código") || lower.contains("kotlin") || lower.contains("python") || lower.contains("api") || lower.contains("sql") ->
                        enabled.firstOrNull { it.id == "prov_deepseek" || it.availableModelsCsv.contains("coder") }?.defaultModel
                            ?: enabled.first().defaultModel
                    lower.contains("pesquisa") || lower.contains("documento") || lower.contains("pdf") ->
                        enabled.firstOrNull { it.id == "prov_gemini" }?.defaultModel ?: enabled.first().defaultModel
                    lower.contains("plano") || lower.contains("estratégia") || lower.contains("análise") ->
                        enabled.firstOrNull { it.id == "prov_anthropic" || it.id == "prov_openai" }?.defaultModel
                            ?: enabled.first().defaultModel
                    else -> enabled.first().defaultModel
                }
            }
            RoutingStrategy.AUTO, RoutingStrategy.FALLBACK -> enabled.first().defaultModel
        }
    }

    companion object {
        private val COMPLEX_KEYWORDS = listOf(
            "n8n", "workflow", "webhook", "pesquise na web", "multiagente",
            "relatório completo", "integrar api", "executar fluxo", "auditar sistema",
            "pesquisar", "internet", "sincronizar"
        )
    }
}
