package tech.afuagro.agi.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import tech.afuagro.agi.BuildConfig
import tech.afuagro.agi.core.model.IntelligenceMode
import tech.afuagro.agi.core.model.RoutingStrategy
import tech.afuagro.agi.core.model.SyncConflictStrategy
import tech.afuagro.agi.core.security.CryptoManager
import tech.afuagro.agi.ui.theme.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.agiDataStore: DataStore<Preferences> by preferencesDataStore(name = "agi_mobile_prefs")

data class AgiSettingsState(
    val agiBackendUrl: String = "",
    val n8nBaseUrl: String = "",
    val orchestratorWebhookPath: String = "/webhook/agi/orchestrator",
    val statusWebhookPath: String = "/webhook/agi/status",
    val syncWebhookPath: String = "/webhook/agi/memory-sync",
    val routerWebhookPath: String = "/webhook/agi/api-router",
    val hasAuthToken: Boolean = false,
    val maskedAuthToken: String = "Não configurado",
    val intelligenceMode: IntelligenceMode = IntelligenceMode.AUTO,
    val routingStrategy: RoutingStrategy = RoutingStrategy.AUTO,
    val themeMode: ThemeMode = ThemeMode.DARK,
    val ttsEnabled: Boolean = false,
    val streamingEnabled: Boolean = true,
    val wifiOnlySync: Boolean = true,
    val cloudDisabledCompletely: Boolean = false,
    val enforceHttpsOnly: Boolean = true,
    val autoSyncIntervalMinutes: Int = 30,
    val conflictStrategy: SyncConflictStrategy = SyncConflictStrategy.ASK,
    val hasAdminPin: Boolean = false,
    val lastSyncTimestamp: Long = 0L,
    val notificationsEnabled: Boolean = true,
    val plantApiBaseUrl: String = "",
    val plantAnalyzePath: String = "/api/plant_healthy/analyze_image",
    val plantTelemetryPath: String = "/api/plant_healthy/telemetry",
    val plantAlertsPath: String = "/api/plant_healthy/alerts",
    // Conta AFU Agro (JWT) — sem chaves LLM no cliente
    val afuApiBaseUrl: String = "",
    val afuLoggedIn: Boolean = false,
    val afuUserEmail: String = "",
    val afuUserName: String = "",
    val afuOrganizationId: Long = 0L,
    val afuOrganizationName: String = "",
    val afuPropriedadeId: Long = 0L,
    val afuPropriedadeName: String = "",
    val afuDeepLinkScheme: String = "afuagi"
)

class AgiPreferencesRepository(
    private val context: Context,
    private val cryptoManager: CryptoManager
) {
    private object Keys {
        val AGI_BACKEND_URL = stringPreferencesKey("agi_backend_url")
        val N8N_BASE_URL = stringPreferencesKey("n8n_base_url")
        val ORCHESTRATOR_PATH = stringPreferencesKey("orchestrator_path")
        val STATUS_PATH = stringPreferencesKey("status_path")
        val SYNC_PATH = stringPreferencesKey("sync_path")
        val ROUTER_PATH = stringPreferencesKey("router_path")
        val ENCRYPTED_AUTH_TOKEN = stringPreferencesKey("encrypted_auth_token")
        val MASKED_AUTH_TOKEN = stringPreferencesKey("masked_auth_token")
        val INTELLIGENCE_MODE = stringPreferencesKey("intelligence_mode")
        val ROUTING_STRATEGY = stringPreferencesKey("routing_strategy")
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val TTS_ENABLED = booleanPreferencesKey("tts_enabled")
        val STREAMING_ENABLED = booleanPreferencesKey("streaming_enabled")
        val WIFI_ONLY_SYNC = booleanPreferencesKey("wifi_only_sync")
        val CLOUD_DISABLED = booleanPreferencesKey("cloud_disabled")
        val ENFORCE_HTTPS = booleanPreferencesKey("enforce_https")
        val SYNC_INTERVAL_MIN = intPreferencesKey("sync_interval_min")
        val CONFLICT_STRATEGY = stringPreferencesKey("conflict_strategy")
        val ADMIN_PIN_HASH = stringPreferencesKey("admin_pin_hash")
        val LAST_SYNC_TS = longPreferencesKey("last_sync_ts")
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val PLANT_API_BASE_URL = stringPreferencesKey("plant_api_base_url")
        val PLANT_ANALYZE_PATH = stringPreferencesKey("plant_analyze_path")
        val PLANT_TELEMETRY_PATH = stringPreferencesKey("plant_telemetry_path")
        val PLANT_ALERTS_PATH = stringPreferencesKey("plant_alerts_path")
        val AFU_API_BASE_URL = stringPreferencesKey("afu_api_base_url")
        val AFU_ENCRYPTED_ACCESS = stringPreferencesKey("afu_encrypted_access")
        val AFU_ENCRYPTED_REFRESH = stringPreferencesKey("afu_encrypted_refresh")
        val AFU_USER_EMAIL = stringPreferencesKey("afu_user_email")
        val AFU_USER_NAME = stringPreferencesKey("afu_user_name")
        val AFU_ORG_ID = longPreferencesKey("afu_org_id")
        val AFU_ORG_NAME = stringPreferencesKey("afu_org_name")
        val AFU_PROP_ID = longPreferencesKey("afu_prop_id")
        val AFU_PROP_NAME = stringPreferencesKey("afu_prop_name")
    }

    val settingsFlow: Flow<AgiSettingsState> = context.agiDataStore.data.map { prefs ->
        AgiSettingsState(
            agiBackendUrl = prefs[Keys.AGI_BACKEND_URL] ?: "",
            n8nBaseUrl = prefs[Keys.N8N_BASE_URL] ?: "",
            orchestratorWebhookPath = prefs[Keys.ORCHESTRATOR_PATH] ?: "/webhook/agi/orchestrator",
            statusWebhookPath = prefs[Keys.STATUS_PATH] ?: "/webhook/agi/status",
            syncWebhookPath = prefs[Keys.SYNC_PATH] ?: "/webhook/agi/memory-sync",
            routerWebhookPath = prefs[Keys.ROUTER_PATH] ?: "/webhook/agi/api-router",
            hasAuthToken = !prefs[Keys.ENCRYPTED_AUTH_TOKEN].isNullOrBlank(),
            maskedAuthToken = prefs[Keys.MASKED_AUTH_TOKEN] ?: "Não configurado",
            intelligenceMode = prefs[Keys.INTELLIGENCE_MODE]?.let {
                runCatching { IntelligenceMode.valueOf(it) }.getOrNull()
            } ?: IntelligenceMode.AUTO,
            routingStrategy = prefs[Keys.ROUTING_STRATEGY]?.let {
                runCatching { RoutingStrategy.valueOf(it) }.getOrNull()
            } ?: RoutingStrategy.AUTO,
            themeMode = prefs[Keys.THEME_MODE]?.let {
                runCatching { ThemeMode.valueOf(it) }.getOrNull()
            } ?: ThemeMode.DARK,
            ttsEnabled = prefs[Keys.TTS_ENABLED] ?: false,
            streamingEnabled = prefs[Keys.STREAMING_ENABLED] ?: true,
            wifiOnlySync = prefs[Keys.WIFI_ONLY_SYNC] ?: true,
            cloudDisabledCompletely = prefs[Keys.CLOUD_DISABLED] ?: false,
            enforceHttpsOnly = prefs[Keys.ENFORCE_HTTPS] ?: true,
            autoSyncIntervalMinutes = prefs[Keys.SYNC_INTERVAL_MIN] ?: 30,
            conflictStrategy = prefs[Keys.CONFLICT_STRATEGY]?.let {
                runCatching { SyncConflictStrategy.valueOf(it) }.getOrNull()
            } ?: SyncConflictStrategy.ASK,
            hasAdminPin = !prefs[Keys.ADMIN_PIN_HASH].isNullOrBlank(),
            lastSyncTimestamp = prefs[Keys.LAST_SYNC_TS] ?: 0L,
            notificationsEnabled = prefs[Keys.NOTIFICATIONS_ENABLED] ?: true,
            plantApiBaseUrl = prefs[Keys.PLANT_API_BASE_URL] ?: "",
            plantAnalyzePath = prefs[Keys.PLANT_ANALYZE_PATH] ?: "/api/plant_healthy/analyze_image",
            plantTelemetryPath = prefs[Keys.PLANT_TELEMETRY_PATH] ?: "/api/plant_healthy/telemetry",
            plantAlertsPath = prefs[Keys.PLANT_ALERTS_PATH] ?: "/api/plant_healthy/alerts",
            afuApiBaseUrl = prefs[Keys.AFU_API_BASE_URL]
                ?.takeIf { it.isNotBlank() }
                ?: BuildConfig.AFU_API_BASE_URL.orEmpty(),
            afuLoggedIn = !prefs[Keys.AFU_ENCRYPTED_ACCESS].isNullOrBlank(),
            afuUserEmail = prefs[Keys.AFU_USER_EMAIL] ?: "",
            afuUserName = prefs[Keys.AFU_USER_NAME] ?: "",
            afuOrganizationId = prefs[Keys.AFU_ORG_ID] ?: 0L,
            afuOrganizationName = prefs[Keys.AFU_ORG_NAME] ?: "",
            afuPropriedadeId = prefs[Keys.AFU_PROP_ID] ?: 0L,
            afuPropriedadeName = prefs[Keys.AFU_PROP_NAME] ?: "",
            afuDeepLinkScheme = "afuagi"
        )
    }

    suspend fun getDecryptedAuthToken(): String {
        val encrypted = context.agiDataStore.data.first()[Keys.ENCRYPTED_AUTH_TOKEN] ?: ""
        return cryptoManager.decrypt(encrypted)
    }

    suspend fun saveBackendEndpoints(
        agiBackendUrl: String,
        n8nBaseUrl: String,
        orchestratorPath: String,
        statusPath: String,
        syncPath: String,
        routerPath: String
    ) {
        context.agiDataStore.edit { prefs ->
            prefs[Keys.AGI_BACKEND_URL] = agiBackendUrl.trim().trimEnd('/')
            prefs[Keys.N8N_BASE_URL] = n8nBaseUrl.trim().trimEnd('/')
            prefs[Keys.ORCHESTRATOR_PATH] = ensureLeadingSlash(orchestratorPath)
            prefs[Keys.STATUS_PATH] = ensureLeadingSlash(statusPath)
            prefs[Keys.SYNC_PATH] = ensureLeadingSlash(syncPath)
            prefs[Keys.ROUTER_PATH] = ensureLeadingSlash(routerPath)
        }
    }

    suspend fun savePlantHealthyEndpoints(
        baseUrl: String,
        analyzePath: String,
        telemetryPath: String,
        alertsPath: String
    ) {
        context.agiDataStore.edit { prefs ->
            prefs[Keys.PLANT_API_BASE_URL] = baseUrl.trim().trimEnd('/')
            prefs[Keys.PLANT_ANALYZE_PATH] = ensureLeadingSlash(analyzePath)
            prefs[Keys.PLANT_TELEMETRY_PATH] = ensureLeadingSlash(telemetryPath)
            prefs[Keys.PLANT_ALERTS_PATH] = ensureLeadingSlash(alertsPath)
        }
    }

    suspend fun saveAuthToken(plainToken: String) {
        val trimmed = plainToken.trim()
        context.agiDataStore.edit { prefs ->
            if (trimmed.isEmpty()) {
                prefs.remove(Keys.ENCRYPTED_AUTH_TOKEN)
                prefs[Keys.MASKED_AUTH_TOKEN] = "Não configurado"
            } else {
                prefs[Keys.ENCRYPTED_AUTH_TOKEN] = cryptoManager.encrypt(trimmed)
                prefs[Keys.MASKED_AUTH_TOKEN] = cryptoManager.maskSecret(trimmed)
            }
        }
    }

    suspend fun setIntelligenceMode(mode: IntelligenceMode) {
        context.agiDataStore.edit { it[Keys.INTELLIGENCE_MODE] = mode.name }
    }

    suspend fun setRoutingStrategy(strategy: RoutingStrategy) {
        context.agiDataStore.edit { it[Keys.ROUTING_STRATEGY] = strategy.name }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.agiDataStore.edit { it[Keys.THEME_MODE] = mode.name }
    }

    suspend fun setTtsEnabled(enabled: Boolean) {
        context.agiDataStore.edit { it[Keys.TTS_ENABLED] = enabled }
    }

    suspend fun setStreamingEnabled(enabled: Boolean) {
        context.agiDataStore.edit { it[Keys.STREAMING_ENABLED] = enabled }
    }

    suspend fun setWifiOnlySync(wifiOnly: Boolean) {
        context.agiDataStore.edit { it[Keys.WIFI_ONLY_SYNC] = wifiOnly }
    }

    suspend fun setCloudDisabledCompletely(disabled: Boolean) {
        context.agiDataStore.edit {
            it[Keys.CLOUD_DISABLED] = disabled
            if (disabled) it[Keys.INTELLIGENCE_MODE] = IntelligenceMode.LOCAL.name
        }
    }

    suspend fun setEnforceHttpsOnly(enforce: Boolean) {
        context.agiDataStore.edit { it[Keys.ENFORCE_HTTPS] = enforce }
    }

    suspend fun setSyncSettings(intervalMin: Int, conflictStrategy: SyncConflictStrategy) {
        context.agiDataStore.edit {
            it[Keys.SYNC_INTERVAL_MIN] = intervalMin
            it[Keys.CONFLICT_STRATEGY] = conflictStrategy.name
        }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        context.agiDataStore.edit { it[Keys.NOTIFICATIONS_ENABLED] = enabled }
    }

    suspend fun updateLastSyncTimestamp(ts: Long) {
        context.agiDataStore.edit { it[Keys.LAST_SYNC_TS] = ts }
    }

    suspend fun setAdminPin(pin: String) {
        context.agiDataStore.edit { prefs ->
            if (pin.isBlank()) prefs.remove(Keys.ADMIN_PIN_HASH)
            else prefs[Keys.ADMIN_PIN_HASH] = cryptoManager.sha256(pin.trim())
        }
    }

    suspend fun verifyAdminPin(pin: String): Boolean {
        val savedHash = context.agiDataStore.data.first()[Keys.ADMIN_PIN_HASH]
        if (savedHash.isNullOrBlank()) return true
        return cryptoManager.sha256(pin.trim()) == savedHash
    }


    suspend fun getDecryptedAfuAccessToken(): String {
        val encrypted = context.agiDataStore.data.first()[Keys.AFU_ENCRYPTED_ACCESS] ?: ""
        return cryptoManager.decrypt(encrypted)
    }

    suspend fun getDecryptedAfuRefreshToken(): String {
        val encrypted = context.agiDataStore.data.first()[Keys.AFU_ENCRYPTED_REFRESH] ?: ""
        return cryptoManager.decrypt(encrypted)
    }

    suspend fun saveAfuApiBaseUrl(baseUrl: String) {
        context.agiDataStore.edit { prefs ->
            prefs[Keys.AFU_API_BASE_URL] = baseUrl.trim().trimEnd('/')
            // Default plant API to AFU when empty
            if ((prefs[Keys.PLANT_API_BASE_URL] ?: "").isBlank() && baseUrl.isNotBlank()) {
                prefs[Keys.PLANT_API_BASE_URL] = baseUrl.trim().trimEnd('/')
            }
        }
    }

    suspend fun saveAfuSession(
        accessToken: String,
        refreshToken: String,
        email: String,
        name: String,
        organizationId: Long,
        organizationName: String,
        propriedadeId: Long = 0L,
        propriedadeName: String = ""
    ) {
        context.agiDataStore.edit { prefs ->
            prefs[Keys.AFU_ENCRYPTED_ACCESS] = cryptoManager.encrypt(accessToken.trim())
            prefs[Keys.AFU_ENCRYPTED_REFRESH] = cryptoManager.encrypt(refreshToken.trim())
            prefs[Keys.AFU_USER_EMAIL] = email
            prefs[Keys.AFU_USER_NAME] = name
            prefs[Keys.AFU_ORG_ID] = organizationId
            prefs[Keys.AFU_ORG_NAME] = organizationName
            if (propriedadeId > 0L) {
                prefs[Keys.AFU_PROP_ID] = propriedadeId
                prefs[Keys.AFU_PROP_NAME] = propriedadeName
            }
            // Reuse encrypted auth token slot so PlantHealthy / n8n calls send AFU JWT
            if (accessToken.isNotBlank()) {
                prefs[Keys.ENCRYPTED_AUTH_TOKEN] = cryptoManager.encrypt(accessToken.trim())
                prefs[Keys.MASKED_AUTH_TOKEN] = cryptoManager.maskSecret(accessToken.trim())
            }
        }
    }

    suspend fun saveAfuFarmSelection(
        organizationId: Long,
        organizationName: String,
        propriedadeId: Long,
        propriedadeName: String
    ) {
        context.agiDataStore.edit { prefs ->
            prefs[Keys.AFU_ORG_ID] = organizationId
            prefs[Keys.AFU_ORG_NAME] = organizationName
            prefs[Keys.AFU_PROP_ID] = propriedadeId
            prefs[Keys.AFU_PROP_NAME] = propriedadeName
        }
    }

    suspend fun clearAfuSession() {
        context.agiDataStore.edit { prefs ->
            prefs.remove(Keys.AFU_ENCRYPTED_ACCESS)
            prefs.remove(Keys.AFU_ENCRYPTED_REFRESH)
            prefs.remove(Keys.AFU_USER_EMAIL)
            prefs.remove(Keys.AFU_USER_NAME)
            prefs.remove(Keys.AFU_ORG_ID)
            prefs.remove(Keys.AFU_ORG_NAME)
            prefs.remove(Keys.AFU_PROP_ID)
            prefs.remove(Keys.AFU_PROP_NAME)
        }
    }

    suspend fun clearCredentials() {
        context.agiDataStore.edit { prefs ->
            prefs.remove(Keys.ENCRYPTED_AUTH_TOKEN)
            prefs[Keys.MASKED_AUTH_TOKEN] = "Não configurado"
            prefs.remove(Keys.ADMIN_PIN_HASH)
            prefs.remove(Keys.AFU_ENCRYPTED_ACCESS)
            prefs.remove(Keys.AFU_ENCRYPTED_REFRESH)
            prefs.remove(Keys.AFU_USER_EMAIL)
            prefs.remove(Keys.AFU_USER_NAME)
            prefs.remove(Keys.AFU_ORG_ID)
            prefs.remove(Keys.AFU_ORG_NAME)
            prefs.remove(Keys.AFU_PROP_ID)
            prefs.remove(Keys.AFU_PROP_NAME)
        }
    }

    private fun ensureLeadingSlash(path: String): String {
        val cleaned = path.trim()
        if (cleaned.isEmpty()) return "/"
        return if (cleaned.startsWith("/")) cleaned else "/$cleaned"
    }
}
