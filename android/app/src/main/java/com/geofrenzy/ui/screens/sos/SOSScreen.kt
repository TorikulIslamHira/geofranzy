package com.geofrenzy.ui.screens.sos

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.geofrenzy.ui.theme.*

// ============================================
// SOSScreen.kt
// Emergency SOS screen — pulsing red button
// that broadcasts user location to all friends.
// ============================================

@Composable
fun SOSScreen(
    onSendSOS: (message: String) -> Unit,
    onResolve: () -> Unit,
    onBack: () -> Unit
) {
    var sosSent by remember { mutableStateOf(false) }
    var customMessage by remember { mutableStateOf("") }
    val pulseAnim = rememberInfiniteTransition(label = "pulse")
    val scale by pulseAnim.animateFloat(
        initialValue = 1f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0x60FF3B30), Background),
                    radius = 600f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(32.dp)
        ) {
            Text("Emergency SOS", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Your location will be instantly shared\nwith ALL of your friends",
                color = TextSecondary,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodyMedium
            )

            Spacer(modifier = Modifier.height(40.dp))

            if (!sosSent) {
                // Pulsing SOS Button
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.size(200.dp)
                ) {
                    // Outer glow pulse ring
                    Box(
                        modifier = Modifier
                            .size(200.dp)
                            .scale(scale)
                            .clip(CircleShape)
                            .background(Color(0x40FF3B30))
                    )
                    // Inner button
                    Button(
                        onClick = {
                            sosSent = true
                            onSendSOS(customMessage.ifBlank { "🆘 I need help! This is an emergency!" })
                        },
                        modifier = Modifier.size(150.dp),
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(containerColor = SOSRed),
                        elevation = ButtonDefaults.buttonElevation(12.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("🆘", fontSize = 36.sp)
                            Text("SOS", fontWeight = FontWeight.ExtraBold, fontSize = 24.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Optional custom message
                OutlinedTextField(
                    value = customMessage,
                    onValueChange = { customMessage = it },
                    label = { Text("Custom message (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = SOSRed,
                        unfocusedBorderColor = GlassBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = SOSRed,
                    )
                )
            } else {
                // SOS Sent confirmation
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF00E676)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(80.dp))
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text("SOS Sent!", fontWeight = FontWeight.Bold, fontSize = 28.sp, color = OnlineGreen)
                Text("Your friends have been notified", color = TextSecondary)

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = { sosSent = false; onResolve() },
                    colors = ButtonDefaults.buttonColors(containerColor = OnlineGreen),
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text("✅ I'm Safe Now", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            TextButton(onClick = onBack) {
                Text("← Go Back", color = TextSecondary)
            }
        }
    }
}
