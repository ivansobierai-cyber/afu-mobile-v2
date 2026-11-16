package tech.afuagro.agi.ui.screens.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AddComment
import androidx.compose.material.icons.filled.AltRoute
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.R
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.OperationalStage
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.ChatSessionEntity
import tech.afuagro.agi.data.local.LocalModelEntity
import tech.afuagro.agi.data.local.SyncQueueEntity
import tech.afuagro.agi.data.local.TelemetryLogEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.network.BackendProbeResult
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.HybridModeSelector
import tech.afuagro.agi.ui.components.OperationalPipelineCard
import tech.afuagro.agi.ui.components.StatusPulseDot
import tech.afuagro.agi.ui.navigation.AgiRoute
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.NeonMint
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(
    settings: AgiSettingsState,
    backendStatus: BackendProbeResult,
    isProbingBackend: Boolean,
    telemetry: HardwareTelemetry,
    operationalStage: OperationalStage,
    agents: List<AgentEntity>,
    sessions: List<ChatSessionEntity>,
    providers: List<ApiProviderEntity>,
    localModels: List<LocalModelEntity>,
    syncQueue: List<SyncQueueEntity>,
    telemetryLogs: List<TelemetryLogEntity>,
    onSelectMode: (IntelligenceMode) -> Unit,
    onProbeBackend: () -> Unit,
    onTriggerSync: () -> Unit,
    onQuickSend: (String) -> Unit,
    onStartNewChat: () -> Unit,
    onOpenSession: (String) -> Unit,
    onNavigate: (AgiRoute) -> Unit,
    onStopExecution: () -> Unit
) {
    var quickInput by remember { mutableStateOf("") }
    val activeLocalModel = localModels.firstOrNull { it.isActive }
    val primaryCloudModel = providers.filter { it.isEnabled }.minByOrNull { it.priorityOrder }?.defaultModel ?: "Não definido"
    val displayedModel = when (settings.intelligenceMode) {
        IntelligenceMode.LOCAL -> activeLocalModel?.name ?: "AGI Local Core"
        IntelligenceMode.CLOUD -> primaryCloudModel
        IntelligenceMode.AUTO, IntelligenceMode.HYBRID ->
            if (backendStatus.reachable && !settings.cloudDisabledCompletely) primaryCloudModel else (activeLocalModel?.name ?: "AGI Local Core")
    }
    val cloudTokensTotal = telemetryLogs.sumOf { it.tokensUsed }
    val pendingSyncCount = syncQueue.count { it.status == "PENDING" || it.status == "CONFLICT" || it.status == "ERROR" }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Hero Command Core Banner
        item {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.large,
                color = MaterialTheme.colorScheme.surface,
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    MaterialTheme.colorScheme.primary.copy(alpha = 0.45f)
                )
            ) {
                Box(modifier = Modifier.fillMaxWidth()) {
                    Image(
                        painter = painterResource(id = R.drawable.img_agi_core_banner),
                        contentDescription = "Núcleo AGI",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .matchParentSize()
                            .alpha(0.32f)
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .background(
                                Brush.horizontalGradient(
                                    listOf(
                                        MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                                        MaterialTheme.colorScheme.surface.copy(alpha = 0.70f)
                                    )
                                )
                            )
                    )
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                Image(
                                    painter = painterResource(id = R.drawable.img_agi_avatar),
                                    contentDescription = "Avatar AGI Mobile",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                )
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "AGI MOBILE",
                                        style = MaterialTheme.typography.titleLarge,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "CENTRAL DE COMANDO MULTIAGENTE",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                            IconButton(
                                onClick = onProbeBackend,
                                enabled = !isProbingBackend,
                                modifier = Modifier.testTag("probe_backend_button")
                            ) {
                                if (isProbingBackend) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = "Verificar conexão com núcleo",
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }

                        // Connection + Orchestrator + Network Indicators
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            StatusPill(
                                label = if (backendStatus.reachable) "Núcleo Online (${backendStatus.latencyMs}ms)" else "Núcleo: ${backendStatus.orchestratorStatus}",
                                isOk = backendStatus.reachable,
                                modifier = Modifier.weight(1f)
                            )
                            StatusPill(
                                label = "n8n: ${backendStatus.n8nStatus}",
                                isOk = backendStatus.reachable,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Active Model + Telemetry Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "MODELO ATIVO",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = displayedModel,
                                    style = MaterialTheme.typography.titleMedium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (telemetry.isOnline) Icons.Default.Wifi else Icons.Default.WifiOff,
                                    contentDescription = "Estado da rede",
                                    tint = if (telemetry.isOnline) NeonMint else AmberPulse,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    text = when {
                                        !telemetry.isOnline -> "Offline"
                                        telemetry.isWifi -> "Wi-Fi"
                                        else -> "Dados Móveis"
                                    },
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }
                    }
                }
            }
        }

        // 2. Hybrid Intelligence Router Selector
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "HYBRID INTELLIGENCE ROUTER",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Estratégia: ${settings.routingStrategy.label}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                HybridModeSelector(
                    selectedMode = settings.intelligenceMode,
                    cloudBlocked = settings.cloudDisabledCompletely,
                    onModeSelected = onSelectMode
                )
            }
        }

        // 3. Active Operational Indicator
        item {
            OperationalPipelineCard(
                stage = operationalStage,
                onCancel = onStopExecution
            )
        }

        // 4. Hybrid Hardware & Sync Strip
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AgiGlassCard(modifier = Modifier.weight(1f)) {
                    Text("RECURSOS LOCAIS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "${telemetry.availableRamMb} MB livres",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "CPU ${telemetry.cpuCores} cores • ${"%.1f".format(telemetry.temperatureCelsius)}°C",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                AgiGlassCard(
                    modifier = Modifier.weight(1f),
                    onClick = onTriggerSync
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("SINCRONIZAÇÃO", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Icon(
                            imageVector = Icons.Default.Sync,
                            contentDescription = "Sincronizar agora",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = if (pendingSyncCount == 0) "Atualizado" else "$pendingSyncCount pendente(s)",
                        style = MaterialTheme.typography.titleMedium,
                        color = if (pendingSyncCount == 0) NeonMint else AmberPulse
                    )
                    Text(
                        text = "$cloudTokensTotal tokens rastreados",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // 5. Main Communication Input + New Conversation
        item {
            AgiGlassCard(highlighted = true) {
                Text(
                    text = "COMANDO DIRETO",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = quickInput,
                    onValueChange = { quickInput = it },
                    placeholder = { Text("Descreva um objetivo ou pergunte à AGI…") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("home_command_input"),
                    maxLines = 3
                )
                Spacer(Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onStartNewChat,
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 48.dp)
                            .testTag("new_conversation_button")
                    ) {
                        Icon(Icons.Default.AddComment, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Nova Conversa", maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Button(
                        onClick = {
                            if (quickInput.isNotBlank()) {
                                val text = quickInput
                                quickInput = ""
                                onQuickSend(text)
                            }
                        },
                        enabled = quickInput.isNotBlank(),
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 48.dp)
                            .testTag("home_send_button")
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Executar", maxLines = 1)
                    }
                }
            }
        }

        // 6. Active Agents Strip
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ATIVIDADE DOS AGENTES (${agents.count { it.isEnabled }}/${agents.size})",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Ver todos",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier
                            .clickable { onNavigate(AgiRoute.Agents) }
                            .padding(4.dp)
                    )
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(agents, key = { it.id }) { agent ->
                        AssistChip(
                            onClick = { onNavigate(AgiRoute.AgentDetail(agent.id)) },
                            label = { Text(agent.name) },
                            leadingIcon = {
                                StatusPulseDot(
                                    isActive = agent.isEnabled,
                                    activeColor = NeonMint,
                                    inactiveColor = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        )
                    }
                }
            }
        }

        // 7. Quick Access Modules
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "ACESSO RÁPIDO",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    QuickActionTile("API Router", Icons.Default.AltRoute, Modifier.weight(1f)) {
                        onNavigate(AgiRoute.ApiRouter)
                    }
                    QuickActionTile("Intelligence", Icons.Default.Hub, Modifier.weight(1f)) {
                        onNavigate(AgiRoute.IntelligenceManager)
                    }
                    QuickActionTile("Memória", Icons.Default.Memory, Modifier.weight(1f)) {
                        onNavigate(AgiRoute.Memory)
                    }
                    QuickActionTile("Monitor", Icons.Default.Analytics, Modifier.weight(1f)) {
                        onNavigate(AgiRoute.Dashboard)
                    }
                    QuickActionTile("Config", Icons.Default.Settings, Modifier.weight(1f)) {
                        onNavigate(AgiRoute.Settings)
                    }
                }
            }
        }

        // 8. Recent Conversations
        item {
            Text(
                text = "CONVERSAS RECENTES",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary
            )
        }

        if (sessions.isEmpty()) {
            item {
                AgiGlassCard(onClick = onStartNewChat) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Psychology,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Nenhuma sessão registrada ainda", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Toque para iniciar sua primeira conversa com a AGI.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        } else {
            items(sessions.take(5), key = { it.id }) { session ->
                val dateStr = remember(session.updatedAt) {
                    SimpleDateFormat("dd/MM HH:mm", Locale.getDefault()).format(Date(session.updatedAt))
                }
                AgiGlassCard(onClick = { onOpenSession(session.id) }) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = session.title,
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Modo ${session.modeUsed} • ${session.syncStatus}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Text(
                            text = dateStr,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusPill(
    label: String,
    isOk: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.8f),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isOk) NeonMint.copy(alpha = 0.5f) else AmberPulse.copy(alpha = 0.45f)
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            StatusPulseDot(isActive = isOk, activeColor = NeonMint, inactiveColor = AmberPulse)
            Spacer(Modifier.width(6.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun QuickActionTile(
    label: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier
            .clip(MaterialTheme.shapes.small)
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        FilledTonalIconButton(
            onClick = onClick,
            modifier = Modifier.size(48.dp)
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = MaterialTheme.colorScheme.primary)
        }
        Spacer(Modifier.height(4.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
