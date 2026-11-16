package tech.afuagro.agi.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ChatDao {
    @Query("SELECT * FROM chat_sessions ORDER BY updatedAt DESC")
    fun observeSessions(): Flow<List<ChatSessionEntity>>

    @Query("SELECT * FROM chat_sessions WHERE id = :sessionId LIMIT 1")
    suspend fun getSessionById(sessionId: String): ChatSessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSession(session: ChatSessionEntity)

    @Query("DELETE FROM chat_sessions WHERE id = :sessionId")
    suspend fun deleteSession(sessionId: String)

    @Query("SELECT * FROM chat_messages WHERE sessionId = :sessionId ORDER BY timestamp ASC")
    fun observeMessages(sessionId: String): Flow<List<ChatMessageEntity>>

    @Query("SELECT * FROM chat_messages WHERE sessionId = :sessionId ORDER BY timestamp ASC")
    suspend fun getMessagesSnapshot(sessionId: String): List<ChatMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMessage(message: ChatMessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMessages(messages: List<ChatMessageEntity>)

    @Query("SELECT * FROM chat_messages WHERE syncStatus IN ('PENDING_SYNC', 'CONFLICT') ORDER BY timestamp ASC")
    suspend fun getPendingSyncMessages(): List<ChatMessageEntity>

    @Query("UPDATE chat_messages SET syncStatus = 'SYNCED' WHERE id = :id")
    suspend fun markMessageSynced(id: String)

    @Query("SELECT * FROM chat_messages WHERE content LIKE '%' || :query || '%' OR agentsInvolvedCsv LIKE '%' || :query || '%' ORDER BY timestamp DESC LIMIT 100")
    fun searchMessages(query: String): Flow<List<ChatMessageEntity>>

    @Query("DELETE FROM chat_messages WHERE sessionId = :sessionId")
    suspend fun deleteMessagesForSession(sessionId: String)

    @Query("SELECT COUNT(*) FROM chat_messages")
    fun observeTotalMessageCount(): Flow<Int>
}

@Dao
interface AgentDao {
    @Query("SELECT * FROM agents ORDER BY isCoreAgent DESC, name ASC")
    fun observeAgents(): Flow<List<AgentEntity>>

    @Query("SELECT * FROM agents WHERE isEnabled = 1 ORDER BY isCoreAgent DESC, name ASC")
    fun observeEnabledAgents(): Flow<List<AgentEntity>>

    @Query("SELECT * FROM agents WHERE status = :status ORDER BY name ASC")
    fun observeAgentsByStatus(status: String): Flow<List<AgentEntity>>

    @Query("SELECT * FROM agents ORDER BY isCoreAgent DESC, name ASC")
    suspend fun getAllSnapshot(): List<AgentEntity>

    @Query("SELECT * FROM agents WHERE id = :id LIMIT 1")
    fun observeAgent(id: String): Flow<AgentEntity?>

    @Query("SELECT * FROM agents WHERE id = :id LIMIT 1")
    suspend fun getAgentById(id: String): AgentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAgent(agent: AgentEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAllIgnore(agents: List<AgentEntity>)

    @Query("UPDATE agents SET status = :status, isEnabled = :isEnabled, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateAgentOperationalState(
        id: String,
        status: String,
        isEnabled: Boolean,
        updatedAt: Long = System.currentTimeMillis()
    )

    @Query("DELETE FROM agents WHERE id = :id AND isCoreAgent = 0")
    suspend fun deleteCustomAgent(id: String)
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun observeTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE status = :status ORDER BY createdAt DESC")
    fun observeTasksByStatus(status: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE status IN ('COMPLETED', 'FAILED') ORDER BY createdAt DESC")
    fun observeCompletedTaskHistory(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE agentId = :agentId ORDER BY createdAt DESC")
    fun observeTasksForAgent(agentId: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE syncStatus IN ('PENDING_SYNC', 'CONFLICT') ORDER BY createdAt ASC")
    suspend fun getPendingSyncTasks(): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getTaskById(id: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertTask(task: TaskEntity)

    @Query("UPDATE tasks SET syncStatus = 'SYNCED' WHERE id = :id")
    suspend fun markTaskSynced(id: String)

    @Query("UPDATE tasks SET status = :status, progress = :progress, resultText = :resultText, auditTrail = :auditTrail WHERE id = :id")
    suspend fun updateTaskProgressAndStatus(
        id: String,
        status: String,
        progress: Float,
        resultText: String,
        auditTrail: String
    )

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteTask(id: String)
}

@Dao
interface TaskHistoryDao {
    @Query("SELECT * FROM task_history ORDER BY timestamp DESC")
    fun observeAllHistory(): Flow<List<TaskHistoryEntity>>

    @Query("SELECT * FROM task_history WHERE taskId = :taskId ORDER BY timestamp ASC")
    fun observeHistoryForTask(taskId: String): Flow<List<TaskHistoryEntity>>

    @Query("SELECT * FROM task_history WHERE agentId = :agentId ORDER BY timestamp DESC")
    fun observeHistoryForAgent(agentId: String): Flow<List<TaskHistoryEntity>>

    @Query("SELECT * FROM task_history ORDER BY timestamp DESC LIMIT :limit")
    suspend fun getRecentHistorySnapshot(limit: Int = 50): List<TaskHistoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistoryEntry(entry: TaskHistoryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistoryEntries(entries: List<TaskHistoryEntity>)

    @Query("DELETE FROM task_history WHERE taskId = :taskId")
    suspend fun deleteHistoryForTask(taskId: String)
}

@Dao
interface MemoryDao {
    @Query("SELECT * FROM memories ORDER BY updatedAt DESC")
    fun observeMemories(): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM memories WHERE layer = :layer ORDER BY updatedAt DESC")
    fun observeMemoriesByLayer(layer: String): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM memories WHERE category = :category ORDER BY updatedAt DESC")
    fun observeMemoriesByCategory(category: String): Flow<List<MemoryEntity>>

    @Query(
        "SELECT * FROM memories WHERE title LIKE '%' || :query || '%' " +
            "OR content LIKE '%' || :query || '%' " +
            "OR tagsCsv LIKE '%' || :query || '%' " +
            "ORDER BY updatedAt DESC"
    )
    fun searchMemoriesByKeyword(query: String): Flow<List<MemoryEntity>>

    @Query("SELECT * FROM memories WHERE syncStatus IN ('PENDING_SYNC', 'CONFLICT')")
    suspend fun getPendingSyncMemories(): List<MemoryEntity>

    @Query("UPDATE memories SET syncStatus = 'SYNCED', updatedAt = :syncedAt WHERE id = :id")
    suspend fun markMemorySynced(id: String, syncedAt: Long = System.currentTimeMillis())

    @Query("SELECT * FROM memories")
    suspend fun getAllSnapshot(): List<MemoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertMemory(memory: MemoryEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAllIgnore(memories: List<MemoryEntity>)

    @Query("DELETE FROM memories WHERE id = :id")
    suspend fun deleteMemory(id: String)

    @Query("DELETE FROM memories")
    suspend fun clearAllMemories()
}

@Dao
interface ProviderDao {
    @Query("SELECT * FROM api_providers ORDER BY priorityOrder ASC")
    fun observeProviders(): Flow<List<ApiProviderEntity>>

    @Query("SELECT * FROM api_providers ORDER BY priorityOrder ASC")
    suspend fun getAllSnapshot(): List<ApiProviderEntity>

    @Query("SELECT * FROM api_providers WHERE id = :id LIMIT 1")
    suspend fun getProviderById(id: String): ApiProviderEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProvider(provider: ApiProviderEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAllIgnore(providers: List<ApiProviderEntity>)

    @Update
    suspend fun updateProviders(providers: List<ApiProviderEntity>)
}

@Dao
interface LocalModelDao {
    @Query("SELECT * FROM local_models ORDER BY isActive DESC, isDownloaded DESC, minRamMb ASC")
    fun observeLocalModels(): Flow<List<LocalModelEntity>>

    @Query("SELECT * FROM local_models")
    suspend fun getAllSnapshot(): List<LocalModelEntity>

    @Query("SELECT * FROM local_models WHERE isActive = 1 LIMIT 1")
    suspend fun getActiveModel(): LocalModelEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertModel(model: LocalModelEntity)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAllIgnore(models: List<LocalModelEntity>)

    @Query("UPDATE local_models SET isActive = (id = :modelId)")
    suspend fun setActiveModel(modelId: String)

    @Query("DELETE FROM local_models WHERE id = :modelId")
    suspend fun deleteModel(modelId: String)
}

@Dao
interface SyncQueueDao {
    @Query("SELECT * FROM sync_queue ORDER BY createdAt DESC")
    fun observeSyncQueue(): Flow<List<SyncQueueEntity>>

    @Query("SELECT * FROM sync_queue WHERE status IN ('PENDING', 'ERROR') ORDER BY createdAt ASC")
    suspend fun getPendingItems(): List<SyncQueueEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertItem(item: SyncQueueEntity)

    @Query("DELETE FROM sync_queue WHERE status = 'SYNCED'")
    suspend fun clearSynced()

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun deleteById(id: String)
}

@Dao
interface TelemetryLogDao {
    @Query("SELECT * FROM telemetry_logs ORDER BY timestamp DESC LIMIT 150")
    fun observeRecentLogs(): Flow<List<TelemetryLogEntity>>

    @Insert
    suspend fun insertLog(log: TelemetryLogEntity)

    @Query("DELETE FROM telemetry_logs")
    suspend fun clearLogs()
}
