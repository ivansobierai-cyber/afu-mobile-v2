package tech.afuagro.agi

import android.app.Application
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import tech.afuagro.agi.core.model.AgentStatus
import tech.afuagro.agi.core.model.TaskPriority
import tech.afuagro.agi.core.model.TaskStatus
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.AgiDatabase
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.data.local.TaskHistoryEntity
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36], application = Application::class)
class RoomPersistenceTest {

    @Test
    fun chatDao_persistsSearchesAndSyncsMessagesLocally() = runBlocking {
        val db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AgiDatabase::class.java
        ).allowMainThreadQueries().build()

        try {
            val chatDao = db.chatDao()
            chatDao.upsertSession(
                ChatSessionEntity(
                    id = "sess-room-1",
                    title = "Sessão Room",
                    createdAt = 1000L,
                    updatedAt = 1000L,
                    modeUsed = "HYBRID",
                    activeAgentsCsv = "Orquestrador,Programador",
                    syncStatus = "PENDING_SYNC"
                )
            )
            chatDao.upsertMessages(
                listOf(
                    ChatMessageEntity(
                        id = "msg-1",
                        sessionId = "sess-room-1",
                        role = "user",
                        content = "Implementar persistência local no Room",
                        timestamp = 1001L,
                        syncStatus = "PENDING_SYNC"
                    ),
                    ChatMessageEntity(
                        id = "msg-2",
                        sessionId = "sess-room-1",
                        role = "agi",
                        content = "Entidades e DAOs configurados.",
                        agentsInvolvedCsv = "Programador,Auditor",
                        modelUsed = "deepseek-reasoner",
                        latencyMs = 150L,
                        tokensUsed = 90,
                        timestamp = 1002L,
                        syncStatus = "SYNCED"
                    )
                )
            )

            val sessionMsgs = chatDao.observeMessages("sess-room-1").first()
            assertEquals(2, sessionMsgs.size)
            assertEquals("msg-1", sessionMsgs.first().id)

            val searchResults = chatDao.searchMessages("Programador").first()
            assertEquals(1, searchResults.size)
            assertEquals("msg-2", searchResults.first().id)

            val pendingBefore = chatDao.getPendingSyncMessages()
            assertEquals(1, pendingBefore.size)
            chatDao.markMessageSynced("msg-1")
            assertTrue(chatDao.getPendingSyncMessages().isEmpty())
        } finally {
            db.close()
        }
    }

    @Test
    fun agentDao_persistsMetadataAndQueriesOperationalStates() = runBlocking {
        val db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AgiDatabase::class.java
        ).allowMainThreadQueries().build()

        try {
            AgiDatabase.seedInitialCatalog(db)
            val agentDao = db.agentDao()

            val allAgents = agentDao.getAllSnapshot()
            assertTrue(allAgents.any { it.id == "plant-09" && it.name == "Planta Saudável" })

            agentDao.upsertAgent(
                AgentEntity(
                    id = "custom-sec-01",
                    name = "Guardião",
                    specialty = "Cibersegurança & Auditoria",
                    description = "Verifica certificados e tokens locais.",
                    modelId = "qwen-max",
                    toolsCsv = "tls-check,keystore-audit",
                    permissionsCsv = "READ,AUDIT",
                    status = AgentStatus.ACTIVE.name,
                    isEnabled = true,
                    isCoreAgent = false
                )
            )

            agentDao.updateAgentOperationalState(
                id = "custom-sec-01",
                status = AgentStatus.PAUSED.name,
                isEnabled = false,
                updatedAt = 2000L
            )

            val updated = agentDao.getAgentById("custom-sec-01")
            assertNotNull(updated)
            assertEquals(AgentStatus.PAUSED.name, updated?.status)
            assertEquals(false, updated?.isEnabled)

            val pausedList = agentDao.observeAgentsByStatus(AgentStatus.PAUSED.name).first()
            assertTrue(pausedList.any { it.id == "custom-sec-01" })
        } finally {
            db.close()
        }
    }

    @Test
    fun taskAndHistoryDao_persistsTasksAndChronologicalAuditHistory() = runBlocking {
        val db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AgiDatabase::class.java
        ).allowMainThreadQueries().build()

        try {
            val taskDao = db.taskDao()
            val historyDao = db.taskHistoryDao()

            taskDao.upsertTask(
                TaskEntity(
                    id = "TSK-100",
                    title = "Sincronizar memória",
                    description = "Enviar lote pendente para n8n",
                    agentId = "exe-06",
                    agentName = "Executor",
                    priority = TaskPriority.HIGH.name,
                    status = TaskStatus.PENDING.name,
                    progress = 0f,
                    createdAt = 1000L
                )
            )
            historyDao.insertHistoryEntries(
                listOf(
                    TaskHistoryEntity(
                        id = "th-1",
                        taskId = "TSK-100",
                        agentId = "exe-06",
                        agentName = "Executor",
                        previousStatus = "NONE",
                        newStatus = TaskStatus.PENDING.name,
                        progress = 0f,
                        summary = "Tarefa criada",
                        timestamp = 1000L
                    ),
                    TaskHistoryEntity(
                        id = "th-2",
                        taskId = "TSK-100",
                        agentId = "exe-06",
                        agentName = "Executor",
                        previousStatus = TaskStatus.PENDING.name,
                        newStatus = TaskStatus.COMPLETED.name,
                        progress = 1f,
                        summary = "Concluída com sucesso",
                        evidenceText = "HTTP 200 OK",
                        latencyMs = 185L,
                        timestamp = 2000L
                    )
                )
            )
            taskDao.updateTaskProgressAndStatus(
                id = "TSK-100",
                status = TaskStatus.COMPLETED.name,
                progress = 1f,
                resultText = "HTTP 200 OK",
                auditTrail = "Criada -> Concluída"
            )

            val completed = taskDao.observeCompletedTaskHistory().first()
            assertEquals(1, completed.size)
            assertEquals("HTTP 200 OK", completed.first().resultText)

            val taskHistory = historyDao.observeHistoryForTask("TSK-100").first()
            assertEquals(2, taskHistory.size)
            assertEquals(TaskStatus.PENDING.name, taskHistory[0].newStatus)
            assertEquals(TaskStatus.COMPLETED.name, taskHistory[1].newStatus)

            val agentHistory = historyDao.observeHistoryForAgent("exe-06").first()
            assertEquals(2, agentHistory.size)
            assertEquals("th-2", agentHistory.first().id)
        } finally {
            db.close()
        }
    }

    @Test
    fun roomMigration2To3_preservesIntegrityWithoutSchemaException() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val dbFile = File(context.cacheDir, "migration_v2_to_v3_test.db")
        if (dbFile.exists()) dbFile.delete()

        // Create a real SQLite database matching AgiDatabase v2 schema
        val sqlite = SQLiteDatabase.openOrCreateDatabase(dbFile, null)
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `chat_sessions` (`id` TEXT NOT NULL, `title` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL, `modeUsed` TEXT NOT NULL, `activeAgentsCsv` TEXT NOT NULL, `syncStatus` TEXT NOT NULL, `version` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `chat_messages` (`id` TEXT NOT NULL, `sessionId` TEXT NOT NULL, `role` TEXT NOT NULL, `content` TEXT NOT NULL, `attachmentsJson` TEXT NOT NULL, `stageReached` TEXT NOT NULL, `agentsInvolvedCsv` TEXT NOT NULL, `modelUsed` TEXT NOT NULL, `executionMode` TEXT NOT NULL, `latencyMs` INTEGER NOT NULL, `tokensUsed` INTEGER NOT NULL, `isCancelled` INTEGER NOT NULL, `timestamp` INTEGER NOT NULL, `syncStatus` TEXT NOT NULL, `version` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE INDEX IF NOT EXISTS `index_chat_messages_sessionId` ON `chat_messages` (`sessionId`)")
        sqlite.execSQL("CREATE INDEX IF NOT EXISTS `index_chat_messages_syncStatus` ON `chat_messages` (`syncStatus`)")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `agents` (`id` TEXT NOT NULL, `name` TEXT NOT NULL, `specialty` TEXT NOT NULL, `description` TEXT NOT NULL, `modelId` TEXT NOT NULL, `toolsCsv` TEXT NOT NULL, `permissionsCsv` TEXT NOT NULL, `status` TEXT NOT NULL, `isEnabled` INTEGER NOT NULL, `tasksAssigned` INTEGER NOT NULL, `tasksCompleted` INTEGER NOT NULL, `avgLatencyMs` INTEGER NOT NULL, `successRate` REAL NOT NULL, `isCoreAgent` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `tasks` (`id` TEXT NOT NULL, `title` TEXT NOT NULL, `description` TEXT NOT NULL, `agentId` TEXT NOT NULL, `agentName` TEXT NOT NULL, `priority` TEXT NOT NULL, `status` TEXT NOT NULL, `progress` REAL NOT NULL, `dependenciesCsv` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, `deadlineAt` INTEGER, `resultText` TEXT NOT NULL, `evidenceText` TEXT NOT NULL, `auditTrail` TEXT NOT NULL, `requiresAdminAuth` INTEGER NOT NULL, `isLocalOnly` INTEGER NOT NULL, `syncStatus` TEXT NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `memories` (`id` TEXT NOT NULL, `layer` TEXT NOT NULL, `category` TEXT NOT NULL, `title` TEXT NOT NULL, `content` TEXT NOT NULL, `tagsCsv` TEXT NOT NULL, `source` TEXT NOT NULL, `version` INTEGER NOT NULL, `syncStatus` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, `updatedAt` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE INDEX IF NOT EXISTS `index_memories_layer` ON `memories` (`layer`)")
        sqlite.execSQL("CREATE INDEX IF NOT EXISTS `index_memories_category` ON `memories` (`category`)")
        sqlite.execSQL("CREATE INDEX IF NOT EXISTS `index_memories_syncStatus` ON `memories` (`syncStatus`)")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `api_providers` (`id` TEXT NOT NULL, `name` TEXT NOT NULL, `baseUrl` TEXT NOT NULL, `encryptedApiKey` TEXT NOT NULL, `maskedKey` TEXT NOT NULL, `defaultModel` TEXT NOT NULL, `availableModelsCsv` TEXT NOT NULL, `authType` TEXT NOT NULL, `rateLimitRpm` INTEGER NOT NULL, `connectionStatus` TEXT NOT NULL, `priorityOrder` INTEGER NOT NULL, `costPer1kTokensUsd` REAL NOT NULL, `maxContextTokens` INTEGER NOT NULL, `extraConfigJson` TEXT NOT NULL, `tokensConsumed` INTEGER NOT NULL, `lastLatencyMs` INTEGER NOT NULL, `lastTestedAt` INTEGER NOT NULL, `isEnabled` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `local_models` (`id` TEXT NOT NULL, `name` TEXT NOT NULL, `family` TEXT NOT NULL, `format` TEXT NOT NULL, `quantization` TEXT NOT NULL, `sizeMb` INTEGER NOT NULL, `minRamMb` INTEGER NOT NULL, `contextLength` INTEGER NOT NULL, `threads` INTEGER NOT NULL, `temperature` REAL NOT NULL, `useGpuDelegate` INTEGER NOT NULL, `filePath` TEXT NOT NULL, `downloadUrl` TEXT NOT NULL, `isDownloaded` INTEGER NOT NULL, `isDownloading` INTEGER NOT NULL, `downloadProgress` REAL NOT NULL, `isActive` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `sync_queue` (`id` TEXT NOT NULL, `entityType` TEXT NOT NULL, `entityId` TEXT NOT NULL, `operation` TEXT NOT NULL, `payloadJson` TEXT NOT NULL, `version` INTEGER NOT NULL, `status` TEXT NOT NULL, `conflictMessage` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, `retryCount` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        sqlite.execSQL("CREATE TABLE IF NOT EXISTS `telemetry_logs` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, `timestamp` INTEGER NOT NULL, `source` TEXT NOT NULL, `level` TEXT NOT NULL, `message` TEXT NOT NULL, `latencyMs` INTEGER NOT NULL, `tokensUsed` INTEGER NOT NULL, `estimatedCostUsd` REAL NOT NULL, `providerId` TEXT NOT NULL)")
        sqlite.execSQL("PRAGMA user_version = 2")
        sqlite.close()

        // Open with Room v3 WITHOUT fallbackToDestructiveMigration so identity hash is strictly verified!
        val migratedDb = Room.databaseBuilder(context, AgiDatabase::class.java, dbFile.absolutePath)
            .addMigrations(AgiDatabase.MIGRATION_1_2, AgiDatabase.MIGRATION_2_3)
            .allowMainThreadQueries()
            .build()

        try {
            migratedDb.taskHistoryDao().insertHistoryEntry(
                TaskHistoryEntity(
                    id = "th-mig-1",
                    taskId = "TSK-MIG",
                    agentId = "orch-01",
                    agentName = "Orquestrador",
                    previousStatus = "NONE",
                    newStatus = "PENDING",
                    progress = 0f,
                    summary = "Migrado v2->v3 com sucesso"
                )
            )
            val entries = migratedDb.taskHistoryDao().getRecentHistorySnapshot()
            assertEquals(1, entries.size)
            assertEquals("TSK-MIG", entries.first().taskId)
        } finally {
            migratedDb.close()
            dbFile.delete()
        }
    }
}
