package com.geofrenzy.data.model

import com.google.gson.annotations.SerializedName

// ============================================
// Data Models — mirror the Node.js API responses
// ============================================

// --- Auth / User ---

data class User(
    @SerializedName("_id") val id: String,
    val name: String,
    val email: String,
    val avatar: String?,
    val isGhostMode: Boolean = false,
    val batteryLevel: Int? = null,
    val friends: List<String> = emptyList()
)

data class AuthResponse(
    val success: Boolean,
    val token: String?,
    val user: User?,
    val message: String?
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class GoogleLoginRequest(
    val googleId: String,
    val name: String,
    val email: String,
    val avatar: String?
)

// --- Location ---

data class LocationUpdate(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float? = null,
    val altitude: Double? = null,
    val speed: Float? = null
)

data class FriendLocation(
    val user: User,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float?,
    val updatedAt: String
)

data class FriendsLocationResponse(
    val success: Boolean,
    val locations: List<FriendLocation>
)

data class LocationUpdateResponse(
    val success: Boolean,
    val nearbyFriends: List<NearbyFriend>?
)

data class NearbyFriend(
    val user: User,
    val distanceMeters: Int
)

// --- Meeting History ---

data class MeetingHistory(
    @SerializedName("_id") val id: String,
    val users: List<User>,
    val location: MeetLocation,
    val metAt: String,
    val durationMinutes: Int?
)

data class MeetLocation(
    val latitude: Double,
    val longitude: Double,
    val placeName: String?
)

data class HistoryResponse(
    val success: Boolean,
    val history: List<MeetingHistory>
)

// --- Weather ---

data class WeatherData(
    val city: String,
    val country: String?,
    val temperature: Int,
    val feelsLike: Int,
    val condition: String,
    val description: String,
    val icon: String,
    val humidity: Int,
    val windSpeed: Double,
    val latitude: Double,
    val longitude: Double
)

data class WeatherResponse(
    val success: Boolean,
    val weather: WeatherData?,
    val message: String?
)

data class WeatherShareRequest(
    val friendId: String,
    val lat: Double,
    val lon: Double
)

// --- Friends ---

data class SearchUsersResponse(
    val success: Boolean,
    val users: List<User>
)

data class AddFriendRequest(
    val friendId: String
)

data class MeetingPointResponse(
    val success: Boolean,
    val midpoint: LatLng?,
    val suggestedPlaces: List<SuggestedPlace>?
)

data class LatLng(
    val latitude: Double,
    val longitude: Double
)

data class SuggestedPlace(
    val name: String,
    val type: String,
    val latitude: Double,
    val longitude: Double
)

// --- SOS ---

data class SOSRequest(
    val latitude: Double,
    val longitude: Double,
    val batteryLevel: Int?,
    val message: String?
)

// --- Generic ---
data class GenericResponse(
    val success: Boolean,
    val message: String?,
    val isGhostMode: Boolean? = null
)
