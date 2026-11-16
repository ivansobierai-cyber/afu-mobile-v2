package tech.afuagro.agi.ui.screens.router

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.NetworkCheck
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.ProviderAuthType
import tech.afuagro.agi.core.model.RoutingStrategy
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.NeonMint
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun ApiRouterScreen(
    settings: AgiSettingsState,
    providers: List<ApiProviderEntity>,
    testingProviderId: String?,
    onBack: () -> Unit,
    onSelectStrategy: (RoutingStrategy) -> Unit,
    onMovePriority: (String, Int) -> Unit,
    onTestProvider: (String) -> Unit,
    onSaveProvider: (
        providerId: String,
        baseUrl: String,
        plainApiKey: String?,
        defaultModel: String,
        availableModelsCsv: String,
        authType: ProviderAuthType,
        rateLimitRpm: Int,
        costPer1kTokensUsd: Double,
        maxContextTokens: Int,
        isEnabled: Boolean
    ) -> Unit
) {
    var editingProvider by remember { mutableStateOf<ApiProviderEntity?>(null) }
    val activeProvider = remember(providers) {
        providers.filter { it.isEnabled }.minByOrNull { it.priorityOrder }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AgiSubScreenTopBar(
            title = "API ROUTER",
            subtitle = "Roteamento multi-provedor com fallback & keystore",
            onBack = onBack
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Active Visual Model Selector Summary
            item {
                AgiGlassCard(highlighted = true) {
                    Text("MODELO ATIVO NA PRIORIDADE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = activeProvider?.defaultModel ?: "Nenhum provedor ativo",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = activeProvider?.let {
                            "${it.name} • Status: ${it.connectionStatus} • Latência: ${it.lastLatencyMs}ms • Custo: $${"%.4f".format(it.costPer1kTokensUsd)}/1K tok"
                        } ?: "Ative pelo menos um provedor abaixo.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Segurança: chaves armazenadas cifradas no Android Keystore e encaminhadas via backend seguro.",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonMint
                    )
                }
            }

            // 6 Routing Strategies
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("ESTRATÉGIA DE ROTEAMENTO", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        RoutingStrategy.entries.forEach { strategy ->
                            FilterChip(
                                selected = settings.routingStrategy == strategy,
                                onClick = { onSelectStrategy(strategy) },
                                label = { Text(strategy.label) },
                                modifier = Modifier.testTag("routing_strategy_${strategy.name.lowercase()}")
                            )
                        }
                    }
                    Text(
                        text = settings.routingStrategy.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            item {
                Text("PROVEDORES & ORDEM DE PRIORIDADE", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }

            items(providers, key = { it.id }) { provider ->
                val isTesting = testingProviderId == provider.id
                val testedAt = remember(provider.lastTestedAt) {
                    if (provider.lastTestedAt == 0L) "Nunca testado"
                    else SimpleDateFormat("dd/MM HH:mm:ss", Locale.getDefault()).format(Date(provider.lastTestedAt))
                }
                val isOk = provider.connectionStatus.contains("Conectado", true) ||
                    provider.connectionStatus.contains("Online", true)

                AgiGlassCard(highlighted = provider.id == activeProvider?.id) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "#${provider.priorityOrder} ${provider.name}",
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "Modelo: ${provider.defaultModel} • Chave: ${provider.maskedKey}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(onClick = { onMovePriority(provider.id, -1) }) {
                                Icon(Icons.Default.ArrowUpward, contentDescription = "Aumentar prioridade")
                            }
                            IconButton(onClick = { onMovePriority(provider.id, +1) }) {
                                Icon(Icons.Default.ArrowDownward, contentDescription = "Reduzir prioridade")
                            }
                        }
                    }

                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "Disponibilidade: ${provider.connectionStatus} • Latência: ${provider.lastLatencyMs}ms • Tokens: ${provider.tokensConsumed}",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (isOk) NeonMint else AmberPulse
                    )
                    Text(
                        text = "Custo: $${"%.4f".format(provider.costPer1kTokensUsd)}/1K • Limite: ${provider.rateLimitRpm} RPM • Último teste: $testedAt",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { onTestProvider(provider.id) },
                            enabled = !isTesting,
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("test_provider_${provider.id}")
                        ) {
                            if (isTesting) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.NetworkCheck, contentDescription = null, modifier = Modifier.size(18.dp))
                            }
                            Spacer(Modifier.width(6.dp))
                            Text("Testar")
                        }
                        Button(
                            onClick = { editingProvider = provider },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                                .testTag("edit_provider_${provider.id}")
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Configurar")
                        }
                    }
                }
            }
        }
    }

    editingProvider?.let { prov ->
        ProviderEditSheet(
            provider = prov,
            onDismiss = { editingProvider = null },
            onSave = { baseUrl, key, defModel, availModels, authType, rpm, cost, maxCtx, enabled ->
                onSaveProvider(prov.id, baseUrl, key, defModel, availModels, authType, rpm, cost, maxCtx, enabled)
                editingProvider = null
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProviderEditSheet(
    provider: ApiProviderEntity,
    onDismiss: () -> Unit,
    onSave: (String, String?, String, String, ProviderAuthType, Int, Double, Int, Boolean) -> Unit
) {
    var baseUrl by remember { mutableStateOf(provider.baseUrl) }
    var newApiKey by remember { mutableStateOf("") }
    var defaultModel by remember { mutableStateOf(provider.defaultModel) }
    var availableModels by remember { mutableStateOf(provider.availableModelsCsv) }
    var authType by remember {
        mutableStateOf(runCatching { ProviderAuthType.valueOf(provider.authType) }.getOrDefault(ProviderAuthType.BEARER))
    }
    var rateLimit by remember { mutableStateOf(provider.rateLimitRpm.toString()) }
    var costPer1k by remember { mutableStateOf(provider.costPer1kTokensUsd.toString()) }
    var maxContext by remember { mutableStateOf(provider.maxContextTokens.toString()) }
    var enabled by remember { mutableStateOf(provider.isEnabled) }
    var authMenuOpen by remember { mutableStateOf(false) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(provider.name, style = MaterialTheme.typography.titleLarge)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Provedor Habilitado", style = MaterialTheme.typography.titleMedium)
                Switch(checked = enabled, onCheckedChange = { enabled = it })
            }
            OutlinedTextField(
                value = baseUrl,
                onValueChange = { baseUrl = it },
                label = { Text("URL Base da API") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = newApiKey,
                onValueChange = { newApiKey = it },
                label = { Text("Nova Chave de API (atual: ${provider.maskedKey})") },
                placeholder = { Text("Deixe em branco para manter a chave cifrada atual") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = defaultModel,
                onValueChange = { defaultModel = it },
                label = { Text("Modelo Padrão") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = availableModels,
                onValueChange = { availableModels = it },
                label = { Text("Modelos Disponíveis (CSV)") },
                modifier = Modifier.fillMaxWidth()
            )
            ExposedDropdownMenuBox(expanded = authMenuOpen, onExpandedChange = { authMenuOpen = it }) {
                OutlinedTextField(
                    value = authType.label,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Tipo de Autenticação") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = authMenuOpen) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                )
                ExposedDropdownMenu(expanded = authMenuOpen, onDismissRequest = { authMenuOpen = false }) {
                    ProviderAuthType.entries.forEach { t ->
                        DropdownMenuItem(
                            text = { Text(t.label) },
                            onClick = {
                                authType = t
                                authMenuOpen = false
                            }
                        )
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = rateLimit,
                    onValueChange = { rateLimit = it },
                    label = { Text("RPM") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = costPer1k,
                    onValueChange = { costPer1k = it },
                    label = { Text("Custo/1K ($)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = maxContext,
                    onValueChange = { maxContext = it },
                    label = { Text("Max Tokens") },
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }
            Button(
                onClick = {
                    onSave(
                        baseUrl,
                        newApiKey.takeIf { it.isNotBlank() },
                        defaultModel,
                        availableModels,
                        authType,
                        rateLimit.toIntOrNull() ?: 60,
                        costPer1k.toDoubleOrNull() ?: 0.0,
                        maxContext.toIntOrNull() ?: 128000,
                        enabled
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp)
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Salvar Provedor Cifrado")
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}
