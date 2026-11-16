package tech.afuagro.agi

import android.app.Application
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import tech.afuagro.agi.data.local.AgiDatabase
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.repository.ChatHistorySource
import tech.afuagro.agi.data.repository.ChatHistorySyncState
import tech.afuagro.agi.data.repository.N8nChatRemoteDataSource
import tech.afuagro.agi.data.repository.OfflineFirstChatRepository
import tech.afuagro.agi.network.N8nReceivedMessageDto
import tech.afuagro.agi.network.SyncPushResult
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36], application = Application::class)
class ChatRepositoryTest {

    private lateinit var db: AgiDatabase

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AgiDatabase::class.java
        ).allowMainThreadQueries().build()
    }

    @After
    fun teardown() {
        db.close()
    }

    @Test
    fun loadSessionHistoryLocalFirstThenSync_emitsRoomCacheImmediatelyBeforeN8nSyncCompletes() = runBlocking {
        val gate = CompletableDeferred<Unit>()
        val fakeRemote = object : N8nChatRemoteDataSource {
            override suspend fun fetchRemoteMessages(
                sessionId: String,
                sinceTimestamp: Long?
            ): Result<List<N8nReceivedMessageDto>> {
                gate.await()
                return Result.success(
                    listOf(
                        N8nReceivedMessageDto(
                            id = "msg-remote-2",
                            sessionId = sessionId,
                            role = "agi",
                            content = "Resposta sincronizada do n8n",
                            agentsInvolved = listOf("Orquestrador", "Pesquisador"),
                            model = "gemini-2.5-pro",
                            timestamp = 2000L
                        )
                    )
                )
            }

            override suspend fun pushPendingMessage(message: ChatMessageEntity): SyncPushResult =
                SyncPushResult(success = true, message = "ok")
        }

        val repo = OfflineFirstChatRepository(
            chatDao = db.chatDao(),
            remoteDataSource = fakeRemote,
            ioDispatcher = Dispatchers.Unconfined
        )

        val sessionId = "sess-instant-1"
        db.chatDao().upsertSession(
            ChatSessionEntity(
                id = sessionId,
                title = "Sessão Persistida",
                createdAt = 1000L,
                updatedAt = 1000L,
                modeUsed = "HYBRID",
                activeAgentsCsv = "Orquestrador",
                syncStatus = "SYNCED"
            )
        )
        repo.persistLocalMessage(
            ChatMessageEntity(
                id = "msg-local-1",
                sessionId = sessionId,
                role = "user",
                content = "Mensagem em cache no Room",
                timestamp = 1500L,
                syncStatus = "SYNCED"
            )
        )

        val emissions = mutableListOf<ChatHistorySyncState>()
        val firstEmissionReady = CompletableDeferred<Unit>()

        val collectorJob = async(Dispatchers.Unconfined) {
            repo.loadSessionHistoryLocalFirstThenSync(sessionId)
                .take(2)
                .collect { state ->
                    emissions.add(state)
                    if (emissions.size == 1) {
                        firstEmissionReady.complete(Unit)
                    }
                }
        }

        // 1) A primeira emissão DEVE chegar imediatamente do Room mesmo com o n8n bloqueado pelo gate
        withTimeout(2000L) { firstEmissionReady.await() }
        assertEquals(1, emissions.size)
        assertEquals(ChatHistorySource.LOCAL_CACHE, emissions[0].source)
        assertTrue(emissions[0].isSyncingWithN8n)
        assertEquals(listOf("Mensagem em cache no Room"), emissions[0].messages.map { it.content })

        // 2) Libera a resposta do n8n e valida a segunda emissão pós-sincronização
        gate.complete(Unit)
        withTimeout(2000L) { collectorJob.await() }

        assertEquals(2, emissions.size)
        val syncedState = emissions[1]
        assertEquals(ChatHistorySource.LOCAL_AND_N8N_SYNCED, syncedState.source)
        assertFalse(syncedState.isSyncingWithN8n)
        assertEquals(1, syncedState.newlySyncedCount)
        assertNull(syncedState.syncError)
        assertEquals(
            listOf("Mensagem em cache no Room", "Resposta sincronizada do n8n"),
            syncedState.messages.map { it.content }
        )

        // Confirma persistência no Room DAO
        val persisted = repo.getCachedMessagesSnapshot(sessionId)
        assertEquals(2, persisted.size)
        assertEquals("SYNCED", persisted.last().syncStatus)
    }

    @Test
    fun loadSessionHistoryLocalFirstThenSync_preservesRoomHistoryWhenN8nOffline() = runBlocking {
        val offlineRemote = object : N8nChatRemoteDataSource {
            override suspend fun fetchRemoteMessages(
                sessionId: String,
                sinceTimestamp: Long?
            ): Result<List<N8nReceivedMessageDto>> =
                Result.failure(IOException("n8n inacessível"))

            override suspend fun pushPendingMessage(message: ChatMessageEntity): SyncPushResult =
                SyncPushResult(success = false, message = "offline")
        }

        val repo = OfflineFirstChatRepository(
            chatDao = db.chatDao(),
            remoteDataSource = offlineRemote,
            ioDispatcher = Dispatchers.Unconfined
        )

        val sessionId = repo.createSession(title = "Modo Offline")
        repo.persistLocalMessage(
            ChatMessageEntity(
                id = "msg-offline-1",
                sessionId = sessionId,
                role = "user",
                content = "Histórico local preservado",
                timestamp = 3000L,
                syncStatus = "PENDING_SYNC"
            )
        )

        val states = repo.loadSessionHistoryLocalFirstThenSync(sessionId).toList()
        assertEquals(2, states.size)
        assertEquals(ChatHistorySource.LOCAL_CACHE, states[0].source)
        assertEquals(1, states[0].messages.size)

        val finalState = states[1]
        assertEquals(ChatHistorySource.LOCAL_AND_N8N_SYNCED, finalState.source)
        assertFalse(finalState.isSyncingWithN8n)
        assertNotNull(finalState.syncError)
        assertEquals(listOf("Histórico local preservado"), finalState.messages.map { it.content })
    }

    @Test
    fun pushPendingMessagesAndSync_marksLocalPendingMessagesSyncedAfterN8nAck() = runBlocking {
        val pushedIds = mutableListOf<String>()
        val remote = object : N8nChatRemoteDataSource {
            override suspend fun fetchRemoteMessages(
                sessionId: String,
                sinceTimestamp: Long?
            ): Result<List<N8nReceivedMessageDto>> = Result.success(emptyList())

            override suspend fun pushPendingMessage(message: ChatMessageEntity): SyncPushResult {
                pushedIds.add(message.id)
                return SyncPushResult(success = true, message = "Synced")
            }
        }

        val repo = OfflineFirstChatRepository(
            chatDao = db.chatDao(),
            remoteDataSource = remote,
            ioDispatcher = Dispatchers.Unconfined
        )

        val sessionId = repo.createSession(title = "Sync Bidirecional")
        repo.persistLocalMessage(
            ChatMessageEntity(
                id = "msg-pend-1",
                sessionId = sessionId,
                role = "user",
                content = "Mensagem pendente de envio ao n8n",
                timestamp = 5000L,
                syncStatus = "PENDING_SYNC"
            )
        )

        assertEquals(1, repo.getPendingSyncMessages().size)

        val states = repo.loadSessionHistoryLocalFirstThenSync(sessionId).toList()
        assertEquals(1, states.last().uploadedPendingCount)
        assertEquals(listOf("msg-pend-1"), pushedIds)
        assertTrue(repo.getPendingSyncMessages().isEmpty())
        assertEquals("SYNCED", repo.getCachedMessagesSnapshot(sessionId).single().syncStatus)
    }
}
