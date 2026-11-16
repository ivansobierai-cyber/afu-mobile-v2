package tech.afuagro.agi.intelligence

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.LocalModelEntity
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.data.local.TaskEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import kotlin.math.sqrt

data class LocalInferenceOutput(
    val responseText: String,
    val matchedMemories: List<MemoryEntity>,
    val latencyMs: Long,
    val estimatedTokens: Int,
    val modelUsed: String
)

data class ImportedModelMetadata(
    val fileName: String,
    val format: String,
    val sizeMb: Int,
    val internalPath: String,
    val isValidBinaryHeader: Boolean
)

class LocalInferenceEngine(private val context: Context) {

    fun semanticSearch(query: String, memories: List<MemoryEntity>, limit: Int = 5): List<Pair<MemoryEntity, Float>> {
        val queryTokens = tokenize(query)
        if (queryTokens.isEmpty() || memories.isEmpty()) return emptyList()

        val docs = memories.map { mem ->
            mem to tokenize("${mem.title} ${mem.content} ${mem.tagsCsv}")
        }
        val docCount = docs.size.toFloat()

        // Compute IDF weights over local memory corpus
        val df = mutableMapOf<String, Int>()
        docs.forEach { (_, tokens) ->
            tokens.toSet().forEach { tok -> df[tok] = (df[tok] ?: 0) + 1 }
        }

        fun tfidfVector(tokens: List<String>): Map<String, Float> {
            val tf = tokens.groupingBy { it }.eachCount()
            return tf.mapValues { (term, count) ->
                val idf = kotlin.math.ln((docCount + 1f) / ((df[term] ?: 0) + 1f)) + 1f
                count * idf
            }
        }

        val queryVec = tfidfVector(queryTokens)
        return docs.mapNotNull { (mem, tokens) ->
            val sim = cosineSimilarity(queryVec, tfidfVector(tokens))
            if (sim > 0.05f) mem to sim else null
        }.sortedByDescending { it.second }.take(limit)
    }

    suspend fun generateLocalResponse(
        prompt: String,
        memories: List<MemoryEntity>,
        tasks: List<TaskEntity>,
        agents: List<AgentEntity>,
        activeModel: LocalModelEntity?,
        telemetry: HardwareTelemetry,
        attachmentSummaries: List<String>,
        requiresCloudWarning: Boolean,
        onStageUpdate: suspend (OperationalStage) -> Unit
    ): LocalInferenceOutput = withContext(Dispatchers.Default) {
        val start = System.currentTimeMillis()
        onStageUpdate(OperationalStage.INTERPRETING)
        delay(120)
        currentCoroutineContext().ensureActive()

        onStageUpdate(OperationalStage.PLANNING)
        val matched = semanticSearch(prompt, memories, limit = 4)
        delay(120)
        currentCoroutineContext().ensureActive()

        onStageUpdate(OperationalStage.CONSULTING_AGENTS)
        val lower = prompt.lowercase()
        val isCloudOnlyRequest = CLOUD_ONLY_HINTS.any { lower.contains(it) }

        onStageUpdate(OperationalStage.EXECUTING)
        val sb = StringBuilder()

        if (requiresCloudWarning || isCloudOnlyRequest) {
            sb.appendLine("[MODO LOCAL — OFFLINE]")
            sb.appendLine("Aviso operacional: solicitações que dependem de workflows n8n, pesquisa externa na internet ou APIs de terceiros não estão disponíveis offline e não foram simuladas.")
            sb.appendLine()
        } else {
            sb.appendLine("[MODO LOCAL — PROCESSAMENTO NO DISPOSITIVO]")
        }

        when {
            lower.contains("status") || lower.contains("hardware") || lower.contains("memória ram") || lower.contains("sistema") -> {
                sb.appendLine("Diagnóstico Local do Dispositivo:")
                sb.appendLine("• RAM disponível: ${telemetry.availableRamMb} MB / ${telemetry.totalRamMb} MB (${(telemetry.ramUsageFraction * 100).toInt()}% em uso)")
                sb.appendLine("• Armazenamento livre: ${"%.1f".format(telemetry.freeStorageGb)} GB")
                sb.appendLine("• Bateria: ${telemetry.batteryLevel}% | Temperatura: ${"%.1f".format(telemetry.temperatureCelsius)}°C (${telemetry.thermalStatusLabel})")
                sb.appendLine("• Rede: ${if (telemetry.isOnline) if (telemetry.isWifi) "Online (Wi-Fi)" else "Online (Rede Móvel)" else "Offline"}")
                sb.appendLine("• Tarefas registradas localmente: ${tasks.size} | Agentes ativos: ${agents.count { it.isEnabled }}")
            }

            lower.contains("tarefa") || lower.contains("pendência") -> {
                val pending = tasks.filter { it.status == "PENDING" || it.status == "RUNNING" }
                sb.appendLine("Resumo Local da Central de Tarefas (${tasks.size} total):")
                if (pending.isEmpty()) {
                    sb.appendLine("• Nenhuma tarefa pendente ou em execução no cache local.")
                } else {
                    pending.take(5).forEach {
                        sb.appendLine("• [${it.status}] ${it.title} — Agente: ${it.agentName} (${(it.progress * 100).toInt()}%)")
                    }
                }
            }

            lower.contains("agente") -> {
                sb.appendLine("Subagentes Registrados no Núcleo Local (${agents.count { it.isEnabled }}/${agents.size} ativos):")
                agents.forEach {
                    sb.appendLine("• ${it.name} (${it.id}): ${it.specialty} — Modelo: ${it.modelId} [${it.status}]")
                }
            }

            else -> {
                val modelLabel = activeModel?.name ?: "AGI Local Core"
                sb.appendLine("Motor ativo: $modelLabel (${activeModel?.format ?: "BUILTIN"}).")
                if (attachmentSummaries.isNotEmpty()) {
                    sb.appendLine()
                    sb.appendLine("Documentos/Anexos lidos localmente:")
                    attachmentSummaries.forEach { sb.appendLine("• $it") }
                }
                if (matched.isNotEmpty()) {
                    sb.appendLine()
                    sb.appendLine("Memórias locais relevantes recuperadas por busca semântica:")
                    matched.forEach { (mem, score) ->
                        sb.appendLine("• ${mem.title} (${(score * 100).toInt()}% relevância): ${mem.content.take(180)}")
                    }
                } else {
                    sb.appendLine()
                    sb.appendLine("Solicitação registrada localmente: \"${prompt.take(160)}\".")
                    sb.appendLine("Não há memórias prévias correspondentes no índice semântico local para este tópico ainda.")
                }
                sb.appendLine()
                sb.append("Para orquestração multiagente completa via n8n e raciocínio em nuvem, conecte-se à rede e configure o Servidor AGI em Menu > Configurações.")
            }
        }

        onStageUpdate(OperationalStage.VALIDATING)
        delay(80)
        onStageUpdate(OperationalStage.CONCLUDING)

        val finalText = sb.toString().trim()
        val estTokens = (prompt.length + finalText.length) / 4
        LocalInferenceOutput(
            responseText = finalText,
            matchedMemories = matched.map { it.first },
            latencyMs = System.currentTimeMillis() - start,
            estimatedTokens = estTokens,
            modelUsed = activeModel?.name ?: "AGI Local Core"
        )
    }

    suspend fun importModelFromUri(uri: Uri): Result<ImportedModelMetadata> = withContext(Dispatchers.IO) {
        runCatching {
            val resolver = context.contentResolver
            var displayName = "modelo_local_${System.currentTimeMillis()}.gguf"
            var fileSize = 0L
            resolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
                    if (nameIdx >= 0) displayName = cursor.getString(nameIdx) ?: displayName
                    if (sizeIdx >= 0) fileSize = cursor.getLong(sizeIdx)
                }
            }
            val modelsDir = File(context.filesDir, "local_models").apply { mkdirs() }
            val destFile = File(modelsDir, displayName)

            val headerBytes = ByteArray(4)
            resolver.openInputStream(uri)?.use { input ->
                val readHeader = input.read(headerBytes)
                FileOutputStream(destFile).use { output ->
                    if (readHeader > 0) output.write(headerBytes, 0, readHeader)
                    input.copyTo(output)
                }
            } ?: error("Não foi possível abrir o arquivo selecionado.")

            val isGguf = headerBytes.size == 4 &&
                headerBytes[0] == 'G'.code.toByte() &&
                headerBytes[1] == 'G'.code.toByte() &&
                headerBytes[2] == 'U'.code.toByte() &&
                headerBytes[3] == 'F'.code.toByte()
            val format = when {
                displayName.endsWith(".onnx", ignoreCase = true) -> "ONNX"
                else -> "GGUF"
            }
            val finalSizeMb = ((if (fileSize > 0) fileSize else destFile.length()) / (1024L * 1024L)).toInt().coerceAtLeast(1)

            ImportedModelMetadata(
                fileName = displayName,
                format = format,
                sizeMb = finalSizeMb,
                internalPath = destFile.absolutePath,
                isValidBinaryHeader = if (format == "GGUF") isGguf else destFile.length() > 16
            )
        }
    }

    fun readDocumentTextPreview(uri: Uri, maxChars: Int = 1200): String {
        return runCatching {
            context.contentResolver.openInputStream(uri)?.bufferedReader()?.use { reader ->
                val buf = CharArray(maxChars)
                val read = reader.read(buf)
                if (read > 0) String(buf, 0, read) else ""
            }.orEmpty()
        }.getOrDefault("")
    }

    private fun tokenize(text: String): List<String> {
        return text.lowercase()
            .replace(Regex("[^a-zà-ÿ0-9\\s]"), " ")
            .split(Regex("\\s+"))
            .filter { it.length >= 2 && it !in STOP_WORDS }
    }

    private fun cosineSimilarity(a: Map<String, Float>, b: Map<String, Float>): Float {
        if (a.isEmpty() || b.isEmpty()) return 0f
        var dot = 0f
        var normA = 0f
        var normB = 0f
        a.forEach { (k, v) ->
            normA += v * v
            b[k]?.let { bv -> dot += v * bv }
        }
        b.values.forEach { bv -> normB += bv * bv }
        val denom = sqrt(normA) * sqrt(normB)
        return if (denom > 0f) dot / denom else 0f
    }

    companion object {
        private val STOP_WORDS = setOf(
            "de", "da", "do", "das", "dos", "em", "no", "na", "para", "com", "por", "uma", "um",
            "que", "como", "the", "and", "for", "with", "this", "that"
        )
        private val CLOUD_ONLY_HINTS = listOf(
            "n8n", "webhook", "pesquisar na internet", "pesquise online", "enviar e-mail",
            "pagamento", "api externa", "sincronizar servidor"
        )
    }
}
