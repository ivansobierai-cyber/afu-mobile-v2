package tech.afuagro.agi

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.data.local.ChatMessageEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.network.BackendProbeResult
import tech.afuagro.agi.ui.screens.chat.AgentChatInterface
import tech.afuagro.agi.ui.screens.chat.ChatScreen
import tech.afuagro.agi.ui.theme.AgiMobileTheme
import android.app.Application
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36], application = Application::class)
class AgentChatInterfaceTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun emptyState_displaysSuggestions_andTriggersCallback() {
        var clickedPrompt = ""
        composeRule.setContent {
            AgiMobileTheme {
                AgentChatInterface(
                    messages = emptyList(),
                    inputText = "",
                    onInputChange = {},
                    onSend = {},
                    intelligenceMode = IntelligenceMode.HYBRID,
                    onPromptSuggestionClick = { clickedPrompt = it }
                )
            }
        }

        composeRule.waitForIdle()
        composeRule.onNodeWithTag("chat_message_list").assertIsDisplayed()
        composeRule.onNodeWithTag("chat_empty_state").assertIsDisplayed()
        composeRule.onNodeWithTag("chat_suggestion_0").performClick()
        composeRule.waitForIdle()

        assertEquals("Verificar status do hardware e memória local", clickedPrompt)
    }

    @Test
    fun messageList_rendersUserAndAgentMessages_andAllowsSendingText() {
        val sentMessages = mutableListOf<String>()
        val messagesState = mutableStateListOf(
            ChatMessageEntity(
                id = "m1",
                sessionId = "s1",
                role = "user",
                content = "Analise o fluxo n8n",
                timestamp = 1_700_000_000_000L
            ),
            ChatMessageEntity(
                id = "m2",
                sessionId = "s1",
                role = "agi",
                content = "Orquestrador e Analista verificaram os workflows.",
                agentsInvolvedCsv = "Orquestrador, Analista",
                modelUsed = "gemini-2.5-pro",
                executionMode = "CLOUD",
                latencyMs = 240L,
                tokensUsed = 128,
                timestamp = 1_700_000_005_000L
            )
        )

        var currentInput by mutableStateOf("")

        composeRule.setContent {
            AgiMobileTheme {
                AgentChatInterface(
                    messages = messagesState,
                    inputText = currentInput,
                    onInputChange = { currentInput = it },
                    onSend = {
                        val payload = currentInput
                        sentMessages.add(payload)
                        messagesState.add(
                            ChatMessageEntity(
                                id = "m3",
                                sessionId = "s1",
                                role = "user",
                                content = payload,
                                timestamp = 1_700_000_010_000L
                            )
                        )
                        currentInput = ""
                    },
                    intelligenceMode = IntelligenceMode.CLOUD,
                    operationalStage = OperationalStage.IDLE,
                    activeAgentNames = listOf("Orquestrador", "Programador")
                )
            }
        }

        composeRule.waitForIdle()
        composeRule.onNodeWithTag("chat_message_list").assertIsDisplayed()
        composeRule.onNodeWithText("Analise o fluxo n8n").assertIsDisplayed()
        composeRule.onNodeWithText("Orquestrador e Analista verificaram os workflows.").assertIsDisplayed()
        composeRule.onNodeWithText("Orquestrador, Analista").assertIsDisplayed()

        // Send button starts disabled when input is blank
        composeRule.onNodeWithTag("chat_send_button").assertIsNotEnabled()

        // Type message and tap active agent chip to mention it, then send
        composeRule.onNodeWithTag("chat_input_field").performTextInput("crie endpoint REST")
        composeRule.onNodeWithText("Programador").performClick()
        composeRule.waitForIdle()

        composeRule.onNodeWithTag("chat_send_button").assertIsEnabled().performClick()
        composeRule.waitForIdle()

        assertEquals(listOf("@Programador crie endpoint REST"), sentMessages)
        composeRule.onNodeWithText("@Programador crie endpoint REST").assertIsDisplayed()
    }

    @Test
    fun chatScreen_displaysOrchestratorStatus_andSendsMessageViaPersistentBottomBar() {
        val dispatched = mutableListOf<String>()
        var probed = false
        val session = ChatSessionEntity(
            id = "sess-1",
            title = "Comando Central n8n",
            createdAt = 1_700_000_000_000L,
            updatedAt = 1_700_000_000_000L,
            modeUsed = "HYBRID",
            activeAgentsCsv = "Orquestrador,Pesquisador",
            syncStatus = "SYNCED"
        )
        val initialMessages = mutableStateListOf(
            ChatMessageEntity(
                id = "msg-1",
                sessionId = "sess-1",
                role = "agi",
                content = "Orquestrador pronto para receber objetivos.",
                agentsInvolvedCsv = "Orquestrador",
                modelUsed = "gemini-2.5-pro",
                executionMode = "HYBRID",
                timestamp = 1_700_000_001_000L
            )
        )

        composeRule.setContent {
            AgiMobileTheme {
                ChatScreen(
                    settings = AgiSettingsState(intelligenceMode = IntelligenceMode.HYBRID),
                    sessions = listOf(session),
                    activeSessionId = session.id,
                    messages = initialMessages,
                    pendingAttachments = emptyList(),
                    operationalStage = OperationalStage.IDLE,
                    activeAgentNames = listOf("Orquestrador", "Pesquisador"),
                    backendStatus = BackendProbeResult(
                        reachable = true,
                        httpCode = 200,
                        latencyMs = 42L,
                        orchestratorStatus = "Online",
                        n8nStatus = "Conectado"
                    ),
                    activeModelLabel = "gemini-2.5-pro",
                    onProbeBackend = { probed = true },
                    onSendMessage = { text ->
                        dispatched.add(text)
                        initialMessages.add(
                            ChatMessageEntity(
                                id = "msg-user-${initialMessages.size}",
                                sessionId = session.id,
                                role = "user",
                                content = text,
                                timestamp = 1_700_000_002_000L
                            )
                        )
                    },
                    onCancelOperation = {},
                    onSelectSession = {},
                    onNewSession = {},
                    onDeleteSession = {},
                    onAddAttachment = {},
                    onRemoveAttachment = {},
                    onReadDocumentPreview = { "" },
                    onToggleTts = {},
                    onPostBanner = {}
                )
            }
        }

        composeRule.waitForIdle()
        composeRule.onNodeWithTag("chat_orchestrator_status_bar").assertIsDisplayed()
        composeRule.onNodeWithText("Orquestrador: Online (42ms)").assertIsDisplayed()
        composeRule.onNodeWithTag("chat_message_list").assertIsDisplayed()
        composeRule.onNodeWithText("Orquestrador pronto para receber objetivos.").assertIsDisplayed()
        composeRule.onNodeWithTag("chat_bottom_composer").assertIsDisplayed()
        composeRule.onNodeWithText("Enviar").assertIsDisplayed()

        composeRule.onNodeWithTag("chat_probe_backend_button").performClick()
        assertTrue(probed)

        composeRule.onNodeWithTag("chat_input_field").performTextInput("Executar pipeline n8n")
        composeRule.onNodeWithTag("chat_send_button").assertIsEnabled().performClick()
        composeRule.waitForIdle()

        assertEquals(listOf("Executar pipeline n8n"), dispatched)
        composeRule.onNodeWithText("Executar pipeline n8n").assertIsDisplayed()
    }
}
