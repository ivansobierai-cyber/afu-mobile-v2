package tech.afuagro.agi

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material.icons.filled.Assignment
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material.icons.outlined.Analytics
import androidx.compose.material.icons.outlined.Assignment
import androidx.compose.material.icons.outlined.GridView
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.SmartToy
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import tech.afuagro.agi.ui.navigation.AgiRoute
import tech.afuagro.agi.ui.screens.agents.AgentDetailScreen
import tech.afuagro.agi.ui.screens.agents.AgentsScreen
import tech.afuagro.agi.ui.screens.chat.ChatScreen
import tech.afuagro.agi.ui.screens.dashboard.DashboardScreen
import tech.afuagro.agi.ui.screens.home.HomeScreen
import tech.afuagro.agi.ui.screens.intelligence.IntelligenceManagerScreen
import tech.afuagro.agi.ui.screens.memory.MemoryScreen
import tech.afuagro.agi.ui.screens.menu.MenuHubScreen
import tech.afuagro.agi.ui.screens.plant.PlantHealthyScreen
import tech.afuagro.agi.ui.screens.router.ApiRouterScreen
import tech.afuagro.agi.ui.screens.settings.SettingsScreen
import tech.afuagro.agi.ui.screens.tasks.TasksScreen
import tech.afuagro.agi.ui.theme.AgiMobileTheme
import tech.afuagro.agi.viewmodel.AgiViewModelFactory
import tech.afuagro.agi.viewmodel.ControlViewModel
import tech.afuagro.agi.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as AgiApplication
        val factory = AgiViewModelFactory(app.container.repository)
        val initialDeepLink = intent?.data

        setContent {
            val mainVm: MainViewModel = viewModel(factory = factory)
            val controlVm: ControlViewModel = viewModel(factory = factory)
            val settings by mainVm.settings.collectAsStateWithLifecycle()

            AgiMobileTheme(themeMode = settings.themeMode) {
                AgiMobileAppRoot(
                    mainVm = mainVm,
                    controlVm = controlVm,
                    initialDeepLink = initialDeepLink?.toString()
                )
            }
        }
    }
}

private data class TopNavItem(
    val route: AgiRoute,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val testTag: String
)

private val TOP_NAV_ITEMS = listOf(
    TopNavItem(AgiRoute.Home, "Início", Icons.Filled.Home, Icons.Outlined.Home, "nav_home"),
    TopNavItem(AgiRoute.Chat, "Chat", Icons.AutoMirrored.Filled.Chat, Icons.AutoMirrored.Outlined.Chat, "nav_chat"),
    TopNavItem(AgiRoute.Dashboard, "Painel", Icons.Filled.Analytics, Icons.Outlined.Analytics, "nav_dashboard"),
    TopNavItem(AgiRoute.Agents, "Agentes", Icons.Filled.SmartToy, Icons.Outlined.SmartToy, "nav_agents"),
    TopNavItem(AgiRoute.Tasks, "Tarefas", Icons.Filled.Assignment, Icons.Outlined.Assignment, "nav_tasks"),
    TopNavItem(AgiRoute.Menu, "Menu", Icons.Filled.GridView, Icons.Outlined.GridView, "nav_menu")
)

@Composable
fun AgiMobileAppRoot(
    mainVm: MainViewModel,
    controlVm: ControlViewModel,
    initialDeepLink: String? = null
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDest = backStackEntry?.destination

    val settings by mainVm.settings.collectAsStateWithLifecycle()
    val backendStatus by mainVm.backendStatus.collectAsStateWithLifecycle()
    val isProbingBackend by mainVm.isProbingBackend.collectAsStateWithLifecycle()
    val isSyncingChatHistory by mainVm.isSyncingChatHistory.collectAsStateWithLifecycle()
    val telemetry by mainVm.hardwareTelemetry.collectAsStateWithLifecycle()
    val operationalStage by mainVm.operationalStage.collectAsStateWithLifecycle()
    val agents by mainVm.agents.collectAsStateWithLifecycle()
    val sessions by mainVm.sessions.collectAsStateWithLifecycle()
    val activeSessionId by mainVm.activeSessionId.collectAsStateWithLifecycle()
    val activeMessages by mainVm.activeMessages.collectAsStateWithLifecycle()
    val pendingAttachments by mainVm.pendingAttachments.collectAsStateWithLifecycle()
    val tasks by mainVm.tasks.collectAsStateWithLifecycle()
    val providers by mainVm.providers.collectAsStateWithLifecycle()
    val localModels by mainVm.localModels.collectAsStateWithLifecycle()
    val memories by mainVm.memories.collectAsStateWithLifecycle()
    val syncQueue by mainVm.syncQueue.collectAsStateWithLifecycle()
    val telemetryLogs by mainVm.telemetryLogs.collectAsStateWithLifecycle()
    val periodicSyncStatus by mainVm.periodicSyncStatusLabel.collectAsStateWithLifecycle()

    val mainBanner by mainVm.uiBannerMessage.collectAsStateWithLifecycle()
    val controlFeedback by controlVm.statusFeedback.collectAsStateWithLifecycle()
    val testingProviderId by controlVm.testingProviderId.collectAsStateWithLifecycle()
    val isPlantAnalyzing by controlVm.isPlantAnalyzing.collectAsStateWithLifecycle()
    val plantDiagnosis by controlVm.plantDiagnosisResult.collectAsStateWithLifecycle()
    val plantAlerts by controlVm.plantMonitoringAlerts.collectAsStateWithLifecycle()
    val processedRawAgro by controlVm.processedRawAgro.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(mainBanner) {
        mainBanner?.let {
            snackbarHostState.showSnackbar(it)
            mainVm.clearBanner()
        }
    }
    LaunchedEffect(controlFeedback) {
        controlFeedback?.let {
            snackbarHostState.showSnackbar(it)
            controlVm.clearFeedback()
        }
    }



    val isTopLevelRoute = currentDest?.let { dest ->
        dest.hasRoute<AgiRoute.Home>() ||
            dest.hasRoute<AgiRoute.Chat>() ||
            dest.hasRoute<AgiRoute.Dashboard>() ||
            dest.hasRoute<AgiRoute.Agents>() ||
            dest.hasRoute<AgiRoute.Tasks>() ||
            dest.hasRoute<AgiRoute.Menu>()
    } ?: true

    val navigateTopLevel: (AgiRoute) -> Unit = { route ->
        navController.navigate(route) {
            popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    LaunchedEffect(initialDeepLink) {
        val link = initialDeepLink ?: return@LaunchedEffect
        // afuagi://dashboard | afuagi://chat | afuagi://plant | afuagi://settings
        // also accept afuagro://agi/... from AFU Agro companion deep links
        val route = when {
            link.contains("dashboard") || link.contains("painel") -> AgiRoute.Dashboard
            link.contains("plant") || link.contains("planta") -> AgiRoute.PlantHealthy
            link.contains("settings") || link.contains("config") -> AgiRoute.Settings
            link.contains("agents") || link.contains("agentes") -> AgiRoute.Agents
            link.contains("tasks") || link.contains("tarefas") -> AgiRoute.Tasks
            link.contains("chat") -> AgiRoute.Chat
            else -> null
        }
        if (route != null) {
            if (route == AgiRoute.Dashboard || route == AgiRoute.Chat ||
                route == AgiRoute.Agents || route == AgiRoute.Tasks || route == AgiRoute.Home ||
                route == AgiRoute.Menu
            ) {
                navigateTopLevel(route)
            } else {
                navController.navigate(route)
            }
        }
    }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val useRail = maxWidth >= 600.dp

        Scaffold(
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
            contentWindowInsets = WindowInsets.safeDrawing,
            bottomBar = {
                if (!useRail && isTopLevelRoute) {
                    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                        TOP_NAV_ITEMS.forEach { item ->
                            val selected = currentDest?.hasRoute(item.route::class) == true
                            NavigationBarItem(
                                selected = selected,
                                onClick = { navigateTopLevel(item.route) },
                                icon = {
                                    Icon(
                                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                        contentDescription = item.label
                                    )
                                },
                                label = { Text(item.label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                                modifier = Modifier.testTag(item.testTag)
                            )
                        }
                    }
                }
            }
        ) { innerPadding ->
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                if (useRail && isTopLevelRoute) {
                    NavigationRail(
                        containerColor = MaterialTheme.colorScheme.surface,
                        modifier = Modifier.fillMaxHeight()
                    ) {
                        TOP_NAV_ITEMS.forEach { item ->
                            val selected = currentDest?.hasRoute(item.route::class) == true
                            NavigationRailItem(
                                selected = selected,
                                onClick = { navigateTopLevel(item.route) },
                                icon = {
                                    Icon(
                                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                        contentDescription = item.label
                                    )
                                },
                                label = { Text(item.label) },
                                modifier = Modifier.testTag(item.testTag)
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                    contentAlignment = Alignment.TopCenter
                ) {
                    NavHost(
                        navController = navController,
                        startDestination = AgiRoute.Home,
                        modifier = Modifier.widthIn(max = 960.dp).fillMaxSize()
                    ) {
                        composable<AgiRoute.Home> {
                            HomeScreen(
                                settings = settings,
                                backendStatus = backendStatus,
                                isProbingBackend = isProbingBackend,
                                telemetry = telemetry,
                                operationalStage = operationalStage,
                                agents = agents,
                                sessions = sessions,
                                providers = providers,
                                localModels = localModels,
                                syncQueue = syncQueue,
                                telemetryLogs = telemetryLogs,
                                onSelectMode = mainVm::setIntelligenceMode,
                                onProbeBackend = mainVm::probeBackend,
                                onTriggerSync = mainVm::triggerManualSync,
                                onQuickSend = { prompt ->
                                    mainVm.startNewSessionAndSend(prompt)
                                    navigateTopLevel(AgiRoute.Chat)
                                },
                                onStartNewChat = {
                                    mainVm.startNewSessionAndSend(null)
                                    navigateTopLevel(AgiRoute.Chat)
                                },
                                onOpenSession = { sessionId ->
                                    mainVm.selectSession(sessionId)
                                    navigateTopLevel(AgiRoute.Chat)
                                },
                                onNavigate = { target ->
                                    when (target) {
                                        AgiRoute.Agents, AgiRoute.Tasks, AgiRoute.Chat, AgiRoute.Menu, AgiRoute.Home ->
                                            navigateTopLevel(target)
                                        else -> navController.navigate(target)
                                    }
                                },
                                onStopExecution = mainVm::cancelActiveOperation
                            )
                        }

                        composable<AgiRoute.Chat> {
                            val activeAgentNames = remember(agents) {
                                agents.filter { it.isEnabled }.map { it.name }
                            }
                            val activeModelLabel = remember(settings.intelligenceMode, providers, localModels, backendStatus) {
                                val localName = localModels.firstOrNull { it.isActive }?.name ?: "AGI Local Core"
                                val cloudName = providers.filter { it.isEnabled }.minByOrNull { it.priorityOrder }?.defaultModel ?: "Não definido"
                                when (settings.intelligenceMode) {
                                    tech.afuagro.agi.core.model.IntelligenceMode.LOCAL -> localName
                                    tech.afuagro.agi.core.model.IntelligenceMode.CLOUD -> cloudName
                                    tech.afuagro.agi.core.model.IntelligenceMode.AUTO,
                                    tech.afuagro.agi.core.model.IntelligenceMode.HYBRID ->
                                        if (backendStatus.reachable && !settings.cloudDisabledCompletely) cloudName else localName
                                }
                            }
                            ChatScreen(
                                settings = settings,
                                sessions = sessions,
                                activeSessionId = activeSessionId,
                                messages = activeMessages,
                                pendingAttachments = pendingAttachments,
                                operationalStage = operationalStage,
                                activeAgentNames = activeAgentNames,
                                backendStatus = backendStatus,
                                isProbingBackend = isProbingBackend,
                                isSyncingHistory = isSyncingChatHistory,
                                activeModelLabel = activeModelLabel,
                                onProbeBackend = mainVm::probeBackend,
                                onSendMessage = mainVm::sendChatMessage,
                                onCancelOperation = mainVm::cancelActiveOperation,
                                onSelectSession = mainVm::selectSession,
                                onNewSession = { mainVm.startNewSessionAndSend(null) },
                                onDeleteSession = mainVm::deleteSession,
                                onAddAttachment = mainVm::addAttachment,
                                onRemoveAttachment = mainVm::removeAttachment,
                                onReadDocumentPreview = mainVm.repository::readDocumentPreview,
                                onToggleTts = mainVm::toggleTts,
                                onSyncRemoteMessages = mainVm::syncActiveSessionMessages,
                                onPostBanner = mainVm::postBanner
                            )
                        }

                        composable<AgiRoute.Agents> {
                            val allModels = remember(providers) {
                                providers.flatMap { it.availableModelsCsv.split(",") }
                                    .map { it.trim() }
                                    .filter { it.isNotBlank() }
                                    .distinct()
                            }
                            AgentsScreen(
                                agents = agents,
                                availableModels = allModels,
                                hasAdminPin = settings.hasAdminPin,
                                verifyAdminPin = mainVm::verifyAdminPin,
                                onToggleAgent = controlVm::toggleAgent,
                                onOpenAgentDetail = { agentId ->
                                    navController.navigate(AgiRoute.AgentDetail(agentId))
                                },
                                onCreateCustomAgent = controlVm::createCustomAgent
                            )
                        }

                        composable<AgiRoute.AgentDetail> { entry ->
                            val route = entry.toRoute<AgiRoute.AgentDetail>()
                            val agent by controlVm.observeAgent(route.agentId).collectAsStateWithLifecycle(initialValue = null)
                            val agentTasks by controlVm.observeTasksForAgent(route.agentId).collectAsStateWithLifecycle(initialValue = emptyList())
                            AgentDetailScreen(
                                agent = agent,
                                tasks = agentTasks,
                                providers = providers,
                                onBack = { navController.popBackStack() },
                                onToggleEnabled = { enabled -> controlVm.toggleAgent(route.agentId, enabled) },
                                onSaveConfig = { spec, model, perms ->
                                    controlVm.updateAgentConfig(route.agentId, spec, model, perms)
                                },
                                onOpenPlantConsole = { navController.navigate(AgiRoute.PlantHealthy) }
                            )
                        }

                        composable<AgiRoute.Tasks> {
                            TasksScreen(
                                tasks = tasks,
                                agents = agents,
                                hasAdminPin = settings.hasAdminPin,
                                verifyAdminPin = mainVm::verifyAdminPin,
                                onCreateTask = controlVm::createTask,
                                onUpdateStatus = controlVm::updateTaskStatus,
                                onDeleteTask = controlVm::deleteTask
                            )
                        }

                        composable<AgiRoute.Menu> {
                            MenuHubScreen(
                                settings = settings,
                                telemetry = telemetry,
                                providerCount = providers.size,
                                memoryCount = memories.size,
                                pendingSyncCount = syncQueue.count { it.status != "SYNCED" },
                                onNavigate = { navController.navigate(it) }
                            )
                        }

                        composable<AgiRoute.ApiRouter> {
                            ApiRouterScreen(
                                settings = settings,
                                providers = providers,
                                testingProviderId = testingProviderId,
                                onBack = { navController.popBackStack() },
                                onSelectStrategy = controlVm::setRoutingStrategy,
                                onMovePriority = controlVm::moveProviderPriority,
                                onTestProvider = controlVm::testProvider,
                                onSaveProvider = controlVm::saveProviderConfig
                            )
                        }

                        composable<AgiRoute.IntelligenceManager> {
                            IntelligenceManagerScreen(
                                settings = settings,
                                telemetry = telemetry,
                                localModels = localModels,
                                syncQueue = syncQueue,
                                pendingMemorySyncCount = memories.count { it.syncStatus == "PENDING_SYNC" || it.syncStatus == "CONFLICT" },
                                periodicSyncStatus = periodicSyncStatus,
                                onBack = { navController.popBackStack() },
                                onSelectMode = mainVm::setIntelligenceMode,
                                onSetWifiOnly = controlVm::setWifiOnlySync,
                                onSetCloudDisabled = controlVm::setCloudDisabledCompletely,
                                onImportModelUri = controlVm::importLocalModel,
                                onDownloadModel = controlVm::downloadCatalogModel,
                                onActivateModel = controlVm::activateLocalModel,
                                onRemoveModel = controlVm::removeLocalModel,
                                onUpdateModelConfig = controlVm::updateLocalModelConfig,
                                onManualSync = mainVm::triggerManualSync,
                                onResolveConflict = controlVm::resolveConflict
                            )
                        }

                        composable<AgiRoute.Memory> {
                            MemoryScreen(
                                memories = memories,
                                hasAdminPin = settings.hasAdminPin,
                                verifyAdminPin = mainVm::verifyAdminPin,
                                semanticSearch = controlVm::semanticSearch,
                                exportJson = controlVm::exportMemoriesJson,
                                onAddMemory = controlVm::addMemory,
                                onDeleteMemory = controlVm::deleteMemory,
                                onPostFeedback = mainVm::postBanner,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable<AgiRoute.Dashboard> {
                            DashboardScreen(
                                settings = settings,
                                backendStatus = backendStatus,
                                agents = agents,
                                tasks = tasks,
                                providers = providers,
                                logs = telemetryLogs,
                                onProbeBackend = mainVm::probeBackend,
                                onRefreshFarmContext = controlVm::refreshAfuFarmContext,
                                onOpenAgents = { navigateTopLevel(AgiRoute.Agents) },
                                onOpenTasks = { navigateTopLevel(AgiRoute.Tasks) },
                                onOpenPlantHealthy = { navController.navigate(AgiRoute.PlantHealthy) },
                                onOpenSettings = { navController.navigate(AgiRoute.Settings) },
                                showBack = false,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable<AgiRoute.Settings> {
                            SettingsScreen(
                                settings = settings,
                                verifyAdminPin = mainVm::verifyAdminPin,
                                onBack = { navController.popBackStack() },
                                onSaveEndpoints = controlVm::saveServerEndpoints,
                                onProbeConnection = mainVm::probeBackend,
                                onSetThemeMode = controlVm::setThemeMode,
                                onSetStreaming = controlVm::setStreamingEnabled,
                                onSetEnforceHttps = controlVm::setEnforceHttpsOnly,
                                onSetNotifications = controlVm::setNotificationsEnabled,
                                onSetSyncSettings = controlVm::setSyncSettings,
                                onSetAdminPin = controlVm::setAdminPin,
                                onClearCredentials = controlVm::clearCredentials,
                                onClearCache = controlVm::clearCache,
                                onAfuLogin = controlVm::loginAfuAccount,
                                onRefreshAfuContext = controlVm::refreshAfuFarmContext
                            )
                        }

                        composable<AgiRoute.PlantHealthy> {
                            PlantHealthyScreen(
                                settings = settings,
                                isAnalyzing = isPlantAnalyzing,
                                diagnosisResult = plantDiagnosis,
                                monitoringAlerts = plantAlerts,
                                processedRawAgro = processedRawAgro,
                                memories = memories,
                                onBack = { navController.popBackStack() },
                                onSaveEndpoints = controlVm::savePlantHealthyEndpoints,
                                onAnalyzeImage = controlVm::analyzePlantImage,
                                onCleanRawData = controlVm::cleanRawAgroData,
                                onSendTelemetry = controlVm::sendNormalizedAgroTelemetry,
                                onFetchAlerts = controlVm::fetchPlantMonitoringAlerts,
                                onReadRawFileText = controlVm::readAgroRawFileText,
                                onAskAgentInChat = { prompt ->
                                    mainVm.startNewSessionAndSend(prompt)
                                    navigateTopLevel(AgiRoute.Chat)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
