package tech.afuagro.agi.ui.navigation

import kotlinx.serialization.Serializable

sealed interface AgiRoute {
    @Serializable data object Home : AgiRoute
    @Serializable data object Chat : AgiRoute
    @Serializable data object Agents : AgiRoute
    @Serializable data class AgentDetail(val agentId: String) : AgiRoute
    @Serializable data object Tasks : AgiRoute
    @Serializable data object Menu : AgiRoute
    @Serializable data object ApiRouter : AgiRoute
    @Serializable data object IntelligenceManager : AgiRoute
    @Serializable data object Memory : AgiRoute
    @Serializable data object Dashboard : AgiRoute
    @Serializable data object Settings : AgiRoute
    @Serializable data object PlantHealthy : AgiRoute
}
