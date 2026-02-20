package com.geofrenzy.data.api

import com.geofrenzy.data.model.*
import retrofit2.Response
import retrofit2.http.*

// ============================================
// ApiService.kt
// Defines ALL REST API endpoints to our
// Node.js backend using Retrofit.
//
// Think of this as a "menu" of all the server
// calls the app can make.
// ============================================

interface ApiService {

    // ==================== AUTH ====================

    @POST("api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("api/auth/google")
    suspend fun googleLogin(@Body request: GoogleLoginRequest): Response<AuthResponse>

    @GET("api/auth/me")
    suspend fun getMe(): Response<AuthResponse>

    // ==================== LOCATION ====================

    @POST("api/location/update")
    suspend fun updateLocation(@Body location: LocationUpdate): Response<LocationUpdateResponse>

    @GET("api/location/friends")
    suspend fun getFriendsLocations(): Response<FriendsLocationResponse>

    @GET("api/location/history")
    suspend fun getMeetingHistory(): Response<HistoryResponse>

    // ==================== WEATHER ====================

    @GET("api/weather")
    suspend fun getWeather(
        @Query("lat") lat: Double,
        @Query("lon") lon: Double
    ): Response<WeatherResponse>

    @POST("api/weather/share")
    suspend fun shareWeather(@Body request: WeatherShareRequest): Response<GenericResponse>

    // ==================== FRIENDS ====================

    @GET("api/friends/search")
    suspend fun searchUsers(@Query("q") query: String): Response<SearchUsersResponse>

    @POST("api/friends/add")
    suspend fun addFriend(@Body request: AddFriendRequest): Response<GenericResponse>

    @DELETE("api/friends/remove/{friendId}")
    suspend fun removeFriend(@Path("friendId") friendId: String): Response<GenericResponse>

    @GET("api/friends/meetpoint/{friendId}")
    suspend fun getMeetingPoint(@Path("friendId") friendId: String): Response<MeetingPointResponse>

    @PATCH("api/friends/ghostmode")
    suspend fun toggleGhostMode(): Response<GenericResponse>

    // ==================== SOS ====================

    @POST("api/sos/send")
    suspend fun sendSOS(@Body request: SOSRequest): Response<GenericResponse>

    @PATCH("api/sos/resolve/{alertId}")
    suspend fun resolveSOS(@Path("alertId") alertId: String): Response<GenericResponse>
}
