package com.geofrenzy.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

// ============================================
// PreferenceManager.kt
// Saves the user's login token and basic
// profile info using DataStore (no SQLite needed
// for simple key-value data).
// ============================================

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "geofrenzy_prefs")

class PreferenceManager(private val context: Context) {

    companion object {
        val KEY_TOKEN = stringPreferencesKey("auth_token")
        val KEY_USER_ID = stringPreferencesKey("user_id")
        val KEY_USER_NAME = stringPreferencesKey("user_name")
        val KEY_USER_EMAIL = stringPreferencesKey("user_email")
        val KEY_USER_AVATAR = stringPreferencesKey("user_avatar")
        val KEY_IS_GHOST_MODE = booleanPreferencesKey("is_ghost_mode")
    }

    // --- Save Login Token ---
    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN] = token
        }
    }

    // --- Save User Profile ---
    suspend fun saveUser(id: String, name: String, email: String, avatar: String?, isGhostMode: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_USER_ID] = id
            prefs[KEY_USER_NAME] = name
            prefs[KEY_USER_EMAIL] = email
            prefs[KEY_USER_AVATAR] = avatar ?: ""
            prefs[KEY_IS_GHOST_MODE] = isGhostMode
        }
    }

    // --- Read Token (as a Flow — auto-updates when it changes) ---
    val tokenFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_TOKEN]
    }

    // --- Read User ID ---
    val userIdFlow: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[KEY_USER_ID]
    }

    // --- Clear All (Logout) ---
    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }
}
