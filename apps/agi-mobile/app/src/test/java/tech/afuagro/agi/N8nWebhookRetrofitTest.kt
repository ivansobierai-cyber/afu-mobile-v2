package tech.afuagro.agi

import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.network.AgiApiClient
import tech.afuagro.agi.network.N8nAgentMessageRequest
import tech.afuagro.agi.network.N8nRetrofitFactory
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class N8nWebhookRetrofitTest {

    private fun buildTestClient(handler: (okhttp3.Request, String) -> Response): AgiApiClient {
        val okHttp = OkHttpClient.Builder()
            .addInterceptor(Interceptor { chain ->
                val req = chain.request()
                val bodyBuffer = Buffer()
                req.body?.writeTo(bodyBuffer)
                handler(req, bodyBuffer.readUtf8())
            })
            .build()
        val service = N8nRetrofitFactory.createN8nService(
            baseUrl = "https://n8n.example.com/",
            client = okHttp
        )
        return AgiApiClient(client = okHttp, n8nService = service)
    }

    @Test
    fun sendOrchestratorMessage_serializesMoshiRequestAndParsesMultiAgentJson() = runBlocking {
        var capturedUrl = ""
        var capturedAuth: String? = null
        var capturedRequestJson = ""

        val apiClient = buildTestClient { req, bodyStr ->
            capturedUrl = req.url.toString()
            capturedAuth = req.header("Authorization")
            capturedRequestJson = bodyStr

            val jsonResponse = """
                {
                  "success": true,
                  "output": "API REST criada e validada com sucesso.",
                  "model": "gpt-4o",
                  "agents": ["Orquestrador", "Programador", "Auditor"],
                  "tokensUsed": 420,
                  "estimatedCostUsd": 0.0021,
                  "executionId": "exec-n8n-77",
                  "tasks": [
                    {
                      "id": "t-101",
                      "title": "Gerar endpoints",
                      "description": "Controlador REST implementado",
                      "agent": "Programador",
                      "status": "COMPLETED",
                      "priority": "HIGH"
                    }
                  ]
                }
            """.trimIndent()

            Response.Builder()
                .request(req)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body(jsonResponse.toResponseBody("application/json; charset=utf-8".toMediaType()))
                .build()
        }

        val stages = mutableListOf<OperationalStage>()
        val result = apiClient.sendOrchestratorMessage(
            baseUrl = "https://n8n.example.com",
            webhookPath = "/webhook/agi/orchestrator",
            authToken = "secret-n8n-token",
            enforceHttpsOnly = true,
            sessionId = "sess-123",
            message = "@Programador criar API REST",
            routingStrategy = "SPECIALTY",
            preferredModel = "gpt-4o",
            mode = "CLOUD",
            memoryContext = listOf("Arquitetura Retrofit"),
            attachmentNames = listOf("spec.md"),
            onStageUpdate = { stages.add(it) }
        )

        assertEquals("https://n8n.example.com/webhook/agi/orchestrator", capturedUrl)
        assertEquals("Bearer secret-n8n-token", capturedAuth)

        val requestDto = N8nRetrofitFactory.moshi.adapter(N8nAgentMessageRequest::class.java)
            .fromJson(capturedRequestJson)
        assertNotNull(requestDto)
        assertEquals("sess-123", requestDto?.sessionId)
        assertEquals("Programador", requestDto?.targetAgent)
        assertEquals(listOf("spec.md"), requestDto?.attachments)

        assertTrue(result.success)
        assertEquals("API REST criada e validada com sucesso.", result.replyText)
        assertEquals("gpt-4o", result.modelUsed)
        assertEquals(listOf("Orquestrador", "Programador", "Auditor"), result.agentsInvolved)
        assertEquals(420, result.tokensUsed)
        assertEquals(1, result.createdTasks.size)
        assertEquals("Programador", result.createdTasks.first().agentName)
        assertTrue(stages.contains(OperationalStage.PLANNING))
        assertTrue(stages.contains(OperationalStage.CONCLUDING))
    }

    @Test
    fun sendOrchestratorMessage_handlesSseStreamViaRetrofit() = runBlocking {
        val ssePayload = """
            data: {"stage":"delegating","delta":"Analisando ","agents":["Orquestrador"]}
            data: {"stage":"executing","delta":"workflow n8n.","agents":["Executor"],"model":"deepseek-chat","tokensUsed":95}
            data: [DONE]
        """.trimIndent() + "\n"

        val apiClient = buildTestClient { req, _ ->
            Response.Builder()
                .request(req)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .addHeader("Content-Type", "text/event-stream")
                .body(ssePayload.toResponseBody("text/event-stream".toMediaType()))
                .build()
        }

        val stages = mutableListOf<OperationalStage>()
        val result = apiClient.sendOrchestratorMessage(
            baseUrl = "https://n8n.example.com",
            webhookPath = "/webhook/agi/orchestrator",
            authToken = "",
            enforceHttpsOnly = true,
            sessionId = "sess-sse",
            message = "Executar fluxo",
            routingStrategy = "AUTO",
            preferredModel = "gpt-4o",
            mode = "HYBRID",
            memoryContext = emptyList(),
            attachmentNames = emptyList(),
            onStageUpdate = { stages.add(it) }
        )

        assertTrue(result.success)
        assertEquals("Analisando workflow n8n.", result.replyText)
        assertEquals("deepseek-chat", result.modelUsed)
        assertEquals(listOf("Orquestrador", "Executor"), result.agentsInvolved)
        assertEquals(95, result.tokensUsed)
        assertTrue(stages.contains(OperationalStage.DELEGATING))
        assertTrue(stages.contains(OperationalStage.EXECUTING))
    }

    @Test
    fun fetchRemoteMessages_queriesSessionAndParsesMessages() = runBlocking {
        var capturedUrl = ""
        val apiClient = buildTestClient { req, _ ->
            capturedUrl = req.url.toString()
            val json = """
                {
                  "sessionId": "sess-99",
                  "messages": [
                    {
                      "id": "remote-1",
                      "sessionId": "sess-99",
                      "role": "agi",
                      "content": "Relatório assíncrono concluído pelo Auditor.",
                      "agentsInvolved": ["Auditor"],
                      "model": "claude-3-7-sonnet",
                      "executionMode": "CLOUD",
                      "latencyMs": 310,
                      "tokensUsed": 210,
                      "timestamp": 1700000100000
                    }
                  ]
                }
            """.trimIndent()

            Response.Builder()
                .request(req)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body(json.toResponseBody("application/json; charset=utf-8".toMediaType()))
                .build()
        }

        val res = apiClient.fetchRemoteMessages(
            baseUrl = "https://n8n.example.com",
            messagesPath = "/webhook/agi/orchestrator/messages",
            authToken = "tok",
            enforceHttpsOnly = true,
            sessionId = "sess-99",
            sinceTimestamp = 1700000000000L
        )

        assertTrue(res.isSuccess)
        assertTrue(capturedUrl.contains("sessionId=sess-99"))
        assertTrue(capturedUrl.contains("since=1700000000000"))
        val msgs = res.getOrThrow()
        assertEquals(1, msgs.size)
        assertEquals("remote-1", msgs.first().id)
        assertEquals("Relatório assíncrono concluído pelo Auditor.", msgs.first().content)
        assertEquals(listOf("Auditor"), msgs.first().agentsInvolved)
    }

    @Test
    fun probeBackendStatus_parsesStatusAndBlocksInsecureExternalHttp() = runBlocking {
        val apiClient = buildTestClient { req, _ ->
            Response.Builder()
                .request(req)
                .protocol(Protocol.HTTP_1_1)
                .code(200)
                .message("OK")
                .body("""{"orchestratorStatus":"Operacional","n8nStatus":"Ativo"}""".toResponseBody("application/json".toMediaType()))
                .build()
        }

        val okProbe = apiClient.probeBackendStatus(
            baseUrl = "https://n8n.example.com",
            statusPath = "/webhook/agi/status",
            authToken = "tok",
            enforceHttpsOnly = true
        )
        assertTrue(okProbe.reachable)
        assertEquals("Operacional", okProbe.orchestratorStatus)
        assertEquals("Ativo", okProbe.n8nStatus)

        val blockedProbe = apiClient.probeBackendStatus(
            baseUrl = "http://insecure.example.com",
            statusPath = "/webhook/agi/status",
            authToken = "tok",
            enforceHttpsOnly = true
        )
        assertFalse(blockedProbe.reachable)
        assertNotNull(blockedProbe.errorMessage)
    }
}
