package com.geofrenzy

import android.app.Application
import org.osmdroid.config.Configuration

// ============================================
// GeoFrenzyApp.kt
// Application class — runs before any Activity.
// Used to initialize global libraries.
// ============================================

class GeoFrenzyApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize OSMDroid (OpenStreetMap)
        // Set user agent so the tile servers know who's requesting tiles
        Configuration.getInstance().apply {
            userAgentValue = "GeoFrenzy/1.0 (Android)"
            // Cache tiles locally to save bandwidth (offline map support)
            osmdroidTileCache = getExternalFilesDir(null)
        }
    }
}
