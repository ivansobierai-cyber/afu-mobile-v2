package tech.afuagro.agi.network

import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.core.model.ProviderAuthType
import tech.afuagro.agi.data.local.ApiProviderEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream

data class BackendProbeResult(
    val reachable: Boolean,
    val httpCode: Int,
    val latencyMs: Long,
    val orchestratorStatus: String,
    val n8nStatus: String,
    val errorMessage: String? = null
)

data class OrchestratorResponse(
    val success: Boolean,
    val replyText: String,
    val modelUsed: String,
    val agentsInvolved: List<String>,
    val tokensUsed: Int,
    val estimatedCostUsd: Double,
    val latencyMs: Long,
    val executionId: String? = null,
    val createdTasks: List<RemoteTaskPayload> = emptyList(),
    val errorMessage: String? = null
)

data class RemoteTaskPayload(
    val id: String,
    val title: String,
    val description: String,
    val agentName: String,
    val status: String,
    val priority: String
)

data class ProviderTestResult(
    val reachable: Boolean,
    val statusLabel: String,
    val latencyMs: Long,
    val errorMessage: String? = null
)

data class SyncPushResult(
    val success: Boolean,
    val conflict: Boolean = false,
    val message: String
)

class AgiApiClient(
    private val client: OkHttpClient = N8nRetrofitFactory.createDefaultClient(),
    private val n8nService: N8nWebhookService = N8nRetrofitFactory.createN8nService(client = client),
    private val plantHealthyService: PlantHealthyService = N8nRetrofitFactory.createPlantHealthyService(client = client),
    private val afuAuthApi: AfuAuthApi = N8nRetrofitFactory.createAfuAuthApi(client = client)
) {

    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()
    private val responseAdapter = N8nRetrofitFactory.moshi.adapter(N8nAgentMessageResponse::class.java)
    private val chunkAdapter = N8nRetrofitFactory.moshi.adapter(N8nStreamChunkDto::class.java)

    fun validateUrlSecurity(url: String, enforceHttpsOnly: Boolean): String? {
        val trimmed = url.trim()
        if (trimmed.isEmpty()) return "URL do servidor não configurada."
        if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
            return "URL inválida. Utilize o prefixo https:// ou http://."
        }
        if (enforceHttpsOnly && trimmed.startsWith("http://")) {
            val isLocalDev = trimmed.startsWith("http://localhost") ||
                trimmed.startsWith("http://127.0.0.1") ||
                trimmed.startsWith("http://10.0.2.2")
            if (!isLocalDev) {
                return "Política HTTPS obrigatória ativa: conexões HTTP externas estão bloqueadas."
            }
        }
        return null
    }

    private fun buildEndpointUrl(baseUrl: String, path: String): String {
        val normalizedPath = if (path.startsWith("/")) path else "/$path"
        return "${baseUrl.trimEnd('/')}$normalizedPath"
    }

    private fun bearerHeader(authToken: String): String? =
        authToken.trim().takeIf { it.isNotEmpty() }?.let { "Bearer $it" }

    private fun extractTargetAgent(message: String): String? {
        val trimmed = message.trimStart()
        if (!trimmed.startsWith("@")) return null
        val candidate = trimmed.substring(1).takeWhile { !it.isWhitespace() }
        return candidate.takeIf { it.isNotBlank() }
    }

    suspend fun probeBackendStatus(
        baseUrl: String,
        statusPath: String,
        authToken: String,
        enforceHttpsOnly: Boolean
    ): BackendProbeResult = withContext(Dispatchers.IO) {
        val securityError = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (securityError != null) {
            return@withContext BackendProbeResult(
                reachable = false,
                httpCode = 0,
                latencyMs = 0L,
                orchestratorStatus = "Não configurado",
                n8nStatus = "Desconectado",
                errorMessage = securityError
            )
        }

        val fullUrl = buildEndpointUrl(baseUrl, statusPath)
        val start = System.currentTimeMillis()
        return@withContext runCatching {
            val resp = n8nService.probeStatus(
                statusUrl = fullUrl,
                authHeader = bearerHeader(authToken)
            )
            val latency = System.currentTimeMillis() - start
            if (resp.isSuccessful) {
                val body = resp.body()
                BackendProbeResult(
                    reachable = true,
                    httpCode = resp.code(),
                    latencyMs = latency,
                    orchestratorStatus = body?.orchestratorStatus?.ifBlank { "Online" } ?: "Online",
                    n8nStatus = body?.n8nStatus?.ifBlank { "Conectado" } ?: "Conectado"
                )
            } else {
                BackendProbeResult(
                    reachable = false,
                    httpCode = resp.code(),
                    latencyMs = latency,
                    orchestratorStatus = "Erro HTTP ${resp.code()}",
                    n8nStatus = "Indisponível",
                    errorMessage = "Servidor respondeu com HTTP ${resp.code()}"
                )
            }
        }.getOrElse { err ->
            BackendProbeResult(
                reachable = false,
                httpCode = 0,
                latencyMs = System.currentTimeMillis() - start,
                orchestratorStatus = "Inacessível",
                n8nStatus = "Offline",
                errorMessage = err.localizedMessage ?: "Falha de rede ao consultar servidor"
            )
        }
    }

    suspend fun sendOrchestratorMessage(
        baseUrl: String,
        webhookPath: String,
        authToken: String,
        enforceHttpsOnly: Boolean,
        sessionId: String,
        message: String,
        routingStrategy: String,
        preferredModel: String,
        mode: String,
        memoryContext: List<String>,
        attachmentNames: List<String>,
        onStageUpdate: suspend (OperationalStage) -> Unit
    ): OrchestratorResponse = withContext(Dispatchers.IO) {
        val securityError = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (securityError != null) {
            return@withContext OrchestratorResponse(
                success = false,
                replyText = "",
                modelUsed = preferredModel,
                agentsInvolved = emptyList(),
                tokensUsed = 0,
                estimatedCostUsd = 0.0,
                latencyMs = 0L,
                errorMessage = securityError
            )
        }

        val fullUrl = buildEndpointUrl(baseUrl, webhookPath)
        val requestDto = N8nAgentMessageRequest(
            sessionId = sessionId,
            message = message,
            mode = mode,
            routingStrategy = routingStrategy,
            preferredModel = preferredModel,
            targetAgent = extractTargetAgent(message),
            contextMemories = memoryContext,
            attachments = attachmentNames,
            timestamp = System.currentTimeMillis()
        )

        onStageUpdate(OperationalStage.INTERPRETING)
        val start = System.currentTimeMillis()

        return@withContext runCatching {
            onStageUpdate(OperationalStage.PLANNING)
            val resp = n8nService.sendMessageToWebhook(
                webhookUrl = fullUrl,
                authHeader = bearerHeader(authToken),
                request = requestDto
            )
            currentCoroutineContext().ensureActive()
            val latency = System.currentTimeMillis() - start
            val contentType = resp.headers()["Content-Type"].orEmpty()

            if (!resp.isSuccessful) {
                val errBody = resp.errorBody()?.string().orEmpty().take(300)
                return@runCatching OrchestratorResponse(
                    success = false,
                    replyText = "",
                    modelUsed = preferredModel,
                    agentsInvolved = emptyList(),
                    tokensUsed = 0,
                    estimatedCostUsd = 0.0,
                    latencyMs = latency,
                    errorMessage = "HTTP ${resp.code()}: ${errBody.ifBlank { resp.message() }}"
                )
            }

            onStageUpdate(OperationalStage.CONSULTING_AGENTS)

            val responseBody = resp.body()
            if (contentType.contains("text/event-stream", ignoreCase = true) && responseBody != null) {
                responseBody.use { body ->
                    val source = body.source()
                    val collected = StringBuilder()
                    var modelUsed = preferredModel
                    val agents = mutableListOf<String>()
                    var tokens = 0

                    while (!source.exhausted()) {
                        currentCoroutineContext().ensureActive()
                        val line = source.readUtf8Line() ?: break
                        if (line.startsWith("data:")) {
                            val data = line.removePrefix("data:").trim()
                            if (data == "[DONE]") break
                            val chunk = runCatching { chunkAdapter.fromJson(data) }.getOrNull()
                            if (chunk != null) {
                                chunk.stage?.let { mapStageString(it) }?.let { onStageUpdate(it) }
                                val tokenText = chunk.delta.orEmpty()
                                    .ifBlank { chunk.output.orEmpty() }
                                    .ifBlank { chunk.reply.orEmpty() }
                                    .ifBlank { chunk.text.orEmpty() }
                                if (tokenText.isNotEmpty()) collected.append(tokenText)
                                if (!chunk.model.isNullOrBlank()) modelUsed = chunk.model
                                if (chunk.tokensUsed != null) tokens = chunk.tokensUsed
                                chunk.agents?.forEach { name ->
                                    if (name.isNotBlank() && !agents.contains(name)) agents.add(name)
                                }
                            } else if (data.isNotBlank()) {
                                collected.append(data)
                            }
                        }
                    }
                    onStageUpdate(OperationalStage.VALIDATING)
                    onStageUpdate(OperationalStage.CONCLUDING)
                    OrchestratorResponse(
                        success = true,
                        replyText = collected.toString().ifBlank { "Operação concluída pelo orquestrador n8n." },
                        modelUsed = modelUsed,
                        agentsInvolved = agents.ifEmpty { listOf("Orquestrador") },
                        tokensUsed = tokens,
                        estimatedCostUsd = tokens * 0.000002,
                        latencyMs = System.currentTimeMillis() - start
                    )
                }
            } else {
                val rawBody = responseBody?.use { it.string() }.orEmpty()
                onStageUpdate(OperationalStage.EXECUTING)
                val parsed = parseFlexibleOrchestratorJson(rawBody, preferredModel, latency)
                onStageUpdate(OperationalStage.VALIDATING)
                onStageUpdate(OperationalStage.CONCLUDING)
                parsed
            }
        }.getOrElse { err ->
            OrchestratorResponse(
                success = false,
                replyText = "",
                modelUsed = preferredModel,
                agentsInvolved = emptyList(),
                tokensUsed = 0,
                estimatedCostUsd = 0.0,
                latencyMs = System.currentTimeMillis() - start,
                errorMessage = err.localizedMessage ?: "Erro de comunicação com o orquestrador"
            )
        }
    }

    suspend fun fetchRemoteMessages(
        baseUrl: String,
        messagesPath: String,
        authToken: String,
        enforceHttpsOnly: Boolean,
        sessionId: String,
        sinceTimestamp: Long? = null
    ): Result<List<N8nReceivedMessageDto>> = withContext(Dispatchers.IO) {
        val securityError = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (securityError != null) {
            return@withContext Result.failure(IllegalStateException(securityError))
        }
        val fullUrl = buildEndpointUrl(baseUrl, messagesPath)
        runCatching {
            val resp = n8nService.fetchAgentMessages(
                messagesUrl = fullUrl,
                authHeader = bearerHeader(authToken),
                sessionId = sessionId,
                sinceTimestamp = sinceTimestamp
            )
            if (!resp.isSuccessful) {
                error("HTTP ${resp.code()}: ${resp.message()}")
            }
            resp.body()?.messages ?: emptyList()
        }
    }

    suspend fun analyzePlantImage(
        baseUrl: String,
        analyzePath: String,
        authToken: String,
        enforceHttpsOnly: Boolean,
        request: PlantImageAnalyzeRequest
    ): Result<Pair<PlantImageAnalyzeResponse, Long>> = withContext(Dispatchers.IO) {
        val securityError = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (securityError != null) {
            return@withContext Result.failure(IllegalStateException(securityError))
        }
        val fullUrl = buildEndpointUrl(baseUrl, analyzePath)
        val start = System.currentTimeMillis()
        runCatching {
            val resp = plantHealthyService.analyzePlantImage(
                endpointUrl = fullUrl,
                authHeader = bearerHeader(authToken),
                request = request
            )
            val latency = System.currentTimeMillis() - start
            if (!resp.isSuccessful) {
                val errBody = resp.errorBody()?.string().orEmpty().take(250)
                error("HTTP ${resp.code()}: ${errBody.ifBlank { resp.message() }}")
            }
            val body = resp.body() ?: error("Resposta vazia da API Planta Saudável.")
            if (!body.error.isNullOrBlank()) error(body.error)
            body to latency
        }
    }

    suspend fun sendPlantRawTelemetry(
        baseUrl: String,
        telemetryPath: String,
        authToken: String,
        enforceHttpsOnly: Boolean,
        request: PlantRawTelemetryRequest
    ): Result<Pair<PlantMonitoringResponse, Long>> = withContext(Dispatchers.IO) {
        val securityError = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (securityError != null) {
            return@withContext Result.failure(IllegalStateException(securityError))
        }
        val fullUrl = buildEndpointUrl(baseUrl, telemetryPath)
        val start = System.currentTimeMillis()
        runCatching {
            val resp = plantHealthyService.sendNormalizedTelemetry(
                endpointUrl = fullUrl,
                authHeader = bearerHeader(authToken),
                request = request
            )
            val latency = System.currentTimeMillis() - start
            if (!resp.isSuccessful) {
                error("HTTP ${resp.code()}: ${resp.message()}")
            }
            val body = resp.body() ?: PlantMonitoringResponse(status = "OK", message = "Dados recebidos")
            body to latency
        }
    }

    suspend fun fetchPlantMonitoringAlerts(
        baseUrl: String,
        alertsPath: String,
        authToken: String,
        enforceHttpsOnly: Boolean,
        cropType: String? = null,
        generation: String? = null,
        propriedadeId: Long? = null
    ): Result<PlantMonitoringResponse> = withContext(Dispatchers.IO) {
        val securityError = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (securityError != null) {
            return@withContext Result.failure(IllegalStateException(securityError))
        }
        val fullUrl = buildEndpointUrl(baseUrl, alertsPath)
        runCatching {
            val resp = plantHealthyService.fetchMonitoringAlerts(
                endpointUrl = fullUrl,
                authHeader = bearerHeader(authToken),
                cropType = cropType?.takeIf { it.isNotBlank() },
                generation = generation?.takeIf { it.isNotBlank() },
                propriedadeId = propriedadeId?.takeIf { it > 0L }
            )
            if (!resp.isSuccessful) {
                error("HTTP ${resp.code()}: ${resp.message()}")
            }
            resp.body() ?: PlantMonitoringResponse(status = "OK", alerts = emptyList())
        }
    }

    private fun parseFlexibleOrchestratorJson(
        rawBody: String,
        fallbackModel: String,
        latency: Long
    ): OrchestratorResponse {
        val dto = runCatching { responseAdapter.fromJson(rawBody) }.getOrNull()
        if (dto == null) {
            return OrchestratorResponse(
                success = rawBody.isNotBlank(),
                replyText = rawBody.ifBlank { "Resposta vazia do servidor." },
                modelUsed = fallbackModel,
                agentsInvolved = listOf("Orquestrador"),
                tokensUsed = 0,
                estimatedCostUsd = 0.0,
                latencyMs = latency
            )
        }
        if (dto.success == false && !dto.error.isNullOrBlank()) {
            return OrchestratorResponse(
                success = false,
                replyText = "",
                modelUsed = dto.model?.ifBlank { fallbackModel } ?: fallbackModel,
                agentsInvolved = emptyList(),
                tokensUsed = dto.tokensUsed ?: dto.totalTokens ?: 0,
                estimatedCostUsd = dto.estimatedCostUsd ?: 0.0,
                latencyMs = latency,
                executionId = dto.executionId,
                errorMessage = dto.error
            )
        }

        val reply = dto.output.orEmpty()
            .ifBlank { dto.reply.orEmpty() }
            .ifBlank { dto.response.orEmpty() }
            .ifBlank { dto.message.orEmpty() }
            .ifBlank { dto.text.orEmpty() }
            .ifBlank { rawBody }

        val agents = (dto.agents.orEmpty() + dto.agentsInvolved.orEmpty())
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinct()
            .ifEmpty { listOf("Orquestrador") }

        val tasks = dto.tasks.orEmpty().mapIndexed { index, t ->
            RemoteTaskPayload(
                id = t.id?.ifBlank { null } ?: "task-${System.currentTimeMillis()}-$index",
                title = t.title?.ifBlank { null } ?: "Subtarefa AGI",
                description = t.description.orEmpty(),
                agentName = t.agent?.ifBlank { null } ?: "Orquestrador",
                status = t.status?.ifBlank { null } ?: "COMPLETED",
                priority = t.priority?.ifBlank { null } ?: "MEDIUM"
            )
        }

        val tokens = dto.tokensUsed ?: dto.totalTokens ?: 0
        val cost = dto.estimatedCostUsd ?: (tokens * 0.000002)
        return OrchestratorResponse(
            success = true,
            replyText = reply,
            modelUsed = dto.model?.ifBlank { fallbackModel } ?: fallbackModel,
            agentsInvolved = agents,
            tokensUsed = tokens,
            estimatedCostUsd = cost,
            latencyMs = latency,
            executionId = dto.executionId?.ifBlank { null },
            createdTasks = tasks
        )
    }

    private fun mapStageString(raw: String): OperationalStage? {
        return when (raw.lowercase()) {
            "interpreting" -> OperationalStage.INTERPRETING
            "planning" -> OperationalStage.PLANNING
            "delegating" -> OperationalStage.DELEGATING
            "consulting" -> OperationalStage.CONSULTING_AGENTS
            "executing" -> OperationalStage.EXECUTING
            "validating" -> OperationalStage.VALIDATING
            "concluding" -> OperationalStage.CONCLUDING
            else -> null
        }
    }

    suspend fun testProviderConnection(
        provider: ApiProviderEntity,
        decryptedApiKey: String,
        backendBaseUrl: String,
        routerWebhookPath: String,
        backendAuthToken: String,
        enforceHttpsOnly: Boolean
    ): ProviderTestResult = withContext(Dispatchers.IO) {
        val start = System.currentTimeMillis()

        // Prefer testing via the secure AGI Backend Router using Retrofit
        if (backendBaseUrl.isNotBlank()) {
            val secErr = validateUrlSecurity(backendBaseUrl, enforceHttpsOnly)
            if (secErr != null) {
                return@withContext ProviderTestResult(false, "Bloqueado (HTTPS)", 0L, secErr)
            }
            val url = buildEndpointUrl(backendBaseUrl, routerWebhookPath)
            val requestDto = N8nProviderTestRequest(
                providerId = provider.id,
                providerName = provider.name,
                baseUrl = provider.baseUrl,
                model = provider.defaultModel
            )
            return@withContext runCatching {
                val resp = n8nService.testRouterProvider(
                    routerUrl = url,
                    authHeader = bearerHeader(backendAuthToken),
                    request = requestDto
                )
                val lat = System.currentTimeMillis() - start
                resp.body()?.close()
                if (resp.isSuccessful) {
                    ProviderTestResult(true, "Online (via Backend)", lat)
                } else {
                    ProviderTestResult(false, "HTTP ${resp.code()}", lat, "Backend Router retornou HTTP ${resp.code()}")
                }
            }.getOrElse {
                ProviderTestResult(false, "Inacessível", System.currentTimeMillis() - start, it.localizedMessage)
            }
        }

        // Direct endpoint reachability probe (metadata /models check)
        val secErr = validateUrlSecurity(provider.baseUrl, enforceHttpsOnly)
        if (secErr != null) {
            return@withContext ProviderTestResult(false, "Bloqueado (HTTPS)", 0L, secErr)
        }
        val probeUrl = when (provider.id) {
            "prov_gemini" -> {
                val keySuffix = if (decryptedApiKey.isNotBlank()) "?key=$decryptedApiKey" else ""
                "${provider.baseUrl.trimEnd('/')}/models$keySuffix"
            }
            else -> "${provider.baseUrl.trimEnd('/')}/models"
        }

        return@withContext runCatching {
            val reqBuilder = Request.Builder().url(probeUrl).get()
            when (ProviderAuthType.valueOf(provider.authType)) {
                ProviderAuthType.BEARER -> if (decryptedApiKey.isNotBlank()) reqBuilder.addHeader("Authorization", "Bearer $decryptedApiKey")
                ProviderAuthType.API_KEY_HEADER -> {
                    if (decryptedApiKey.isNotBlank()) reqBuilder.addHeader("x-api-key", decryptedApiKey)
                    if (provider.id == "prov_anthropic") reqBuilder.addHeader("anthropic-version", "2023-06-01")
                }
                ProviderAuthType.QUERY_PARAM, ProviderAuthType.NONE -> Unit
            }
            client.newCall(reqBuilder.build()).execute().use { resp ->
                val lat = System.currentTimeMillis() - start
                when {
                    resp.isSuccessful -> ProviderTestResult(true, "Conectado (${resp.code})", lat)
                    resp.code == 401 || resp.code == 403 -> ProviderTestResult(
                        false,
                        "Auth Requerida (${resp.code})",
                        lat,
                        "Endpoint alcançado (${lat}ms), mas chave/token não autorizado (HTTP ${resp.code})."
                    )
                    else -> ProviderTestResult(
                        false,
                        "Erro HTTP ${resp.code}",
                        lat,
                        "Servidor respondeu HTTP ${resp.code}"
                    )
                }
            }
        }.getOrElse {
            ProviderTestResult(false, "Offline / Erro", System.currentTimeMillis() - start, it.localizedMessage)
        }
    }

    suspend fun pushSyncBatch(
        baseUrl: String,
        syncPath: String,
        authToken: String,
        enforceHttpsOnly: Boolean,
        payloadJson: String
    ): SyncPushResult = withContext(Dispatchers.IO) {
        val secErr = validateUrlSecurity(baseUrl, enforceHttpsOnly)
        if (secErr != null) {
            return@withContext SyncPushResult(success = false, message = secErr)
        }
        val fullUrl = buildEndpointUrl(baseUrl, syncPath)
        return@withContext runCatching {
            val resp = n8nService.pushMemorySync(
                syncUrl = fullUrl,
                authHeader = bearerHeader(authToken),
                payload = payloadJson.toRequestBody(jsonMediaType)
            )
            resp.body()?.close()
            when {
                resp.isSuccessful -> SyncPushResult(success = true, message = "Sincronizado (HTTP ${resp.code()})")
                resp.code() == 409 -> SyncPushResult(
                    success = false,
                    conflict = true,
                    message = "Conflito de versão detectado pelo servidor (HTTP 409)"
                )
                else -> SyncPushResult(success = false, message = "Falha na sincronização: HTTP ${resp.code()}")
            }
        }.getOrElse {
            SyncPushResult(success = false, message = it.localizedMessage ?: "Falha de rede na sincronização")
        }
    }

    suspend fun afuLogin(
        baseUrl: String,
        email: String,
        password: String,
        enforceHttpsOnly: Boolean
    ): Result<AfuLoginResponse> = withContext(Dispatchers.IO) {
        runCatching {
            validateUrlSecurity(baseUrl, enforceHttpsOnly)?.let { error(it) }
            val url = buildEndpointUrl(baseUrl, "/api/agi/auth/login")
            val resp = afuAuthApi.login(url, AfuLoginRequest(email = email, password = password))
            val body = resp.body()
            if (!resp.isSuccessful || body?.accessToken.isNullOrBlank()) {
                error(body?.error ?: "Login AFU falhou (HTTP ${resp.code()})")
            }
            body!!
        }
    }

    suspend fun afuRefresh(
        baseUrl: String,
        refreshToken: String,
        enforceHttpsOnly: Boolean
    ): Result<AfuRefreshResponse> = withContext(Dispatchers.IO) {
        runCatching {
            validateUrlSecurity(baseUrl, enforceHttpsOnly)?.let { error(it) }
            val url = buildEndpointUrl(baseUrl, "/api/agi/auth/refresh")
            val resp = afuAuthApi.refresh(url, AfuRefreshRequest(refreshToken = refreshToken))
            val body = resp.body()
            if (!resp.isSuccessful || body?.accessToken.isNullOrBlank()) {
                error(body?.error ?: "Refresh AFU falhou (HTTP ${resp.code()})")
            }
            body!!
        }
    }

    suspend fun afuFarmContext(
        baseUrl: String,
        authToken: String,
        propriedadeId: Long?,
        enforceHttpsOnly: Boolean
    ): Result<AfuFarmContextResponse> = withContext(Dispatchers.IO) {
        runCatching {
            validateUrlSecurity(baseUrl, enforceHttpsOnly)?.let { error(it) }
            val url = buildEndpointUrl(baseUrl, "/api/agi/context")
            val resp = afuAuthApi.farmContext(
                endpointUrl = url,
                authHeader = bearerHeader(authToken),
                propriedadeId = propriedadeId?.takeIf { it > 0L }
            )
            val body = resp.body()
            if (!resp.isSuccessful || body == null) {
                error(body?.error ?: "Contexto AFU indisponível (HTTP ${resp.code()})")
            }
            body
        }
    }

    suspend fun afuSelectContext(
        baseUrl: String,
        authToken: String,
        organizationId: Long,
        propriedadeId: Long?,
        enforceHttpsOnly: Boolean
    ): Result<AfuSelectContextResponse> = withContext(Dispatchers.IO) {
        runCatching {
            validateUrlSecurity(baseUrl, enforceHttpsOnly)?.let { error(it) }
            val url = buildEndpointUrl(baseUrl, "/api/agi/context/select")
            val resp = afuAuthApi.selectContext(
                endpointUrl = url,
                authHeader = bearerHeader(authToken),
                body = AfuSelectContextRequest(
                    organizationId = organizationId,
                    propriedadeId = propriedadeId?.takeIf { it > 0L }
                )
            )
            val body = resp.body()
            if (!resp.isSuccessful || body?.success != true) {
                error(body?.error ?: "Falha ao selecionar contexto AFU (HTTP ${resp.code()})")
            }
            body
        }
    }

    suspend fun downloadFileWithProgress(
        url: String,
        destination: File,
        onProgress: suspend (Float) -> Unit
    ): Result<File> = withContext(Dispatchers.IO) {
        runCatching {
            val response = n8nService.downloadFile(url)
            if (!response.isSuccessful) {
                error("Download falhou com HTTP ${response.code()}")
            }
            val body = response.body() ?: error("Corpo da resposta vazio")
            body.use { responseBody ->
                val totalBytes = responseBody.contentLength()
                destination.parentFile?.mkdirs()
                responseBody.byteStream().use { input ->
                    FileOutputStream(destination).use { output ->
                        val buffer = ByteArray(8192)
                        var copied = 0L
                        var read: Int
                        var lastReported = -1f
                        while (input.read(buffer).also { read = it } != -1) {
                            currentCoroutineContext().ensureActive()
                            output.write(buffer, 0, read)
                            copied += read
                            if (totalBytes > 0) {
                                val pct = (copied.toFloat() / totalBytes).coerceIn(0f, 1f)
                                if (pct - lastReported >= 0.02f || pct >= 1f) {
                                    lastReported = pct
                                    onProgress(pct)
                                }
                            }
                        }
                    }
                }
            }
            destination
        }
    }
}
