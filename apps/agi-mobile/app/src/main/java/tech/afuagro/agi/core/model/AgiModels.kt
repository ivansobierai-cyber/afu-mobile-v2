package tech.afuagro.agi.core.model

enum class IntelligenceMode(val label: String, val description: String) {
    LOCAL("LOCAL", "Execução 100% offline no dispositivo, sem envio de dados à nuvem"),
    CLOUD("CLOUD", "Orquestração completa via n8n, subagentes e API Router em nuvem"),
    AUTO("AUTO", "Seleção inteligente conforme rede, hardware, custo e privacidade"),
    HYBRID("HYBRID", "Distribui memória/triagem local e execução pesada na nuvem")
}

enum class RoutingStrategy(val label: String, val description: String) {
    MANUAL("Manual", "O usuário define explicitamente o modelo ativo"),
    AUTO("Automático", "A AGI escolhe o modelo conforme complexidade da solicitação"),
    SPECIALTY("Por Especialidade", "Código, análise, pesquisa ou planejamento por modelo"),
    COST("Por Custo", "Prioriza modelos econômicos e menor custo por 1K tokens"),
    PERFORMANCE("Por Desempenho", "Prioriza modelos de maior capacidade e precisão"),
    FALLBACK("Com Fallback", "Aciona o próximo provedor em prioridade se o principal falhar")
}

enum class OperationalStage(val stepIndex: Int, val label: String) {
    IDLE(0, "Pronto para comando"),
    INTERPRETING(1, "1. Interpretando solicitação"),
    PLANNING(2, "2. Criando plano de execução"),
    DELEGATING(3, "3. Delegando tarefas"),
    CONSULTING_AGENTS(4, "4. Consultando subagentes"),
    EXECUTING(5, "5. Executando operações"),
    VALIDATING(6, "6. Validando resultados"),
    CONCLUDING(7, "7. Concluindo resposta")
}

enum class AgentStatus(val label: String) {
    ACTIVE("Ativo"),
    RUNNING("Em execução"),
    PAUSED("Pausado"),
    ERROR("Erro")
}

enum class TaskStatus(val label: String) {
    PENDING("Pendente"),
    RUNNING("Em execução"),
    COMPLETED("Concluída"),
    FAILED("Com falha"),
    AWAITING_AUTH("Aguardando autorização")
}

enum class TaskPriority(val label: String, val weight: Int) {
    CRITICAL("Crítica", 4),
    HIGH("Alta", 3),
    MEDIUM("Média", 2),
    LOW("Baixa", 1)
}

enum class MemoryLayer(val label: String, val description: String) {
    SHORT_TERM("Curto Prazo", "Contexto imediato da sessão e tarefas ativas"),
    LONG_TERM("Longo Prazo", "Históricos consolidados, experiências e decisões"),
    OPERATIONAL("Operacional", "Estado de tarefas, agentes, execuções e dependências"),
    SEMANTIC("Semântica", "Indexação vetorial local e recuperação por significado")
}

enum class MemoryCategory(val label: String) {
    CONVERSATIONS("Histórico de Conversas"),
    KNOWLEDGE("Conhecimentos"),
    PROJECTS("Projetos"),
    EXPERIENCES("Experiências"),
    COMPLETED_TASKS("Tarefas Concluídas"),
    PREFERENCES("Preferências"),
    IMPORTANT_INFO("Informações Importantes")
}

enum class SyncStatus(val label: String) {
    LOCAL_ONLY("Local"),
    PENDING_SYNC("Pendente"),
    SYNCED("Sincronizado"),
    CONFLICT("Conflito")
}

enum class SyncConflictStrategy(val label: String) {
    ASK("Perguntar ao usuário"),
    SERVER_WINS("Priorizar Servidor"),
    LOCAL_WINS("Priorizar Dispositivo")
}

enum class ProviderAuthType(val label: String) {
    BEARER("Bearer Token"),
    API_KEY_HEADER("Header x-api-key"),
    QUERY_PARAM("Query Parameter"),
    NONE("Sem Autenticação")
}

data class HardwareTelemetry(
    val totalRamMb: Long = 0L,
    val availableRamMb: Long = 0L,
    val lowMemory: Boolean = false,
    val totalStorageGb: Float = 0f,
    val freeStorageGb: Float = 0f,
    val batteryLevel: Int = 100,
    val temperatureCelsius: Float = 0f,
    val thermalStatusLabel: String = "Normal",
    val cpuCores: Int = 1,
    val abi: String = "arm64-v8a",
    val isOnline: Boolean = false,
    val isWifi: Boolean = false,
    val isMetered: Boolean = false
) {
    val usedRamMb: Long get() = (totalRamMb - availableRamMb).coerceAtLeast(0L)
    val ramUsageFraction: Float get() = if (totalRamMb > 0) usedRamMb.toFloat() / totalRamMb else 0f
}

data class RoutingDecision(
    val effectiveMode: IntelligenceMode,
    val reason: String,
    val canExecuteCloud: Boolean,
    val canExecuteLocal: Boolean,
    val activeModelLabel: String
)

data class AttachmentPayload(
    val id: String,
    val name: String,
    val mimeType: String,
    val uriString: String,
    val sizeBytes: Long = 0L,
    val textPreview: String? = null
)
