package tech.afuagro.agi

import android.app.Application
import tech.afuagro.agi.core.security.CryptoManager
import tech.afuagro.agi.core.telemetry.DeviceTelemetryMonitor
import tech.afuagro.agi.data.local.AgiDatabase
import tech.afuagro.agi.data.preferences.AgiPreferencesRepository
import tech.afuagro.agi.data.repository.AgiApiN8nChatRemoteDataSource
import tech.afuagro.agi.data.repository.AgiRepository
import tech.afuagro.agi.data.repository.ChatRepository
import tech.afuagro.agi.data.repository.OfflineFirstChatRepository
import tech.afuagro.agi.intelligence.HybridIntelligenceRouter
import tech.afuagro.agi.intelligence.LocalInferenceEngine
import tech.afuagro.agi.network.AgiApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class AgiAppContainer(application: Application) {
    val database: AgiDatabase = AgiDatabase.getInstance(application)
    val cryptoManager = CryptoManager()
    val preferencesRepository = AgiPreferencesRepository(application, cryptoManager)
    val telemetryMonitor = DeviceTelemetryMonitor(application)
    val apiClient = AgiApiClient()
    val hybridRouter = HybridIntelligenceRouter()
    val localEngine = LocalInferenceEngine(application)
    val chatRepository: ChatRepository = OfflineFirstChatRepository(
        chatDao = database.chatDao(),
        remoteDataSource = AgiApiN8nChatRemoteDataSource(preferencesRepository, apiClient)
    )

    val repository = AgiRepository(
        context = application,
        db = database,
        preferences = preferencesRepository,
        cryptoManager = cryptoManager,
        telemetryMonitor = telemetryMonitor,
        apiClient = apiClient,
        hybridRouter = hybridRouter,
        localEngine = localEngine,
        chatRepository = chatRepository
    )
}

class AgiApplication : Application() {
    lateinit var container: AgiAppContainer
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()
        container = AgiAppContainer(this)
        appScope.launch {
            AgiDatabase.seedInitialCatalog(container.database)
            val settings = container.preferencesRepository.settingsFlow.first()
            if (!settings.cloudDisabledCompletely && settings.autoSyncIntervalMinutes >= 15) {
                container.repository.schedulePeriodicSync(
                    intervalMinutes = settings.autoSyncIntervalMinutes,
                    wifiOnly = settings.wifiOnlySync
                )
            }
        }
    }
}
