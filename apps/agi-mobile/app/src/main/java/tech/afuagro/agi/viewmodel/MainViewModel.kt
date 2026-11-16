package tech.afuagro.agi.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import tech.afuagro.agi.core.model.AttachmentPayload
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.local.LocalModelEntity
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.data.local.SyncQueueEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.data.local.TelemetryLogEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.data.repository.AgiRepository
import tech.afuagro.agi.network.BackendProbeResult
import androidx.work.WorkInfo
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(val repository: AgiRepository) : ViewModel() {

    val settings: StateFlow<AgiSettingsState> = repository.settingsFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        AgiSettingsState()
    )

    val backendStatus: StateFlow<BackendProbeResult> = repository.backendStatus
    val hardwareTelemetry: StateFlow<HardwareTelemetry> = repository.hardwareTelemetry

    val sessions: StateFlow<List<ChatSessionEntity>> = repository.sessionsFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val agents: StateFlow<List<AgentEntity>> = repository.agentsFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val tasks: StateFlow<List<TaskEntity>> = repository.tasksFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val providers: StateFlow<List<ApiProviderEntity>> = repository.providersFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val localModels: StateFlow<List<LocalModelEntity>> = repository.localModelsFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val memories: StateFlow<List<MemoryEntity>> = repository.memoriesFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val syncQueue: StateFlow<List<SyncQueueEntity>> = repository.syncQueueFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val telemetryLogs: StateFlow<List<TelemetryLogEntity>> = repository.telemetryLogsFlow.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val periodicSyncStatusLabel: StateFlow<String> = repository.observePeriodicSyncWorkInfo()
        .map { infos ->
            val info = infos.firstOrNull()
            when (info?.state) {
                WorkInfo.State.ENQUEUED -> "Agendado (WorkManager)"
                WorkInfo.State.RUNNING -> "Sincronizando em segundo plano…"
                WorkInfo.State.SUCCEEDED -> "Concluído"
                WorkInfo.State.BLOCKED -> "Aguardando restrições de rede"
                WorkInfo.State.FAILED -> "Falha na última tentativa"
                WorkInfo.State.CANCELLED, null -> "Inativo"
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "Inativo")

    private val _activeSessionId = MutableStateFlow<String?>(null)
    val activeSessionId: StateFlow<String?> = _activeSessionId.asStateFlow()

    @OptIn(ExperimentalCoroutinesApi::class)
    val activeMessages: StateFlow<List<ChatMessageEntity>> = _activeSessionId
        .flatMapLatest { id ->
            if (id.isNullOrBlank()) flowOf(emptyList()) else repository.observeMessages(id)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _operationalStage = MutableStateFlow(OperationalStage.IDLE)
    val operationalStage: StateFlow<OperationalStage> = _operationalStage.asStateFlow()

    private val _pendingAttachments = MutableStateFlow<List<AttachmentPayload>>(emptyList())
    val pendingAttachments: StateFlow<List<AttachmentPayload>> = _pendingAttachments.asStateFlow()

    private val _isProbingBackend = MutableStateFlow(false)
    val isProbingBackend: StateFlow<Boolean> = _isProbingBackend.asStateFlow()

    private val _isSyncingChatHistory = MutableStateFlow(false)
    val isSyncingChatHistory: StateFlow<Boolean> = _isSyncingChatHistory.asStateFlow()

    private val _uiBannerMessage = MutableStateFlow<String?>(null)
    val uiBannerMessage: StateFlow<String?> = _uiBannerMessage.asStateFlow()

    private var activeChatJob: Job? = null
    private var sessionSyncJob: Job? = null

    init {
        viewModelScope.launch {
            if (_activeSessionId.value == null) {
                val latestSession = repository.sessionsFlow.first().firstOrNull()
                if (latestSession != null) {
                    selectSession(latestSession.id)
                }
            }
        }
        viewModelScope.launch {
            while (true) {
                repository.refreshHardwareTelemetry()
                delay(5000L)
            }
        }
    }

    fun selectSession(sessionId: String) {
        _activeSessionId.value = sessionId
        sessionSyncJob?.cancel()
        sessionSyncJob = viewModelScope.launch {
            repository.loadSessionHistoryLocalFirstThenSync(sessionId).collect { state ->
                _isSyncingChatHistory.value = state.isSyncingWithN8n
            }
        }
    }

    fun startNewSessionAndSend(initialPrompt: String? = null) {
        viewModelScope.launch {
            sessionSyncJob?.cancel()
            _isSyncingChatHistory.value = false
            val newId = repository.createSession()
            _activeSessionId.value = newId
            if (!initialPrompt.isNullOrBlank()) {
                sendChatMessage(initialPrompt)
            }
        }
    }

    fun deleteSession(sessionId: String) {
        viewModelScope.launch {
            repository.deleteSession(sessionId)
            if (_activeSessionId.value == sessionId) {
                _activeSessionId.value = null
            }
        }
    }

    fun addAttachment(attachment: AttachmentPayload) {
        _pendingAttachments.value = _pendingAttachments.value + attachment
    }

    fun removeAttachment(id: String) {
        _pendingAttachments.value = _pendingAttachments.value.filterNot { it.id == id }
    }

    fun sendChatMessage(prompt: String) {
        val trimmed = prompt.trim()
        val attachments = _pendingAttachments.value
        if (trimmed.isEmpty() && attachments.isEmpty()) return

        activeChatJob?.cancel()
        activeChatJob = viewModelScope.launch {
            try {
                val targetSession = _activeSessionId.value ?: repository.createSession(
                    title = trimmed.take(36).ifBlank { "Sessão Multimodal" }
                ).also { _activeSessionId.value = it }

                _pendingAttachments.value = emptyList()
                repository.sendChatMessage(
                    sessionId = targetSession,
                    prompt = trimmed,
                    attachments = attachments,
                    onStageUpdate = { stage -> _operationalStage.value = stage }
                )
            } catch (_: CancellationException) {
                _operationalStage.value = OperationalStage.IDLE
                _activeSessionId.value?.let { repository.recordCancelledMessage(it) }
            } catch (e: Exception) {
                _operationalStage.value = OperationalStage.IDLE
                _uiBannerMessage.value = e.localizedMessage ?: "Erro ao processar mensagem"
            }
        }
    }

    fun cancelActiveOperation() {
        activeChatJob?.cancel()
        activeChatJob = null
        _operationalStage.value = OperationalStage.IDLE
    }

    fun setIntelligenceMode(mode: IntelligenceMode) {
        viewModelScope.launch {
            if (mode != IntelligenceMode.LOCAL && settings.value.cloudDisabledCompletely) {
                _uiBannerMessage.value = "Comunicação em nuvem está bloqueada nas configurações de segurança."
                return@launch
            }
            repository.preferences.setIntelligenceMode(mode)
        }
    }

    fun toggleTts() {
        viewModelScope.launch {
            repository.preferences.setTtsEnabled(!settings.value.ttsEnabled)
        }
    }

    fun probeBackend() {
        viewModelScope.launch {
            _isProbingBackend.value = true
            val res = repository.probeBackendConnection()
            _isProbingBackend.value = false
            _uiBannerMessage.value = res.errorMessage ?: "Servidor AGI online (${res.latencyMs} ms)"
        }
    }

    fun triggerManualSync() {
        viewModelScope.launch {
            val ok = repository.runManualSync()
            _uiBannerMessage.value = if (ok) {
                "Sincronização concluída com o núcleo central."
            } else {
                "Sincronização adiada: verifique rede, modo Wi-Fi ou URL do servidor."
            }
        }
    }

    fun syncActiveSessionMessages() {
        val sessionId = _activeSessionId.value
        if (sessionId.isNullOrBlank()) {
            _uiBannerMessage.value = "Selecione ou inicie uma conversa para buscar mensagens no n8n."
            return
        }
        sessionSyncJob?.cancel()
        sessionSyncJob = viewModelScope.launch {
            repository.loadSessionHistoryLocalFirstThenSync(sessionId).collect { state ->
                _isSyncingChatHistory.value = state.isSyncingWithN8n
                if (!state.isSyncingWithN8n) {
                    _uiBannerMessage.value = when {
                        state.syncError != null -> state.syncError
                        state.newlySyncedCount > 0 || state.uploadedPendingCount > 0 ->
                            "Sincronizado com n8n: ${state.newlySyncedCount} recebida(s), ${state.uploadedPendingCount} enviada(s)."
                        else -> "Histórico local atualizado; nenhuma nova mensagem no n8n."
                    }
                }
            }
        }
    }

    fun clearBanner() {
        _uiBannerMessage.value = null
    }

    fun postBanner(message: String) {
        _uiBannerMessage.value = message
    }

    suspend fun verifyAdminPin(pin: String): Boolean = repository.preferences.verifyAdminPin(pin)
}

class AgiViewModelFactory(private val repository: AgiRepository) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(MainViewModel::class.java) -> MainViewModel(repository) as T
            modelClass.isAssignableFrom(ControlViewModel::class.java) -> ControlViewModel(repository) as T
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
