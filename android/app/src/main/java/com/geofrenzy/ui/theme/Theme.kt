package com.geofrenzy.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ============================================
// GeoFrenzy App Theme
// Dark-mode only, premium feel
// ============================================

private val DarkColorScheme = darkColorScheme(
    primary = Blue60,
    onPrimary = Color.White,
    primaryContainer = BlueDark,
    onPrimaryContainer = Blue80,

    secondary = Purple60,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFF2A0066),
    onSecondaryContainer = Purple80,

    tertiary = Pink60,
    onTertiary = Color.White,

    background = Background,
    onBackground = TextPrimary,

    surface = SurfaceDark,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceMedium,
    onSurfaceVariant = TextSecondary,

    outline = GlassBorder,
    error = SOSRed,
    onError = Color.White,
)

@Composable
fun GeoFrenzyTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = GeoFrenzyTypography,
        content = content
    )
}
