package tech.afuagro.agi.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import okhttp3.OkHttpClient
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Headers
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Url

@JsonClass(generateAdapter = true)
data class AfuLoginRequest(
    @Json(name = "email") val email: String,
    @Json(name = "password") val password: String
)

@JsonClass(generateAdapter = true)
data class AfuOrgDto(
    @Json(name = "id") val id: Long,
    @Json(name = "nome") val nome: String,
    @Json(name = "role") val role: String? = null
)

@JsonClass(generateAdapter = true)
data class AfuUserDto(
    @Json(name = "id") val id: Long,
    @Json(name = "email") val email: String? = null,
    @Json(name = "name") val name: String? = null,
    @Json(name = "role") val role: String? = null,
    @Json(name = "openId") val openId: String? = null
)

@JsonClass(generateAdapter = true)
data class AfuLoginResponse(
    @Json(name = "success") val success: Boolean? = null,
    @Json(name = "accessToken") val accessToken: String? = null,
    @Json(name = "refreshToken") val refreshToken: String? = null,
    @Json(name = "user") val user: AfuUserDto? = null,
    @Json(name = "organization") val organization: AfuOrgDto? = null,
    @Json(name = "organizations") val organizations: List<AfuOrgDto>? = null,
    @Json(name = "error") val error: String? = null
)

@JsonClass(generateAdapter = true)
data class AfuRefreshRequest(
    @Json(name = "refreshToken") val refreshToken: String
)

@JsonClass(generateAdapter = true)
data class AfuRefreshResponse(
    @Json(name = "success") val success: Boolean? = null,
    @Json(name = "accessToken") val accessToken: String? = null,
    @Json(name = "refreshToken") val refreshToken: String? = null,
    @Json(name = "error") val error: String? = null
)

@JsonClass(generateAdapter = true)
data class AfuPropriedadeDto(
    @Json(name = "id") val id: Long,
    @Json(name = "nome") val nome: String,
    @Json(name = "cidade") val cidade: String? = null,
    @Json(name = "estado") val estado: String? = null,
    @Json(name = "tamanhoArea") val tamanhoArea: String? = null
)

@JsonClass(generateAdapter = true)
data class AfuFarmContextResponse(
    @Json(name = "user") val user: AfuUserDto? = null,
    @Json(name = "organization") val organization: AfuOrgDto? = null,
    @Json(name = "organizations") val organizations: List<AfuOrgDto>? = null,
    @Json(name = "propriedades") val propriedades: List<AfuPropriedadeDto>? = null,
    @Json(name = "selectedPropriedade") val selectedPropriedade: AfuPropriedadeDto? = null,
    @Json(name = "error") val error: String? = null
)

@JsonClass(generateAdapter = true)
data class AfuSelectContextRequest(
    @Json(name = "organizationId") val organizationId: Long,
    @Json(name = "propriedadeId") val propriedadeId: Long? = null
)

@JsonClass(generateAdapter = true)
data class AfuSelectContextResponse(
    @Json(name = "success") val success: Boolean? = null,
    @Json(name = "activeOrganizationId") val activeOrganizationId: Long? = null,
    @Json(name = "propriedadeId") val propriedadeId: Long? = null,
    @Json(name = "role") val role: String? = null,
    @Json(name = "error") val error: String? = null
)

/**
 * Cliente REST fino para autenticação/contexto AFU (JWT) usado pelo AFU AGI.
 * Sem chaves LLM — apenas token de sessão AFU.
 */
interface AfuAuthApi {
    @Headers("Accept: application/json", "Content-Type: application/json")
    @POST
    suspend fun login(
        @Url endpointUrl: String,
        @Body body: AfuLoginRequest
    ): Response<AfuLoginResponse>

    @Headers("Accept: application/json", "Content-Type: application/json")
    @POST
    suspend fun refresh(
        @Url endpointUrl: String,
        @Body body: AfuRefreshRequest
    ): Response<AfuRefreshResponse>

    @Headers("Accept: application/json")
    @GET
    suspend fun farmContext(
        @Url endpointUrl: String,
        @Header("Authorization") authHeader: String?,
        @Query("propriedadeId") propriedadeId: Long? = null
    ): Response<AfuFarmContextResponse>

    @Headers("Accept: application/json", "Content-Type: application/json")
    @POST
    suspend fun selectContext(
        @Url endpointUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body body: AfuSelectContextRequest
    ): Response<AfuSelectContextResponse>
}

fun N8nRetrofitFactory.createAfuAuthApi(
    baseUrl: String = "https://localhost/",
    client: OkHttpClient = createDefaultClient()
): AfuAuthApi = createRetrofit(baseUrl = baseUrl, client = client)
    .create(AfuAuthApi::class.java)
