package tech.afuagro.agi.ui.screens.chat

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.OpenableColumns
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import tech.afuagro.agi.core.model.AttachmentPayload
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.network.BackendProbeResult
import tech.afuagro.agi.ui.components.StatusPulseDot
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.NeonMint
import java.util.Locale
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    settings: AgiSettingsState,
    sessions: List<ChatSessionEntity>,
    activeSessionId: String?,
    messages: List<ChatMessageEntity>,
    pendingAttachments: List<AttachmentPayload>,
    operationalStage: OperationalStage,
    activeAgentNames: List<String> = emptyList(),
    backendStatus: BackendProbeResult = BackendProbeResult(
        reachable = false,
        httpCode = 0,
        latencyMs = 0L,
        orchestratorStatus = "Aguardando verificação",
        n8nStatus = "Não verificado"
    ),
    isProbingBackend: Boolean = false,
    isSyncingHistory: Boolean = false,
    activeModelLabel: String = "",
    onProbeBackend: () -> Unit = {},
    onSendMessage: (String) -> Unit,
    onCancelOperation: () -> Unit,
    onSelectSession: (String) -> Unit,
    onNewSession: () -> Unit,
    onDeleteSession: (String) -> Unit,
    onAddAttachment: (AttachmentPayload) -> Unit,
    onRemoveAttachment: (String) -> Unit,
    onReadDocumentPreview: (android.net.Uri) -> String,
    onToggleTts: () -> Unit,
    onSyncRemoteMessages: () -> Unit = {},
    onPostBanner: (String) -> Unit
) {
    val context = LocalContext.current
    var inputText by remember { mutableStateOf("") }
    var showSessionsSheet by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    // TextToSpeech engine
    var ttsEngine by remember { mutableStateOf<TextToSpeech?>(null) }
    var lastSpokenId by remember { mutableStateOf<String?>(null) }

    DisposableEffect(context) {
        var tts: TextToSpeech? = null
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.Builder().setLanguage("pt").setRegion("BR").build()
            }
        }
        ttsEngine = tts
        onDispose {
            tts.stop()
            tts.shutdown()
        }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            val last = messages.last()
            if (settings.ttsEnabled && last.role == "agi" && last.id != lastSpokenId) {
                lastSpokenId = last.id
                ttsEngine?.speak(last.content.take(500), TextToSpeech.QUEUE_FLUSH, null, last.id)
            }
        }
    }

    // Android Photo Picker (Zero storage permission)
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            onAddAttachment(
                AttachmentPayload(
                    id = UUID.randomUUID().toString().take(8),
                    name = "Imagem_${System.currentTimeMillis() % 10000}.jpg",
                    mimeType = "image/*",
                    uriString = uri.toString()
                )
            )
        }
    }

    // SAF Document Picker (Zero storage permission)
    val documentPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            var fileName = "Documento"
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (idx >= 0) fileName = cursor.getString(idx) ?: fileName
                }
            }
            val mime = context.contentResolver.getType(uri) ?: "application/octet-stream"
            val preview = onReadDocumentPreview(uri)
            onAddAttachment(
                AttachmentPayload(
                    id = UUID.randomUUID().toString().take(8),
                    name = fileName,
                    mimeType = mime,
                    uriString = uri.toString(),
                    textPreview = preview.ifBlank { null }
                )
            )
        }
    }

    // Voice Input Launcher
    val voiceIntentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val spoken = matches?.firstOrNull()
            if (!spoken.isNullOrBlank()) {
                inputText = if (inputText.isBlank()) spoken else "$inputText $spoken"
            }
        }
    }

    val launchVoiceRecognizer = {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR")
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Fale seu comando para a AGI")
        }
        runCatching { voiceIntentLauncher.launch(intent) }.onFailure {
            onPostBanner("Reconhecimento de voz não disponível neste dispositivo.")
        }
    }

    val audioPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchVoiceRecognizer()
        else onPostBanner("Permissão de microfone negada. Digite sua mensagem ou habilite nas configurações.")
    }

    val activeSessionTitle = sessions.firstOrNull { it.id == activeSessionId }?.title ?: "Chat Multimodal AGI"

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = {
                Column {
                    Text(
                        text = activeSessionTitle,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "Modo ${settings.intelligenceMode.label} • ${settings.routingStrategy.label}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            },
            actions = {
                IconButton(
                    onClick = onSyncRemoteMessages,
                    modifier = Modifier.testTag("chat_sync_messages_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Sync,
                        contentDescription = "Receber mensagens do n8n"
                    )
                }
                IconButton(
                    onClick = onToggleTts,
                    modifier = Modifier.testTag("toggle_tts_button")
                ) {
                    Icon(
                        imageVector = if (settings.ttsEnabled) Icons.AutoMirrored.Filled.VolumeUp else Icons.AutoMirrored.Filled.VolumeOff,
                        contentDescription = "Alternar resposta por voz",
                        tint = if (settings.ttsEnabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                IconButton(
                    onClick = { showSessionsSheet = true },
                    modifier = Modifier.testTag("open_sessions_button")
                ) {
                    Icon(Icons.Default.History, contentDescription = "Sessões de conversa")
                }
                IconButton(
                    onClick = onNewSession,
                    modifier = Modifier.testTag("chat_new_session_button")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Nova sessão")
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
        )

        OrchestratorStatusBanner(
            backendStatus = backendStatus,
            isProbing = isProbingBackend,
            isSyncingHistory = isSyncingHistory,
            activeModelLabel = activeModelLabel,
            onProbeBackend = onProbeBackend
        )

        AgentChatInterface(
            messages = messages,
            inputText = inputText,
            onInputChange = { inputText = it },
            onSend = {
                val toSend = inputText
                inputText = ""
                onSendMessage(toSend)
            },
            intelligenceMode = settings.intelligenceMode,
            operationalStage = operationalStage,
            pendingAttachments = pendingAttachments,
            activeAgentNames = activeAgentNames,
            onRemoveAttachment = onRemoveAttachment,
            onAttachImage = {
                photoPickerLauncher.launch(
                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                )
            },
            onAttachDocument = {
                documentPickerLauncher.launch(arrayOf("*/*"))
            },
            onVoiceInput = {
                val granted = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
                if (granted) launchVoiceRecognizer()
                else audioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            },
            onCancelOperation = onCancelOperation,
            onPromptSuggestionClick = { onSendMessage(it) },
            onMessageCopied = onPostBanner,
            listState = listState,
            modifier = Modifier.weight(1f)
        )
    }

    if (showSessionsSheet) {
        ModalBottomSheet(onDismissRequest = { showSessionsSheet = false }) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Sessões Persistentes (${sessions.size})", style = MaterialTheme.typography.titleLarge)
                if (sessions.isEmpty()) {
                    Text("Nenhuma sessão salva ainda.", style = MaterialTheme.typography.bodyMedium)
                } else {
                    sessions.forEach { sess ->
                        val selected = sess.id == activeSessionId
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    onSelectSession(sess.id)
                                    showSessionsSheet = false
                                },
                            shape = MaterialTheme.shapes.small,
                            color = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(sess.title, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("Modo ${sess.modeUsed} • v${sess.version} • ${sess.syncStatus}", style = MaterialTheme.typography.labelSmall)
                                }
                                IconButton(onClick = { onDeleteSession(sess.id) }) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Excluir sessão")
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun OrchestratorStatusBanner(
    backendStatus: BackendProbeResult,
    isProbing: Boolean,
    isSyncingHistory: Boolean,
    activeModelLabel: String,
    onProbeBackend: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .testTag("chat_orchestrator_status_bar"),
        shape = MaterialTheme.shapes.small,
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
        border = BorderStroke(
            1.dp,
            if (backendStatus.reachable) NeonMint.copy(alpha = 0.4f)
            else MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusPulseDot(
                    isActive = backendStatus.reachable,
                    activeColor = NeonMint,
                    inactiveColor = AmberPulse
                )
                Spacer(Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    val statusLine = buildString {
                        append("Orquestrador: ${backendStatus.orchestratorStatus}")
                        if (backendStatus.latencyMs > 0) append(" (${backendStatus.latencyMs}ms)")
                    }
                    Text(
                        text = statusLine,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    val secondaryLine = buildString {
                        append("n8n: ${backendStatus.n8nStatus}")
                        if (isSyncingHistory) append(" • Sincronizando histórico…")
                        else if (activeModelLabel.isNotBlank()) append(" • Modelo: $activeModelLabel")
                    }
                    Text(
                        text = secondaryLine,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSyncingHistory) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            TextButton(
                onClick = onProbeBackend,
                enabled = !isProbing,
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                modifier = Modifier
                    .heightIn(min = 48.dp)
                    .testTag("chat_probe_backend_button")
            ) {
                if (isProbing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(Modifier.width(4.dp))
                Text(
                    text = if (isProbing) "Verificando" else "Reconectar",
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}
