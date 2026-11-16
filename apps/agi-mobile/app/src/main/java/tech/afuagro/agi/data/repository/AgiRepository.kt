package tech.afuagro.agi.data.repository

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import tech.afuagro.agi.core.model.AgentStatus
import tech.afuagro.agi.core.model.AttachmentPayload
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.MemoryCategory
import tech.afuagro.agi.core.model.MemoryLayer
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.core.model.ProviderAuthType
import tech.afuagro.agi.core.model.RoutingStrategy
import tech.afuagro.agi.core.model.SyncConflictStrategy
import tech.afuagro.agi.core.model.TaskPriority
import tech.afuagro.agi.core.model.TaskStatus
import tech.afuagro.agi.core.security.CryptoManager
import tech.afuagro.agi.core.telemetry.DeviceTelemetryMonitor
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.AgiDatabase
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.local.LocalModelEntity
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.data.local.SyncQueueEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.data.local.TaskHistoryEntity
import tech.afuagro.agi.data.local.TelemetryLogEntity
import tech.afuagro.agi.data.preferences.AgiPreferencesRepository
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.intelligence.AgiSyncWorker
import tech.afuagro.agi.intelligence.HybridIntelligenceRouter
import tech.afuagro.agi.intelligence.LocalInferenceEngine
import tech.afuagro.agi.core.agro.ProcessedRawAgroResult
import tech.afuagro.agi.core.agro.RawAgroDataProcessor
import tech.afuagro.agi.network.AfuFarmContextResponse
import tech.afuagro.agi.network.AfuLoginResponse
import tech.afuagro.agi.network.AfuSelectContextResponse
import tech.afuagro.agi.network.AgiApiClient
import tech.afuagro.agi.network.BackendProbeResult
import tech.afuagro.agi.network.PlantImageAnalyzeRequest
import tech.afuagro.agi.network.PlantImageAnalyzeResponse
import tech.afuagro.agi.network.PlantMonitoringResponse
import tech.afuagro.agi.ui.theme.ThemeMode
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID
import java.util.concurrent.TimeUnit

data class SyncCycleOutcome(
    val success: Boolean,
    val syncedItems: Int = 0,
    val hasConflict: Boolean = false
)

class AgiRepository(
    private val context: Context,
    private val db: AgiDatabase,
    val preferences: AgiPreferencesRepository,
    val cryptoManager: CryptoManager,
    val telemetryMonitor: DeviceTelemetryMonitor,
    private val apiClient: AgiApiClient,
    private val hybridRouter: HybridIntelligenceRouter,
    private val localEngine: LocalInferenceEngine,
    val chatRepository: ChatRepository = OfflineFirstChatRepository(
        chatDao = db.chatDao(),
        remoteDataSource = AgiApiN8nChatRemoteDataSource(preferences, apiClient)
    )
) {
    val sessionsFlow: Flow<List<ChatSessionEntity>> = chatRepository.sessionsFlow
    val agentsFlow: Flow<List<AgentEntity>> = db.agentDao().observeAgents()
    val tasksFlow: Flow<List<TaskEntity>> = db.taskDao().observeTasks()
    val memoriesFlow: Flow<List<MemoryEntity>> = db.memoryDao().observeMemories()
    val providersFlow: Flow<List<ApiProviderEntity>> = db.providerDao().observeProviders()
    val localModelsFlow: Flow<List<LocalModelEntity>> = db.localModelDao().observeLocalModels()
    val syncQueueFlow: Flow<List<SyncQueueEntity>> = db.syncQueueDao().observeSyncQueue()
    val telemetryLogsFlow: Flow<List<TelemetryLogEntity>> = db.telemetryLogDao().observeRecentLogs()
    val settingsFlow: Flow<AgiSettingsState> = preferences.settingsFlow

    private val _backendStatus = MutableStateFlow(
        BackendProbeResult(
            reachable = false,
            httpCode = 0,
            latencyMs = 0L,
            orchestratorStatus = "Não verificado",
            n8nStatus = "Desconectado"
        )
    )
    val backendStatus: StateFlow<BackendProbeResult> = _backendStatus.asStateFlow()

    /** Single-flight lock so concurrent 401/expiry paths do not rotate refresh twice. */
    private val afuRefreshMutex = Mutex()

    private val _hardwareTelemetry = MutableStateFlow(telemetryMonitor.snapshot())
    val hardwareTelemetry: StateFlow<HardwareTelemetry> = _hardwareTelemetry.asStateFlow()

    fun refreshHardwareTelemetry() {
        _hardwareTelemetry.value = telemetryMonitor.snapshot()
    }

    fun observeMessages(sessionId: String): Flow<List<ChatMessageEntity>> =
        chatRepository.observeSessionMessages(sessionId)

    fun loadSessionHistoryLocalFirstThenSync(sessionId: String): Flow<ChatHistorySyncState> =
        chatRepository.loadSessionHistoryLocalFirstThenSync(sessionId)

    fun observeAgent(agentId: String): Flow<AgentEntity?> =
        db.agentDao().observeAgent(agentId)

    fun observeTasksForAgent(agentId: String): Flow<List<TaskEntity>> =
        db.taskDao().observeTasksForAgent(agentId)

    suspend fun createSession(title: String = "Nova Sessão AGI"): String {
        val settings = preferences.settingsFlow.first()
        return chatRepository.createSession(title = title, modeUsed = settings.intelligenceMode.name)
    }

    suspend fun deleteSession(sessionId: String) {
        chatRepository.deleteSession(sessionId)
    }

    suspend fun probeBackendConnection(): BackendProbeResult {
        val settings = preferences.settingsFlow.first()
        val targetUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
        val token = preferences.getDecryptedAuthToken()
        val result = apiClient.probeBackendStatus(
            baseUrl = targetUrl,
            statusPath = settings.statusWebhookPath,
            authToken = token,
            enforceHttpsOnly = settings.enforceHttpsOnly
        )
        _backendStatus.value = result
        db.telemetryLogDao().insertLog(
            TelemetryLogEntity(
                source = "BackendProbe",
                level = if (result.reachable) "INFO" else "WARN",
                message = result.errorMessage ?: "Conectado ao servidor AGI (${result.latencyMs}ms)",
                latencyMs = result.latencyMs
            )
        )
        return result
    }

    suspend fun sendChatMessage(
        sessionId: String,
        prompt: String,
        attachments: List<AttachmentPayload>,
        onStageUpdate: suspend (OperationalStage) -> Unit
    ) {
        val settings = preferences.settingsFlow.first()
        val telemetry = telemetryMonitor.snapshot().also { _hardwareTelemetry.value = it }
        val activeLocalModel = db.localModelDao().getActiveModel()
        val providers = db.providerDao().getAllSnapshot()
        val memories = db.memoryDao().getAllSnapshot()
        val tasks = db.taskDao().observeTasks().first()
        val agents = db.agentDao().observeAgents().first()

        // Ensure session exists via ChatRepository (instant Room persistence)
        val now = System.currentTimeMillis()
        chatRepository.ensureSessionExists(
            sessionId = sessionId,
            title = prompt,
            modeUsed = settings.intelligenceMode.name,
            syncStatus = "PENDING_SYNC"
        )

        val attachJson = JSONArray().apply {
            attachments.forEach {
                put(JSONObject().apply {
                    put("name", it.name)
                    put("mimeType", it.mimeType)
                    put("uri", it.uriString)
                })
            }
        }.toString()

        val userMsgId = "msg-${UUID.randomUUID().toString().take(8)}"
        chatRepository.persistLocalMessage(
            ChatMessageEntity(
                id = userMsgId,
                sessionId = sessionId,
                role = "user",
                content = prompt,
                attachmentsJson = attachJson,
                executionMode = settings.intelligenceMode.name,
                timestamp = now,
                syncStatus = "PENDING_SYNC"
            )
        )

        val decision = hybridRouter.decide(
            prompt = prompt,
            settings = settings,
            telemetry = telemetry,
            activeLocalModel = activeLocalModel,
            providers = providers,
            hasSensitiveLocalAttachment = attachments.isNotEmpty()
        )

        val relevantMemories = localEngine.semanticSearch(prompt, memories, limit = 4)
            .map { "${it.first.title}: ${it.first.content}" }

        val attachmentPreviews = attachments.map { att ->
            val preview = att.textPreview?.take(300)?.let { " -> $it" }.orEmpty()
            "${att.name} (${att.mimeType})$preview"
        }

        val effectiveCloud = decision.canExecuteCloud &&
            (decision.effectiveMode == IntelligenceMode.CLOUD || decision.effectiveMode == IntelligenceMode.HYBRID)

        if (decision.effectiveMode == IntelligenceMode.CLOUD && !decision.canExecuteCloud) {
            // Strict CLOUD mode with unavailable backend: inform honestly, do NOT simulate
            val errText = "Modo CLOUD indisponível: ${decision.reason}\n\n" +
                "Configure a URL do Servidor AGI / n8n em Menu > Configurações ou alterne para LOCAL / AUTO no seletor híbrido."
            chatRepository.persistLocalMessage(
                ChatMessageEntity(
                    id = "msg-${UUID.randomUUID().toString().take(8)}",
                    sessionId = sessionId,
                    role = "agi",
                    content = errText,
                    stageReached = OperationalStage.IDLE.label,
                    agentsInvolvedCsv = "Sistema Híbrido",
                    modelUsed = decision.activeModelLabel,
                    executionMode = IntelligenceMode.CLOUD.name,
                    timestamp = System.currentTimeMillis(),
                    syncStatus = "LOCAL_ONLY"
                )
            )
            db.telemetryLogDao().insertLog(
                TelemetryLogEntity(
                    source = "HybridRouter",
                    level = "ERROR",
                    message = decision.reason
                )
            )
            onStageUpdate(OperationalStage.IDLE)
            return
        }

        if (effectiveCloud) {
            val targetUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
            val token = preferences.getDecryptedAuthToken()
            val response = apiClient.sendOrchestratorMessage(
                baseUrl = targetUrl,
                webhookPath = settings.orchestratorWebhookPath,
                authToken = token,
                enforceHttpsOnly = settings.enforceHttpsOnly,
                sessionId = sessionId,
                message = prompt,
                routingStrategy = settings.routingStrategy.name,
                preferredModel = hybridRouter.selectCloudModel(prompt, settings.routingStrategy, providers),
                mode = decision.effectiveMode.name,
                memoryContext = relevantMemories,
                attachmentNames = attachments.map { it.name },
                onStageUpdate = onStageUpdate
            )

            if (response.success) {
                chatRepository.persistLocalMessage(
                    ChatMessageEntity(
                        id = "msg-${UUID.randomUUID().toString().take(8)}",
                        sessionId = sessionId,
                        role = "agi",
                        content = response.replyText,
                        stageReached = OperationalStage.CONCLUDING.label,
                        agentsInvolvedCsv = response.agentsInvolved.joinToString(","),
                        modelUsed = response.modelUsed,
                        executionMode = decision.effectiveMode.name,
                        latencyMs = response.latencyMs,
                        tokensUsed = response.tokensUsed,
                        timestamp = System.currentTimeMillis(),
                        syncStatus = "SYNCED"
                    )
                )

                // Persist any tasks returned by the backend orchestrator
                response.createdTasks.forEach { rt ->
                    val resolvedAgentId = agents.firstOrNull { it.name.equals(rt.agentName, true) }?.id ?: "orch-01"
                    val resolvedProgress = if (rt.status == "COMPLETED") 1f else 0.35f
                    db.taskDao().upsertTask(
                        TaskEntity(
                            id = rt.id,
                            title = rt.title,
                            description = rt.description,
                            agentId = resolvedAgentId,
                            agentName = rt.agentName,
                            priority = rt.priority,
                            status = rt.status,
                            progress = resolvedProgress,
                            syncStatus = "SYNCED"
                        )
                    )
                    db.taskHistoryDao().insertHistoryEntry(
                        TaskHistoryEntity(
                            id = "th-${UUID.randomUUID().toString().take(8)}",
                            taskId = rt.id,
                            agentId = resolvedAgentId,
                            agentName = rt.agentName,
                            previousStatus = "REMOTE_DISPATCH",
                            newStatus = rt.status,
                            progress = resolvedProgress,
                            summary = "Delegada pelo Orquestrador: ${rt.title}",
                            latencyMs = response.latencyMs,
                            syncStatus = "SYNCED"
                        )
                    )
                }

                // Update real token/latency telemetry
                db.telemetryLogDao().insertLog(
                    TelemetryLogEntity(
                        source = "OrchestratorCloud",
                        level = "INFO",
                        message = "Resposta concluída (${response.modelUsed})",
                        latencyMs = response.latencyMs,
                        tokensUsed = response.tokensUsed,
                        estimatedCostUsd = response.estimatedCostUsd
                    )
                )
                recordAgentExecution("Orquestrador", response.latencyMs, true)
                storeConversationMemory(prompt, response.replyText, source = "CENTRAL", syncStatus = "SYNCED")
            } else {
                db.telemetryLogDao().insertLog(
                    TelemetryLogEntity(
                        source = "OrchestratorCloud",
                        level = "ERROR",
                        message = response.errorMessage ?: "Erro na chamada ao orquestrador",
                        latencyMs = response.latencyMs
                    )
                )
                // If HYBRID or AUTO, fall back transparently to local engine with explicit warning
                val localOut = localEngine.generateLocalResponse(
                    prompt = prompt,
                    memories = memories,
                    tasks = tasks,
                    agents = agents,
                    activeModel = activeLocalModel,
                    telemetry = telemetry,
                    attachmentSummaries = attachmentPreviews,
                    requiresCloudWarning = true,
                    onStageUpdate = onStageUpdate
                )
                val fallbackContent = "Falha na comunicação com o servidor AGI (${response.errorMessage}).\n\n" +
                    localOut.responseText
                chatRepository.persistLocalMessage(
                    ChatMessageEntity(
                        id = "msg-${UUID.randomUUID().toString().take(8)}",
                        sessionId = sessionId,
                        role = "agi",
                        content = fallbackContent,
                        stageReached = OperationalStage.CONCLUDING.label,
                        agentsInvolvedCsv = "Motor Local (Contingência)",
                        modelUsed = localOut.modelUsed,
                        executionMode = IntelligenceMode.LOCAL.name,
                        latencyMs = localOut.latencyMs,
                        tokensUsed = localOut.estimatedTokens,
                        timestamp = System.currentTimeMillis(),
                        syncStatus = "PENDING_SYNC"
                    )
                )
                enqueueContinuitySync(sessionId, prompt, fallbackContent)
            }
        } else {
            // Local execution path
            val localOut = localEngine.generateLocalResponse(
                prompt = prompt,
                memories = memories,
                tasks = tasks,
                agents = agents,
                activeModel = activeLocalModel,
                telemetry = telemetry,
                attachmentSummaries = attachmentPreviews,
                requiresCloudWarning = false,
                onStageUpdate = onStageUpdate
            )
            chatRepository.persistLocalMessage(
                ChatMessageEntity(
                    id = "msg-${UUID.randomUUID().toString().take(8)}",
                    sessionId = sessionId,
                    role = "agi",
                    content = localOut.responseText,
                    stageReached = OperationalStage.CONCLUDING.label,
                    agentsInvolvedCsv = "Motor Local,Agente de Memória",
                    modelUsed = localOut.modelUsed,
                    executionMode = IntelligenceMode.LOCAL.name,
                    latencyMs = localOut.latencyMs,
                    tokensUsed = localOut.estimatedTokens,
                    timestamp = System.currentTimeMillis(),
                    syncStatus = "PENDING_SYNC"
                )
            )
            db.telemetryLogDao().insertLog(
                TelemetryLogEntity(
                    source = "LocalEngine",
                    level = "INFO",
                    message = "Processamento offline via ${localOut.modelUsed}",
                    latencyMs = localOut.latencyMs,
                    tokensUsed = localOut.estimatedTokens,
                    estimatedCostUsd = 0.0
                )
            )
            recordAgentExecution("Agente de Memória", localOut.latencyMs, true)
            storeConversationMemory(prompt, localOut.responseText, source = "LOCAL", syncStatus = "PENDING_SYNC")
            enqueueContinuitySync(sessionId, prompt, localOut.responseText)
        }

        // Update session timestamp
        chatRepository.getSessionById(sessionId)?.let { sess ->
            chatRepository.updateSession(
                sess.copy(
                    updatedAt = System.currentTimeMillis(),
                    modeUsed = decision.effectiveMode.name,
                    version = sess.version + 1
                )
            )
        }
        onStageUpdate(OperationalStage.IDLE)
    }

    suspend fun recordCancelledMessage(sessionId: String) {
        chatRepository.persistLocalMessage(
            ChatMessageEntity(
                id = "msg-${UUID.randomUUID().toString().take(8)}",
                sessionId = sessionId,
                role = "system",
                content = "Operação interrompida pelo usuário.",
                isCancelled = true,
                timestamp = System.currentTimeMillis(),
                syncStatus = "LOCAL_ONLY"
            )
        )
    }

    suspend fun syncRemoteMessagesForSession(sessionId: String): Result<Int> =
        chatRepository.syncSessionWithN8n(sessionId)

    // Agente Planta Saudável (Fitotecnia, Genomas G1-G4 & Dados Brutos)
    suspend fun analyzePlantHealthyImage(
        imageUrl: String?,
        localImageUri: Uri?,
        cropType: String,
        generation: String,
        fieldNotes: String?
    ): Result<PlantImageAnalyzeResponse> {
        val settings = preferences.settingsFlow.first()
        if (settings.cloudDisabledCompletely) {
            return Result.failure(IllegalStateException("Comunicação em nuvem bloqueada nas configurações de segurança."))
        }
        val targetUrl = settings.plantApiBaseUrl
            .ifBlank { settings.afuApiBaseUrl }
            .ifBlank { settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl } }
        if (targetUrl.isBlank()) {
            return Result.failure(IllegalStateException("Configure a URL da API Planta Saudável ou do Servidor AGI/n8n."))
        }

        val encodedImage = localImageUri?.let { uri ->
            runCatching {
                context.contentResolver.openInputStream(uri)?.use { input ->
                    val bytes = input.readBytes()
                    // Gateway LLM limit ~2.5M base64 chars ≈ 1.8 MB binary
                    if (bytes.size > 1_800_000) {
                        error("Imagem excede ~1.8 MB. Comprima a foto e tente novamente.")
                    }
                    Base64.encodeToString(bytes, Base64.NO_WRAP)
                }
            }.getOrElse { err ->
                return Result.failure(err)
            }
        }

        val cleanUrl = imageUrl?.trim()?.takeIf { it.isNotBlank() }
        if (cleanUrl == null && encodedImage == null) {
            return Result.failure(IllegalArgumentException("Selecione uma foto ou informe a image_url da planta."))
        }

        val request = PlantImageAnalyzeRequest(
            imageUrl = cleanUrl,
            imageBase64 = encodedImage,
            cropType = cropType.trim().ifBlank { "soja" },
            generation = generation.trim().ifBlank { "G3" },
            fieldNotes = fieldNotes?.trim()?.takeIf { it.isNotBlank() },
            propriedadeId = settings.afuPropriedadeId.takeIf { it > 0L }
        )

        val apiResult = withAfuAccessToken { token ->
            apiClient.analyzePlantImage(
                baseUrl = targetUrl,
                analyzePath = settings.plantAnalyzePath,
                authToken = token,
                enforceHttpsOnly = settings.enforceHttpsOnly,
                request = request
            )
        }
        return apiResult.fold(
            onSuccess = { (resp, latency) ->
                recordAgentExecution("Planta Saudável", latency, true)
                val recSummary = resp.recommendations.orEmpty().joinToString(" • ")
                val confPct = resp.confidence?.let { "${(it * 100).toInt()}%" } ?: "N/D"
                db.memoryDao().upsertMemory(
                    MemoryEntity(
                        id = "mem-plant-${UUID.randomUUID().toString().take(8)}",
                        layer = MemoryLayer.LONG_TERM.name,
                        category = MemoryCategory.PROJECTS.name,
                        title = "Diagnóstico ${request.cropType.uppercase()} (${request.generation}): ${resp.diagnosis ?: "Análise"}",
                        content = buildString {
                            append("Diagnóstico: ${resp.diagnosis ?: "Não informado"} (Confiança: $confPct)\n")
                            if (!resp.genomicRisk.isNullOrBlank()) append("Risco genômico: ${resp.genomicRisk}\n")
                            if (!resp.historicalComparison.isNullOrBlank()) append("Histórico multigeneracional: ${resp.historicalComparison}\n")
                            if (recSummary.isNotBlank()) append("Recomendações: $recSummary")
                        },
                        tagsCsv = "planta-saudavel,fitotecnia,${request.cropType.lowercase()},${request.generation}",
                        source = "CENTRAL",
                        syncStatus = "SYNCED"
                    )
                )
                db.telemetryLogDao().insertLog(
                    TelemetryLogEntity(
                        source = "PlantaSaudavelAPI",
                        level = "INFO",
                        message = "Diagnóstico ${request.cropType} (${request.generation}): ${resp.diagnosis}",
                        latencyMs = latency
                    )
                )
                Result.success(resp)
            },
            onFailure = { err ->
                recordAgentExecution("Planta Saudável", 0L, false)
                db.telemetryLogDao().insertLog(
                    TelemetryLogEntity(
                        source = "PlantaSaudavelAPI",
                        level = "ERROR",
                        message = err.localizedMessage ?: "Falha na análise de imagem"
                    )
                )
                Result.failure(err)
            }
        )
    }

    suspend fun submitPlantHealthyTelemetry(
        processed: ProcessedRawAgroResult
    ): Result<PlantMonitoringResponse> {
        val settings = preferences.settingsFlow.first()
        if (settings.cloudDisabledCompletely) {
            return Result.failure(IllegalStateException("Comunicação em nuvem bloqueada nas configurações de segurança."))
        }
        val targetUrl = settings.plantApiBaseUrl
            .ifBlank { settings.afuApiBaseUrl }
            .ifBlank { settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl } }
        if (targetUrl.isBlank()) {
            return Result.failure(IllegalStateException("Configure a URL da API Planta Saudável ou do Servidor AGI/n8n."))
        }
        val apiResult = withAfuAccessToken { token ->
            apiClient.sendPlantRawTelemetry(
                baseUrl = targetUrl,
                telemetryPath = settings.plantTelemetryPath,
                authToken = token,
                enforceHttpsOnly = settings.enforceHttpsOnly,
                request = processed.toTelemetryRequest().copy(
                    propriedadeId = settings.afuPropriedadeId.takeIf { it > 0L }
                )
            )
        }
        return apiResult.fold(
            onSuccess = { (resp, latency) ->
                recordAgentExecution("Planta Saudável", latency, true)
                db.memoryDao().upsertMemory(
                    MemoryEntity(
                        id = "mem-agro-iot-${UUID.randomUUID().toString().take(8)}",
                        layer = MemoryLayer.OPERATIONAL.name,
                        category = MemoryCategory.EXPERIENCES.name,
                        title = "Telemetria Limpa ${processed.cropType.uppercase()} (${processed.generation})",
                        content = "Campos normalizados: ${processed.normalizedFields.entries.joinToString { "${it.key}=${it.value}" }}\n" +
                            "Descartados: ${processed.discardedFields.size} • Alertas validação: ${processed.validationWarnings.joinToString("; ").ifBlank { "Nenhum" }}",
                        tagsCsv = "planta-saudavel,iot,dados-brutos,${processed.cropType},${processed.generation}",
                        source = "CENTRAL",
                        syncStatus = "SYNCED"
                    )
                )
                Result.success(resp)
            },
            onFailure = { err ->
                Result.failure(err)
            }
        )
    }

    suspend fun fetchPlantHealthyAlerts(
        cropType: String?,
        generation: String?
    ): Result<PlantMonitoringResponse> {
        val settings = preferences.settingsFlow.first()
        if (settings.cloudDisabledCompletely) {
            return Result.failure(IllegalStateException("Comunicação em nuvem bloqueada nas configurações de segurança."))
        }
        val targetUrl = settings.plantApiBaseUrl
            .ifBlank { settings.afuApiBaseUrl }
            .ifBlank { settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl } }
        if (targetUrl.isBlank()) {
            return Result.failure(IllegalStateException("Configure a URL da API Planta Saudável ou do Servidor AGI/n8n."))
        }
        return withAfuAccessToken { token ->
            apiClient.fetchPlantMonitoringAlerts(
                baseUrl = targetUrl,
                alertsPath = settings.plantAlertsPath,
                authToken = token,
                enforceHttpsOnly = settings.enforceHttpsOnly,
                cropType = cropType,
                generation = generation,
                propriedadeId = settings.afuPropriedadeId.takeIf { it > 0L }
            )
        }
    }


    /** JWT AFU access (~15 min). Refresh before expiry or after HTTP 401. */
    private fun isUnauthorizedError(err: Throwable): Boolean {
        val msg = err.message.orEmpty()
        return msg.contains("HTTP 401") || msg.contains("Unauthorized", ignoreCase = true)
    }

    private fun jwtExpiresAtEpochMs(jwt: String): Long? {
        val parts = jwt.split('.')
        if (parts.size < 2) return null
        return runCatching {
            val payloadJson = String(Base64.decode(parts[1], Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING))
            val expMatch = Regex("\"exp\"\\s*:\\s*(\\d+)").find(payloadJson) ?: return null
            expMatch.groupValues[1].toLong() * 1000L
        }.getOrNull()
    }

    private fun accessTokenNeedsRefresh(token: String, skewMs: Long = 60_000L): Boolean {
        if (token.isBlank()) return true
        val expMs = jwtExpiresAtEpochMs(token) ?: return false
        return System.currentTimeMillis() >= (expMs - skewMs)
    }

    private suspend fun refreshAfuAccessToken(): Result<String> = afuRefreshMutex.withLock {
        // Another waiter may have refreshed while we were queued.
        val maybeFresh = preferences.getDecryptedAfuAccessToken()
            .ifBlank { preferences.getDecryptedAuthToken() }
        if (maybeFresh.isNotBlank() && !accessTokenNeedsRefresh(maybeFresh, skewMs = 30_000L)) {
            return@withLock Result.success(maybeFresh)
        }

        val settings = preferences.settingsFlow.first()
        val base = settings.afuApiBaseUrl.ifBlank { settings.plantApiBaseUrl }
        val refresh = preferences.getDecryptedAfuRefreshToken()
        if (base.isBlank() || refresh.isBlank()) {
            return@withLock Result.failure(IllegalStateException("Refresh token AFU ausente — faça login novamente."))
        }
        return@withLock apiClient.afuRefresh(
            baseUrl = base,
            refreshToken = refresh,
            enforceHttpsOnly = settings.enforceHttpsOnly
        ).fold(
            onSuccess = { resp ->
                val access = resp.accessToken.orEmpty()
                val newRefresh = resp.refreshToken?.takeIf { it.isNotBlank() } ?: refresh
                if (access.isBlank()) {
                    Result.failure(IllegalStateException("Refresh AFU não retornou accessToken."))
                } else {
                    preferences.saveAfuSession(
                        accessToken = access,
                        refreshToken = newRefresh,
                        email = settings.afuUserEmail,
                        name = settings.afuUserName,
                        organizationId = settings.afuOrganizationId,
                        organizationName = settings.afuOrganizationName,
                        propriedadeId = settings.afuPropriedadeId,
                        propriedadeName = settings.afuPropriedadeName
                    )
                    Result.success(access)
                }
            },
            onFailure = { Result.failure(it) }
        )
    }

    private suspend fun ensureAfuAccessToken(): Result<String> {
        val current = preferences.getDecryptedAfuAccessToken()
            .ifBlank { preferences.getDecryptedAuthToken() }
        if (current.isNotBlank() && !accessTokenNeedsRefresh(current)) {
            return Result.success(current)
        }
        val refreshed = refreshAfuAccessToken()
        if (refreshed.isSuccess) return refreshed
        if (current.isNotBlank()) return Result.success(current)
        return refreshed
    }

    private suspend fun <T> withAfuAccessToken(
        call: suspend (token: String) -> Result<T>
    ): Result<T> {
        val tokenResult = ensureAfuAccessToken()
        val token = tokenResult.getOrElse { return Result.failure(it) }
        val first = call(token)
        if (first.isSuccess || !isUnauthorizedError(first.exceptionOrNull() ?: return first)) {
            return first
        }
        val refreshed = refreshAfuAccessToken().getOrElse { return first }
        return call(refreshed)
    }

    suspend fun loginAfuAccount(
        apiBaseUrl: String,
        email: String,
        password: String
    ): Result<AfuLoginResponse> {
        val settings = preferences.settingsFlow.first()
        val base = apiBaseUrl.trim().ifBlank { settings.afuApiBaseUrl }
        if (base.isBlank()) {
            return Result.failure(IllegalStateException("Informe a URL da API AFU (ex.: https://api.afuagro.com.br)."))
        }
        val result = apiClient.afuLogin(
            baseUrl = base,
            email = email.trim(),
            password = password,
            enforceHttpsOnly = settings.enforceHttpsOnly
        )
        return result.fold(
            onSuccess = { resp ->
                preferences.saveAfuApiBaseUrl(base)
                val org = resp.organization
                preferences.saveAfuSession(
                    accessToken = resp.accessToken.orEmpty(),
                    refreshToken = resp.refreshToken.orEmpty(),
                    email = resp.user?.email.orEmpty(),
                    name = resp.user?.name.orEmpty(),
                    organizationId = org?.id ?: 0L,
                    organizationName = org?.nome.orEmpty()
                )
                // Carrega propriedades do tenant após login
                refreshAfuFarmContext()
                Result.success(resp)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun refreshAfuFarmContext(): Result<AfuFarmContextResponse> {
        val settings = preferences.settingsFlow.first()
        val base = settings.afuApiBaseUrl.ifBlank { settings.plantApiBaseUrl }
        if (base.isBlank()) {
            return Result.failure(IllegalStateException("URL da API AFU não configurada."))
        }
        val result = withAfuAccessToken { token ->
            apiClient.afuFarmContext(
                baseUrl = base,
                authToken = token,
                propriedadeId = settings.afuPropriedadeId.takeIf { it > 0L },
                enforceHttpsOnly = settings.enforceHttpsOnly
            )
        }
        return result.fold(
            onSuccess = { ctx ->
                val org = ctx.organization
                val prop = ctx.selectedPropriedade ?: ctx.propriedades?.firstOrNull()
                if (org != null) {
                    preferences.saveAfuFarmSelection(
                        organizationId = org.id,
                        organizationName = org.nome,
                        propriedadeId = prop?.id ?: 0L,
                        propriedadeName = prop?.nome.orEmpty()
                    )
                }
                Result.success(ctx)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun selectAfuFarmContext(
        organizationId: Long,
        organizationName: String,
        propriedadeId: Long?,
        propriedadeName: String?
    ): Result<AfuSelectContextResponse> {
        val settings = preferences.settingsFlow.first()
        val base = settings.afuApiBaseUrl.ifBlank { settings.plantApiBaseUrl }
        if (base.isBlank()) {
            return Result.failure(IllegalStateException("Sessão AFU ausente."))
        }
        val result = withAfuAccessToken { token ->
            apiClient.afuSelectContext(
                baseUrl = base,
                authToken = token,
                organizationId = organizationId,
                propriedadeId = propriedadeId,
                enforceHttpsOnly = settings.enforceHttpsOnly
            )
        }
        return result.fold(
            onSuccess = { resp ->
                preferences.saveAfuFarmSelection(
                    organizationId = organizationId,
                    organizationName = organizationName,
                    propriedadeId = propriedadeId ?: 0L,
                    propriedadeName = propriedadeName.orEmpty()
                )
                Result.success(resp)
            },
            onFailure = { Result.failure(it) }
        )
    }

    fun readAgroRawFileText(uri: Uri): String = localEngine.readDocumentTextPreview(uri)

    private suspend fun recordAgentExecution(agentName: String, latencyMs: Long, success: Boolean) {
        val agents = db.agentDao().observeAgents().first()
        val target = agents.firstOrNull { it.name.equals(agentName, ignoreCase = true) } ?: return
        val newTotal = target.tasksCompleted + 1
        val newAvg = ((target.avgLatencyMs * target.tasksCompleted) + latencyMs) / newTotal
        val newRate = if (success) {
            ((target.successRate * target.tasksCompleted) + 100f) / newTotal
        } else {
            ((target.successRate * target.tasksCompleted) + 0f) / newTotal
        }
        db.agentDao().upsertAgent(
            target.copy(
                tasksAssigned = target.tasksAssigned + 1,
                tasksCompleted = newTotal,
                avgLatencyMs = newAvg,
                successRate = newRate,
                updatedAt = System.currentTimeMillis()
            )
        )
    }

    private suspend fun storeConversationMemory(
        prompt: String,
        reply: String,
        source: String,
        syncStatus: String
    ) {
        val mem = MemoryEntity(
            id = "mem-${UUID.randomUUID().toString().take(8)}",
            layer = MemoryLayer.SHORT_TERM.name,
            category = MemoryCategory.CONVERSATIONS.name,
            title = prompt.take(48).ifBlank { "Interação AGI" },
            content = "Usuário: ${prompt.take(240)}\nAGI: ${reply.take(360)}",
            tagsCsv = prompt.lowercase().split(Regex("\\s+")).filter { it.length > 3 }.take(4).joinToString(","),
            source = source,
            syncStatus = syncStatus
        )
        db.memoryDao().upsertMemory(mem)
    }

    private suspend fun enqueueContinuitySync(sessionId: String, prompt: String, reply: String) {
        val payload = JSONObject().apply {
            put("sessionId", sessionId)
            put("prompt", prompt)
            put("reply", reply)
            put("origin", "AGI_MOBILE_ANDROID")
            put("timestamp", System.currentTimeMillis())
        }.toString()
        db.syncQueueDao().upsertItem(
            SyncQueueEntity(
                id = "sync-${UUID.randomUUID().toString().take(8)}",
                entityType = "CHAT_CONTINUITY",
                entityId = sessionId,
                operation = "CONVERSATION_CONTINUITY",
                payloadJson = payload,
                version = 1,
                status = "PENDING"
            )
        )
    }

    // Agents Management
    suspend fun toggleAgentEnabled(agentId: String, enabled: Boolean) {
        db.agentDao().getAgentById(agentId)?.let { agent ->
            db.agentDao().upsertAgent(
                agent.copy(
                    isEnabled = enabled,
                    status = if (enabled) AgentStatus.ACTIVE.name else AgentStatus.PAUSED.name,
                    updatedAt = System.currentTimeMillis()
                )
            )
        }
    }

    suspend fun updateAgentConfig(
        agentId: String,
        specialty: String,
        modelId: String,
        permissionsCsv: String
    ) {
        db.agentDao().getAgentById(agentId)?.let { agent ->
            db.agentDao().upsertAgent(
                agent.copy(
                    specialty = specialty.trim(),
                    modelId = modelId.trim(),
                    permissionsCsv = permissionsCsv.trim(),
                    updatedAt = System.currentTimeMillis()
                )
            )
        }
    }

    suspend fun createCustomAgent(
        name: String,
        specialty: String,
        description: String,
        modelId: String,
        toolsCsv: String
    ) {
        val id = "usr-${UUID.randomUUID().toString().take(6)}"
        db.agentDao().upsertAgent(
            AgentEntity(
                id = id,
                name = name.trim(),
                specialty = specialty.trim(),
                description = description.trim(),
                modelId = modelId.trim(),
                toolsCsv = toolsCsv.trim(),
                permissionsCsv = "READ,PLAN",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = false
            )
        )
    }

    // Tasks Management
    val taskHistoryFlow: Flow<List<TaskHistoryEntity>> = db.taskHistoryDao().observeAllHistory()
    fun observeTaskHistory(taskId: String): Flow<List<TaskHistoryEntity>> = db.taskHistoryDao().observeHistoryForTask(taskId)

    suspend fun createTask(
        title: String,
        description: String,
        agentId: String,
        agentName: String,
        priority: TaskPriority,
        dependenciesCsv: String = "",
        requiresAdminAuth: Boolean = false
    ) {
        val initialStatus = if (requiresAdminAuth) TaskStatus.AWAITING_AUTH.name else TaskStatus.PENDING.name
        val task = TaskEntity(
            id = "TSK-${UUID.randomUUID().toString().take(6).uppercase()}",
            title = title.trim(),
            description = description.trim(),
            agentId = agentId,
            agentName = agentName,
            priority = priority.name,
            status = initialStatus,
            progress = 0f,
            dependenciesCsv = dependenciesCsv,
            requiresAdminAuth = requiresAdminAuth,
            auditTrail = "Criada pelo operador móvel"
        )
        db.taskDao().upsertTask(task)
        db.taskHistoryDao().insertHistoryEntry(
            TaskHistoryEntity(
                id = "th-${UUID.randomUUID().toString().take(8)}",
                taskId = task.id,
                agentId = task.agentId,
                agentName = task.agentName,
                previousStatus = "NONE",
                newStatus = initialStatus,
                progress = 0f,
                summary = "Tarefa criada: ${task.title}"
            )
        )
    }

    suspend fun updateTaskStatus(taskId: String, newStatus: TaskStatus, resultNote: String = "") {
        db.taskDao().getTaskById(taskId)?.let { task ->
            val progress = when (newStatus) {
                TaskStatus.COMPLETED -> 1f
                TaskStatus.RUNNING -> 0.55f
                TaskStatus.PENDING -> 0.1f
                TaskStatus.AWAITING_AUTH -> 0.25f
                TaskStatus.FAILED -> task.progress
            }
            val audit = "${task.auditTrail}\n-> Status alterado para ${newStatus.label}".trim()
            db.taskDao().upsertTask(
                task.copy(
                    status = newStatus.name,
                    progress = progress,
                    resultText = if (resultNote.isNotBlank()) resultNote else task.resultText,
                    auditTrail = audit
                )
            )
            db.taskHistoryDao().insertHistoryEntry(
                TaskHistoryEntity(
                    id = "th-${UUID.randomUUID().toString().take(8)}",
                    taskId = task.id,
                    agentId = task.agentId,
                    agentName = task.agentName,
                    previousStatus = task.status,
                    newStatus = newStatus.name,
                    progress = progress,
                    summary = "Transição para ${newStatus.label}",
                    evidenceText = resultNote
                )
            )
        }
    }

    suspend fun deleteTask(taskId: String) {
        db.taskHistoryDao().deleteHistoryForTask(taskId)
        db.taskDao().deleteTask(taskId)
    }

    // API Router Management
    suspend fun saveProviderConfig(
        providerId: String,
        baseUrl: String,
        plainApiKey: String?,
        defaultModel: String,
        availableModelsCsv: String,
        authType: ProviderAuthType,
        rateLimitRpm: Int,
        costPer1kTokensUsd: Double,
        maxContextTokens: Int,
        isEnabled: Boolean
    ) {
        val existing = db.providerDao().getProviderById(providerId) ?: return
        val newEncrypted = if (!plainApiKey.isNullOrBlank()) {
            cryptoManager.encrypt(plainApiKey.trim())
        } else {
            existing.encryptedApiKey
        }
        val newMasked = if (!plainApiKey.isNullOrBlank()) {
            cryptoManager.maskSecret(plainApiKey.trim())
        } else {
            existing.maskedKey
        }
        db.providerDao().upsertProvider(
            existing.copy(
                baseUrl = baseUrl.trim().trimEnd('/'),
                encryptedApiKey = newEncrypted,
                maskedKey = newMasked,
                defaultModel = defaultModel.trim(),
                availableModelsCsv = availableModelsCsv.trim(),
                authType = authType.name,
                rateLimitRpm = rateLimitRpm,
                costPer1kTokensUsd = costPer1kTokensUsd,
                maxContextTokens = maxContextTokens,
                isEnabled = isEnabled
            )
        )
    }

    suspend fun moveProviderPriority(providerId: String, delta: Int) {
        val sorted = db.providerDao().getAllSnapshot().sortedBy { it.priorityOrder }.toMutableList()
        val idx = sorted.indexOfFirst { it.id == providerId }
        if (idx == -1) return
        val targetIdx = (idx + delta).coerceIn(0, sorted.lastIndex)
        if (idx == targetIdx) return
        val item = sorted.removeAt(idx)
        sorted.add(targetIdx, item)
        val reindexed = sorted.mapIndexed { index, prov -> prov.copy(priorityOrder = index + 1) }
        db.providerDao().updateProviders(reindexed)
    }

    suspend fun testProvider(providerId: String): String {
        val provider = db.providerDao().getProviderById(providerId) ?: return "Provedor não encontrado"
        val settings = preferences.settingsFlow.first()
        val backendUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
        val backendToken = preferences.getDecryptedAuthToken()
        val decryptedProviderKey = cryptoManager.decrypt(provider.encryptedApiKey)

        val res = apiClient.testProviderConnection(
            provider = provider,
            decryptedApiKey = decryptedProviderKey,
            backendBaseUrl = backendUrl,
            routerWebhookPath = settings.routerWebhookPath,
            backendAuthToken = backendToken,
            enforceHttpsOnly = settings.enforceHttpsOnly
        )

        db.providerDao().upsertProvider(
            provider.copy(
                connectionStatus = res.statusLabel,
                lastLatencyMs = res.latencyMs,
                lastTestedAt = System.currentTimeMillis()
            )
        )
        db.telemetryLogDao().insertLog(
            TelemetryLogEntity(
                source = "ApiRouter:${provider.name}",
                level = if (res.reachable) "INFO" else "WARN",
                message = res.errorMessage ?: "${res.statusLabel} (${res.latencyMs}ms)",
                latencyMs = res.latencyMs,
                providerId = provider.id
            )
        )
        return res.errorMessage ?: "${res.statusLabel} em ${res.latencyMs}ms"
    }

    // Memory Management
    suspend fun addMemory(
        layer: MemoryLayer,
        category: MemoryCategory,
        title: String,
        content: String,
        tagsCsv: String
    ) {
        db.memoryDao().upsertMemory(
            MemoryEntity(
                id = "mem-${UUID.randomUUID().toString().take(8)}",
                layer = layer.name,
                category = category.name,
                title = title.trim(),
                content = content.trim(),
                tagsCsv = tagsCsv.trim(),
                source = "LOCAL",
                syncStatus = "PENDING_SYNC"
            )
        )
        val settings = preferences.settingsFlow.first()
        if (!settings.cloudDisabledCompletely && (settings.agiBackendUrl.isNotBlank() || settings.n8nBaseUrl.isNotBlank())) {
            enqueueImmediateSync(wifiOnly = settings.wifiOnlySync)
        }
    }

    suspend fun deleteMemory(id: String) = db.memoryDao().deleteMemory(id)

    fun semanticSearchMemories(query: String, memories: List<MemoryEntity>): List<Pair<MemoryEntity, Float>> =
        localEngine.semanticSearch(query, memories, limit = 25)

    suspend fun exportMemoriesAsJson(): String {
        val list = db.memoryDao().getAllSnapshot()
        val arr = JSONArray()
        list.forEach { m ->
            arr.put(JSONObject().apply {
                put("id", m.id)
                put("layer", m.layer)
                put("category", m.category)
                put("title", m.title)
                put("content", m.content)
                put("tags", m.tagsCsv)
                put("source", m.source)
                put("version", m.version)
                put("updatedAt", m.updatedAt)
            })
        }
        return JSONObject().apply {
            put("exportedAt", System.currentTimeMillis())
            put("count", list.size)
            put("memories", arr)
        }.toString(2)
    }

    // Local Models Management
    suspend fun activateLocalModel(modelId: String) = db.localModelDao().setActiveModel(modelId)

    suspend fun updateLocalModelInferenceConfig(
        modelId: String,
        contextLength: Int,
        threads: Int,
        temperature: Float,
        useGpuDelegate: Boolean
    ) {
        val model = db.localModelDao().getAllSnapshot().firstOrNull { it.id == modelId } ?: return
        db.localModelDao().upsertModel(
            model.copy(
                contextLength = contextLength,
                threads = threads,
                temperature = temperature,
                useGpuDelegate = useGpuDelegate
            )
        )
    }

    suspend fun importLocalModelFromUri(uri: Uri): Result<String> {
        val imported = localEngine.importModelFromUri(uri)
        return imported.map { meta ->
            val id = "custom-${UUID.randomUUID().toString().take(6)}"
            val telemetry = telemetryMonitor.snapshot()
            val estMinRam = (meta.sizeMb * 1.4f).toInt().coerceAtLeast(512)
            db.localModelDao().upsertModel(
                LocalModelEntity(
                    id = id,
                    name = meta.fileName,
                    family = if (meta.isValidBinaryHeader) "Importado (Validado)" else "Importado (Genérico)",
                    format = meta.format,
                    quantization = "Local",
                    sizeMb = meta.sizeMb,
                    minRamMb = estMinRam,
                    filePath = meta.internalPath,
                    isDownloaded = true,
                    isActive = telemetry.availableRamMb > estMinRam
                )
            )
            if (meta.isValidBinaryHeader) {
                "Modelo ${meta.fileName} (${meta.sizeMb} MB) importado e validado."
            } else {
                "Arquivo ${meta.fileName} importado (${meta.sizeMb} MB). Aviso: cabeçalho GGUF não detectado."
            }
        }
    }

    suspend fun downloadCatalogModel(modelId: String, scope: CoroutineScope): Result<String> {
        val model = db.localModelDao().getAllSnapshot().firstOrNull { it.id == modelId }
            ?: return Result.failure(IllegalArgumentException("Modelo não encontrado"))
        if (model.downloadUrl.isBlank()) {
            return Result.failure(IllegalStateException("URL de download não definida"))
        }
        val modelsDir = File(context.filesDir, "local_models").apply { mkdirs() }
        val ext = if (model.format == "ONNX") "onnx" else "gguf"
        val destFile = File(modelsDir, "${model.id}.$ext")

        db.localModelDao().upsertModel(model.copy(isDownloading = true, downloadProgress = 0.02f))

        val result = apiClient.downloadFileWithProgress(model.downloadUrl, destFile) { progress ->
            scope.launch(Dispatchers.IO) {
                db.localModelDao().upsertModel(
                    model.copy(isDownloading = true, downloadProgress = progress)
                )
            }
        }

        return result.fold(
            onSuccess = { file ->
                db.localModelDao().upsertModel(
                    model.copy(
                        isDownloading = false,
                        isDownloaded = true,
                        downloadProgress = 1f,
                        filePath = file.absolutePath
                    )
                )
                Result.success("Download concluído: ${model.name}")
            },
            onFailure = { err ->
                db.localModelDao().upsertModel(model.copy(isDownloading = false, downloadProgress = 0f))
                Result.failure(err)
            }
        )
    }

    suspend fun removeDownloadedModel(modelId: String) {
        val model = db.localModelDao().getAllSnapshot().firstOrNull { it.id == modelId } ?: return
        if (model.format == "BUILTIN") return
        if (model.filePath.isNotBlank()) {
            runCatching { File(model.filePath).delete() }
        }
        if (model.id.startsWith("custom-")) {
            db.localModelDao().deleteModel(modelId)
        } else {
            db.localModelDao().upsertModel(
                model.copy(isDownloaded = false, filePath = "", isActive = false, downloadProgress = 0f)
            )
            db.localModelDao().setActiveModel("agi-local-core-v1")
        }
    }

    // Synchronization
    fun observePeriodicSyncWorkInfo(): Flow<List<WorkInfo>> =
        WorkManager.getInstance(context).getWorkInfosForUniqueWorkFlow(AgiSyncWorker.UNIQUE_PERIODIC_WORK_NAME)

    suspend fun runManualSync(): Boolean = runSyncCycle().success

    suspend fun runSyncCycle(): SyncCycleOutcome {
        val settings = preferences.settingsFlow.first()
        if (settings.cloudDisabledCompletely) return SyncCycleOutcome(success = false)
        val telemetry = telemetryMonitor.snapshot().also { _hardwareTelemetry.value = it }
        if (!telemetry.isOnline) return SyncCycleOutcome(success = false)
        if (settings.wifiOnlySync && telemetry.isMetered) return SyncCycleOutcome(success = false)
        val targetUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
        if (targetUrl.isBlank()) return SyncCycleOutcome(success = false)

        val pendingQueue = db.syncQueueDao().getPendingItems()
        val pendingMemories = db.memoryDao().getPendingSyncMemories()
        val pendingChatMessages = chatRepository.getPendingSyncMessages()
        if (pendingQueue.isEmpty() && pendingMemories.isEmpty() && pendingChatMessages.isEmpty()) {
            preferences.updateLastSyncTimestamp(System.currentTimeMillis())
            return SyncCycleOutcome(success = true, syncedItems = 0)
        }

        val token = preferences.getDecryptedAuthToken()
        var allSuccess = true
        var anyConflict = false
        var syncedCount = 0

        // 0. Sync pending local chat messages to n8n
        if (pendingChatMessages.isNotEmpty()) {
            syncedCount += chatRepository.pushPendingMessagesToN8n()
        }

        // 1. Sync pending local memories to n8n cloud memory state
        pendingMemories.forEach { memory ->
            val memoryPayload = JSONObject().apply {
                put("entityType", "MEMORY")
                put("id", memory.id)
                put("layer", memory.layer)
                put("category", memory.category)
                put("title", memory.title)
                put("content", memory.content)
                put("tags", memory.tagsCsv)
                put("source", memory.source)
                put("version", memory.version)
                put("updatedAt", memory.updatedAt)
            }.toString()

            val res = apiClient.pushSyncBatch(
                baseUrl = targetUrl,
                syncPath = settings.syncWebhookPath,
                authToken = token,
                enforceHttpsOnly = settings.enforceHttpsOnly,
                payloadJson = memoryPayload
            )
            when {
                res.success -> {
                    db.memoryDao().markMemorySynced(memory.id)
                    syncedCount++
                }
                res.conflict -> {
                    allSuccess = false
                    anyConflict = true
                    when (settings.conflictStrategy) {
                        SyncConflictStrategy.LOCAL_WINS -> {
                            db.memoryDao().upsertMemory(memory.copy(version = memory.version + 1, syncStatus = "PENDING_SYNC"))
                        }
                        SyncConflictStrategy.SERVER_WINS -> {
                            db.memoryDao().markMemorySynced(memory.id)
                        }
                        SyncConflictStrategy.ASK -> {
                            db.memoryDao().upsertMemory(memory.copy(syncStatus = "CONFLICT"))
                        }
                    }
                }
                else -> {
                    allSuccess = false
                }
            }
        }

        // 2. Sync pending conversation continuity / operation queue items
        pendingQueue.forEach { item ->
            val res = apiClient.pushSyncBatch(
                baseUrl = targetUrl,
                syncPath = settings.syncWebhookPath,
                authToken = token,
                enforceHttpsOnly = settings.enforceHttpsOnly,
                payloadJson = item.payloadJson
            )
            when {
                res.success -> {
                    db.syncQueueDao().upsertItem(item.copy(status = "SYNCED"))
                    syncedCount++
                }
                res.conflict -> {
                    allSuccess = false
                    anyConflict = true
                    when (settings.conflictStrategy) {
                        SyncConflictStrategy.LOCAL_WINS -> {
                            db.syncQueueDao().upsertItem(item.copy(version = item.version + 1, status = "PENDING"))
                        }
                        SyncConflictStrategy.SERVER_WINS -> {
                            db.syncQueueDao().upsertItem(item.copy(status = "SYNCED", conflictMessage = "Resolvido pelo servidor"))
                        }
                        SyncConflictStrategy.ASK -> {
                            db.syncQueueDao().upsertItem(item.copy(status = "CONFLICT", conflictMessage = res.message))
                        }
                    }
                }
                else -> {
                    allSuccess = false
                    db.syncQueueDao().upsertItem(
                        item.copy(
                            status = "ERROR",
                            conflictMessage = res.message,
                            retryCount = item.retryCount + 1
                        )
                    )
                }
            }
        }

        if (allSuccess) {
            preferences.updateLastSyncTimestamp(System.currentTimeMillis())
        }
        db.telemetryLogDao().insertLog(
            TelemetryLogEntity(
                source = "WorkManagerSync",
                level = if (allSuccess) "INFO" else "WARN",
                message = "Ciclo de sincronização: $syncedCount item(ns) enviado(s), conflito=$anyConflict"
            )
        )
        return SyncCycleOutcome(
            success = allSuccess,
            syncedItems = syncedCount,
            hasConflict = anyConflict
        )
    }

    suspend fun resolveSyncConflict(itemId: String, keepLocal: Boolean) {
        val item = db.syncQueueDao().observeSyncQueue().first().firstOrNull { it.id == itemId } ?: return
        if (keepLocal) {
            db.syncQueueDao().upsertItem(item.copy(version = item.version + 1, status = "PENDING", conflictMessage = ""))
        } else {
            db.syncQueueDao().upsertItem(item.copy(status = "SYNCED", conflictMessage = ""))
        }
    }

    fun schedulePeriodicSync(intervalMinutes: Int, wifiOnly: Boolean, cloudDisabled: Boolean = false) {
        val workManager = WorkManager.getInstance(context)
        if (cloudDisabled || intervalMinutes <= 0) {
            workManager.cancelUniqueWork(AgiSyncWorker.UNIQUE_PERIODIC_WORK_NAME)
            workManager.cancelUniqueWork(AgiSyncWorker.UNIQUE_IMMEDIATE_WORK_NAME)
            return
        }
        val networkType = if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(networkType)
            .setRequiresBatteryNotLow(true)
            .build()
        val request = PeriodicWorkRequestBuilder<AgiSyncWorker>(
            intervalMinutes.toLong().coerceAtLeast(15L),
            TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30L, TimeUnit.SECONDS)
            .addTag(AgiSyncWorker.WORK_TAG)
            .build()

        workManager.enqueueUniquePeriodicWork(
            AgiSyncWorker.UNIQUE_PERIODIC_WORK_NAME,
            ExistingPeriodicWorkPolicy.UPDATE,
            request
        )
    }

    fun enqueueImmediateSync(wifiOnly: Boolean) {
        val networkType = if (wifiOnly) NetworkType.UNMETERED else NetworkType.CONNECTED
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(networkType)
            .build()
        val request = OneTimeWorkRequestBuilder<AgiSyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15L, TimeUnit.SECONDS)
            .addTag(AgiSyncWorker.WORK_TAG)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            AgiSyncWorker.UNIQUE_IMMEDIATE_WORK_NAME,
            ExistingWorkPolicy.KEEP,
            request
        )
    }

    suspend fun clearLocalCaches() {
        db.telemetryLogDao().clearLogs()
        db.syncQueueDao().clearSynced()
    }

    fun readDocumentPreview(uri: Uri): String = localEngine.readDocumentTextPreview(uri)
}
