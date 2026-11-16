package tech.afuagro.agi.ui.screens.intelligence

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.FileUpload
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.data.local.LocalModelEntity
import tech.afuagro.agi.data.local.SyncQueueEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import tech.afuagro.agi.ui.components.HybridModeSelector
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.CrimsonAlert
import tech.afuagro.agi.ui.theme.NeonMint

@Composable
fun IntelligenceManagerScreen(
    settings: AgiSettingsState,
    telemetry: HardwareTelemetry,
    localModels: List<LocalModelEntity>,
    syncQueue: List<SyncQueueEntity>,
    pendingMemorySyncCount: Int,
    periodicSyncStatus: String,
    onBack: () -> Unit,
    onSelectMode: (IntelligenceMode) -> Unit,
    onSetWifiOnly: (Boolean) -> Unit,
    onSetCloudDisabled: (Boolean) -> Unit,
    onImportModelUri: (android.net.Uri) -> Unit,
    onDownloadModel: (String) -> Unit,
    onActivateModel: (String) -> Unit,
    onRemoveModel: (String) -> Unit,
    onUpdateModelConfig: (String, Int, Int, Float, Boolean) -> Unit,
    onManualSync: () -> Unit,
    onResolveConflict: (String, Boolean) -> Unit
) {
    var configModel by remember { mutableStateOf<LocalModelEntity?>(null) }

    val modelPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) onImportModelUri(uri)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AgiSubScreenTopBar(
            title = "INTELLIGENCE MANAGER",
            subtitle = "Motor Híbrido Local (GGUF/ONNX) + Nuvem",
            onBack = onBack
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Hybrid Mode Control
            item {
                AgiGlassCard(highlighted = true) {
                    Text("MODO DE OPERAÇÃO HÍBRIDA", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    HybridModeSelector(
                        selectedMode = settings.intelligenceMode,
                        cloudBlocked = settings.cloudDisabledCompletely,
                        onModeSelected = onSelectMode
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(settings.intelligenceMode.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Somente Wi-Fi para Nuvem/Sync", style = MaterialTheme.typography.bodyMedium)
                            Text("Bloqueia tráfego em dados móveis", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(checked = settings.wifiOnlySync, onCheckedChange = onSetWifiOnly)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Desativar Comunicação em Nuvem", style = MaterialTheme.typography.bodyMedium)
                            Text("Isolamento estrito offline (modo LOCAL)", style = MaterialTheme.typography.labelSmall, color = CrimsonAlert)
                        }
                        Switch(checked = settings.cloudDisabledCompletely, onCheckedChange = onSetCloudDisabled)
                    }
                }
            }

            // Hardware Telemetry Card
            item {
                AgiGlassCard {
                    Text("TELEMETRIA REAL DO HARDWARE", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "RAM: ${telemetry.usedRamMb} MB / ${telemetry.totalRamMb} MB (${telemetry.availableRamMb} MB disponíveis)",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = { telemetry.ramUsageFraction.coerceIn(0f, 1f) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Armazenamento livre: ${"%.1f".format(telemetry.freeStorageGb)} GB de ${"%.1f".format(telemetry.totalStorageGb)} GB",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = "CPU: ${telemetry.cpuCores} núcleos (${telemetry.abi}) • Bateria: ${telemetry.batteryLevel}% • Temp: ${"%.1f".format(telemetry.temperatureCelsius)}°C (${telemetry.thermalStatusLabel})",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Local Models Header + Import
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("MODELOS LOCAIS (GGUF / ONNX)", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    OutlinedButton(
                        onClick = { modelPicker.launch(arrayOf("*/*")) },
                        modifier = Modifier
                            .heightIn(min = 48.dp)
                            .testTag("import_local_model_button")
                    ) {
                        Icon(Icons.Default.FileUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Importar Arquivo")
                    }
                }
            }

            items(localModels, key = { it.id }) { model ->
                val ramCompatible = telemetry.totalRamMb >= model.minRamMb
                val storageCompatible = (telemetry.freeStorageGb * 1024f) >= model.sizeMb

                AgiGlassCard(highlighted = model.isActive) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(model.name, style = MaterialTheme.typography.titleMedium)
                            Text(
                                text = "${model.format} • ${model.quantization} • ${model.sizeMb} MB • RAM mín: ${model.minRamMb} MB",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        if (model.format != "BUILTIN") {
                            IconButton(onClick = { configModel = model }) {
                                Icon(Icons.Default.Tune, contentDescription = "Parâmetros de inferência")
                            }
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = if (ramCompatible && storageCompatible) {
                            "Compatível com este dispositivo (Contexto: ${model.contextLength} • Threads: ${model.threads})"
                        } else {
                            "Atenção: hardware abaixo do recomendado (${model.minRamMb} MB RAM / ${model.sizeMb} MB espaço)"
                        },
                        style = MaterialTheme.typography.bodySmall,
                        color = if (ramCompatible && storageCompatible) NeonMint else AmberPulse
                    )

                    if (model.isDownloading) {
                        Spacer(Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = { model.downloadProgress.coerceIn(0f, 1f) },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Text("Baixando… ${(model.downloadProgress * 100).toInt()}%", style = MaterialTheme.typography.labelSmall)
                    }

                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (model.isDownloaded) {
                            Button(
                                onClick = { onActivateModel(model.id) },
                                enabled = !model.isActive,
                                modifier = Modifier
                                    .weight(1f)
                                    .heightIn(min = 48.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text(if (model.isActive) "Ativo" else "Ativar")
                            }
                            if (model.format != "BUILTIN") {
                                OutlinedButton(
                                    onClick = { onRemoveModel(model.id) },
                                    modifier = Modifier.heightIn(min = 48.dp)
                                ) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Remover modelo")
                                }
                            }
                        } else {
                            Button(
                                onClick = { onDownloadModel(model.id) },
                                enabled = !model.isDownloading && telemetry.isOnline && !(settings.wifiOnlySync && telemetry.isMetered),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = 48.dp)
                            ) {
                                Icon(Icons.Default.CloudDownload, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(6.dp))
                                Text("Baixar Modelo (${model.sizeMb} MB)")
                            }
                        }
                    }
                }
            }

            // Sync Queue & Conflicts
            item {
                AgiGlassCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("FILA DE SINCRONIZAÇÃO HÍBRIDA", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "${syncQueue.count { it.status != "SYNCED" } + pendingMemorySyncCount} item(ns) aguardando envio ou resolução",
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                text = "WorkManager: $periodicSyncStatus (a cada ${settings.autoSyncIntervalMinutes} min)",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.secondary
                            )
                        }
                        Button(onClick = onManualSync, modifier = Modifier.heightIn(min = 48.dp)) {
                            Icon(Icons.Default.Sync, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Sincronizar")
                        }
                    }
                    syncQueue.filter { it.status == "CONFLICT" }.forEach { conflict ->
                        Spacer(Modifier.height(8.dp))
                        Text("Conflito em ${conflict.entityType} (v${conflict.version}): ${conflict.conflictMessage}", color = AmberPulse, style = MaterialTheme.typography.bodySmall)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            TextButton(onClick = { onResolveConflict(conflict.id, true) }) { Text("Manter Local") }
                            TextButton(onClick = { onResolveConflict(conflict.id, false) }) { Text("Aceitar Servidor") }
                        }
                    }
                }
            }
        }
    }

    configModel?.let { model ->
        var ctxText by remember { mutableStateOf(model.contextLength.toString()) }
        var threadsText by remember { mutableStateOf(model.threads.toString()) }
        var tempText by remember { mutableStateOf(model.temperature.toString()) }
        var useGpu by remember { mutableStateOf(model.useGpuDelegate) }

        AlertDialog(
            onDismissRequest = { configModel = null },
            title = { Text("Parâmetros: ${model.name}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = ctxText, onValueChange = { ctxText = it }, label = { Text("Tamanho de Contexto (tokens)") })
                    OutlinedTextField(value = threadsText, onValueChange = { threadsText = it }, label = { Text("Threads CPU") })
                    OutlinedTextField(value = tempText, onValueChange = { tempText = it }, label = { Text("Temperatura (0.0 - 1.5)") })
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Aceleração GPU / NNAPI")
                        Switch(checked = useGpu, onCheckedChange = { useGpu = it })
                    }
                }
            },
            confirmButton = {
                Button(onClick = {
                    onUpdateModelConfig(
                        model.id,
                        ctxText.toIntOrNull() ?: 4096,
                        threadsText.toIntOrNull() ?: 4,
                        tempText.toFloatOrNull() ?: 0.4f,
                        useGpu
                    )
                    configModel = null
                }) {
                    Text("Salvar")
                }
            },
            dismissButton = {
                TextButton(onClick = { configModel = null }) { Text("Cancelar") }
            }
        )
    }
}
