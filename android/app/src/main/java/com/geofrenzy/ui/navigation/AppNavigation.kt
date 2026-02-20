package com.geofrenzy.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.geofrenzy.ui.screens.auth.LoginScreen
import com.geofrenzy.ui.screens.history.HistoryScreen
import com.geofrenzy.ui.screens.map.MapScreen
import com.geofrenzy.ui.screens.sos.SOSScreen
import com.geofrenzy.ui.screens.weather.WeatherScreen

// ============================================
// AppNavigation.kt
// All app screens and routes are defined here.
//
// Route Structure:
//   login     → Login / Register
//   map       → Main Map (home screen after login)
//   sos       → Emergency SOS
//   weather   → Weather + share
//   history   → Meeting history log
// ============================================

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Map : Screen("map")
    object SOS : Screen("sos")
    object Weather : Screen("weather")
    object History : Screen("history")
}

@Composable
fun AppNavigation(
    navController: NavHostController,
    startDestination: String = Screen.Login.route
) {
    NavHost(navController = navController, startDestination = startDestination) {

        // --- Login / Register ---
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Map.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        // --- Main Map ---
        composable(Screen.Map.route) {
            MapScreen(
                currentUserId = "",
                onSOSPress = { navController.navigate(Screen.SOS.route) },
                onFriendClick = { navController.navigate(Screen.Weather.route) }
            )
        }

        // --- SOS ---
        composable(Screen.SOS.route) {
            SOSScreen(
                onSendSOS = { message -> /* TODO: call ViewModel */ },
                onResolve = { navController.popBackStack() },
                onBack = { navController.popBackStack() }
            )
        }

        // --- Weather ---
        composable(Screen.Weather.route) {
            WeatherScreen(
                weather = null,
                onShareWeather = { /* TODO: call ViewModel */ },
                onBack = { navController.popBackStack() }
            )
        }

        // --- History ---
        composable(Screen.History.route) {
            HistoryScreen(
                history = emptyList(),
                onBack = { navController.popBackStack() }
            )
        }
    }
}
