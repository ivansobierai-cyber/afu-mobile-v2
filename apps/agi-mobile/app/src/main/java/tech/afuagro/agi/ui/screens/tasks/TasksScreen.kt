package tech.afuagro.agi.ui.screens.tasks

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountTree
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.TaskPriority
import tech.afuagro.agi.core.model.TaskStatus
import tech.afuagro.agi.data.local.AgentEntity
import tech.afuagro.agi.data.local.TaskEntity
import tech.afuagro.agi.ui.components.AdminAuthorizationDialog
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.theme.AmberPulse
import tech.afuagro.agi.ui.theme.CrimsonAlert
import tech.afuagro.agi.ui.theme.NeonMint
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    tasks: List<TaskEntity>,
    agents: List<AgentEntity>,
    hasAdminPin: Boolean,
    verifyAdminPin: suspend (String) -> Boolean,
    onCreateTask: (
        title: String,
        description: String,
        agentId: String,
        agentName: String,
        priority: TaskPriority,
        dependenciesCsv: String,
        requiresAdminAuth: Boolean
    ) -> Unit,
    onUpdateStatus: (String, TaskStatus, String) -> Unit,
    onDeleteTask: (String) -> Unit
) {
    var selectedFilter by remember { mutableStateOf<TaskStatus?>(null) }
    var isFlowView by remember { mutableStateOf(false) }
    var showCreateDialog by remember { mutableStateOf(false) }
    var inspectedTask by remember { mutableStateOf<TaskEntity?>(null) }
    var authTargetTask by remember { mutableStateOf<TaskEntity?>(null) }
    val scope = rememberCoroutineScope()

    val filteredTasks = remember(tasks, selectedFilter) {
        if (selectedFilter == null) tasks else tasks.filter { it.status == selectedFilter?.name }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                modifier = Modifier.testTag("create_task_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Nova tarefa")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("CENTRAL DE TAREFAS", style = MaterialTheme.typography.headlineMedium)
                    Text("${tasks.size} tarefas no ciclo operacional", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                }
            }

            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                SegmentedButton(
                    selected = !isFlowView,
                    onClick = { isFlowView = false },
                    shape = SegmentedButtonDefaults.itemShape(0, 2),
                    icon = { Icon(Icons.Default.ListAlt, contentDescription = null) },
                    modifier = Modifier.testTag("tasks_list_tab")
                ) {
                    Text("Lista")
                }
                SegmentedButton(
                    selected = isFlowView,
                    onClick = { isFlowView = true },
                    shape = SegmentedButtonDefaults.itemShape(1, 2),
                    icon = { Icon(Icons.Default.AccountTree, contentDescription = null) },
                    modifier = Modifier.testTag("tasks_flow_tab")
                ) {
                    Text("Fluxo de Agentes")
                }
            }

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = selectedFilter == null,
                        onClick = { selectedFilter = null },
                        label = { Text("Todas (${tasks.size})") }
                    )
                }
                items(TaskStatus.entries) { status ->
                    val count = tasks.count { it.status == status.name }
                    FilterChip(
                        selected = selectedFilter == status,
                        onClick = { selectedFilter = if (selectedFilter == status) null else status },
                        label = { Text("${status.label} ($count)") }
                    )
                }
            }

            if (isFlowView) {
                TaskExecutionFlowCanvas(
                    tasks = filteredTasks,
                    onTaskClick = { inspectedTask = it },
                    modifier = Modifier.weight(1f)
                )
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 72.dp)
                ) {
                    if (filteredTasks.isEmpty()) {
                        item {
                            AgiGlassCard {
                                Text("Nenhuma tarefa neste filtro", style = MaterialTheme.typography.titleMedium)
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Crie uma tarefa manualmente ou envie um objetivo complexo pelo Chat para o Orquestrador delegar aos subagentes.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        items(filteredTasks, key = { it.id }) { task ->
                            TaskCard(task = task, onClick = { inspectedTask = task })
                        }
                    }
                }
            }
        }
    }

    if (showCreateDialog) {
        CreateTaskDialog(
            agents = agents,
            onDismiss = { showCreateDialog = false },
            onCreate = { title, desc, agId, agName, prio, deps, reqAuth ->
                onCreateTask(title, desc, agId, agName, prio, deps, reqAuth)
                showCreateDialog = false
            }
        )
    }

    inspectedTask?.let { task ->
        ModalBottomSheet(onDismissRequest = { inspectedTask = null }) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(task.id, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    IconButton(onClick = {
                        onDeleteTask(task.id)
                        inspectedTask = null
                    }) {
                        Icon(Icons.Default.Delete, contentDescription = "Excluir tarefa", tint = CrimsonAlert)
                    }
                }
                Text(task.title, style = MaterialTheme.typography.titleLarge)
                Text(task.description.ifBlank { "Sem descrição adicional." }, style = MaterialTheme.typography.bodyMedium)
                Text("Agente responsável: ${task.agentName} • Prioridade: ${task.priority}", style = MaterialTheme.typography.labelMedium)
                if (task.dependenciesCsv.isNotBlank()) {
                    Text("Dependências: ${task.dependenciesCsv}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                }
                if (task.resultText.isNotBlank()) {
                    Text("Resultado: ${task.resultText}", style = MaterialTheme.typography.bodySmall)
                }
                if (task.auditTrail.isNotBlank()) {
                    Text("Auditoria:\n${task.auditTrail}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (task.status == TaskStatus.AWAITING_AUTH.name) {
                        Button(
                            onClick = {
                                inspectedTask = null
                                authTargetTask = task
                            },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                        ) {
                            Text("Autorizar Operação")
                        }
                    } else {
                        OutlinedButton(
                            onClick = {
                                onUpdateStatus(task.id, TaskStatus.RUNNING, "Execução iniciada")
                                inspectedTask = null
                            },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text("Executar")
                        }
                        Button(
                            onClick = {
                                onUpdateStatus(task.id, TaskStatus.COMPLETED, "Validada e concluída")
                                inspectedTask = null
                            },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(min = 48.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null)
                            Spacer(Modifier.width(4.dp))
                            Text("Concluir")
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
            }
        }
    }

    authTargetTask?.let { task ->
        AdminAuthorizationDialog(
            title = "Autorizar Tarefa Crítica",
            description = "A tarefa '${task.title}' exige autorização explícita antes de ser liberada ao agente ${task.agentName}.",
            hasAdminPin = hasAdminPin,
            onDismiss = { authTargetTask = null },
            onAuthorize = { pin, onFailed ->
                scope.launch {
                    if (verifyAdminPin(pin)) {
                        onUpdateStatus(task.id, TaskStatus.RUNNING, "Autorizada pelo administrador")
                        authTargetTask = null
                    } else {
                        onFailed()
                    }
                }
            }
        )
    }
}

@Composable
private fun TaskCard(task: TaskEntity, onClick: () -> Unit) {
    val statusColor = when (task.status) {
        TaskStatus.COMPLETED.name -> NeonMint
        TaskStatus.RUNNING.name -> MaterialTheme.colorScheme.primary
        TaskStatus.FAILED.name -> CrimsonAlert
        TaskStatus.AWAITING_AUTH.name -> AmberPulse
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    AgiGlassCard(onClick = onClick) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(task.id, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
            Text(task.status, style = MaterialTheme.typography.labelSmall, color = statusColor)
        }
        Spacer(Modifier.height(4.dp))
        Text(task.title, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Spacer(Modifier.height(4.dp))
        Text("Agente: ${task.agentName} • Prioridade: ${task.priority}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { task.progress.coerceIn(0f, 1f) },
            modifier = Modifier
                .fillMaxWidth()
                .height(5.dp),
            color = statusColor
        )
    }
}

@Composable
private fun TaskExecutionFlowCanvas(
    tasks: List<TaskEntity>,
    onTaskClick: (TaskEntity) -> Unit,
    modifier: Modifier = Modifier
) {
    val lineColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.6f)
    val grouped = remember(tasks) { tasks.groupBy { it.agentName } }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
    ) {
        if (tasks.isEmpty()) {
            AgiGlassCard(modifier = Modifier.width(320.dp)) {
                Text("Fluxo de Execução Vazio", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Quando o Orquestrador distribuir tarefas entre os subagentes, o grafo de fluxo aparecerá aqui.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            Column(
                modifier = Modifier.padding(vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                AgiGlassCard(highlighted = true, modifier = Modifier.width(260.dp)) {
                    Text("NÚCLEO ORQUESTRADOR", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                    Text("Distribuindo ${tasks.size} tarefa(s) entre ${grouped.size} agente(s)", style = MaterialTheme.typography.bodySmall)
                }

                Canvas(
                    modifier = Modifier
                        .width((grouped.size * 250).coerceAtLeast(280).dp)
                        .height(36.dp)
                ) {
                    val startX = 130.dp.toPx().coerceAtMost(size.width / 2f)
                    val branchCount = grouped.size.coerceAtLeast(1)
                    for (i in 0 until branchCount) {
                        val endX = (i * 250.dp.toPx()) + 115.dp.toPx()
                        drawLine(
                            color = lineColor,
                            start = Offset(startX, 0f),
                            end = Offset(endX.coerceAtMost(size.width), size.height),
                            strokeWidth = 3f,
                            cap = StrokeCap.Round,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f), 0f)
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    grouped.forEach { (agentName, agentTasks) ->
                        Column(
                            modifier = Modifier.width(234.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            AgiGlassCard {
                                Text(agentName.uppercase(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
                                Text("${agentTasks.size} operação(ões)", style = MaterialTheme.typography.bodySmall)
                            }
                            agentTasks.forEach { task ->
                                AgiGlassCard(onClick = { onTaskClick(task) }) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        if (task.requiresAdminAuth) {
                                            Icon(Icons.Default.Warning, contentDescription = "Requer autorização", tint = AmberPulse)
                                            Spacer(Modifier.width(4.dp))
                                        }
                                        Text(task.title, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    }
                                    Text("${task.status} (${(task.progress * 100).toInt()}%)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateTaskDialog(
    agents: List<AgentEntity>,
    onDismiss: () -> Unit,
    onCreate: (String, String, String, String, TaskPriority, String, Boolean) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedAgent by remember { mutableStateOf(agents.firstOrNull()) }
    var selectedPriority by remember { mutableStateOf(TaskPriority.MEDIUM) }
    var dependencies by remember { mutableStateOf("") }
    var requiresAuth by remember { mutableStateOf(false) }
    var agentExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Nova Tarefa Operacional") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título da tarefa") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Descrição") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                ExposedDropdownMenuBox(
                    expanded = agentExpanded,
                    onExpandedChange = { agentExpanded = it }
                ) {
                    OutlinedTextField(
                        value = selectedAgent?.name ?: "Orquestrador",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Agente Responsável") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = agentExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                    )
                    ExposedDropdownMenu(expanded = agentExpanded, onDismissRequest = { agentExpanded = false }) {
                        agents.forEach { ag ->
                            DropdownMenuItem(
                                text = { Text("${ag.name} (${ag.specialty})") },
                                onClick = {
                                    selectedAgent = ag
                                    agentExpanded = false
                                }
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = dependencies,
                    onValueChange = { dependencies = it },
                    label = { Text("IDs de dependência (opcional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { requiresAuth = !requiresAuth }
                ) {
                    Checkbox(checked = requiresAuth, onCheckedChange = { requiresAuth = it })
                    Text("Exigir autorização de administrador", style = MaterialTheme.typography.bodySmall)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onCreate(
                            title,
                            description,
                            selectedAgent?.id ?: "orch-01",
                            selectedAgent?.name ?: "Orquestrador",
                            selectedPriority,
                            dependencies,
                            requiresAuth
                        )
                    }
                },
                enabled = title.isNotBlank(),
                modifier = Modifier.heightIn(min = 48.dp)
            ) {
                Text("Criar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, modifier = Modifier.heightIn(min = 48.dp)) {
                Text("Cancelar")
            }
        }
    )
}
