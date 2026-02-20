package com.geofrenzy.utils

import android.util.Log
import com.geofrenzy.BuildConfig
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URI

// ============================================
// SocketManager.kt
// Manages the real-time Socket.io connection.
//
// Handles events:
//   nearbyAlert   → friend is close!
//   weatherShare  → friend sent you weather
//   sosAlert      → emergency from friend
//   sosResolved   → friend is safe
//   friendOnMyWay → friend is coming
//   friendBatteryUpdate → friend's battery changed
// ============================================

object SocketManager {

    private var socket: Socket? = null

    // Callbacks — set by screens to react to events
    var onNearbyAlert: ((name: String, distance: Int) -> Unit)? = null
    var onWeatherShare: ((fromName: String, temp: Int, condition: String) -> Unit)? = null
    var onSOSAlert: ((fromName: String, lat: Double, lon: Double, battery: Int?) -> Unit)? = null
    var onSOSResolved: ((fromName: String) -> Unit)? = null
    var onFriendBattery: ((userId: String, batteryLevel: Int) -> Unit)? = null

    fun connect(userId: String, token: String) {
        if (socket?.connected() == true) return

        try {
            val options = IO.Options.builder()
                .setExtraHeaders(mapOf("Authorization" to listOf("Bearer $token")))
                .build()

            socket = IO.socket(URI.create(BuildConfig.BASE_URL), options)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("Socket", "✅ Connected to server")
                // Join our personal room so the server can send us messages
                socket?.emit("join", userId)
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("Socket", "❌ Disconnected from server")
            }

            // --- Handle incoming events ---

            socket?.on("nearbyAlert") { args ->
                val data = args[0] as JSONObject
                val friendName = data.getJSONObject("friend").getString("name")
                val distance = data.getInt("distance")
                onNearbyAlert?.invoke(friendName, distance)
            }

            socket?.on("weatherShare") { args ->
                val data = args[0] as JSONObject
                val fromName = data.getJSONObject("from").getString("name")
                val weather = data.getJSONObject("weather")
                val temp = weather.getInt("temperature")
                val condition = weather.getString("condition")
                onWeatherShare?.invoke(fromName, temp, condition)
            }

            socket?.on("sosAlert") { args ->
                val data = args[0] as JSONObject
                val fromName = data.getJSONObject("from").getString("name")
                val loc = data.getJSONObject("location")
                val lat = loc.getDouble("latitude")
                val lon = loc.getDouble("longitude")
                val battery = if (data.has("batteryLevel")) data.getInt("batteryLevel") else null
                onSOSAlert?.invoke(fromName, lat, lon, battery)
            }

            socket?.on("sosResolved") { args ->
                val data = args[0] as JSONObject
                val message = data.getString("message")
                onSOSResolved?.invoke(message)
            }

            socket?.on("friendBatteryUpdate") { args ->
                val data = args[0] as JSONObject
                val userId = data.getString("userId")
                val battery = data.getInt("batteryLevel")
                onFriendBattery?.invoke(userId, battery)
            }

            socket?.connect()
        } catch (e: Exception) {
            Log.e("Socket", "Connection failed: ${e.message}")
        }
    }

    // Emit "On My Way" to a friend
    fun emitOnMyWay(senderId: String, friendId: String, lat: Double, lon: Double, destination: String) {
        socket?.emit("onMyWay", JSONObject().apply {
            put("senderId", senderId)
            put("friendId", friendId)
            put("latitude", lat)
            put("longitude", lon)
            put("destination", destination)
        })
    }

    // Emit battery level to all friends
    fun emitBatteryUpdate(userId: String, batteryLevel: Int, friendIds: List<String>) {
        socket?.emit("batteryUpdate", JSONObject().apply {
            put("userId", userId)
            put("batteryLevel", batteryLevel)
            put("friendIds", org.json.JSONArray(friendIds))
        })
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }

    fun isConnected(): Boolean = socket?.connected() == true
}
