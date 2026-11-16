package tech.afuagro.agi.core.agro

import tech.afuagro.agi.network.N8nRetrofitFactory
import tech.afuagro.agi.network.PlantRawTelemetryRequest
import com.squareup.moshi.Types

data class ProcessedRawAgroResult(
    val normalizedFields: Map<String, String>,
    val discardedFields: List<String>,
    val validationWarnings: List<String>,
    val cropType: String,
    val generation: String,
    val temperatureCelsius: Double?,
    val humidityPercent: Double?,
    val soilPh: Double?,
    val nitrogenPpm: Double?,
    val phosphorusPpm: Double?,
    val potassiumPpm: Double?
) {
    fun toTelemetryRequest(): PlantRawTelemetryRequest = PlantRawTelemetryRequest(
        cropType = cropType,
        generation = generation,
        temperatureCelsius = temperatureCelsius,
        humidityPercent = humidityPercent,
        soilPh = soilPh,
        nitrogenPpm = nitrogenPpm,
        phosphorusPpm = phosphorusPpm,
        potassiumPpm = potassiumPpm,
        normalizedFields = normalizedFields,
        validationWarnings = validationWarnings
    )
}

/**
 * Higienizador e validador determinístico de dados brutos (raw data / IoT / CSV / JSON)
 * para o Agente Planta Saudável antes do envio à API ou persistência em memória.
 */
object RawAgroDataProcessor {

    private val invalidTokens = setOf("", "null", "nan", "n/a", "na", "undefined", "-", "--")

    fun process(
        rawInput: String,
        fallbackCropType: String = "soja",
        fallbackGeneration: String = "G3"
    ): ProcessedRawAgroResult {
        val rawMap = parseRawEntries(rawInput)
        val normalized = linkedMapOf<String, String>()
        val discarded = mutableListOf<String>()
        val warnings = mutableListOf<String>()

        var cropType = fallbackCropType.trim().lowercase().ifBlank { "soja" }
        var generation = normalizeGeneration(fallbackGeneration) ?: "G3"
        var temperature: Double? = null
        var humidity: Double? = null
        var soilPh: Double? = null
        var nitrogen: Double? = null
        var phosphorus: Double? = null
        var potassium: Double? = null

        rawMap.forEach { (rawKey, rawVal) ->
            val key = rawKey.trim().lowercase()
            val cleanedVal = rawVal.trim()
            if (key.isEmpty() || cleanedVal.lowercase() in invalidTokens) {
                discarded.add("$rawKey=${rawVal.ifBlank { "<vazio>" }}")
                return@forEach
            }

            when (key) {
                "crop", "crop_type", "cultura", "planta" -> {
                    cropType = cleanedVal.lowercase()
                    normalized["crop_type"] = cropType
                }
                "generation", "gen", "geracao", "geração" -> {
                    val normGen = normalizeGeneration(cleanedVal)
                    if (normGen != null) {
                        generation = normGen
                        normalized["generation"] = normGen
                    } else {
                        warnings.add("Geração fora do padrão G1–G4 ignorada: '$cleanedVal'")
                        discarded.add("$rawKey=$cleanedVal")
                    }
                }
                "temp", "temperature", "temperatura", "temperature_c" -> {
                    val parsed = parseFlexibleDouble(cleanedVal)
                    if (parsed == null) {
                        discarded.add("$rawKey=$cleanedVal")
                        warnings.add("Temperatura não numérica descartada: '$cleanedVal'")
                    } else if (parsed < -50.0 || parsed > 70.0) {
                        warnings.add("Temperatura fora do intervalo físico (-50..70°C): $parsed°C")
                    } else {
                        temperature = parsed
                        normalized["temperatureCelsius"] = "%.2f".format(java.util.Locale.US, parsed)
                    }
                }
                "humidity", "umidade", "umid", "rh", "humidity_percent" -> {
                    val parsed = parseFlexibleDouble(cleanedVal)
                    if (parsed == null) {
                        discarded.add("$rawKey=$cleanedVal")
                        warnings.add("Umidade não numérica descartada: '$cleanedVal'")
                    } else if (parsed < 0.0 || parsed > 100.0) {
                        warnings.add("Umidade fora do intervalo (0..100%): $parsed%")
                    } else {
                        humidity = parsed
                        normalized["humidityPercent"] = "%.2f".format(java.util.Locale.US, parsed)
                    }
                }
                "ph", "soil_ph", "ph_solo" -> {
                    val parsed = parseFlexibleDouble(cleanedVal)
                    if (parsed == null) {
                        discarded.add("$rawKey=$cleanedVal")
                        warnings.add("pH inválido descartado: '$cleanedVal'")
                    } else if (parsed < 0.0 || parsed > 14.0) {
                        warnings.add("pH fora da escala química (0..14): $parsed")
                    } else {
                        soilPh = parsed
                        normalized["soilPh"] = "%.2f".format(java.util.Locale.US, parsed)
                    }
                }
                "n", "nitrogen", "nitrogenio", "nitrogen_ppm" -> {
                    val parsed = parseFlexibleDouble(cleanedVal)
                    if (parsed == null || parsed < 0.0) {
                        discarded.add("$rawKey=$cleanedVal")
                        warnings.add("Nitrogênio inválido descartado: '$cleanedVal'")
                    } else {
                        nitrogen = parsed
                        normalized["nitrogenPpm"] = "%.1f".format(java.util.Locale.US, parsed)
                    }
                }
                "p", "phosphorus", "fosforo", "phosphorus_ppm" -> {
                    val parsed = parseFlexibleDouble(cleanedVal)
                    if (parsed == null || parsed < 0.0) {
                        discarded.add("$rawKey=$cleanedVal")
                        warnings.add("Fósforo inválido descartado: '$cleanedVal'")
                    } else {
                        phosphorus = parsed
                        normalized["phosphorusPpm"] = "%.1f".format(java.util.Locale.US, parsed)
                    }
                }
                "k", "potassium", "potassio", "potassium_ppm" -> {
                    val parsed = parseFlexibleDouble(cleanedVal)
                    if (parsed == null || parsed < 0.0) {
                        discarded.add("$rawKey=$cleanedVal")
                        warnings.add("Potássio inválido descartado: '$cleanedVal'")
                    } else {
                        potassium = parsed
                        normalized["potassiumPpm"] = "%.1f".format(java.util.Locale.US, parsed)
                    }
                }
                else -> normalized[key] = cleanedVal
            }
        }

        if (normalized.isEmpty()) {
            warnings.add("Nenhum dado válido extraído. Informe pares JSON ou CSV/Chave=Valor.")
        }

        return ProcessedRawAgroResult(
            normalizedFields = normalized,
            discardedFields = discarded,
            validationWarnings = warnings,
            cropType = cropType,
            generation = generation,
            temperatureCelsius = temperature,
            humidityPercent = humidity,
            soilPh = soilPh,
            nitrogenPpm = nitrogen,
            phosphorusPpm = phosphorus,
            potassiumPpm = potassium
        )
    }

    private val mapAdapter by lazy {
        val mapType = Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
        N8nRetrofitFactory.moshi.adapter<Map<String, Any?>>(mapType)
    }

    private fun parseRawEntries(rawInput: String): List<Pair<String, String>> {
        val trimmed = rawInput.trim()
        if (trimmed.isEmpty()) return emptyList()

        // Try JSON object first via Moshi
        if (trimmed.startsWith("{")) {
            val map = runCatching { mapAdapter.fromJson(trimmed) }.getOrNull()
            if (map != null) {
                return map.entries.map { (k, v) -> k to (v?.toString() ?: "") }
            }
        }

        // Try 2-line CSV (header row + values row)
        val lines = trimmed.lines().map { it.trim() }.filter { it.isNotEmpty() }
        if (lines.size >= 2 && lines[0].contains(",") && !lines[0].contains("=") && !lines[0].contains(":")) {
            val headers = lines[0].split(",").map { it.trim() }
            val values = lines.last().split(",").map { it.trim() }
            if (headers.size > 1 && headers.size == values.size) {
                return headers.zip(values)
            }
        }

        // Fallback: line-by-line key=value, key:value, or key,value
        val pairs = mutableListOf<Pair<String, String>>()
        lines.forEach { line ->
            val separator = when {
                line.contains("=") -> '='
                line.contains(":") -> ':'
                line.contains(";") -> ';'
                line.contains(",") -> ','
                else -> null
            }
            if (separator != null) {
                val idx = line.indexOf(separator)
                val k = line.substring(0, idx).trim()
                val v = line.substring(idx + 1).trim()
                pairs.add(k to v)
            }
        }
        return pairs
    }

    private fun parseFlexibleDouble(raw: String): Double? {
        val sanitized = raw
            .replace("°C", "", ignoreCase = true)
            .replace("%", "")
            .replace("ppm", "", ignoreCase = true)
            .replace(",", ".")
            .trim()
        return sanitized.toDoubleOrNull()
    }

    private fun normalizeGeneration(raw: String): String? {
        val up = raw.trim().uppercase()
        return if (up in setOf("G1", "G2", "G3", "G4")) up else null
    }
}
