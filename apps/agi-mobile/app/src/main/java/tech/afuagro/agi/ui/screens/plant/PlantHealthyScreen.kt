package tech.afuagro.agi.ui.screens.plant

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Science
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.agro.ProcessedRawAgroResult
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.network.PlantImageAnalyzeResponse
import tech.afuagro.agi.network.PlantMonitoringAlertDto
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.NeonMint

private val GENERATIONS = listOf("G1", "G2", "G3", "G4")

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PlantHealthyScreen(
    settings: AgiSettingsState,
    isAnalyzing: Boolean,
    diagnosisResult: PlantImageAnalyzeResponse?,
    monitoringAlerts: List<PlantMonitoringAlertDto>,
    processedRawAgro: ProcessedRawAgroResult?,
    memories: List<MemoryEntity>,
    onBack: () -> Unit,
    onSaveEndpoints: (baseUrl: String, analyzePath: String, telemetryPath: String, alertsPath: String) -> Unit,
    onAnalyzeImage: (imageUrl: String?, localUri: Uri?, cropType: String, generation: String, notes: String?) -> Unit,
    onCleanRawData: (rawInput: String, cropType: String, generation: String) -> Unit,
    onSendTelemetry: (rawInput: String, cropType: String, generation: String) -> Unit,
    onFetchAlerts: (cropType: String?, generation: String?) -> Unit,
    onReadRawFileText: (Uri) -> String,
    onAskAgentInChat: (String) -> Unit
) {
    var apiBaseUrl by remember(settings.plantApiBaseUrl) { mutableStateOf(settings.plantApiBaseUrl) }
    var analyzePath by remember(settings.plantAnalyzePath) { mutableStateOf(settings.plantAnalyzePath) }
    var telemetryPath by remember(settings.plantTelemetryPath) { mutableStateOf(settings.plantTelemetryPath) }
    var alertsPath by remember(settings.plantAlertsPath) { mutableStateOf(settings.plantAlertsPath) }

    var cropType by remember { mutableStateOf("soja") }
    var generation by remember { mutableStateOf("G3") }
    var imageUrlInput by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var fieldNotes by remember { mutableStateOf("") }
    var rawAgroInput by remember { mutableStateOf("") }

    // Android Photo Picker (Zero storage permission)
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            selectedImageUri = uri
        }
    }

    // SAF Raw Data File Picker (CSV / JSON / TXT — zero storage permission)
    val rawFileLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            val content = onReadRawFileText(uri)
            if (content.isNotBlank()) {
                rawAgroInput = content
            }
        }
    }

    val plantMemories = remember(memories) {
        memories.filter { it.tagsCsv.contains("planta-saudavel", ignoreCase = true) }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AgiSubScreenTopBar(
            title = "Agente Planta Saudável",
            subtitle = "Analista Pesquisador • Fitotecnia, G1–G4 & API",
            onBack = onBack,
            actions = {
                androidx.compose.material3.IconButton(
                    onClick = {
                        onAskAgentInChat(
                            "@Planta Saudável Resuma o estado atual do cultivo $cropType ($generation) e recomendações fitotécnicas."
                        )
                    },
                    modifier = Modifier.testTag("plant_open_chat_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = "Consultar Agente no Chat")
                }
            }
        )

        if (isAnalyzing) {
            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Configuração de API do Agente
            item {
                AgiGlassCard {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Eco, contentDescription = null, tint = NeonMint)
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "INTEGRAÇÃO API FITOTÉCNICA",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = if (apiBaseUrl.isBlank()) {
                            "Herda URL do Servidor AGI/n8n quando em branco."
                        } else {
                            "Endpoint ativo: $apiBaseUrl$analyzePath"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = apiBaseUrl,
                        onValueChange = { apiBaseUrl = it },
                        label = { Text("URL Base da API Agro (opcional)") },
                        placeholder = { Text("https://agroapi.exemplo.com") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("plant_api_url_input")
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = analyzePath,
                        onValueChange = { analyzePath = it },
                        label = { Text("Rota Diagnóstico por Imagem") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = telemetryPath,
                            onValueChange = { telemetryPath = it },
                            label = { Text("Rota Dados IoT") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = alertsPath,
                            onValueChange = { alertsPath = it },
                            label = { Text("Rota Alertas") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = { onSaveEndpoints(apiBaseUrl, analyzePath, telemetryPath, alertsPath) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                            .testTag("save_plant_endpoints_button")
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Salvar Endpoints da API")
                    }
                }
            }

            // 2. Diagnóstico por Imagem + Contexto Genômico G1-G4
            item {
                AgiGlassCard(highlighted = true) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Science, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "DIAGNÓSTICO POR IMAGEM & GENOMA",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Spacer(Modifier.height(10.dp))

                    OutlinedTextField(
                        value = cropType,
                        onValueChange = { cropType = it },
                        label = { Text("Cultivo (crop_type)") },
                        placeholder = { Text("soja, café, milho...") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("plant_crop_input")
                    )
                    Spacer(Modifier.height(8.dp))
                    Text("Geração Multigeneracional (G1–G4)", style = MaterialTheme.typography.labelSmall)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        GENERATIONS.forEach { gen ->
                            FilterChip(
                                selected = generation == gen,
                                onClick = { generation = gen },
                                label = { Text(gen) },
                                modifier = Modifier.testTag("plant_gen_$gen")
                            )
                        }
                    }

                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = imageUrlInput,
                        onValueChange = { imageUrlInput = it },
                        label = { Text("URL da Imagem (image_url)") },
                        placeholder = { Text("https://.../folha.jpg") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("plant_image_url_input")
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = {
                            photoPickerLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                            .testTag("plant_pick_image_button")
                    ) {
                        Icon(Icons.Default.Image, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text(
                            text = if (selectedImageUri != null) {
                                "Foto local selecionada (toque para trocar)"
                            } else {
                                "Selecionar Foto da Folha/Planta"
                            },
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = fieldNotes,
                        onValueChange = { fieldNotes = it },
                        label = { Text("Observações de campo (opcional)") },
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(10.dp))
                    Button(
                        onClick = {
                            onAnalyzeImage(
                                imageUrlInput.takeIf { it.isNotBlank() },
                                selectedImageUri,
                                cropType,
                                generation,
                                fieldNotes.takeIf { it.isNotBlank() }
                            )
                        },
                        enabled = !isAnalyzing && (imageUrlInput.isNotBlank() || selectedImageUri != null),
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                            .testTag("plant_analyze_button")
                    ) {
                        Icon(Icons.Default.Science, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Analisar via API (${analyzePath})")
                    }
                }
            }

            // Resultado real retornado pela API de diagnóstico
            if (diagnosisResult != null) {
                item {
                    AgiGlassCard(highlighted = true) {
                        Text(
                            "RESULTADO DO DIAGNÓSTICO",
                            style = MaterialTheme.typography.labelMedium,
                            color = NeonMint
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = diagnosisResult.diagnosis ?: "Sem diagnóstico detalhado",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        val confText = diagnosisResult.confidence?.let { "${(it * 100).toInt()}%" } ?: "N/D"
                        Text(
                            text = "Confiança: $confText • Risco Genômico: ${diagnosisResult.genomicRisk ?: "N/D"}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                        if (!diagnosisResult.historicalComparison.isNullOrBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text(
                                text = "Comparação Multigeneracional: ${diagnosisResult.historicalComparison}",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        val recs = diagnosisResult.recommendations.orEmpty()
                        if (recs.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            Text("Recomendações:", style = MaterialTheme.typography.labelMedium)
                            recs.forEach { rec ->
                                Text("• $rec", style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }

            // 3. Higienização de Dados Brutos (Raw Data / IoT)
            item {
                AgiGlassCard {
                    Text(
                        "DADOS BRUTOS (RAW DATA) & IOT",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Cole medições brutas (JSON, CSV ou chave=valor) ou carregue arquivo de sensores para limpeza, validação e envio.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = rawAgroInput,
                        onValueChange = { rawAgroInput = it },
                        label = { Text("Payload bruto de sensores / laboratório") },
                        placeholder = { Text("temp=27.5\numidade=68\nph=6.1\ngeracao=G3\nobs=N/A") },
                        minLines = 3,
                        maxLines = 6,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("plant_raw_data_input")
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = { rawFileLauncher.launch(arrayOf("text/*", "application/json", "*/*")) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                            .testTag("plant_pick_raw_file_button")
                    ) {
                        Icon(Icons.Default.AttachFile, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Importar CSV / JSON de Sensores")
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { onCleanRawData(rawAgroInput, cropType, generation) },
                            enabled = rawAgroInput.isNotBlank(),
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("plant_clean_raw_button")
                        ) {
                            Icon(Icons.Default.CleaningServices, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Limpar", maxLines = 1)
                        }
                        Button(
                            onClick = { onSendTelemetry(rawAgroInput, cropType, generation) },
                            enabled = !isAnalyzing && rawAgroInput.isNotBlank(),
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("plant_send_telemetry_button")
                        ) {
                            Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Enviar API", maxLines = 1)
                        }
                    }

                    if (processedRawAgro != null) {
                        Spacer(Modifier.height(10.dp))
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                            shape = MaterialTheme.shapes.small,
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(10.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    "Normalizado (${processedRawAgro.normalizedFields.size}) • Descartados (${processedRawAgro.discardedFields.size})",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = NeonMint
                                )
                                processedRawAgro.normalizedFields.forEach { (k, v) ->
                                    Text("$k: $v", style = MaterialTheme.typography.bodySmall)
                                }
                                processedRawAgro.validationWarnings.forEach { warn ->
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.Warning,
                                            contentDescription = "Alerta de validação",
                                            tint = AmberPulse,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(Modifier.width(4.dp))
                                        Text(warn, style = MaterialTheme.typography.labelSmall, color = AmberPulse)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 4. Alertas em Tempo Real & Memória Multigeneracional
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "ALERTAS DE MONITORAMENTO (${monitoringAlerts.size})",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    OutlinedButton(
                        onClick = { onFetchAlerts(cropType, generation) },
                        enabled = !isAnalyzing,
                        modifier = Modifier
                            .heightIn(min = 48.dp)
                            .testTag("plant_fetch_alerts_button")
                    ) {
                        Icon(Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Consultar API")
                    }
                }
            }

            if (monitoringAlerts.isEmpty()) {
                item {
                    Text(
                        text = "Nenhum alerta remoto carregado. Toque em 'Consultar API' após configurar o servidor.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(monitoringAlerts) { alert ->
                    AgiGlassCard {
                        Text(
                            text = "${alert.severity ?: "ALERTA"} • ${alert.title ?: "Monitoramento"}",
                            style = MaterialTheme.typography.titleSmall,
                            color = AmberPulse
                        )
                        if (!alert.message.isNullOrBlank()) {
                            Text(alert.message, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }

            item {
                Text(
                    "HISTÓRICO MULTIGENERACIONAL LOCAL (${plantMemories.size})",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            if (plantMemories.isEmpty()) {
                item {
                    Text(
                        text = "Nenhum diagnóstico ou medição salva ainda nesta instalação.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(plantMemories, key = { it.id }) { mem ->
                    AgiGlassCard {
                        Text(mem.title, style = MaterialTheme.typography.titleSmall)
                        Spacer(Modifier.height(4.dp))
                        Text(mem.content, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}
