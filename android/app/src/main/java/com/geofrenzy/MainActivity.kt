package com.geofrenzy

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.compose.rememberNavController
import com.geofrenzy.data.local.PreferenceManager
import com.geofrenzy.ui.navigation.AppNavigation
import com.geofrenzy.ui.navigation.Screen
import com.geofrenzy.ui.theme.GeoFrenzyTheme

// ============================================
// MainActivity.kt
// The single activity for the entire app.
// Handles:
//   1. Splash screen
//   2. Check if logged in (token stored?)
//   3. Launch Compose UI
// ============================================

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Show splash screen while app is loading
        installSplashScreen()

        super.onCreate(savedInstanceState)
        enableEdgeToEdge() // Full edge-to-edge dark UI

        val prefManager = PreferenceManager(this)

        setContent {
            GeoFrenzyTheme {
                val navController = rememberNavController()
                // Check if user already has a saved token (auto login)
                val token by prefManager.tokenFlow.collectAsState(initial = null)

                val startDest = if (!token.isNullOrBlank()) {
                    Screen.Map.route  // Go straight to map if already logged in
                } else {
                    Screen.Login.route // Otherwise show login
                }

                AppNavigation(
                    navController = navController,
                    startDestination = startDest
                )
            }
        }
    }
}
