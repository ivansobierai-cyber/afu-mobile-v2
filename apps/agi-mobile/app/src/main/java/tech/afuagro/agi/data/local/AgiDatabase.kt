package tech.afuagro.agi.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import tech.afuagro.agi.core.model.AgentStatus
import tech.afuagro.agi.core.model.MemoryCategory
import tech.afuagro.agi.core.model.MemoryLayer
import tech.afuagro.agi.core.model.ProviderAuthType

@Database(
    entities = [
        ChatSessionEntity::class,
        ChatMessageEntity::class,
        AgentEntity::class,
        TaskEntity::class,
        TaskHistoryEntity::class,
        MemoryEntity::class,
        ApiProviderEntity::class,
        LocalModelEntity::class,
        SyncQueueEntity::class,
        TelemetryLogEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AgiDatabase : RoomDatabase() {

    abstract fun chatDao(): ChatDao
    abstract fun agentDao(): AgentDao
    abstract fun taskDao(): TaskDao
    abstract fun taskHistoryDao(): TaskHistoryDao
    abstract fun memoryDao(): MemoryDao
    abstract fun providerDao(): ProviderDao
    abstract fun localModelDao(): LocalModelDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun telemetryLogDao(): TelemetryLogDao

    companion object {
        @Volatile
        private var INSTANCE: AgiDatabase? = null

        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_chat_messages_sessionId` ON `chat_messages` (`sessionId`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_chat_messages_syncStatus` ON `chat_messages` (`syncStatus`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_memories_layer` ON `memories` (`layer`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_memories_category` ON `memories` (`category`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_memories_syncStatus` ON `memories` (`syncStatus`)")
            }
        }

        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_tasks_agentId` ON `tasks` (`agentId`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_tasks_status` ON `tasks` (`status`)")
                db.execSQL(
                    "CREATE TABLE IF NOT EXISTS `task_history` (" +
                        "`id` TEXT NOT NULL, " +
                        "`taskId` TEXT NOT NULL, " +
                        "`agentId` TEXT NOT NULL, " +
                        "`agentName` TEXT NOT NULL, " +
                        "`previousStatus` TEXT NOT NULL, " +
                        "`newStatus` TEXT NOT NULL, " +
                        "`progress` REAL NOT NULL, " +
                        "`summary` TEXT NOT NULL, " +
                        "`evidenceText` TEXT NOT NULL, " +
                        "`latencyMs` INTEGER NOT NULL, " +
                        "`timestamp` INTEGER NOT NULL, " +
                        "`syncStatus` TEXT NOT NULL, " +
                        "PRIMARY KEY(`id`))"
                )
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_task_history_taskId` ON `task_history` (`taskId`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_task_history_agentId` ON `task_history` (`agentId`)")
                db.execSQL("CREATE INDEX IF NOT EXISTS `index_task_history_timestamp` ON `task_history` (`timestamp`)")
            }
        }

        fun getInstance(context: Context): AgiDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AgiDatabase::class.java,
                    "agi_mobile_database.db"
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .fallbackToDestructiveMigration(dropAllTables = true)
                    .build()
                    .also { INSTANCE = it }
            }
        }

        suspend fun seedInitialCatalog(db: AgiDatabase) {
            val existingAgents = db.agentDao()
            existingAgents.insertAllIgnore(defaultCoreAgents())
            db.providerDao().insertAllIgnore(defaultApiProviders())
            db.localModelDao().insertAllIgnore(defaultLocalModels())
            db.memoryDao().insertAllIgnore(defaultOperationalMemories())
        }

        private fun defaultCoreAgents(): List<AgentEntity> = listOf(
            AgentEntity(
                id = "orch-01",
                name = "Orquestrador",
                specialty = "Coordenação Global & Planejamento",
                description = "Cérebro operacional central. Interpreta objetivos, cria planos em etapas, identifica dependências e delega tarefas aos subagentes.",
                modelId = "qwen-max",
                toolsCsv = "n8n-workflow,task-planner,agent-router,memory-query",
                permissionsCsv = "READ,PLAN,DELEGATE,AUDIT",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "res-02",
                name = "Pesquisador",
                specialty = "Pesquisa, Fontes & Documentos",
                description = "Pesquisa informações, analisa documentos anexados, compara fontes e extrai evidências estruturadas.",
                modelId = "gemini-2.5-pro",
                toolsCsv = "web-search,doc-parser,citation-check",
                permissionsCsv = "READ,SEARCH,SUMMARIZE",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "dev-03",
                name = "Programador",
                specialty = "Código, APIs & Sistemas",
                description = "Desenvolve sistemas, integrações REST/GraphQL, scripts n8n, SQL e depura falhas técnicas.",
                modelId = "deepseek-reasoner",
                toolsCsv = "code-gen,api-inspector,sql-builder,diff-review",
                permissionsCsv = "READ,CODE_DRAFT,API_TEST",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "ana-04",
                name = "Analista",
                specialty = "Dados, Métricas & Relatórios",
                description = "Interpreta dados quantitativos, realiza cálculos, identifica padrões operacionais e gera relatórios executivos.",
                modelId = "claude-sonnet-4",
                toolsCsv = "data-calc,csv-analyzer,trend-detector",
                permissionsCsv = "READ,ANALYZE,REPORT",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "str-05",
                name = "Estrategista",
                specialty = "Planos, Riscos & Priorização",
                description = "Desenvolve roadmaps, avalia riscos operacionais, define prioridades e propõe soluções de contingência.",
                modelId = "gpt-4o",
                toolsCsv = "risk-matrix,roadmap-planner,cost-optimizer",
                permissionsCsv = "READ,PLAN,PRIORITIZE",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "exe-06",
                name = "Executor",
                specialty = "Execução Autorizada de Ações",
                description = "Interage com webhooks n8n e APIs externas mediante autorização explícita, retornando evidências de execução.",
                modelId = "qwen-plus",
                toolsCsv = "http-webhook,n8n-trigger,payload-dispatch",
                permissionsCsv = "READ,EXECUTE_AUTHORIZED",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "aud-07",
                name = "Auditor",
                specialty = "Verificação & Qualidade",
                description = "Valida entregas dos outros agentes, detecta inconsistências, verifica conformidade e confirma conclusão dos objetivos.",
                modelId = "claude-sonnet-4",
                toolsCsv = "schema-validator,policy-check,consistency-audit",
                permissionsCsv = "READ,AUDIT,FLAG_ERROR",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "mem-08",
                name = "Agente de Memória",
                specialty = "Memória Persistente & Aprendizado",
                description = "Armazena experiências, organiza conhecimento em 4 camadas, indexa busca semântica e consolida aprendizados validados.",
                modelId = "text-embedding-v3",
                toolsCsv = "vector-index,memory-consolidate,conflict-check",
                permissionsCsv = "READ,WRITE_MEMORY,INDEX",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            ),
            AgentEntity(
                id = "plant-09",
                name = "Planta Saudável",
                specialty = "Fitotecnia, Genomas (G1-G4) & Monitoramento",
                description = "Analista pesquisador integrado para monitoramento IoT/clima em tempo real, diagnóstico por imagem foliar, limpeza de dados brutos e histórico multigeneracional (G1-G4) via API.",
                modelId = "gemini-2.5-pro",
                toolsCsv = "plant-image-api,genomic-g1-g4,iot-telemetry,raw-data-cleaner",
                permissionsCsv = "READ,ANALYZE_IMAGE,IOT_MONITOR,REPORT",
                status = AgentStatus.ACTIVE.name,
                isEnabled = true,
                isCoreAgent = true
            )
        )

        private fun defaultApiProviders(): List<ApiProviderEntity> = listOf(
            ApiProviderEntity(
                id = "prov_qwen",
                name = "Alibaba Cloud Model Studio / Qwen",
                baseUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
                defaultModel = "qwen-max",
                availableModelsCsv = "qwen-max,qwen-plus,qwen-turbo,qwen-coder-plus,qwen-vl-max",
                authType = ProviderAuthType.BEARER.name,
                rateLimitRpm = 60,
                priorityOrder = 1,
                costPer1kTokensUsd = 0.0020,
                maxContextTokens = 131072
            ),
            ApiProviderEntity(
                id = "prov_deepseek",
                name = "DeepSeek",
                baseUrl = "https://api.deepseek.com/v1",
                defaultModel = "deepseek-chat",
                availableModelsCsv = "deepseek-chat,deepseek-reasoner",
                authType = ProviderAuthType.BEARER.name,
                rateLimitRpm = 60,
                priorityOrder = 2,
                costPer1kTokensUsd = 0.0005,
                maxContextTokens = 65536
            ),
            ApiProviderEntity(
                id = "prov_openai",
                name = "OpenAI",
                baseUrl = "https://api.openai.com/v1",
                defaultModel = "gpt-4o",
                availableModelsCsv = "gpt-4o,gpt-4o-mini,o3-mini",
                authType = ProviderAuthType.BEARER.name,
                rateLimitRpm = 100,
                priorityOrder = 3,
                costPer1kTokensUsd = 0.0050,
                maxContextTokens = 128000
            ),
            ApiProviderEntity(
                id = "prov_anthropic",
                name = "Anthropic",
                baseUrl = "https://api.anthropic.com/v1",
                defaultModel = "claude-sonnet-4-20250514",
                availableModelsCsv = "claude-sonnet-4-20250514,claude-3-5-haiku-latest",
                authType = ProviderAuthType.API_KEY_HEADER.name,
                rateLimitRpm = 50,
                priorityOrder = 4,
                costPer1kTokensUsd = 0.0030,
                maxContextTokens = 200000
            ),
            ApiProviderEntity(
                id = "prov_gemini",
                name = "Google Gemini",
                baseUrl = "https://generativelanguage.googleapis.com/v1beta",
                defaultModel = "gemini-2.5-pro",
                availableModelsCsv = "gemini-2.5-pro,gemini-2.5-flash",
                authType = ProviderAuthType.QUERY_PARAM.name,
                rateLimitRpm = 60,
                priorityOrder = 5,
                costPer1kTokensUsd = 0.0012,
                maxContextTokens = 1048576
            ),
            ApiProviderEntity(
                id = "prov_openrouter",
                name = "OpenRouter",
                baseUrl = "https://openrouter.ai/api/v1",
                defaultModel = "qwen/qwen-2.5-72b-instruct",
                availableModelsCsv = "qwen/qwen-2.5-72b-instruct,deepseek/deepseek-r1,anthropic/claude-3.5-sonnet",
                authType = ProviderAuthType.BEARER.name,
                rateLimitRpm = 120,
                priorityOrder = 6,
                costPer1kTokensUsd = 0.0015,
                maxContextTokens = 128000
            ),
            ApiProviderEntity(
                id = "prov_custom",
                name = "API Personalizada REST",
                baseUrl = "https://seu-servidor-agi.exemplo.com/v1",
                defaultModel = "agi-custom-router",
                availableModelsCsv = "agi-custom-router",
                authType = ProviderAuthType.BEARER.name,
                rateLimitRpm = 60,
                priorityOrder = 7,
                costPer1kTokensUsd = 0.0,
                maxContextTokens = 32768
            )
        )

        private fun defaultLocalModels(): List<LocalModelEntity> = listOf(
            LocalModelEntity(
                id = "agi-local-core-v1",
                name = "AGI Local Core (TF-IDF + Síntese Offline)",
                family = "Embutido",
                format = "BUILTIN",
                quantization = "Nativo",
                sizeMb = 4,
                minRamMb = 512,
                contextLength = 4096,
                threads = 2,
                temperature = 0.2f,
                isDownloaded = true,
                isActive = true
            ),
            LocalModelEntity(
                id = "qwen2.5-1.5b-q4",
                name = "Qwen2.5-1.5B-Instruct (GGUF)",
                family = "Qwen 2.5",
                format = "GGUF",
                quantization = "Q4_K_M",
                sizeMb = 1120,
                minRamMb = 3072,
                contextLength = 4096,
                threads = 4,
                downloadUrl = "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf"
            ),
            LocalModelEntity(
                id = "llama-3.2-1b-q4",
                name = "Llama-3.2-1B-Instruct (GGUF)",
                family = "Llama 3.2",
                format = "GGUF",
                quantization = "Q4_K_M",
                sizeMb = 808,
                minRamMb = 2560,
                contextLength = 4096,
                threads = 4,
                downloadUrl = "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf"
            ),
            LocalModelEntity(
                id = "deepseek-r1-1.5b-q4",
                name = "DeepSeek-R1-Distill-Qwen-1.5B (GGUF)",
                family = "DeepSeek R1",
                format = "GGUF",
                quantization = "Q4_K_M",
                sizeMb = 1140,
                minRamMb = 3584,
                contextLength = 4096,
                threads = 4,
                downloadUrl = "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf"
            ),
            LocalModelEntity(
                id = "minilm-l6-onnx",
                name = "All-MiniLM-L6-v2 Embeddings (ONNX)",
                family = "MiniLM",
                format = "ONNX",
                quantization = "INT8",
                sizeMb = 24,
                minRamMb = 512,
                contextLength = 512,
                threads = 2,
                downloadUrl = "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model_quantized.onnx"
            )
        )

        private fun defaultOperationalMemories(): List<MemoryEntity> = listOf(
            MemoryEntity(
                id = "mem_boot_arch",
                layer = MemoryLayer.LONG_TERM.name,
                category = MemoryCategory.KNOWLEDGE.name,
                title = "Arquitetura Híbrida AGI Mobile + n8n",
                content = "O AGI Mobile atua como central de comando móvel conectada ao AGI Backend e ao orquestrador n8n. Chaves de API ficam cifradas no Android Keystore e chamadas remotas são roteadas via backend seguro.",
                tagsCsv = "arquitetura,n8n,seguranca,hibrido",
                source = "LOCAL",
                syncStatus = "LOCAL_ONLY"
            ),
            MemoryEntity(
                id = "mem_boot_prefs",
                layer = MemoryLayer.OPERATIONAL.name,
                category = MemoryCategory.PREFERENCES.name,
                title = "Política de Autonomia Controlada",
                content = "Operações críticas (excluir dados em massa, disparar pagamentos, alterar sistemas de produção ou criar novos agentes) exigem confirmação explícita do administrador.",
                tagsCsv = "governanca,autorizacao,seguranca",
                source = "LOCAL",
                syncStatus = "LOCAL_ONLY"
            )
        )
    }
}
