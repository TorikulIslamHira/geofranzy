package com.geofrenzy.ui.screens.weather

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.geofrenzy.data.model.WeatherData
import com.geofrenzy.ui.theme.*

// ============================================
// WeatherScreen.kt
// Shows local weather and lets you share it
// with a friend instantly.
// ============================================

@Composable
fun WeatherScreen(
    weather: WeatherData?,
    friendName: String? = null,
    onShareWeather: () -> Unit = {},
    onBack: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = when (weather?.condition) {
                        "Clear" -> listOf(Color(0xFF1A237E), Color(0xFF0D47A1), Color(0xFF1565C0))
                        "Rain", "Drizzle" -> listOf(Color(0xFF263238), Color(0xFF37474F), Color(0xFF455A64))
                        "Clouds" -> listOf(Color(0xFF37474F), Color(0xFF546E7A), Color(0xFF607D8B))
                        "Snow" -> listOf(Color(0xFF1A237E), Color(0xFF283593), Color(0xFF3F51B5))
                        else -> listOf(Background, SurfaceDark)
                    }
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))

            if (weather == null) {
                CircularProgressIndicator(color = Blue60)
                Text("Fetching weather...", color = TextSecondary, modifier = Modifier.padding(top = 16.dp))
            } else {
                // Weather icon emoji
                val emoji = when (weather.condition) {
                    "Clear" -> "☀️"
                    "Clouds" -> "☁️"
                    "Rain", "Drizzle" -> "🌧️"
                    "Thunderstorm" -> "⛈️"
                    "Snow" -> "❄️"
                    "Mist", "Fog" -> "🌫️"
                    else -> "🌤️"
                }

                Text(emoji, fontSize = 80.sp)
                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    "${weather.temperature}°C",
                    fontSize = 72.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    weather.condition,
                    fontSize = 22.sp,
                    color = Color.White.copy(alpha = 0.85f)
                )
                Text(
                    "${weather.city}, ${weather.country ?: ""}",
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(32.dp))

                // Weather Details Card (glassmorphism)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(20.dp))
                        .background(GlassSurface)
                        .padding(20.dp)
                ) {
                    Column {
                        WeatherDetailRow("🌡️  Feels Like", "${weather.feelsLike}°C")
                        WeatherDetailRow("💧  Humidity", "${weather.humidity}%")
                        WeatherDetailRow("💨  Wind Speed", "${weather.windSpeed} m/s")
                        Text(
                            "\"${weatherQuote(weather.condition)}\"",
                            color = Blue80,
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(28.dp))

                // Share Button
                Button(
                    onClick = onShareWeather,
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF00B4D8)
                    )
                ) {
                    Icon(Icons.Default.Send, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Share with ${friendName ?: "a Friend"}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))
            TextButton(onClick = onBack) {
                Text("← Go Back", color = TextSecondary)
            }
        }
    }
}

@Composable
private fun WeatherDetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = TextSecondary, style = MaterialTheme.typography.bodyMedium)
        Text(value, color = TextPrimary, fontWeight = FontWeight.SemiBold)
    }
}

private fun weatherQuote(condition: String): String = when (condition) {
    "Clear" -> "Perfect weather for a meet-up! ☀️"
    "Rain", "Drizzle" -> "Grab an umbrella if you're heading out! 🌂"
    "Clouds" -> "A bit cloudy, but still a good day!"
    "Snow" -> "Bundle up out there — it's snowing! ❄️"
    "Thunderstorm" -> "Stay safe indoors! ⛈️"
    else -> "Stay comfortable out there!"
}
