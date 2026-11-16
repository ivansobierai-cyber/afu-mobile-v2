package tech.afuagro.agi.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import tech.afuagro.agi.core.model.MemoryCategory
import tech.afuagro.agi.core.model.MemoryLayer
import tech.afuagro.agi.core.model.ProviderAuthType
import tech.afuagro.agi.core.model.RoutingStrategy
import tech.afuagro.agi.core.model.SyncConflictStrategy
import tech.afuagro.agi.core.model.TaskPriority
import tech.afuagro.agi.core.model.TaskStatus
import tech.afuagro.agi.core.agro.ProcessedRawAgroResult
import tech.afuagro.agi.core.agro.RawAgroDataProcessor
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.data.repository.AgiRepository
import tech.afuagro.agi.network.PlantImageAnalyzeResponse
import tech.afuagro.agi.network.PlantMonitoringAlertDto
import tech.afuagro.agi.ui.theme.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class ControlViewModel(private val repository: AgiRepository) : ViewModel() {

    private val _statusFeedback = MutableStateFlow<String?>(null)
    val statusFeedback: StateFlow<String?> = _statusFeedback.asStateFlow()

    private val _testingProviderId = MutableStateFlow<String?>(null)
    val testingProviderId: StateFlow<String?> = _testingProviderId.asStateFlow()

    private val _isPlantAnalyzing = MutableStateFlow(false)
    val isPlantAnalyzing: StateFlow<Boolean> = _isPlantAnalyzing.asStateFlow()

    private val _plantDiagnosisResult = MutableStateFlow<PlantImageAnalyzeResponse?>(null)
    val plantDiagnosisResult: StateFlow<PlantImageAnalyzeResponse?> = _plantDiagnosisResult.asStateFlow()

    private val _plantMonitoringAlerts = MutableStateFlow<List<PlantMonitoringAlertDto>>(emptyList())
    val plantMonitoringAlerts: StateFlow<List<PlantMonitoringAlertDto>> = _plantMonitoringAlerts.asStateFlow()

    private val _processedRawAgro = MutableStateFlow<ProcessedRawAgroResult?>(null)
    val processedRawAgro: StateFlow<ProcessedRawAgroResult?> = _processedRawAgro.asStateFlow()

    fun clearFeedback() {
        _statusFeedback.value = null
    }

    // Agents
    fun observeAgent(agentId: String): Flow<AgentEntity?> = repository.observeAgent(agentId)
    fun observeTasksForAgent(agentId: String): Flow<List<TaskEntity>> = repository.observeTasksForAgent(agentId)

    fun toggleAgent(agentId: String, enabled: Boolean) {
        viewModelScope.launch { repository.toggleAgentEnabled(agentId, enabled) }
    }

    fun updateAgentConfig(agentId: String, specialty: String, modelId: String, permissionsCsv: String) {
        viewModelScope.launch {
            repository.updateAgentConfig(agentId, specialty, modelId, permissionsCsv)
            _statusFeedback.value = "Configuração do agente atualizada."
        }
    }

    fun createCustomAgent(name: String, specialty: String, description: String, modelId: String, toolsCsv: String) {
        viewModelScope.launch {
            repository.createCustomAgent(name, specialty, description, modelId, toolsCsv)
            _statusFeedback.value = "Novo agente '$name' autorizado e registrado."
        }
    }

    // Tasks
    fun createTask(
        title: String,
        description: String,
        agentId: String,
        agentName: String,
        priority: TaskPriority,
        dependenciesCsv: String,
        requiresAdminAuth: Boolean
    ) {
        viewModelScope.launch {
            repository.createTask(title, description, agentId, agentName, priority, dependenciesCsv, requiresAdminAuth)
            _statusFeedback.value = "Tarefa criada na fila operacional."
        }
    }

    fun updateTaskStatus(taskId: String, status: TaskStatus, resultNote: String = "") {
        viewModelScope.launch {
            repository.updateTaskStatus(taskId, status, resultNote)
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            repository.deleteTask(taskId)
            _statusFeedback.value = "Tarefa removida."
        }
    }

    // API Router
    fun setRoutingStrategy(strategy: RoutingStrategy) {
        viewModelScope.launch {
            repository.preferences.setRoutingStrategy(strategy)
            _statusFeedback.value = "Estratégia de roteamento alterada para ${strategy.label}."
        }
    }

    fun saveProviderConfig(
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
        viewModelScope.launch {
            repository.saveProviderConfig(
                providerId, baseUrl, plainApiKey, defaultModel, availableModelsCsv,
                authType, rateLimitRpm, costPer1kTokensUsd, maxContextTokens, isEnabled
            )
            _statusFeedback.value = "Provedor salvo com chave cifrada no Android Keystore."
        }
    }

    fun moveProviderPriority(providerId: String, delta: Int) {
        viewModelScope.launch { repository.moveProviderPriority(providerId, delta) }
    }

    fun testProvider(providerId: String) {
        viewModelScope.launch {
            _testingProviderId.value = providerId
            val msg = repository.testProvider(providerId)
            _testingProviderId.value = null
            _statusFeedback.value = msg
        }
    }

    // Local Models & Intelligence Manager
    fun activateLocalModel(modelId: String) {
        viewModelScope.launch {
            repository.activateLocalModel(modelId)
            _statusFeedback.value = "Modelo local selecionado como motor ativo."
        }
    }

    fun updateLocalModelConfig(modelId: String, contextLength: Int, threads: Int, temp: Float, useGpu: Boolean) {
        viewModelScope.launch {
            repository.updateLocalModelInferenceConfig(modelId, contextLength, threads, temp, useGpu)
            _statusFeedback.value = "Parâmetros de inferência local salvos."
        }
    }

    fun importLocalModel(uri: Uri) {
        viewModelScope.launch {
            val res = repository.importLocalModelFromUri(uri)
            _statusFeedback.value = res.fold(
                onSuccess = { it },
                onFailure = { "Falha ao importar modelo: ${it.localizedMessage}" }
            )
        }
    }

    fun downloadCatalogModel(modelId: String) {
        viewModelScope.launch {
            val res = repository.downloadCatalogModel(modelId, viewModelScope)
            _statusFeedback.value = res.fold(
                onSuccess = { it },
                onFailure = { "Erro no download: ${it.localizedMessage}" }
            )
        }
    }

    fun removeLocalModel(modelId: String) {
        viewModelScope.launch {
            repository.removeDownloadedModel(modelId)
            _statusFeedback.value = "Modelo removido do armazenamento."
        }
    }

    fun setWifiOnlySync(wifiOnly: Boolean) {
        viewModelScope.launch {
            repository.preferences.setWifiOnlySync(wifiOnly)
            val current = repository.settingsFlow.first()
            repository.schedulePeriodicSync(
                intervalMinutes = current.autoSyncIntervalMinutes,
                wifiOnly = wifiOnly,
                cloudDisabled = current.cloudDisabledCompletely
            )
        }
    }

    fun setCloudDisabledCompletely(disabled: Boolean) {
        viewModelScope.launch {
            repository.preferences.setCloudDisabledCompletely(disabled)
            val current = repository.settingsFlow.first()
            repository.schedulePeriodicSync(
                intervalMinutes = current.autoSyncIntervalMinutes,
                wifiOnly = current.wifiOnlySync,
                cloudDisabled = disabled
            )
        }
    }

    fun resolveConflict(itemId: String, keepLocal: Boolean) {
        viewModelScope.launch {
            repository.resolveSyncConflict(itemId, keepLocal)
            _statusFeedback.value = "Conflito de sincronização resolvido."
        }
    }

    // Memory
    fun addMemory(layer: MemoryLayer, category: MemoryCategory, title: String, content: String, tags: String) {
        viewModelScope.launch {
            repository.addMemory(layer, category, title, content, tags)
            _statusFeedback.value = "Registro salvo na memória local (${layer.label})."
        }
    }

    fun deleteMemory(id: String) {
        viewModelScope.launch {
            repository.deleteMemory(id)
            _statusFeedback.value = "Registro removido da memória."
        }
    }

    fun semanticSearch(query: String, all: List<MemoryEntity>): List<Pair<MemoryEntity, Float>> =
        repository.semanticSearchMemories(query, all)

    suspend fun exportMemoriesJson(): String = repository.exportMemoriesAsJson()

    // Settings & Security
    fun saveServerEndpoints(
        agiUrl: String,
        n8nUrl: String,
        orchPath: String,
        statusPath: String,
        syncPath: String,
        routerPath: String,
        authToken: String?
    ) {
        viewModelScope.launch {
            repository.preferences.saveBackendEndpoints(agiUrl, n8nUrl, orchPath, statusPath, syncPath, routerPath)
            if (authToken != null) {
                repository.preferences.saveAuthToken(authToken)
            }
            _statusFeedback.value = "Endereços e credenciais salvos com segurança."
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch { repository.preferences.setThemeMode(mode) }
    }

    fun setStreamingEnabled(enabled: Boolean) {
        viewModelScope.launch { repository.preferences.setStreamingEnabled(enabled) }
    }

    fun setEnforceHttpsOnly(enforce: Boolean) {
        viewModelScope.launch { repository.preferences.setEnforceHttpsOnly(enforce) }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch { repository.preferences.setNotificationsEnabled(enabled) }
    }

    fun setSyncSettings(intervalMin: Int, strategy: SyncConflictStrategy, wifiOnly: Boolean) {
        viewModelScope.launch {
            repository.preferences.setSyncSettings(intervalMin, strategy)
            repository.preferences.setWifiOnlySync(wifiOnly)
            val current = repository.settingsFlow.first()
            repository.schedulePeriodicSync(
                intervalMinutes = intervalMin,
                wifiOnly = wifiOnly,
                cloudDisabled = current.cloudDisabledCompletely
            )
            _statusFeedback.value = "Política de sincronização atualizada."
        }
    }

    fun setAdminPin(pin: String) {
        viewModelScope.launch {
            repository.preferences.setAdminPin(pin)
            _statusFeedback.value = if (pin.isBlank()) "PIN de administrador removido." else "PIN de administrador configurado."
        }
    }

    fun clearCredentials() {
        viewModelScope.launch {
            repository.preferences.clearCredentials()
            _statusFeedback.value = "Credenciais locais removidas (Logout seguro)."
        }
    }

    fun clearCache() {
        viewModelScope.launch {
            repository.clearLocalCaches()
            _statusFeedback.value = "Cache e logs locais limpos."
        }
    }

    // Agente Planta Saudável
    fun savePlantHealthyEndpoints(baseUrl: String, analyzePath: String, telemetryPath: String, alertsPath: String) {
        viewModelScope.launch {
            repository.preferences.savePlantHealthyEndpoints(baseUrl, analyzePath, telemetryPath, alertsPath)
            _statusFeedback.value = "Endpoints da API Planta Saudável salvos."
        }
    }

    fun loginAfuAccount(apiBaseUrl: String, email: String, password: String) {
        viewModelScope.launch {
            repository.loginAfuAccount(apiBaseUrl, email, password)
                .onSuccess {
                    _statusFeedback.value = "Login AFU Agro OK — contexto de fazenda carregado."
                }
                .onFailure { err ->
                    _statusFeedback.value = err.localizedMessage ?: "Falha no login AFU."
                }
        }
    }

    fun refreshAfuFarmContext() {
        viewModelScope.launch {
            repository.refreshAfuFarmContext()
                .onSuccess {
                    _statusFeedback.value = "Contexto AFU atualizado (${it.propriedades?.size ?: 0} propriedade(s))."
                }
                .onFailure { err ->
                    _statusFeedback.value = err.localizedMessage ?: "Falha ao ler contexto AFU."
                }
        }
    }

    fun selectAfuFarmContext(
        organizationId: Long,
        organizationName: String,
        propriedadeId: Long?,
        propriedadeName: String?
    ) {
        viewModelScope.launch {
            repository.selectAfuFarmContext(
                organizationId = organizationId,
                organizationName = organizationName,
                propriedadeId = propriedadeId,
                propriedadeName = propriedadeName
            ).onSuccess {
                _statusFeedback.value = "Fazenda ativa: ${propriedadeName ?: organizationName}"
            }.onFailure { err ->
                _statusFeedback.value = err.localizedMessage ?: "Falha ao selecionar fazenda."
            }
        }
    }

    fun analyzePlantImage(
        imageUrl: String?,
        localImageUri: Uri?,
        cropType: String,
        generation: String,
        fieldNotes: String?
    ) {
        viewModelScope.launch {
            _isPlantAnalyzing.value = true
            repository.analyzePlantHealthyImage(
                imageUrl = imageUrl,
                localImageUri = localImageUri,
                cropType = cropType,
                generation = generation,
                fieldNotes = fieldNotes
            ).onSuccess { resp ->
                _plantDiagnosisResult.value = resp
                _statusFeedback.value = "Diagnóstico recebido e salvo na memória multigeneracional."
            }.onFailure { err ->
                _statusFeedback.value = err.localizedMessage ?: "Erro na análise fitotécnica."
            }
            _isPlantAnalyzing.value = false
        }
    }

    fun cleanRawAgroData(rawInput: String, cropType: String, generation: String) {
        val processed = RawAgroDataProcessor.process(
            rawInput = rawInput,
            fallbackCropType = cropType,
            fallbackGeneration = generation
        )
        _processedRawAgro.value = processed
        _statusFeedback.value = "Dados limpos: ${processed.normalizedFields.size} campo(s) válido(s), ${processed.discardedFields.size} descartado(s)."
    }

    fun sendNormalizedAgroTelemetry(rawInput: String, cropType: String, generation: String) {
        val processed = RawAgroDataProcessor.process(
            rawInput = rawInput,
            fallbackCropType = cropType,
            fallbackGeneration = generation
        )
        _processedRawAgro.value = processed
        if (processed.normalizedFields.isEmpty()) {
            _statusFeedback.value = "Nenhum dado válido após higienização para enviar."
            return
        }
        viewModelScope.launch {
            _isPlantAnalyzing.value = true
            repository.submitPlantHealthyTelemetry(processed)
                .onSuccess { resp ->
                    resp.alerts?.let { _plantMonitoringAlerts.value = it }
                    _statusFeedback.value = resp.message ?: "Dados normalizados enviados à API de monitoramento."
                }
                .onFailure { err ->
                    _statusFeedback.value = err.localizedMessage ?: "Falha ao enviar dados de monitoramento."
                }
            _isPlantAnalyzing.value = false
        }
    }

    fun fetchPlantMonitoringAlerts(cropType: String?, generation: String?) {
        viewModelScope.launch {
            _isPlantAnalyzing.value = true
            repository.fetchPlantHealthyAlerts(cropType, generation)
                .onSuccess { resp ->
                    _plantMonitoringAlerts.value = resp.alerts.orEmpty()
                    _statusFeedback.value = "Alertas atualizados (${resp.alerts.orEmpty().size} registro(s))."
                }
                .onFailure { err ->
                    _statusFeedback.value = err.localizedMessage ?: "Falha ao consultar alertas na API."
                }
            _isPlantAnalyzing.value = false
        }
    }

    fun readAgroRawFileText(uri: Uri): String = repository.readAgroRawFileText(uri)
}
