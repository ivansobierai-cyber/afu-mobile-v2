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
data class PlantImageAnalyzeRequest(
    @Json(name = "image_url") val imageUrl: String? = null,
    @Json(name = "image_base64") val imageBase64: String? = null,
    @Json(name = "crop_type") val cropType: String,
    @Json(name = "generation") val generation: String,
    @Json(name = "field_notes") val fieldNotes: String? = null,
    @Json(name = "propriedade_id") val propriedadeId: Long? = null,
    @Json(name = "cultura_id") val culturaId: Long? = null,
    @Json(name = "persist") val persist: Boolean? = true
)

@JsonClass(generateAdapter = true)
data class PlantImageAnalyzeResponse(
    @Json(name = "diagnosis") val diagnosis: String? = null,
    @Json(name = "confidence") val confidence: Double? = null,
    @Json(name = "recommendations") val recommendations: List<String>? = null,
    @Json(name = "genomic_risk") val genomicRisk: String? = null,
    @Json(name = "historical_comparison") val historicalComparison: String? = null,
    @Json(name = "error") val error: String? = null
)

@JsonClass(generateAdapter = true)
data class PlantRawTelemetryRequest(
    @Json(name = "crop_type") val cropType: String,
    @Json(name = "generation") val generation: String,
    @Json(name = "temperature_celsius") val temperatureCelsius: Double? = null,
    @Json(name = "humidity_percent") val humidityPercent: Double? = null,
    @Json(name = "soil_ph") val soilPh: Double? = null,
    @Json(name = "nitrogen_ppm") val nitrogenPpm: Double? = null,
    @Json(name = "phosphorus_ppm") val phosphorusPpm: Double? = null,
    @Json(name = "potassium_ppm") val potassiumPpm: Double? = null,
    @Json(name = "normalized_fields") val normalizedFields: Map<String, String> = emptyMap(),
    @Json(name = "validation_warnings") val validationWarnings: List<String> = emptyList(),
    @Json(name = "recorded_at") val recordedAt: Long = System.currentTimeMillis(),
    @Json(name = "propriedade_id") val propriedadeId: Long? = null
)

@JsonClass(generateAdapter = true)
data class PlantMonitoringAlertDto(
    @Json(name = "id") val id: String? = null,
    @Json(name = "severity") val severity: String? = null,
    @Json(name = "title") val title: String? = null,
    @Json(name = "message") val message: String? = null,
    @Json(name = "crop_type") val cropType: String? = null,
    @Json(name = "generation") val generation: String? = null,
    @Json(name = "timestamp") val timestamp: Long? = null
)

@JsonClass(generateAdapter = true)
data class PlantMonitoringResponse(
    @Json(name = "status") val status: String? = null,
    @Json(name = "message") val message: String? = null,
    @Json(name = "alerts") val alerts: List<PlantMonitoringAlertDto>? = null
)

/**
 * Serviço Retrofit dedicado ao Agente Planta Saudável (Analista Pesquisador Fitotécnico).
 */
interface PlantHealthyService {

    @Headers("Accept: application/json")
    @POST
    suspend fun analyzePlantImage(
        @Url endpointUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body request: PlantImageAnalyzeRequest
    ): Response<PlantImageAnalyzeResponse>

    @Headers("Accept: application/json")
    @POST
    suspend fun sendNormalizedTelemetry(
        @Url endpointUrl: String,
        @Header("Authorization") authHeader: String?,
        @Body request: PlantRawTelemetryRequest
    ): Response<PlantMonitoringResponse>

    @Headers("Accept: application/json")
    @GET
    suspend fun fetchMonitoringAlerts(
        @Url endpointUrl: String,
        @Header("Authorization") authHeader: String?,
        @Query("crop_type") cropType: String? = null,
        @Query("generation") generation: String? = null
    ): Response<PlantMonitoringResponse>
}

fun N8nRetrofitFactory.createPlantHealthyService(
    baseUrl: String = "https://localhost/",
    client: OkHttpClient = createDefaultClient()
): PlantHealthyService = createRetrofit(baseUrl = baseUrl, client = client)
    .create(PlantHealthyService::class.java)
