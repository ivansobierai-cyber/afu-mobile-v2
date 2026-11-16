package tech.afuagro.agi

import tech.afuagro.agi.core.agro.RawAgroDataProcessor
import tech.afuagro.agi.network.AgiApiClient
import tech.afuagro.agi.network.N8nRetrofitFactory
import tech.afuagro.agi.network.PlantImageAnalyzeRequest
import tech.afuagro.agi.network.createPlantHealthyService
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PlantHealthyTest {

    @Test
    fun rawAgroDataProcessor_cleansDirtyJsonAndFlagsInvalidBounds() {
        val dirtyJson = """
            {
              "crop_type": "Soja",
              "geracao": "g3",
              "temp": "28,4°C",
              "umidade": "74%",
              "soil_ph": "16.5",
              "n": "N/A",
              "k": "180 ppm"
            }
        """.trimIndent()

        val result = RawAgroDataProcessor.process(dirtyJson)
        assertEquals("soja", result.cropType)
        assertEquals("G3", result.generation)
        assertEquals(28.4, result.temperatureCelsius!!, 0.01)
        assertEquals(74.0, result.humidityPercent!!, 0.01)
        assertNull(result.soilPh) // 16.5 is out of 0..14 bounds
        assertEquals(180.0, result.potassiumPpm!!, 0.01)
        assertTrue(result.discardedFields.any { it.startsWith("n=") })
        assertTrue(result.validationWarnings.any { it.contains("pH fora da escala") })
    }

    @Test
    fun plantHealthyService_postsAnalyzeImageAndParsesResponse() = runBlocking {
        var capturedUrl = ""
        var capturedAuth: String? = null
        var capturedBody = ""

        val okHttp = OkHttpClient.Builder()
            .addInterceptor(Interceptor { chain ->
                val req = chain.request()
                capturedUrl = req.url.toString()
                capturedAuth = req.header("Authorization")
                val buf = Buffer()
                req.body?.writeTo(buf)
                capturedBody = buf.readUtf8()

                val respJson = """
                    {
                      "diagnosis": "Suspeita de mancha de pólio",
                      "confidence": 0.92,
                      "recommendations": [
                        "Aplicar fungicida preventivo",
                        "Monitorar diariamente as folhas jovens"
                      ],
                      "genomic_risk": "Baixo",
                      "historical_comparison": "Similar a casos registrados em G2 (2021)"
                    }
                """.trimIndent()

                Response.Builder()
                    .request(req)
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("OK")
                    .body(respJson.toResponseBody("application/json; charset=utf-8".toMediaType()))
                    .build()
            })
            .build()

        val client = AgiApiClient(
            client = okHttp,
            n8nService = N8nRetrofitFactory.createN8nService(client = okHttp),
            plantHealthyService = N8nRetrofitFactory.createPlantHealthyService(client = okHttp)
        )

        val result = client.analyzePlantImage(
            baseUrl = "https://agroapi.example.com",
            analyzePath = "/api/plant_healthy/analyze_image",
            authToken = "agro-jwt-token",
            enforceHttpsOnly = true,
            request = PlantImageAnalyzeRequest(
                imageUrl = "https://bucket.agroapi.com/images/plant_1234.jpg",
                cropType = "soja",
                generation = "G3"
            )
        )

        assertTrue(result.isSuccess)
        assertEquals("https://agroapi.example.com/api/plant_healthy/analyze_image", capturedUrl)
        assertEquals("Bearer agro-jwt-token", capturedAuth)
        assertTrue(capturedBody.contains("\"crop_type\":\"soja\""))
        assertTrue(capturedBody.contains("\"generation\":\"G3\""))

        val (body, _) = result.getOrThrow()
        assertEquals("Suspeita de mancha de pólio", body.diagnosis)
        assertEquals(0.92, body.confidence!!, 0.001)
        assertEquals(2, body.recommendations?.size)
        assertEquals("Baixo", body.genomicRisk)
        assertNotNull(body.historicalComparison)
    }
}
