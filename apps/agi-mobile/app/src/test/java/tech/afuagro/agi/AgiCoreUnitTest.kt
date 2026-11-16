package tech.afuagro.agi

import androidx.test.core.app.ApplicationProvider
import tech.afuagro.agi.core.model.HardwareTelemetry
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.MemoryCategory
import tech.afuagro.agi.core.model.MemoryLayer
import tech.afuagro.agi.core.model.ProviderAuthType
import tech.afuagro.agi.core.model.RoutingStrategy
import tech.afuagro.agi.data.local.ApiProviderEntity
import tech.afuagro.agi.data.local.MemoryEntity
import tech.afuagro.agi.data.preferences.AgiSettingsState
import tech.afuagro.agi.intelligence.HybridIntelligenceRouter
import tech.afuagro.agi.intelligence.LocalInferenceEngine
import tech.afuagro.agi.network.AgiApiClient
import androidx.room.Room
import tech.afuagro.agi.data.local.AgiDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class AgiCoreUnitTest {

    @Test
    fun hybridRouter_respectsCloudKillSwitch() {
        val router = HybridIntelligenceRouter()
        val decision = router.decide(
            prompt = "Executar workflow n8n complexo",
            settings = AgiSettingsState(
                agiBackendUrl = "https://agi.example.com",
                intelligenceMode = IntelligenceMode.CLOUD,
                cloudDisabledCompletely = true
            ),
            telemetry = HardwareTelemetry(isOnline = true, isWifi = true),
            activeLocalModel = null,
            providers = emptyList()
        )
        assertEquals(IntelligenceMode.LOCAL, decision.effectiveMode)
        assertFalse(decision.canExecuteCloud)
        assertTrue(decision.canExecuteLocal)
    }

    @Test
    fun hybridRouter_selectsCostAndSpecialtyModels() {
        val router = HybridIntelligenceRouter()
        val providers = listOf(
            ApiProviderEntity(
                id = "prov_openai",
                name = "OpenAI",
                baseUrl = "https://api.openai.com/v1",
                defaultModel = "gpt-4o",
                availableModelsCsv = "gpt-4o",
                authType = ProviderAuthType.BEARER.name,
                priorityOrder = 1,
                costPer1kTokensUsd = 0.0050,
                maxContextTokens = 128000
            ),
            ApiProviderEntity(
                id = "prov_deepseek",
                name = "DeepSeek",
                baseUrl = "https://api.deepseek.com/v1",
                defaultModel = "deepseek-chat",
                availableModelsCsv = "deepseek-chat",
                authType = ProviderAuthType.BEARER.name,
                priorityOrder = 2,
                costPer1kTokensUsd = 0.0005,
                maxContextTokens = 65536
            )
        )

        val cheapest = router.selectCloudModel("Olá", RoutingStrategy.COST, providers)
        assertEquals("deepseek-chat", cheapest)

        val codeModel = router.selectCloudModel("Gerar código Kotlin para API REST", RoutingStrategy.SPECIALTY, providers)
        assertEquals("deepseek-chat", codeModel)
    }

    @Test
    fun apiClient_enforcesHttpsInProduction() {
        val client = AgiApiClient()
        assertNotNull(client.validateUrlSecurity("http://external.example.com", enforceHttpsOnly = true))
        assertNull(client.validateUrlSecurity("https://agi.example.com", enforceHttpsOnly = true))
        assertNull(client.validateUrlSecurity("http://localhost:5678", enforceHttpsOnly = true))
    }

    @Test
    fun localEngine_semanticSearchRanksRelevantMemoryFirst() {
        val engine = LocalInferenceEngine(ApplicationProvider.getApplicationContext())
        val memories = listOf(
            MemoryEntity(
                id = "m1",
                layer = MemoryLayer.LONG_TERM.name,
                category = MemoryCategory.KNOWLEDGE.name,
                title = "Receita de Café",
                content = "Moagem média e água filtrada a 93 graus.",
                tagsCsv = "cafe"
            ),
            MemoryEntity(
                id = "m2",
                layer = MemoryLayer.OPERATIONAL.name,
                category = MemoryCategory.PROJECTS.name,
                title = "Webhook Orquestrador n8n",
                content = "O webhook /webhook/agi/orchestrator coordena os subagentes via Bearer Token.",
                tagsCsv = "n8n,webhook,agentes"
            )
        )

        val ranked = engine.semanticSearch("como configurar webhook n8n dos subagentes", memories)
        assertTrue(ranked.isNotEmpty())
        assertEquals("m2", ranked.first().first.id)
    }

    @Test
    fun roomDatabase_persistsAndQueriesLocalMemoriesByLayerAndSyncStatus() = runBlocking {
        val db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AgiDatabase::class.java
        ).allowMainThreadQueries().build()

        try {
            AgiDatabase.seedInitialCatalog(db)
            val dao = db.memoryDao()

            dao.upsertMemory(
                MemoryEntity(
                    id = "mem_test_1",
                    layer = MemoryLayer.SEMANTIC.name,
                    category = MemoryCategory.EXPERIENCES.name,
                    title = "Experiência Offline",
                    content = "Execução local validada com persistência Room.",
                    tagsCsv = "room,offline,hibrido",
                    source = "LOCAL",
                    version = 1,
                    syncStatus = "PENDING_SYNC"
                )
            )

            val semanticList = dao.observeMemoriesByLayer(MemoryLayer.SEMANTIC.name).first()
            assertEquals(1, semanticList.size)
            assertEquals("mem_test_1", semanticList.first().id)

            val pendingBefore = dao.getPendingSyncMemories()
            assertEquals(1, pendingBefore.size)

            dao.markMemorySynced("mem_test_1")
            val pendingAfter = dao.getPendingSyncMemories()
            assertTrue(pendingAfter.isEmpty())

            val keywordMatches = dao.searchMemoriesByKeyword("Room").first()
            assertEquals(1, keywordMatches.size)
        } finally {
            db.close()
        }
    }

    @Test
    fun workManager_schedulesAndCancelsPeriodicSyncWithConstraints() {
        val context = ApplicationProvider.getApplicationContext<android.content.Context>()
        val config = androidx.work.Configuration.Builder().build()
        runCatching { androidx.work.WorkManager.initialize(context, config) }

        val workManager = androidx.work.WorkManager.getInstance(context)
        val app = context as AgiApplication
        val repo = app.container.repository

        repo.schedulePeriodicSync(intervalMinutes = 30, wifiOnly = true, cloudDisabled = false)
        val enqueued = workManager.getWorkInfosForUniqueWork(tech.afuagro.agi.intelligence.AgiSyncWorker.UNIQUE_PERIODIC_WORK_NAME).get()
        assertTrue(enqueued.isNotEmpty())
        assertEquals(androidx.work.WorkInfo.State.ENQUEUED, enqueued.first().state)
        assertTrue(enqueued.first().tags.contains(tech.afuagro.agi.intelligence.AgiSyncWorker.WORK_TAG))

        repo.schedulePeriodicSync(intervalMinutes = 30, wifiOnly = true, cloudDisabled = true)
        val cancelled = workManager.getWorkInfosForUniqueWork(tech.afuagro.agi.intelligence.AgiSyncWorker.UNIQUE_PERIODIC_WORK_NAME).get()
        assertTrue(cancelled.isEmpty() || cancelled.first().state == androidx.work.WorkInfo.State.CANCELLED)
    }
}
