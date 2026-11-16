package tech.afuagro.agi.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val AgiDarkColorScheme = darkColorScheme(
    primary = ElectricCyan,
    onPrimary = ObsidianBg,
    primaryContainer = DeepCobalt,
    onPrimaryContainer = TextPrimaryDark,
    secondary = ElectricBlue,
    onSecondary = Color.White,
    secondaryContainer = GraphiteElevated,
    onSecondaryContainer = ElectricCyan,
    tertiary = VioletNeural,
    onTertiary = Color.White,
    background = ObsidianBg,
    onBackground = TextPrimaryDark,
    surface = GraphiteSurface,
    onSurface = TextPrimaryDark,
    surfaceVariant = GraphiteElevated,
    onSurfaceVariant = TextSecondaryDark,
    outline = SlateBorder,
    outlineVariant = Color(0xFF162030),
    error = CrimsonAlert,
    onError = Color.White
)

private val AgiLightColorScheme = lightColorScheme(
    primary = ElectricBlueLight,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD9E6FF),
    onPrimaryContainer = TextPrimaryLight,
    secondary = CyanDeepLight,
    onSecondary = Color.White,
    secondaryContainer = LightSurfaceVariant,
    onSecondaryContainer = TextPrimaryLight,
    tertiary = VioletNeural,
    onTertiary = Color.White,
    background = LightBg,
    onBackground = TextPrimaryLight,
    surface = LightSurface,
    onSurface = TextPrimaryLight,
    surfaceVariant = LightSurfaceVariant,
    onSurfaceVariant = TextSecondaryLight,
    outline = LightBorder,
    outlineVariant = Color(0xFFDDE6F4),
    error = CrimsonAlert,
    onError = Color.White
)

val AgiShapes = Shapes(
    extraSmall = RoundedCornerShape(6.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(22.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

enum class ThemeMode { DARK, LIGHT, SYSTEM }

@Composable
fun AgiMobileTheme(
    themeMode: ThemeMode = ThemeMode.DARK,
    content: @Composable () -> Unit
) {
    val useDark = when (themeMode) {
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    val colorScheme = if (useDark) AgiDarkColorScheme else AgiLightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AgiTypography,
        shapes = AgiShapes,
        content = content
    )
}
