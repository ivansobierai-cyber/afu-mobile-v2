package tech.afuagro.agi.ui.screens.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.TaskStatus
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.data.local.TelemetryLogEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.network.BackendProbeResult
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.CrimsonAlert
import tech.afuagro.agi.ui.theme.NeonMint
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun DashboardScreen(
    settings: AgiSettingsState,
    backendStatus: BackendProbeResult,
    agents: List<AgentEntity>,
    tasks: List<TaskEntity>,
    providers: List<ApiProviderEntity>,
    logs: List<TelemetryLogEntity>,
    onProbeBackend: () -> Unit,
    onRefreshFarmContext: () -> Unit = {},
    onOpenAgents: () -> Unit = {},
    onOpenTasks: () -> Unit = {},
    onOpenPlantHealthy: () -> Unit = {},
    onOpenSettings: () -> Unit = {},
    showBack: Boolean = true,
    onBack: () -> Unit
) {
    val activeAgentsCount = agents.count { it.isEnabled }
    val runningTasksCount = tasks.count { it.status == TaskStatus.RUNNING.name }
    val totalTokens = logs.sumOf { it.tokensUsed }
    val totalCostUsd = logs.sumOf { it.estimatedCostUsd }
    val measuredLatencies = logs.map { it.latencyMs }.filter { it > 0L }
    val avgLatencyMs = if (measuredLatencies.isNotEmpty()) measuredLatencies.average().toLong() else 0L
    val connectedProviders = providers.count {
        it.connectionStatus.contains("Conectado", true) || it.connectionStatus.contains("Online", true)
    }
    val recentErrors = remember(logs) { logs.filter { it.level == "ERROR" || it.level == "WARN" } }

    Column(modifier = Modifier.fillMaxSize()) {
        AgiSubScreenTopBar(
            title = "PAINEL AFU AGI",
            subtitle = "Agentes, tarefas, monitoramento e fazenda",
            onBack = if (showBack) onBack else null,
            actions = {
                IconButton(onClick = {
                    onProbeBackend()
                    onRefreshFarmContext()
                }) {
                    Icon(Icons.Default.Refresh, contentDescription = "Atualizar painel")
                }
            }
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                AgiGlassCard(highlighted = settings.afuLoggedIn) {
                    Text("RESUMO DA FAZENDA (AFU)", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(6.dp))
                    if (!settings.afuLoggedIn) {
                        Text(
                            "Faça login com a conta AFU Agro em Configurações para carregar organização e propriedade.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(8.dp))
                        OutlinedButton(onClick = onOpenSettings) { Text("Abrir login AFU") }
                    } else {
                        Text(settings.afuUserName.ifBlank { settings.afuUserEmail }.ifBlank { "Usuário AFU" }, style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Org: ${settings.afuOrganizationName.ifBlank { "—" }} (#${settings.afuOrganizationId})",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            "Propriedade: ${settings.afuPropriedadeName.ifBlank { "não selecionada" }}",
                            style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                            "API: ${settings.afuApiBaseUrl.ifBlank { settings.plantApiBaseUrl.ifBlank { "—" }}}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(onClick = onOpenAgents) {
                                Icon(Icons.Default.SmartToy, contentDescription = null)
                                Spacer(Modifier.width(6.dp))
                                Text("Agentes")
                            }
                            OutlinedButton(onClick = onOpenTasks) {
                                Icon(Icons.Default.Assignment, contentDescription = null)
                                Spacer(Modifier.width(6.dp))
                                Text("Tarefas")
                            }
                            OutlinedButton(onClick = onOpenPlantHealthy) {
                                Icon(Icons.Default.Agriculture, contentDescription = null)
                                Spacer(Modifier.width(6.dp))
                                Text("Planta")
                            }
                        }
                    }
                }
            }

            item {
                Text("MONITORAMENTO", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricBox(
                        title = "ESTADO AGI",
                        value = if (backendStatus.reachable) "Online" else "Local/Off",
                        subtitle = "n8n: ${backendStatus.n8nStatus}",
                        isHighlight = backendStatus.reachable,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        title = "PROVEDORES",
                        value = "$connectedProviders/${providers.size}",
                        subtitle = "Modo ${settings.intelligenceMode.label}",
                        isHighlight = connectedProviders > 0,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricBox(
                        title = "AGENTES ATIVOS",
                        value = "$activeAgentsCount/${agents.size}",
                        subtitle = "$runningTasksCount em execução",
                        isHighlight = true,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        title = "TOTAL TAREFAS",
                        value = "${tasks.size}",
                        subtitle = "${tasks.count { it.status == TaskStatus.COMPLETED.name }} concluídas",
                        isHighlight = false,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    MetricBox(
                        title = "CONSUMO TOKENS",
                        value = "$totalTokens",
                        subtitle = "Custo est.: $${"%.4f".format(totalCostUsd)}",
                        isHighlight = false,
                        modifier = Modifier.weight(1f)
                    )
                    MetricBox(
                        title = "LATÊNCIA MÉDIA",
                        value = "$avgLatencyMs ms",
                        subtitle = "${measuredLatencies.size} medições reais",
                        isHighlight = false,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Real Latency Telemetry Chart
            item {
                AgiGlassCard {
                    Text("HISTÓRICO DE LATÊNCIA REAL (MS)", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(10.dp))
                    if (measuredLatencies.isEmpty()) {
                        Text(
                            "Nenhuma medição de rede ou inferência registrada nesta instalação ainda.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    } else {
                        val barColor = MaterialTheme.colorScheme.primary
                        val trackColor = MaterialTheme.colorScheme.surfaceVariant
                        val points = measuredLatencies.take(14).reversed()
                        val maxLat = (points.maxOrNull() ?: 100L).coerceAtLeast(50L).toFloat()

                        Canvas(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                        ) {
                            val count = points.size.coerceAtLeast(1)
                            val spacing = 8.dp.toPx()
                            val barWidth = ((size.width - spacing * (count - 1)) / count).coerceAtLeast(8f)
                            points.forEachIndexed { idx, value ->
                                val ratio = (value / maxLat).coerceIn(0.08f, 1f)
                                val barH = size.height * ratio
                                val x = idx * (barWidth + spacing)
                                drawRoundRect(
                                    color = trackColor,
                                    topLeft = Offset(x, 0f),
                                    size = Size(barWidth, size.height),
                                    cornerRadius = CornerRadius(6f, 6f)
                                )
                                drawRoundRect(
                                    color = barColor,
                                    topLeft = Offset(x, size.height - barH),
                                    size = Size(barWidth, barH),
                                    cornerRadius = CornerRadius(6f, 6f)
                                )
                            }
                        }
                    }
                }
            }

            item {
                Text("ERROS E ALERTAS RECENTES (${recentErrors.size})", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }

            if (recentErrors.isEmpty()) {
                item {
                    AgiGlassCard {
                        Text("Nenhum erro ou alerta registrado.", style = MaterialTheme.typography.bodyMedium, color = NeonMint)
                    }
                }
            } else {
                items(recentErrors.take(15), key = { it.id }) { log ->
                    val time = remember(log.timestamp) {
                        SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(log.timestamp))
                    }
                    AgiGlassCard {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(log.source, style = MaterialTheme.typography.labelMedium, color = if (log.level == "ERROR") CrimsonAlert else AmberPulse)
                            Text(time, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(log.message, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricBox(
    title: String,
    value: String,
    subtitle: String,
    isHighlight: Boolean,
    modifier: Modifier = Modifier
) {
    AgiGlassCard(highlighted = isHighlight, modifier = modifier) {
        Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(4.dp))
        Text(value, style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
        Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
