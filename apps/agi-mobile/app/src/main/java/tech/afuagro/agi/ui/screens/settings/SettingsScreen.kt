package tech.afuagro.agi.ui.screens.settings

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.filled.CleaningServices
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.SyncConflictStrategy
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.ui.components.AdminAuthorizationDialog
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.CrimsonAlert
import tech.afuagro.agi.ui.theme.ThemeMode
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    settings: AgiSettingsState,
    verifyAdminPin: suspend (String) -> Boolean,
    onBack: () -> Unit,
    onSaveEndpoints: (
        agiUrl: String,
        n8nUrl: String,
        orchPath: String,
        statusPath: String,
        syncPath: String,
        routerPath: String,
        token: String?
    ) -> Unit,
    onProbeConnection: () -> Unit,
    onSetThemeMode: (ThemeMode) -> Unit,
    onSetStreaming: (Boolean) -> Unit,
    onSetEnforceHttps: (Boolean) -> Unit,
    onSetNotifications: (Boolean) -> Unit,
    onSetSyncSettings: (Int, SyncConflictStrategy, Boolean) -> Unit,
    onSetAdminPin: (String) -> Unit,
    onClearCredentials: () -> Unit,
    onClearCache: () -> Unit,
    onAfuLogin: (apiBaseUrl: String, email: String, password: String) -> Unit = { _, _, _ -> },
    onRefreshAfuContext: () -> Unit = {}
) {
    val scope = rememberCoroutineScope()
    var agiUrl by remember(settings.agiBackendUrl) { mutableStateOf(settings.agiBackendUrl) }
    var n8nUrl by remember(settings.n8nBaseUrl) { mutableStateOf(settings.n8nBaseUrl) }
    var orchPath by remember(settings.orchestratorWebhookPath) { mutableStateOf(settings.orchestratorWebhookPath) }
    var statusPath by remember(settings.statusWebhookPath) { mutableStateOf(settings.statusWebhookPath) }
    var syncPath by remember(settings.syncWebhookPath) { mutableStateOf(settings.syncWebhookPath) }
    var routerPath by remember(settings.routerWebhookPath) { mutableStateOf(settings.routerWebhookPath) }
    var newToken by remember { mutableStateOf("") }
    var newPin by remember { mutableStateOf("") }
    var syncIntervalText by remember(settings.autoSyncIntervalMinutes) { mutableStateOf(settings.autoSyncIntervalMinutes.toString()) }
    var afuApiUrl by remember(settings.afuApiBaseUrl) { mutableStateOf(settings.afuApiBaseUrl.ifBlank { settings.plantApiBaseUrl }) }
    var afuEmail by remember(settings.afuUserEmail) { mutableStateOf(settings.afuUserEmail) }
    var afuPassword by remember { mutableStateOf("") }

    var showGuideDialog by remember { mutableStateOf(false) }
    var pendingCriticalAction by remember { mutableStateOf<(() -> Unit)?>(null) }
    var criticalTitle by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        AgiSubScreenTopBar(
            title = "CONFIGURAÇÕES",
            subtitle = "Infraestrutura n8n, Segurança & Preferências",
            onBack = onBack,
            actions = {
                IconButton(
                    onClick = { showGuideDialog = true },
                    modifier = Modifier.testTag("setup_guide_button")
                ) {
                    Icon(Icons.AutoMirrored.Filled.HelpOutline, contentDescription = "Guia de conexão n8n")
                }
            }
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Conta AFU Agro (JWT) — agent interface
            item {
                AgiGlassCard(highlighted = settings.afuLoggedIn) {
                    Text("CONTA AFU AGRO", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Login com a mesma conta do AFU Agro. JWT no dispositivo; IA permanece no servidor.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = afuApiUrl,
                        onValueChange = { afuApiUrl = it },
                        label = { Text("URL API AFU") },
                        placeholder = { Text("https://api.afuagro.com.br ou http://10.0.2.2:3000") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("settings_afu_api_url")
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = afuEmail,
                        onValueChange = { afuEmail = it },
                        label = { Text("E-mail AFU") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("settings_afu_email")
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = afuPassword,
                        onValueChange = { afuPassword = it },
                        label = { Text("Senha") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("settings_afu_password")
                    )
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = { onAfuLogin(afuApiUrl, afuEmail, afuPassword) },
                            modifier = Modifier.testTag("settings_afu_login_button")
                        ) { Text(if (settings.afuLoggedIn) "Reautenticar" else "Entrar no AFU") }
                        OutlinedButton(onClick = onRefreshAfuContext) { Text("Atualizar fazenda") }
                    }
                    if (settings.afuLoggedIn) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "${settings.afuUserName.ifBlank { settings.afuUserEmail }} • ${settings.afuOrganizationName.ifBlank { "sem org" }} • ${settings.afuPropriedadeName.ifBlank { "sem propriedade" }}",
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                }
            }

            // Backend & n8n Server Section
            item {
                AgiGlassCard(highlighted = true) {
                    Text("SERVIDOR AGI & N8N", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = agiUrl,
                        onValueChange = { agiUrl = it },
                        label = { Text("Endereço do AGI Backend (HTTPS)") },
                        placeholder = { Text("https://agi.seudominio.com") },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("settings_agi_url_input")
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = n8nUrl,
                        onValueChange = { n8nUrl = it },
                        label = { Text("URL Base do n8n") },
                        placeholder = { Text("https://n8n.seudominio.com") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = orchPath,
                        onValueChange = { orchPath = it },
                        label = { Text("Webhook Orquestrador") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = statusPath,
                        onValueChange = { statusPath = it },
                        label = { Text("Endpoint de Status") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = syncPath,
                        onValueChange = { syncPath = it },
                        label = { Text("Webhook Sincronização Memória") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = routerPath,
                        onValueChange = { routerPath = it },
                        label = { Text("Webhook API Router") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = newToken,
                        onValueChange = { newToken = it },
                        label = { Text("Token Bearer (Atual: ${settings.maskedAuthToken})") },
                        placeholder = { Text("Deixe em branco para manter") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(12.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                onSaveEndpoints(
                                    agiUrl, n8nUrl, orchPath, statusPath, syncPath, routerPath,
                                    newToken.takeIf { it.isNotBlank() }
                                )
                                newToken = ""
                            },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("save_server_settings_button")
                        ) {
                            Icon(Icons.Default.Save, contentDescription = null)
                            Spacer(Modifier.width(6.dp))
                            Text("Salvar")
                        }
                        OutlinedButton(
                            onClick = onProbeConnection,
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                        ) {
                            Text("Testar Conexão")
                        }
                    }
                }
            }

            // Theme & Chat Preferences
            item {
                AgiGlassCard {
                    Text("INTERFACE & CHAT", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    Text("Tema Visual", style = MaterialTheme.typography.bodyMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        ThemeMode.entries.forEach { mode ->
                            FilterChip(
                                selected = settings.themeMode == mode,
                                onClick = { onSetThemeMode(mode) },
                                label = {
                                    Text(
                                        when (mode) {
                                            ThemeMode.DARK -> "Escuro"
                                            ThemeMode.LIGHT -> "Claro"
                                            ThemeMode.SYSTEM -> "Sistema"
                                        }
                                    )
                                }
                            )
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Streaming SSE em Tempo Real", style = MaterialTheme.typography.bodyMedium)
                        Switch(checked = settings.streamingEnabled, onCheckedChange = onSetStreaming)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Notificações de Execução", style = MaterialTheme.typography.bodyMedium)
                        Switch(checked = settings.notificationsEnabled, onCheckedChange = onSetNotifications)
                    }
                }
            }

            // Sync Policy
            item {
                AgiGlassCard {
                    Text("SINCRONIZAÇÃO & CONFLITOS", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = syncIntervalText,
                        onValueChange = { syncIntervalText = it },
                        label = { Text("Intervalo periódico WorkManager (min, 0 = manual)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Text("Resolução de Conflitos", style = MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        SyncConflictStrategy.entries.forEach { strat ->
                            FilterChip(
                                selected = settings.conflictStrategy == strat,
                                onClick = {
                                    onSetSyncSettings(
                                        syncIntervalText.toIntOrNull() ?: 30,
                                        strat,
                                        settings.wifiOnlySync
                                    )
                                },
                                label = { Text(strat.label) }
                            )
                        }
                    }
                }
            }

            // Security & Privacy
            item {
                AgiGlassCard {
                    Text("SEGURANÇA, HTTPS & PRIVACIDADE", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("HTTPS Obrigatório em Produção", style = MaterialTheme.typography.bodyMedium)
                            Text("Bloqueia conexões HTTP externas não criptografadas", style = MaterialTheme.typography.labelSmall, color = AmberPulse)
                        }
                        Switch(checked = settings.enforceHttpsOnly, onCheckedChange = onSetEnforceHttps)
                    }
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = newPin,
                        onValueChange = { newPin = it },
                        label = { Text(if (settings.hasAdminPin) "Alterar PIN Administrador (Ativo)" else "Definir PIN Administrador") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = {
                            onSetAdminPin(newPin)
                            newPin = ""
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                    ) {
                        Text(if (newPin.isBlank()) "Remover PIN" else "Salvar PIN de Administrador")
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = {
                                criticalTitle = "Limpar Cache e Logs Locais"
                                pendingCriticalAction = onClearCache
                            },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                        ) {
                            Icon(Icons.Default.CleaningServices, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text("Limpar Cache")
                        }
                        Button(
                            onClick = {
                                criticalTitle = "Logout Seguro (Remover Credenciais)"
                                pendingCriticalAction = onClearCredentials
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonAlert),
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                        ) {
                            Icon(Icons.Default.Logout, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text("Logout Seguro")
                        }
                    }
                }
            }
        }
    }

    if (showGuideDialog) {
        AlertDialog(
            onDismissRequest = { showGuideDialog = false },
            title = { Text("Guia de Integração n8n & AGI Backend") },
            text = {
                Column(
                    modifier = Modifier.verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        "1. Arquitetura Separada: O APK atua como interface Android. O n8n executa a orquestração multiagente e o AGI Backend gerencia memória vetorial e chamadas seguras aos modelos.",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        "2. Endpoint Orquestrador (POST):\nRecebe JSON { sessionId, message, mode, routingStrategy, preferredModel, contextMemories, attachments } e retorna { output, model, agents, tasks, tokensUsed } ou stream SSE.",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        "3. Endpoint Status (GET):\nRetorna HTTP 200 com { orchestratorStatus: \"Online\", n8nStatus: \"Conectado\" }.",
                        style = MaterialTheme.typography.labelSmall
                    )
                    Text(
                        "4. Segurança: Use HTTPS com certificado válido e Bearer Token configurado em Configurações > Servidor AGI.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            },
            confirmButton = {
                Button(onClick = { showGuideDialog = false }) { Text("Entendido") }
            }
        )
    }

    pendingCriticalAction?.let { action ->
        AdminAuthorizationDialog(
            title = criticalTitle,
            description = "Esta ação crítica requer autorização explícita do administrador.",
            hasAdminPin = settings.hasAdminPin,
            onDismiss = { pendingCriticalAction = null },
            onAuthorize = { pin, onFailed ->
                scope.launch {
                    if (verifyAdminPin(pin)) {
                        action()
                        pendingCriticalAction = null
                    } else {
                        onFailed()
                    }
                }
            }
        )
    }
}
