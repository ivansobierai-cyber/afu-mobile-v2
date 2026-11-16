package tech.afuagro.agi.ui.screens.agents

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.ui.components.AdminAuthorizationDialog
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import tech.afuagro.agi.ui.components.StatusPulseDot
import tech.afuagro.agi.ui.theme.NeonMint
import kotlinx.coroutines.launch

@Composable
fun AgentsScreen(
    agents: List<AgentEntity>,
    availableModels: List<String>,
    hasAdminPin: Boolean,
    verifyAdminPin: suspend (String) -> Boolean,
    onToggleAgent: (String, Boolean) -> Unit,
    onOpenAgentDetail: (String) -> Unit,
    onCreateCustomAgent: (name: String, specialty: String, description: String, modelId: String, toolsCsv: String) -> Unit
) {
    var showCreateDialog by remember { mutableStateOf(false) }
    var pendingCreateData by remember { mutableStateOf<CreateAgentPayload?>(null) }
    val scope = rememberCoroutineScope()

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                modifier = Modifier.testTag("create_agent_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Criar novo subagente")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Column {
                    Text("SUBAGENTES DA AGI", style = MaterialTheme.typography.headlineMedium)
                    Text(
                        text = "${agents.count { it.isEnabled }} de ${agents.size} agentes operacionais",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            items(agents, key = { it.id }) { agent ->
                AgiGlassCard(
                    highlighted = agent.isEnabled,
                    onClick = { onOpenAgentDetail(agent.id) },
                    modifier = Modifier.testTag("agent_card_${agent.id}")
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            StatusPulseDot(
                                isActive = agent.isEnabled,
                                activeColor = NeonMint,
                                inactiveColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(agent.name, style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = "${agent.id} • ${agent.specialty}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        Switch(
                            checked = agent.isEnabled,
                            onCheckedChange = { onToggleAgent(agent.id, it) },
                            modifier = Modifier.testTag("agent_switch_${agent.id}")
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = agent.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Modelo: ${agent.modelId}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                        Text(
                            text = "Execuções: ${agent.tasksCompleted} • ${agent.avgLatencyMs}ms",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateAgentDialog(
            availableModels = availableModels,
            onDismiss = { showCreateDialog = false },
            onSubmit = { payload ->
                showCreateDialog = false
                pendingCreateData = payload
            }
        )
    }

    pendingCreateData?.let { payload ->
        AdminAuthorizationDialog(
            title = "Autorizar Novo Subagente",
            description = "Criar o agente '${payload.name}' (${payload.specialty}) requer confirmação do administrador para registro no orquestrador.",
            hasAdminPin = hasAdminPin,
            onDismiss = { pendingCreateData = null },
            onAuthorize = { pin, onFailed ->
                scope.launch {
                    if (verifyAdminPin(pin)) {
                        onCreateCustomAgent(
                            payload.name,
                            payload.specialty,
                            payload.description,
                            payload.modelId,
                            payload.toolsCsv
                        )
                        pendingCreateData = null
                    } else {
                        onFailed()
                    }
                }
            }
        )
    }
}

private data class CreateAgentPayload(
    val name: String,
    val specialty: String,
    val description: String,
    val modelId: String,
    val toolsCsv: String
)

@Composable
private fun CreateAgentDialog(
    availableModels: List<String>,
    onDismiss: () -> Unit,
    onSubmit: (CreateAgentPayload) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var specialty by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var modelId by remember { mutableStateOf(availableModels.firstOrNull() ?: "qwen-plus") }
    var toolsCsv by remember { mutableStateOf("n8n-webhook,memory-read") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Novo Subagente AGI") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome do Agente") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = specialty,
                    onValueChange = { specialty = it },
                    label = { Text("Especialidade") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Descrição e objetivo") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = modelId,
                    onValueChange = { modelId = it },
                    label = { Text("Modelo de IA") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = toolsCsv,
                    onValueChange = { toolsCsv = it },
                    label = { Text("Ferramentas (separadas por vírgula)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && specialty.isNotBlank()) {
                        onSubmit(CreateAgentPayload(name, specialty, description, modelId, toolsCsv))
                    }
                },
                enabled = name.isNotBlank() && specialty.isNotBlank(),
                modifier = Modifier.heightIn(min = 48.dp)
            ) {
                Text("Prosseguir")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, modifier = Modifier.heightIn(min = 48.dp)) {
                Text("Cancelar")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AgentDetailScreen(
    agent: AgentEntity?,
    tasks: List<TaskEntity>,
    providers: List<ApiProviderEntity>,
    onBack: () -> Unit,
    onToggleEnabled: (Boolean) -> Unit,
    onSaveConfig: (specialty: String, modelId: String, permissionsCsv: String) -> Unit,
    onOpenPlantConsole: (() -> Unit)? = null
) {
    if (agent == null) {
        Column(modifier = Modifier.fillMaxSize()) {
            AgiSubScreenTopBar(title = "Agente", onBack = onBack)
            Text("Agente não encontrado.", modifier = Modifier.padding(16.dp))
        }
        return
    }

    var specialty by remember(agent.id) { mutableStateOf(agent.specialty) }
    var modelId by remember(agent.id) { mutableStateOf(agent.modelId) }
    var permissionsCsv by remember(agent.id) { mutableStateOf(agent.permissionsCsv) }
    var modelMenuExpanded by remember { mutableStateOf(false) }

    val modelOptions = remember(providers) {
        providers.flatMap { it.availableModelsCsv.split(",") }
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .distinct()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AgiSubScreenTopBar(
            title = agent.name,
            subtitle = "ID: ${agent.id} • ${agent.status}",
            onBack = onBack
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                AgiGlassCard(highlighted = agent.isEnabled) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Status Operacional", style = MaterialTheme.typography.titleMedium)
                            Text(
                                text = if (agent.isEnabled) "Disponível para delegação do Orquestrador" else "Pausado manualmente",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(checked = agent.isEnabled, onCheckedChange = onToggleEnabled)
                    }
                    Spacer(Modifier.height(10.dp))
                    Text(agent.description, style = MaterialTheme.typography.bodyMedium)
                    if (agent.id == "plant-09" && onOpenPlantConsole != null) {
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = onOpenPlantConsole,
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = 48.dp)
                                .testTag("open_plant_healthy_console_button")
                        ) {
                            Icon(Icons.Default.Eco, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Abrir Console Fitotécnico (API & Dados Brutos)")
                        }
                    }
                }
            }

            item {
                AgiGlassCard {
                    Text("INDICADORES DE DESEMPENHO", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text("${agent.tasksCompleted}", style = MaterialTheme.typography.titleLarge)
                            Text("Concluídas", style = MaterialTheme.typography.labelSmall)
                        }
                        Column {
                            Text("${"%.1f".format(agent.successRate)}%", style = MaterialTheme.typography.titleLarge, color = NeonMint)
                            Text("Taxa de Sucesso", style = MaterialTheme.typography.labelSmall)
                        }
                        Column {
                            Text("${agent.avgLatencyMs} ms", style = MaterialTheme.typography.titleLarge)
                            Text("Latência Média", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }

            item {
                AgiGlassCard {
                    Text("FERRAMENTAS DISPONÍVEIS", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(8.dp))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        agent.toolsCsv.split(",").filter { it.isNotBlank() }.forEach { tool ->
                            AssistChip(
                                onClick = {},
                                label = { Text(tool.trim()) },
                                leadingIcon = { Icon(Icons.Default.Build, contentDescription = null) }
                            )
                        }
                    }
                }
            }

            item {
                AgiGlassCard {
                    Text("CONFIGURAÇÃO DO AGENTE", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = specialty,
                        onValueChange = { specialty = it },
                        label = { Text("Especialidade") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(10.dp))

                    ExposedDropdownMenuBox(
                        expanded = modelMenuExpanded,
                        onExpandedChange = { modelMenuExpanded = it }
                    ) {
                        OutlinedTextField(
                            value = modelId,
                            onValueChange = { modelId = it },
                            label = { Text("Modelo de IA Atribuído") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = modelMenuExpanded) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(MenuAnchorType.PrimaryEditable)
                        )
                        ExposedDropdownMenu(
                            expanded = modelMenuExpanded,
                            onDismissRequest = { modelMenuExpanded = false }
                        ) {
                            modelOptions.forEach { opt ->
                                DropdownMenuItem(
                                    text = { Text(opt) },
                                    onClick = {
                                        modelId = opt
                                        modelMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = permissionsCsv,
                        onValueChange = { permissionsCsv = it },
                        label = { Text("Permissões (CSV)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = { onSaveConfig(specialty, modelId, permissionsCsv) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 48.dp)
                            .testTag("save_agent_config_button")
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Salvar Configuração do Agente")
                    }
                }
            }

            item {
                Text("TAREFAS ATRIBUÍDAS (${tasks.size})", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }
            if (tasks.isEmpty()) {
                item {
                    Text(
                        "Nenhuma tarefa atribuída a este agente no momento.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(tasks, key = { it.id }) { task ->
                    AgiGlassCard {
                        Text(task.title, style = MaterialTheme.typography.titleMedium)
                        Text("${task.status} • Prioridade: ${task.priority}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}
