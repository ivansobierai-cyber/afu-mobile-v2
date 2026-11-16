package tech.afuagro.agi.ui.screens.menu

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.AltRoute
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Hub
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.navigation.AgiRoute

@Composable
fun MenuHubScreen(
    settings: AgiSettingsState,
    telemetry: HardwareTelemetry,
    providerCount: Int,
    memoryCount: Int,
    pendingSyncCount: Int,
    onNavigate: (AgiRoute) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column {
                Text("SISTEMAS & CONTROLE", style = MaterialTheme.typography.headlineMedium)
                Text(
                    text = "Modo ${settings.intelligenceMode.label} • Estratégia ${settings.routingStrategy.label}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        item {
            MenuModuleCard(
                title = "API ROUTER",
                subtitle = "$providerCount provedores cadastrados • Roteamento inteligente & fallback",
                icon = Icons.Default.AltRoute,
                tag = "menu_api_router",
                highlighted = true,
                onClick = { onNavigate(AgiRoute.ApiRouter) }
            )
        }

        item {
            MenuModuleCard(
                title = "INTELLIGENCE MANAGER",
                subtitle = "Modelos locais GGUF/ONNX, RAM (${telemetry.availableRamMb} MB livres) e sincronização ($pendingSyncCount pendente(s))",
                icon = Icons.Default.Hub,
                tag = "menu_intelligence_manager",
                onClick = { onNavigate(AgiRoute.IntelligenceManager) }
            )
        }

        item {
            MenuModuleCard(
                title = "MEMÓRIA",
                subtitle = "$memoryCount registros em 4 camadas • Busca semântica e exportação",
                icon = Icons.Default.Memory,
                tag = "menu_memory",
                onClick = { onNavigate(AgiRoute.Memory) }
            )
        }

        item {
            MenuModuleCard(
                title = "PAINEL AFU AGI",
                subtitle = "Dashboard dedicado: agentes, tarefas, monitoramento e resumo da fazenda AFU",
                icon = Icons.Default.Analytics,
                tag = "menu_dashboard",
                highlighted = true,
                onClick = { onNavigate(AgiRoute.Dashboard) }
            )
        }

        item {
            MenuModuleCard(
                title = "AGENTE PLANTA SAUDÁVEL",
                subtitle = "Fitotecnia, genomas (G1-G4), dados brutos IoT e diagnóstico por imagem via API",
                icon = Icons.Default.Eco,
                tag = "menu_plant_healthy",
                onClick = { onNavigate(AgiRoute.PlantHealthy) }
            )
        }

        item {
            MenuModuleCard(
                title = "CONFIGURAÇÕES",
                subtitle = "Servidor AGI, URL n8n, Webhooks, HTTPS, PIN Admin e guia de integração",
                icon = Icons.Default.Settings,
                tag = "menu_settings",
                onClick = { onNavigate(AgiRoute.Settings) }
            )
        }
    }
}

@Composable
private fun MenuModuleCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tag: String,
    highlighted: Boolean = false,
    onClick: () -> Unit
) {
    AgiGlassCard(
        highlighted = highlighted,
        onClick = onClick,
        modifier = Modifier.testTag(tag)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(30.dp)
                )
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(title, style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = "Abrir $title",
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
