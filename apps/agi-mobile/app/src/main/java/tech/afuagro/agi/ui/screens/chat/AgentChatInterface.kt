package tech.afuagro.agi.ui.screens.chat

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.InputChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.AttachmentPayload
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.ui.components.OperationalPipelineCard

/**
 * Componente modular de interface de chat para interação com a AGI e seus subagentes.
 * Contém barra de agentes ativos, pipeline operacional, lista rolável de mensagens (`LazyColumn`)
 * e barra persistente inferior com `OutlinedTextField` e botão `'Enviar'`.
 */
@Composable
fun AgentChatInterface(
    messages: List<ChatMessageEntity>,
    inputText: String,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    intelligenceMode: IntelligenceMode,
    operationalStage: OperationalStage = OperationalStage.IDLE,
    pendingAttachments: List<AttachmentPayload> = emptyList(),
    activeAgentNames: List<String> = emptyList(),
    onRemoveAttachment: (String) -> Unit = {},
    onAttachImage: (() -> Unit)? = null,
    onAttachDocument: (() -> Unit)? = null,
    onVoiceInput: (() -> Unit)? = null,
    onCancelOperation: () -> Unit = {},
    onPromptSuggestionClick: (String) -> Unit = {},
    onMessageCopied: (String) -> Unit = {},
    listState: LazyListState = rememberLazyListState(),
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val canSend = (inputText.isNotBlank() || pendingAttachments.isNotEmpty()) &&
        operationalStage == OperationalStage.IDLE
    val hasMultimodalActions = onAttachImage != null || onAttachDocument != null || onVoiceInput != null

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    Column(modifier = modifier.fillMaxSize()) {
        if (activeAgentNames.isNotEmpty()) {
            ActiveAgentsBar(
                agentNames = activeAgentNames,
                onAgentSelected = { agentName ->
                    val mention = "@$agentName "
                    if (!inputText.contains(mention, ignoreCase = true)) {
                        onInputChange(mention + inputText)
                    }
                }
            )
        }

        OperationalPipelineCard(
            stage = operationalStage,
            onCancel = onCancelOperation
        )

        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .testTag("chat_message_list"),
            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (messages.isEmpty()) {
                item(key = "chat_empty_state") {
                    ChatEmptyState(
                        mode = intelligenceMode,
                        onPromptClick = onPromptSuggestionClick
                    )
                }
            } else {
                items(messages, key = { it.id }) { msg ->
                    ChatMessageBubble(
                        msg = msg,
                        onCopy = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
                            clipboard?.setPrimaryClip(ClipData.newPlainText("agi_chat_message", msg.content))
                            onMessageCopied("Mensagem copiada para a área de transferência.")
                        }
                    )
                }
            }
        }

        if (pendingAttachments.isNotEmpty()) {
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 4.dp)
                    .testTag("pending_attachments_row"),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(pendingAttachments, key = { it.id }) { att ->
                    InputChip(
                        selected = true,
                        onClick = { onRemoveAttachment(att.id) },
                        label = { Text(att.name, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Remover anexo ${att.name}",
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    )
                }
            }
        }

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .imePadding()
                .testTag("chat_bottom_composer"),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 4.dp,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (hasMultimodalActions) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        if (onAttachImage != null) {
                            IconButton(
                                onClick = onAttachImage,
                                modifier = Modifier.testTag("attach_image_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Image,
                                    contentDescription = "Anexar imagem",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        if (onAttachDocument != null) {
                            IconButton(
                                onClick = onAttachDocument,
                                modifier = Modifier.testTag("attach_doc_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AttachFile,
                                    contentDescription = "Anexar documento",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        if (onVoiceInput != null) {
                            IconButton(
                                onClick = onVoiceInput,
                                modifier = Modifier.testTag("voice_input_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Mic,
                                    contentDescription = "Entrada por voz",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        Spacer(Modifier.weight(1f))
                        Text(
                            text = if (operationalStage == OperationalStage.IDLE) {
                                "Use @agente para direcionar"
                            } else {
                                operationalStage.label
                            },
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = onInputChange,
                        placeholder = {
                            Text(
                                text = "Comande a AGI…",
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("chat_input_field"),
                        maxLines = 4,
                        shape = RoundedCornerShape(14.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                if (canSend) onSend()
                            }
                        )
                    )

                    Button(
                        onClick = onSend,
                        enabled = canSend,
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary,
                            disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                            disabledContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        modifier = Modifier
                            .heightIn(min = 52.dp)
                            .semantics { contentDescription = "Enviar mensagem" }
                            .testTag("chat_send_button")
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "Enviar",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveAgentsBar(
    agentNames: List<String>,
    onAgentSelected: (String) -> Unit
) {
    LazyRow(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .testTag("chat_active_agents_row"),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        items(agentNames, key = { it }) { agentName ->
            AssistChip(
                onClick = { onAgentSelected(agentName) },
                label = {
                    Text(
                        text = agentName,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.SmartToy,
                        contentDescription = null,
                        modifier = Modifier.size(14.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                },
                colors = AssistChipDefaults.assistChipColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                )
            )
        }
    }
}
