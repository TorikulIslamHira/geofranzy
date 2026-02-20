package com.geofrenzy.services

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.geofrenzy.data.api.ApiClient
import com.geofrenzy.data.model.LocationUpdate
import com.google.android.gms.location.*
import kotlinx.coroutines.*
import kotlin.math.abs

// ============================================
// LocationTrackingService.kt
// A Foreground Service that tracks GPS location
// in the background and sends it to the server.
//
// KEY OPTIMIZATION: Adaptive Update Rate
//   - Moving fast (>5 m/s) → update every 30s
//   - Moving slowly (1-5 m/s) → update every 60s
//   - Stationary (< 1 m/s) → pause updates for 5 min
//
// This saves SIGNIFICANT battery.
// ============================================

class LocationTrackingService : Service() {

    companion object {
        const val CHANNEL_ID = "location_tracking"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "START_TRACKING"
        const val ACTION_STOP = "STOP_TRACKING"

        // Thresholds
        private const val FAST_INTERVAL_MS = 30_000L    // 30 seconds
        private const val SLOW_INTERVAL_MS = 60_000L    // 1 minute
        private const val STATIONARY_PAUSE_MS = 300_000L // 5 minutes
        private const val SPEED_FAST_MS = 5f            // 5 m/s = fast walking / driving
        private const val SPEED_SLOW_MS = 1f            // 1 m/s = slow movement
    }

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val apiService by lazy { ApiClient.create() }

    private var lastSpeed = 0f
    private var stationaryStartTime = 0L

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
        setupLocationCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startTracking()
            ACTION_STOP -> stopSelf()
        }
        return START_STICKY // Restart if killed by system
    }

    private fun startTracking() {
        startForeground(NOTIFICATION_ID, buildNotification())
        requestLocationUpdates(SLOW_INTERVAL_MS)
    }

    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation ?: return
                lastSpeed = location.speed

                // --- Adaptive update interval ---
                val newInterval = when {
                    lastSpeed > SPEED_FAST_MS -> FAST_INTERVAL_MS   // Fast = 30s updates
                    lastSpeed > SPEED_SLOW_MS -> SLOW_INTERVAL_MS   // Slow = 60s updates
                    else -> {
                        // Stationary — check if we've been still long enough to pause
                        if (stationaryStartTime == 0L) {
                            stationaryStartTime = System.currentTimeMillis()
                        }
                        val stationaryDuration = System.currentTimeMillis() - stationaryStartTime
                        if (stationaryDuration > STATIONARY_PAUSE_MS) {
                            return // Skip this update entirely to save battery
                        }
                        SLOW_INTERVAL_MS
                    }
                }
                if (lastSpeed > SPEED_SLOW_MS) stationaryStartTime = 0L // Reset stationary timer

                // --- Send location to server ---
                serviceScope.launch {
                    try {
                        apiService.updateLocation(
                            LocationUpdate(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                accuracy = location.accuracy,
                                altitude = location.altitude,
                                speed = location.speed
                            )
                        )
                    } catch (e: Exception) {
                        // Silently fail — will retry on next update cycle
                    }
                }

                // Adjust update frequency dynamically
                requestLocationUpdates(newInterval)
            }
        }
    }

    private fun requestLocationUpdates(intervalMs: Long) {
        val request = LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, intervalMs)
            .setMinUpdateDistanceMeters(50f) // Only update if moved 50m+
            .build()

        try {
            fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
        } catch (e: SecurityException) {
            stopSelf()
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("GeoFrenzy")
            .setContentText("Sharing location with friends 📍")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW) // Low priority = less intrusive
            .setOngoing(true) // Can't be dismissed by user
            .build()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Location Tracking",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Keeps location active for nearby friend alerts"
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        serviceScope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
