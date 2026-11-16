package tech.afuagro.agi.data.repository

import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.data.local.ChatDao
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.preferences.AgiPreferencesRepository
import tech.afuagro.agi.network.AgiApiClient
import tech.afuagro.agi.network.N8nReceivedMessageDto
import tech.afuagro.agi.network.SyncPushResult
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.util.UUID

enum class ChatHistorySource {
    LOCAL_CACHE,
    LOCAL_AND_N8N_SYNCED
}

data class ChatHistorySyncState(
    val sessionId: String,
    val messages: List<ChatMessageEntity>,
    val source: ChatHistorySource,
    val isSyncingWithN8n: Boolean,
    val newlySyncedCount: Int = 0,
    val uploadedPendingCount: Int = 0,
    val syncError: String? = null
)

interface N8nChatRemoteDataSource {
    suspend fun fetchRemoteMessages(
        sessionId: String,
        sinceTimestamp: Long?
    ): Result<List<N8nReceivedMessageDto>>

    suspend fun pushPendingMessage(message: ChatMessageEntity): SyncPushResult
}

class AgiApiN8nChatRemoteDataSource(
    private val preferences: AgiPreferencesRepository,
    private val apiClient: AgiApiClient
) : N8nChatRemoteDataSource {

    override suspend fun fetchRemoteMessages(
        sessionId: String,
        sinceTimestamp: Long?
    ): Result<List<N8nReceivedMessageDto>> {
        val settings = preferences.settingsFlow.first()
        if (settings.cloudDisabledCompletely) {
            return Result.failure(
                IllegalStateException("Comunicação em nuvem bloqueada nas configurações de segurança.")
            )
        }
        val targetUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
        if (targetUrl.isBlank()) {
            return Result.failure(
                IllegalStateException("URL do servidor AGI / n8n não configurada.")
            )
        }
        val messagesPath = "${settings.orchestratorWebhookPath.trimEnd('/')}/messages"
        val token = preferences.getDecryptedAuthToken()
        return apiClient.fetchRemoteMessages(
            baseUrl = targetUrl,
            messagesPath = messagesPath,
            authToken = token,
            enforceHttpsOnly = settings.enforceHttpsOnly,
            sessionId = sessionId,
            sinceTimestamp = sinceTimestamp
        )
    }

    override suspend fun pushPendingMessage(message: ChatMessageEntity): SyncPushResult {
        val settings = preferences.settingsFlow.first()
        if (settings.cloudDisabledCompletely) {
            return SyncPushResult(
                success = false,
                message = "Comunicação em nuvem bloqueada nas configurações."
            )
        }
        val targetUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
        if (targetUrl.isBlank()) {
            return SyncPushResult(
                success = false,
                message = "URL do servidor AGI / n8n não configurada."
            )
        }
        val token = preferences.getDecryptedAuthToken()
        val payloadJson = JSONObject().apply {
            put("entityType", "CHAT_MESSAGE")
            put("id", message.id)
            put("sessionId", message.sessionId)
            put("role", message.role)
            put("content", message.content)
            put("attachmentsJson", message.attachmentsJson)
            put("agentsInvolvedCsv", message.agentsInvolvedCsv)
            put("modelUsed", message.modelUsed)
            put("executionMode", message.executionMode)
            put("timestamp", message.timestamp)
            put("version", message.version)
        }.toString()

        return apiClient.pushSyncBatch(
            baseUrl = targetUrl,
            syncPath = settings.syncWebhookPath,
            authToken = token,
            enforceHttpsOnly = settings.enforceHttpsOnly,
            payloadJson = payloadJson
        )
    }
}

interface ChatRepository {
    val sessionsFlow: Flow<List<ChatSessionEntity>>

    fun observeSessionMessages(sessionId: String): Flow<List<ChatMessageEntity>>

    /**
     * Garante carregamento instantâneo do histórico persistido no Room DAO antes de iniciar
     * a sincronização assíncrona com o n8n.
     */
    fun loadSessionHistoryLocalFirstThenSync(sessionId: String): Flow<ChatHistorySyncState>

    suspend fun getCachedMessagesSnapshot(sessionId: String): List<ChatMessageEntity>

    suspend fun getSessionById(sessionId: String): ChatSessionEntity?

    suspend fun createSession(
        title: String = "Nova Sessão AGI",
        modeUsed: String = IntelligenceMode.HYBRID.name
    ): String

    suspend fun ensureSessionExists(
        sessionId: String,
        title: String,
        modeUsed: String,
        syncStatus: String = "PENDING_SYNC"
    ): ChatSessionEntity

    suspend fun updateSession(session: ChatSessionEntity)

    suspend fun deleteSession(sessionId: String)

    suspend fun persistLocalMessage(message: ChatMessageEntity)

    suspend fun persistLocalMessages(messages: List<ChatMessageEntity>)

    suspend fun getPendingSyncMessages(): List<ChatMessageEntity>

    suspend fun pushPendingMessagesToN8n(sessionId: String? = null): Int

    suspend fun syncSessionWithN8n(sessionId: String): Result<Int>

    fun searchMessages(query: String): Flow<List<ChatMessageEntity>>
}

class OfflineFirstChatRepository(
    private val chatDao: ChatDao,
    private val remoteDataSource: N8nChatRemoteDataSource,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) : ChatRepository {

    override val sessionsFlow: Flow<List<ChatSessionEntity>> = chatDao.observeSessions()

    override fun observeSessionMessages(sessionId: String): Flow<List<ChatMessageEntity>> =
        chatDao.observeMessages(sessionId)

    override fun loadSessionHistoryLocalFirstThenSync(sessionId: String): Flow<ChatHistorySyncState> = flow {
        // 1. Leitura instantânea do histórico local no Room DAO antes de qualquer chamada de rede
        val cachedMessages = chatDao.getMessagesSnapshot(sessionId)
        emit(
            ChatHistorySyncState(
                sessionId = sessionId,
                messages = cachedMessages,
                source = ChatHistorySource.LOCAL_CACHE,
                isSyncingWithN8n = true
            )
        )

        // 2. Envio de mensagens locais pendentes + pull incremental do n8n
        val uploadedCount = pushPendingMessagesToN8n(sessionId)
        val pullResult = pullRemoteMessagesIntoRoom(sessionId)
        val updatedMessages = chatDao.getMessagesSnapshot(sessionId)

        emit(
            ChatHistorySyncState(
                sessionId = sessionId,
                messages = updatedMessages,
                source = ChatHistorySource.LOCAL_AND_N8N_SYNCED,
                isSyncingWithN8n = false,
                newlySyncedCount = pullResult.getOrDefault(0),
                uploadedPendingCount = uploadedCount,
                syncError = pullResult.exceptionOrNull()?.localizedMessage
            )
        )
    }.flowOn(ioDispatcher)

    override suspend fun getCachedMessagesSnapshot(sessionId: String): List<ChatMessageEntity> =
        withContext(ioDispatcher) {
            chatDao.getMessagesSnapshot(sessionId)
        }

    override suspend fun getSessionById(sessionId: String): ChatSessionEntity? =
        withContext(ioDispatcher) {
            chatDao.getSessionById(sessionId)
        }

    override suspend fun createSession(title: String, modeUsed: String): String =
        withContext(ioDispatcher) {
            val id = "sess-${UUID.randomUUID().toString().take(8)}"
            val now = System.currentTimeMillis()
            chatDao.upsertSession(
                ChatSessionEntity(
                    id = id,
                    title = title,
                    createdAt = now,
                    updatedAt = now,
                    modeUsed = modeUsed,
                    activeAgentsCsv = "Orquestrador",
                    syncStatus = "LOCAL_ONLY",
                    version = 1
                )
            )
            id
        }

    override suspend fun ensureSessionExists(
        sessionId: String,
        title: String,
        modeUsed: String,
        syncStatus: String
    ): ChatSessionEntity = withContext(ioDispatcher) {
        val existing = chatDao.getSessionById(sessionId)
        val now = System.currentTimeMillis()
        if (existing == null) {
            val created = ChatSessionEntity(
                id = sessionId,
                title = title.take(36).ifBlank { "Nova Conversa" },
                createdAt = now,
                updatedAt = now,
                modeUsed = modeUsed,
                activeAgentsCsv = "Orquestrador",
                syncStatus = syncStatus,
                version = 1
            )
            chatDao.upsertSession(created)
            created
        } else if (existing.title == "Nova Sessão AGI" && title.isNotBlank()) {
            val updated = existing.copy(
                title = title.take(40),
                updatedAt = now,
                version = existing.version + 1
            )
            chatDao.upsertSession(updated)
            updated
        } else {
            existing
        }
    }

    override suspend fun updateSession(session: ChatSessionEntity) = withContext(ioDispatcher) {
        chatDao.upsertSession(session)
    }

    override suspend fun deleteSession(sessionId: String) = withContext(ioDispatcher) {
        chatDao.deleteMessagesForSession(sessionId)
        chatDao.deleteSession(sessionId)
    }

    override suspend fun persistLocalMessage(message: ChatMessageEntity) = withContext(ioDispatcher) {
        chatDao.upsertMessage(message)
        val session = chatDao.getSessionById(message.sessionId)
        if (session != null) {
            chatDao.upsertSession(
                session.copy(
                    updatedAt = maxOf(session.updatedAt, message.timestamp)
                )
            )
        }
    }

    override suspend fun persistLocalMessages(messages: List<ChatMessageEntity>) = withContext(ioDispatcher) {
        if (messages.isEmpty()) return@withContext
        chatDao.upsertMessages(messages)
    }

    override suspend fun getPendingSyncMessages(): List<ChatMessageEntity> = withContext(ioDispatcher) {
        chatDao.getPendingSyncMessages()
    }

    override suspend fun pushPendingMessagesToN8n(sessionId: String?): Int = withContext(ioDispatcher) {
        val pending = chatDao.getPendingSyncMessages()
            .filter { sessionId == null || it.sessionId == sessionId }
        var pushed = 0
        pending.forEach { msg ->
            val result = remoteDataSource.pushPendingMessage(msg)
            if (result.success) {
                chatDao.markMessageSynced(msg.id)
                pushed++
            }
        }
        pushed
    }

    override suspend fun syncSessionWithN8n(sessionId: String): Result<Int> = withContext(ioDispatcher) {
        pushPendingMessagesToN8n(sessionId)
        pullRemoteMessagesIntoRoom(sessionId)
    }

    override fun searchMessages(query: String): Flow<List<ChatMessageEntity>> =
        chatDao.searchMessages(query)

    private suspend fun pullRemoteMessagesIntoRoom(sessionId: String): Result<Int> {
        val existingMessages = chatDao.getMessagesSnapshot(sessionId)
        val existingIds = existingMessages.map { it.id }.toSet()
        val sinceTs = existingMessages.maxOfOrNull { it.timestamp }

        val remoteResult = remoteDataSource.fetchRemoteMessages(
            sessionId = sessionId,
            sinceTimestamp = sinceTs
        )

        return remoteResult.map { remoteList ->
            val newEntities = remoteList
                .filter { it.content.isNotBlank() && !existingIds.contains(it.id) }
                .map { dto ->
                    val agentsCsv = dto.agentsInvolved
                        ?.filter { it.isNotBlank() }
                        ?.joinToString(",")
                        ?.ifBlank { dto.agent ?: "Orquestrador" }
                        ?: (dto.agent ?: "Orquestrador")
                    ChatMessageEntity(
                        id = dto.id,
                        sessionId = dto.sessionId ?: sessionId,
                        role = dto.role,
                        content = dto.content,
                        agentsInvolvedCsv = agentsCsv,
                        modelUsed = dto.model.orEmpty(),
                        executionMode = dto.executionMode ?: IntelligenceMode.CLOUD.name,
                        latencyMs = dto.latencyMs,
                        tokensUsed = dto.tokensUsed,
                        timestamp = dto.timestamp ?: System.currentTimeMillis(),
                        syncStatus = "SYNCED"
                    )
                }

            if (newEntities.isNotEmpty()) {
                if (chatDao.getSessionById(sessionId) == null) {
                    val now = System.currentTimeMillis()
                    chatDao.upsertSession(
                        ChatSessionEntity(
                            id = sessionId,
                            title = newEntities.first().content.take(36),
                            createdAt = now,
                            updatedAt = now,
                            modeUsed = IntelligenceMode.CLOUD.name,
                            activeAgentsCsv = "Orquestrador",
                            syncStatus = "SYNCED",
                            version = 1
                        )
                    )
                }
                chatDao.upsertMessages(newEntities)
            }
            newEntities.size
        }
    }
}
