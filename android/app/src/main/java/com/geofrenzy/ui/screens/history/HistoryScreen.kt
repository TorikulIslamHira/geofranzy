package com.geofrenzy.ui.screens.history

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.geofrenzy.data.model.MeetingHistory
import com.geofrenzy.ui.theme.*

// ============================================
// HistoryScreen.kt
// Shows all previous meetings — when and where
// you and your friends were close.
// ============================================

@Composable
fun HistoryScreen(
    history: List<MeetingHistory>,
    isLoading: Boolean = false,
    onBack: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(16.dp)
    ) {
        // Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            TextButton(onClick = onBack) { Text("←", color = TextSecondary, style = MaterialTheme.typography.headlineMedium) }
            Spacer(modifier = Modifier.width(8.dp))
            Text("Meeting History", style = MaterialTheme.typography.headlineMedium)
        }

        when {
            isLoading -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Blue60)
                }
            }
            history.isEmpty() -> {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("📍", style = MaterialTheme.typography.displayLarge)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("No meetings recorded yet", style = MaterialTheme.typography.titleMedium)
                        Text("Your meetings will appear here automatically.", color = TextSecondary)
                    }
                }
            }
            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(history) { meeting ->
                        MeetingCard(meeting)
                    }
                }
            }
        }
    }
}

@Composable
private fun MeetingCard(meeting: MeetingHistory) {
    val otherUser = meeting.users.getOrNull(1) // Show the "other" person's name

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceDark),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar circle
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape)
                    .background(Blue40),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    otherUser?.name?.firstOrNull()?.toString() ?: "?",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Met with ${otherUser?.name ?: "a friend"}",
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "📍 ${meeting.location.placeName ?: "Unknown location"}",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    "🕐 ${meeting.metAt.take(10)}",
                    color = TextSecondary,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            // Duration badge
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(SurfaceMedium)
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(
                    "${meeting.durationMinutes ?: 0} min",
                    color = Blue80,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
