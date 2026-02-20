package com.geofrenzy.ui.screens.auth

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.geofrenzy.ui.theme.*

// ============================================
// LoginScreen.kt
// Clean, premium login/register screen.
// Supports: Email/Password + Google OAuth
// ============================================

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit
) {
    var isLoginMode by remember { mutableStateOf(true) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Background, Color(0xFF0F1F3D), Background)
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // --- App Logo / Title ---
            Text(
                text = "📍 GeoFrenzy",
                fontSize = 40.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Blue60,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Stay connected with your friends",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = TextSecondary
            )

            Spacer(modifier = Modifier.height(40.dp))

            // --- Glass Card ---
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(GlassSurface)
                    .padding(24.dp)
            ) {
                Column {
                    // Tab switcher
                    Row(Modifier.fillMaxWidth()) {
                        listOf("Login", "Register").forEachIndexed { index, label ->
                            val selected = (index == 0) == isLoginMode
                            TextButton(
                                onClick = { isLoginMode = index == 0 },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    label,
                                    color = if (selected) Blue60 else TextSecondary,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 16.sp
                                )
                            }
                        }
                    }
                    Divider(color = GlassBorder)
                    Spacer(modifier = Modifier.height(16.dp))

                    // Name field (register only)
                    AnimatedVisibility(visible = !isLoginMode) {
                        Column {
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = { Text("Full Name") },
                                modifier = Modifier.fillMaxWidth(),
                                leadingIcon = { Icon(Icons.Default.Person, null, tint = Blue60) },
                                colors = geoTextFieldColors()
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }
                    }

                    // Email
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        modifier = Modifier.fillMaxWidth(),
                        leadingIcon = { Icon(Icons.Default.Email, null, tint = Blue60) },
                        colors = geoTextFieldColors()
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Password
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        visualTransformation = PasswordVisualTransformation(),
                        leadingIcon = { Icon(Icons.Default.Lock, null, tint = Blue60) },
                        colors = geoTextFieldColors()
                    )

                    // Error
                    errorMessage?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(it, color = SOSRed, style = MaterialTheme.typography.bodySmall)
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Submit Button
                    Button(
                        onClick = {
                            // TODO: Hook up to ViewModel auth logic
                            onLoginSuccess()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Blue40),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                if (isLoginMode) "Login" else "Create Account",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Divider
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Divider(modifier = Modifier.weight(1f), color = GlassBorder)
                        Text("  or  ", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                        Divider(modifier = Modifier.weight(1f), color = GlassBorder)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Google Button
                    OutlinedButton(
                        onClick = { /* TODO: Google Sign In */ },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = TextPrimary
                        ),
                        border = ButtonDefaults.outlinedButtonBorder.copy(
                            width = 1.dp
                        )
                    ) {
                        Text("🔑  Continue with Google", fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
    }
}

// Reusable text field color scheme
@Composable
private fun geoTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Blue60,
    unfocusedBorderColor = GlassBorder,
    focusedLabelColor = Blue60,
    unfocusedLabelColor = TextSecondary,
    focusedTextColor = TextPrimary,
    unfocusedTextColor = TextPrimary,
    cursorColor = Blue60,
)
