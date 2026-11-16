package tech.afuagro.agi.ui.screens.memory

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import tech.afuagro.agi.core.model.MemoryCategory
import tech.afuagro.agi.core.model.MemoryLayer
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.ui.components.AdminAuthorizationDialog
import tech.afuagro.agi.ui.components.AgiGlassCard
import tech.afuagro.agi.ui.components.AgiSubScreenTopBar
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemoryScreen(
    memories: List<MemoryEntity>,
    hasAdminPin: Boolean,
    verifyAdminPin: suspend (String) -> Boolean,
    semanticSearch: (String, List<MemoryEntity>) -> List<Pair<MemoryEntity, Float>>,
    exportJson: suspend () -> String,
    onAddMemory: (MemoryLayer, MemoryCategory, String, String, String) -> Unit,
    onDeleteMemory: (String) -> Unit,
    onPostFeedback: (String) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var searchQuery by remember { mutableStateOf("") }
    var useSemanticSearch by remember { mutableStateOf(true) }
    var selectedLayer by remember { mutableStateOf<MemoryLayer?>(null) }
    var selectedCategory by remember { mutableStateOf<MemoryCategory?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }
    var deleteCandidate by remember { mutableStateOf<MemoryEntity?>(null) }

    val exportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            scope.launch {
                runCatching {
                    val json = exportJson()
                    context.contentResolver.openOutputStream(uri)?.use { out ->
                        out.write(json.toByteArray(Charsets.UTF_8))
                    }
                }.onSuccess {
                    onPostFeedback("Memórias exportadas em JSON com sucesso.")
                }.onFailure {
                    onPostFeedback("Falha ao exportar memórias: ${it.localizedMessage}")
                }
            }
        }
    }

    val displayedItems: List<Pair<MemoryEntity, Float?>> = remember(
        memories, searchQuery, useSemanticSearch, selectedLayer, selectedCategory
    ) {
        val preFiltered = memories.filter { m ->
            (selectedLayer == null || m.layer == selectedLayer?.name) &&
                (selectedCategory == null || m.category == selectedCategory?.name)
        }
        if (searchQuery.isBlank()) {
            preFiltered.map { it to null }
        } else if (useSemanticSearch) {
            semanticSearch(searchQuery, preFiltered).map { it.first to it.second }
        } else {
            val q = searchQuery.lowercase()
            preFiltered.filter {
                it.title.lowercase().contains(q) ||
                    it.content.lowercase().contains(q) ||
                    it.tagsCsv.lowercase().contains(q)
            }.map { it to null }
        }
    }

    Scaffold(
        topBar = {
            AgiSubScreenTopBar(
                title = "SISTEMA DE MEMÓRIA",
                subtitle = "${memories.size} registros • 4 camadas",
                onBack = onBack,
                actions = {
                    IconButton(
                        onClick = { exportLauncher.launch("agi_memory_export_${System.currentTimeMillis()}.json") },
                        modifier = Modifier.testTag("export_memory_button")
                    ) {
                        Icon(Icons.Default.FileDownload, contentDescription = "Exportar memória JSON")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                modifier = Modifier.testTag("add_memory_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Adicionar memória")
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
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Buscar por contexto, palavra-chave ou significado…") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("memory_search_input")
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (useSemanticSearch) "Busca Semântica (Vetor TF-IDF/Cosseno)" else "Busca Exata por Palavra-Chave",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Switch(checked = useSemanticSearch, onCheckedChange = { useSemanticSearch = it })
                    }
                }
            }

            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(
                            selected = selectedLayer == null,
                            onClick = { selectedLayer = null },
                            label = { Text("Todas Camadas") }
                        )
                    }
                    items(MemoryLayer.entries) { layer ->
                        FilterChip(
                            selected = selectedLayer == layer,
                            onClick = { selectedLayer = if (selectedLayer == layer) null else layer },
                            label = { Text(layer.label) }
                        )
                    }
                }
            }

            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(
                            selected = selectedCategory == null,
                            onClick = { selectedCategory = null },
                            label = { Text("Todas Categorias") }
                        )
                    }
                    items(MemoryCategory.entries) { cat ->
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = if (selectedCategory == cat) null else cat },
                            label = { Text(cat.label) }
                        )
                    }
                }
            }

            if (displayedItems.isEmpty()) {
                item {
                    AgiGlassCard {
                        Text("Nenhum registro encontrado", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Ajuste os filtros de camada/categoria ou registre um novo conhecimento.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                items(displayedItems, key = { it.first.id }) { (mem, simScore) ->
                    AgiGlassCard {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(mem.title, style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = buildString {
                                        append("${mem.layer} • ${mem.category} • ${mem.source} (v${mem.version})")
                                        if (simScore != null) append(" • ${(simScore * 100).toInt()}% match")
                                    },
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            IconButton(onClick = { deleteCandidate = mem }) {
                                Icon(Icons.Default.DeleteOutline, contentDescription = "Excluir registro")
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(mem.content, style = MaterialTheme.typography.bodyMedium)
                        if (mem.tagsCsv.isNotBlank()) {
                            Spacer(Modifier.height(6.dp))
                            Text("Tags: ${mem.tagsCsv}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddMemoryDialog(
            onDismiss = { showAddDialog = false },
            onSave = { layer, category, title, content, tags ->
                onAddMemory(layer, category, title, content, tags)
                showAddDialog = false
            }
        )
    }

    deleteCandidate?.let { mem ->
        AdminAuthorizationDialog(
            title = "Exclusão Autorizada de Memória",
            description = "Confirmar exclusão permanente de '${mem.title}'?",
            hasAdminPin = hasAdminPin,
            onDismiss = { deleteCandidate = null },
            onAuthorize = { pin, onFailed ->
                scope.launch {
                    if (verifyAdminPin(pin)) {
                        onDeleteMemory(mem.id)
                        deleteCandidate = null
                    } else {
                        onFailed()
                    }
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddMemoryDialog(
    onDismiss: () -> Unit,
    onSave: (MemoryLayer, MemoryCategory, String, String, String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var tags by remember { mutableStateOf("") }
    var layer by remember { mutableStateOf(MemoryLayer.LONG_TERM) }
    var category by remember { mutableStateOf(MemoryCategory.KNOWLEDGE) }
    var layerExpanded by remember { mutableStateOf(false) }
    var catExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Registrar na Memória") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                ExposedDropdownMenuBox(expanded = layerExpanded, onExpandedChange = { layerExpanded = it }) {
                    OutlinedTextField(
                        value = layer.label,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Camada") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = layerExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                    )
                    ExposedDropdownMenu(expanded = layerExpanded, onDismissRequest = { layerExpanded = false }) {
                        MemoryLayer.entries.forEach { l ->
                            DropdownMenuItem(text = { Text(l.label) }, onClick = { layer = l; layerExpanded = false })
                        }
                    }
                }
                ExposedDropdownMenuBox(expanded = catExpanded, onExpandedChange = { catExpanded = it }) {
                    OutlinedTextField(
                        value = category.label,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Categoria") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = catExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                    )
                    ExposedDropdownMenu(expanded = catExpanded, onDismissRequest = { catExpanded = false }) {
                        MemoryCategory.entries.forEach { c ->
                            DropdownMenuItem(text = { Text(c.label) }, onClick = { category = c; catExpanded = false })
                        }
                    }
                }
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Título") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = content, onValueChange = { content = it }, label = { Text("Conteúdo") }, maxLines = 4, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = tags, onValueChange = { tags = it }, label = { Text("Tags (CSV)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            Button(
                onClick = { if (title.isNotBlank() && content.isNotBlank()) onSave(layer, category, title, content, tags) },
                enabled = title.isNotBlank() && content.isNotBlank(),
                modifier = Modifier.heightIn(min = 48.dp)
            ) {
                Text("Salvar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, modifier = Modifier.heightIn(min = 48.dp)) { Text("Cancelar") }
        }
    )
}
