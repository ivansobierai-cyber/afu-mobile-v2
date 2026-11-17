package tech.afuagro.agi.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "chat_sessions")
data class ChatSessionEntity(
    @PrimaryKey val id: String,
    val title: String,
    val createdAt: Long,
    val updatedAt: Long,
    val modeUsed: String,
    val activeAgentsCsv: String,
    val syncStatus: String,
    val version: Int = 1
)

@Entity(
    tableName = "chat_messages",
    indices = [Index(value = ["sessionId"]), Index(value = ["syncStatus"])]
)
data class ChatMessageEntity(
    @PrimaryKey val id: String,
    val sessionId: String,
    val role: String, // "user", "agi", "system"
    val content: String,
    val attachmentsJson: String = "[]",
    val stageReached: String = "",
    val agentsInvolvedCsv: String = "",
    val modelUsed: String = "",
    val executionMode: String = "LOCAL",
    val latencyMs: Long = 0L,
    val tokensUsed: Int = 0,
    val isCancelled: Boolean = false,
    val timestamp: Long,
    val syncStatus: String = "LOCAL_ONLY",
    val version: Int = 1
)

@Entity(tableName = "agents")
data class AgentEntity(
    @PrimaryKey val id: String,
    val name: String,
    val specialty: String,
    val description: String,
    val modelId: String,
    val toolsCsv: String,
    val permissionsCsv: String,
    val status: String, // AgentStatus.name
    val isEnabled: Boolean = true,
    val tasksAssigned: Int = 0,
    val tasksCompleted: Int = 0,
    val avgLatencyMs: Long = 0L,
    val successRate: Float = 100f,
    val isCoreAgent: Boolean = true,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "tasks",
    indices = [Index(value = ["agentId"]), Index(value = ["status"])]
)
data class TaskEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String,
    val agentId: String,
    val agentName: String,
    val priority: String, // TaskPriority.name
    val status: String, // TaskStatus.name
    val progress: Float = 0f,
    val dependenciesCsv: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val deadlineAt: Long? = null,
    val resultText: String = "",
    val evidenceText: String = "",
    val auditTrail: String = "",
    val requiresAdminAuth: Boolean = false,
    val isLocalOnly: Boolean = false,
    val syncStatus: String = "LOCAL_ONLY"
)

@Entity(
    tableName = "task_history",
    indices = [
        Index(value = ["taskId"]),
        Index(value = ["agentId"]),
        Index(value = ["timestamp"])
    ]
)
data class TaskHistoryEntity(
    @PrimaryKey val id: String,
    val taskId: String,
    val agentId: String,
    val agentName: String,
    val previousStatus: String,
    val newStatus: String,
    val progress: Float,
    val summary: String,
    val evidenceText: String = "",
    val latencyMs: Long = 0L,
    val timestamp: Long = System.currentTimeMillis(),
    val syncStatus: String = "LOCAL_ONLY"
)

@Entity(
    tableName = "memories",
    indices = [Index(value = ["layer"]), Index(value = ["category"]), Index(value = ["syncStatus"])]
)
data class MemoryEntity(
    @PrimaryKey val id: String,
    val layer: String, // MemoryLayer.name
    val category: String, // MemoryCategory.name
    val title: String,
    val content: String,
    val tagsCsv: String = "",
    val source: String = "LOCAL", // "LOCAL" or "CENTRAL"
    val version: Int = 1,
    val syncStatus: String = "PENDING_SYNC",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "api_providers")
data class ApiProviderEntity(
    @PrimaryKey val id: String,
    val name: String,
    val baseUrl: String,
    val encryptedApiKey: String = "",
    val maskedKey: String = "Não configurada",
    val defaultModel: String,
    val availableModelsCsv: String,
    val authType: String, // ProviderAuthType.name
    val rateLimitRpm: Int = 60,
    val connectionStatus: String = "Não testado",
    val priorityOrder: Int,
    val costPer1kTokensUsd: Double = 0.0,
    val maxContextTokens: Int = 128000,
    val extraConfigJson: String = "{}",
    val tokensConsumed: Long = 0L,
    val lastLatencyMs: Long = 0L,
    val lastTestedAt: Long = 0L,
    val isEnabled: Boolean = true
)

@Entity(tableName = "local_models")
data class LocalModelEntity(
    @PrimaryKey val id: String,
    val name: String,
    val family: String,
    val format: String, // "GGUF" or "ONNX" or "BUILTIN"
    val quantization: String,
    val sizeMb: Int,
    val minRamMb: Int,
    val contextLength: Int = 4096,
    val threads: Int = 4,
    val temperature: Float = 0.4f,
    val useGpuDelegate: Boolean = false,
    val filePath: String = "",
    val downloadUrl: String = "",
    val isDownloaded: Boolean = false,
    val isDownloading: Boolean = false,
    val downloadProgress: Float = 0f,
    val isActive: Boolean = false
)

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey val id: String,
    val entityType: String,
    val entityId: String,
    val operation: String, // "UPSERT", "DELETE", "CONVERSATION_CONTINUITY"
    val payloadJson: String,
    val version: Int,
    val status: String, // "PENDING", "SYNCED", "CONFLICT", "ERROR"
    val conflictMessage: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0
)

@Entity(tableName = "telemetry_logs")
data class TelemetryLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val timestamp: Long = System.currentTimeMillis(),
    val source: String,
    val level: String, // "INFO", "WARN", "ERROR"
    val message: String,
    val latencyMs: Long = 0L,
    val tokensUsed: Int = 0,
    val estimatedCostUsd: Double = 0.0,
    val providerId: String = ""
)
