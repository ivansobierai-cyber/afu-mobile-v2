package tech.afuagro.agi.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class N8nAgentMessageRequest(
    @Json(name = "sessionId") val sessionId: String,
    @Json(name = "message") val message: String,
    @Json(name = "mode") val mode: String,
    @Json(name = "routingStrategy") val routingStrategy: String,
    @Json(name = "preferredModel") val preferredModel: String,
    @Json(name = "targetAgent") val targetAgent: String? = null,
    @Json(name = "contextMemories") val contextMemories: List<String> = emptyList(),
    @Json(name = "attachments") val attachments: List<String> = emptyList(),
    @Json(name = "timestamp") val timestamp: Long = System.currentTimeMillis()
)

@JsonClass(generateAdapter = true)
data class N8nRemoteTaskDto(
    @Json(name = "id") val id: String? = null,
    @Json(name = "title") val title: String? = null,
    @Json(name = "description") val description: String? = null,
    @Json(name = "agent") val agent: String? = null,
    @Json(name = "status") val status: String? = null,
    @Json(name = "priority") val priority: String? = null
)

@JsonClass(generateAdapter = true)
data class N8nAgentMessageResponse(
    @Json(name = "success") val success: Boolean? = null,
    @Json(name = "output") val output: String? = null,
    @Json(name = "reply") val reply: String? = null,
    @Json(name = "response") val response: String? = null,
    @Json(name = "message") val message: String? = null,
    @Json(name = "text") val text: String? = null,
    @Json(name = "model") val model: String? = null,
    @Json(name = "agents") val agents: List<String>? = null,
    @Json(name = "agentsInvolved") val agentsInvolved: List<String>? = null,
    @Json(name = "tokensUsed") val tokensUsed: Int? = null,
    @Json(name = "total_tokens") val totalTokens: Int? = null,
    @Json(name = "estimatedCostUsd") val estimatedCostUsd: Double? = null,
    @Json(name = "executionId") val executionId: String? = null,
    @Json(name = "stage") val stage: String? = null,
    @Json(name = "tasks") val tasks: List<N8nRemoteTaskDto>? = null,
    @Json(name = "error") val error: String? = null
)

@JsonClass(generateAdapter = true)
data class N8nStreamChunkDto(
    @Json(name = "stage") val stage: String? = null,
    @Json(name = "delta") val delta: String? = null,
    @Json(name = "output") val output: String? = null,
    @Json(name = "reply") val reply: String? = null,
    @Json(name = "text") val text: String? = null,
    @Json(name = "model") val model: String? = null,
    @Json(name = "tokensUsed") val tokensUsed: Int? = null,
    @Json(name = "agents") val agents: List<String>? = null
)

@JsonClass(generateAdapter = true)
data class N8nReceivedMessageDto(
    @Json(name = "id") val id: String,
    @Json(name = "sessionId") val sessionId: String? = null,
    @Json(name = "role") val role: String = "agi",
    @Json(name = "content") val content: String = "",
    @Json(name = "agent") val agent: String? = null,
    @Json(name = "agentsInvolved") val agentsInvolved: List<String>? = null,
    @Json(name = "model") val model: String? = null,
    @Json(name = "executionMode") val executionMode: String? = null,
    @Json(name = "latencyMs") val latencyMs: Long = 0L,
    @Json(name = "tokensUsed") val tokensUsed: Int = 0,
    @Json(name = "timestamp") val timestamp: Long? = null
)

@JsonClass(generateAdapter = true)
data class N8nSessionHistoryResponse(
    @Json(name = "sessionId") val sessionId: String? = null,
    @Json(name = "messages") val messages: List<N8nReceivedMessageDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class N8nStatusResponse(
    @Json(name = "orchestratorStatus") val orchestratorStatus: String? = null,
    @Json(name = "n8nStatus") val n8nStatus: String? = null,
    @Json(name = "activeWorkflows") val activeWorkflows: Int? = null,
    @Json(name = "version") val version: String? = null
)

@JsonClass(generateAdapter = true)
data class N8nProviderTestRequest(
    @Json(name = "action") val action: String = "test_provider",
    @Json(name = "providerId") val providerId: String,
    @Json(name = "providerName") val providerName: String,
    @Json(name = "baseUrl") val baseUrl: String,
    @Json(name = "model") val model: String
)
