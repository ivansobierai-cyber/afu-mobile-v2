package tech.afuagro.agi.network

import tech.afuagro.agi.BuildConfig
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.ResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Headers
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Streaming
import retrofit2.http.Url
import java.util.concurrent.TimeUnit

/**
 * Interface Retrofit para comunicação com webhooks e APIs do orquestrador multiagente n8n / AGI Backend.
 * Suporta endpoints dinâmicos (@Url) configurados em runtime pelo usuário nas Configurações.
 */
interface N8nWebhookService {

    /**
     * Envia uma mensagem/objetivo para o webhook orquestrador do n8n,
     * aceitando resposta JSON padrão ou streaming SSE (`text/event-stream`).
     */
    @Headers("Accept: application/json, text/event-stream")
    @Streaming
    @POST
    suspend fun sendMessageToWebhook(
        @Url webhookUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body request: N8nAgentMessageRequest
    ): Response<ResponseBody>

    /**
     * Envia uma mensagem aguardando resposta JSON estruturada do sistema multiagente.
     */
    @Headers("Accept: application/json")
    @POST
    suspend fun postAgentMessage(
        @Url webhookUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body request: N8nAgentMessageRequest
    ): Response<N8nAgentMessageResponse>

    /**
     * Consulta/recebe mensagens recentes ou pendentes de uma sessão multiagente na API/webhook n8n.
     */
    @Headers("Accept: application/json")
    @GET
    suspend fun fetchAgentMessages(
        @Url messagesUrl: String,
        @Header("Authorization") authHeader: String?,
        @Query("sessionId") sessionId: String,
        @Query("since") sinceTimestamp: Long? = null
    ): Response<N8nSessionHistoryResponse>

    /**
     * Verifica disponibilidade e estado operacional do orquestrador e do n8n.
     */
    @Headers("Accept: application/json")
    @GET
    suspend fun probeStatus(
        @Url statusUrl: String,
        @Header("Authorization") authHeader: String?
    ): Response<N8nStatusResponse>

    /**
     * Solicita ao API Router no backend/n8n o teste de conexão com um provedor LLM.
     */
    @Headers("Accept: application/json")
    @POST
    suspend fun testRouterProvider(
        @Url routerUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body request: N8nProviderTestRequest
    ): Response<ResponseBody>

    /**
     * Envia lote de sincronização de memória ou fila operacional para o webhook de memória n8n.
     */
    @Headers("Accept: application/json")
    @POST
    suspend fun pushMemorySync(
        @Url syncUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body payload: RequestBody
    ): Response<ResponseBody>

    /**
     * Baixa artefatos ou modelos locais com suporte a streaming.
     */
    @Streaming
    @GET
    suspend fun downloadFile(
        @Url fileUrl: String
    ): Response<ResponseBody>
}

object N8nRetrofitFactory {

    val moshi: Moshi by lazy {
        Moshi.Builder()
            .addLast(KotlinJsonAdapterFactory())
            .build()
    }

    fun createDefaultClient(): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            redactHeader("Authorization")
            redactHeader("x-api-key")
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BASIC
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }
        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    fun createRetrofit(
        baseUrl: String = "https://localhost/",
        client: OkHttpClient = createDefaultClient()
    ): Retrofit {
        val normalizedBase = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
        return Retrofit.Builder()
            .baseUrl(normalizedBase)
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    fun createN8nService(
        baseUrl: String = "https://localhost/",
        client: OkHttpClient = createDefaultClient()
    ): N8nWebhookService = createRetrofit(baseUrl = baseUrl, client = client)
        .create(N8nWebhookService::class.java)
}
