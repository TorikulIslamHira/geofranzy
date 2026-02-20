# ProGuard rules for GeoFrenzy

# --- Retrofit / Gson (Data models must NOT be obfuscated) ---
-keepattributes Signature
-keepattributes *Annotation*

# Keep all data models for Gson serialization
-keep class com.geofrenzy.data.model.** { *; }

# Keep Retrofit interfaces
-keep interface com.geofrenzy.data.api.** { *; }

# --- Socket.io ---
-keep class io.socket.** { *; }
-keep class okhttp3.** { *; }

# --- OSMDroid ---
-keep class org.osmdroid.** { *; }

# --- General ---
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
