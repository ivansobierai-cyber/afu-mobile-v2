package tech.afuagro.agi.intelligence

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import tech.afuagro.agi.AgiApplication
import kotlinx.coroutines.flow.first

class AgiSyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? AgiApplication ?: return Result.failure()
        val repo = app.container.repository
        val settings = repo.preferences.settingsFlow.first()

        // Do not retry when cloud communication is disabled or backend URL is unconfigured
        val targetUrl = settings.agiBackendUrl.ifBlank { settings.n8nBaseUrl }
        if (settings.cloudDisabledCompletely || targetUrl.isBlank()) {
            return Result.success(
                workDataOf(KEY_STATUS to "SKIPPED_UNCONFIGURED_OR_DISABLED")
            )
        }

        val outcome = repo.runSyncCycle()
        return when {
            outcome.success -> Result.success(
                workDataOf(
                    KEY_STATUS to "SYNCED",
                    KEY_SYNCED_COUNT to outcome.syncedItems,
                    KEY_LAST_SYNC_TS to System.currentTimeMillis()
                )
            )
            outcome.hasConflict -> Result.failure(
                workDataOf(
                    KEY_STATUS to "CONFLICT_REQUIRES_RESOLUTION",
                    KEY_SYNCED_COUNT to outcome.syncedItems
                )
            )
            runAttemptCount >= MAX_RETRY_ATTEMPTS -> Result.failure(
                workDataOf(KEY_STATUS to "MAX_RETRIES_EXCEEDED")
            )
            else -> Result.retry()
        }
    }

    companion object {
        const val UNIQUE_PERIODIC_WORK_NAME = "agi_periodic_sync"
        const val UNIQUE_IMMEDIATE_WORK_NAME = "agi_immediate_sync"
        const val WORK_TAG = "agi_n8n_memory_sync"
        const val KEY_STATUS = "sync_status"
        const val KEY_SYNCED_COUNT = "synced_count"
        const val KEY_LAST_SYNC_TS = "last_sync_ts"
        private const val MAX_RETRY_ATTEMPTS = 5
    }
}
