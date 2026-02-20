package com.geofrenzy.ui.screens.map

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.geofrenzy.data.model.FriendLocation
import com.geofrenzy.ui.theme.*
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker

// ============================================
// MapScreen.kt
// Main screen — shows OpenStreetMap with all
// friends' locations and a friends list panel.
// ============================================

@Composable
fun MapScreen(
    currentUserId: String,
    friendLocations: List<FriendLocation> = emptyList(),
    isGhostMode: Boolean = false,
    onGhostModeToggle: () -> Unit = {},
    onSOSPress: () -> Unit = {},
    onFriendClick: (FriendLocation) -> Unit = {}
) {
    val context = LocalContext.current
    var showFriendPanel by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {

        // ---- FULL SCREEN MAP (OpenStreetMap) ----
        OSMMapView(
            modifier = Modifier.fillMaxSize(),
            friendLocations = friendLocations,
            context = context
        )

        // ---- TOP FLOATING BAR ----
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // App Title
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(GlassSurface)
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Text(
                    "📍 GeoFrenzy",
                    color = Blue60,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            // Ghost Mode Toggle
            FloatingActionButton(
                onClick = onGhostModeToggle,
                modifier = Modifier.size(48.dp),
                containerColor = if (isGhostMode) SurfaceMedium else Blue40,
                elevation = FloatingActionButtonDefaults.elevation(4.dp)
            ) {
                Icon(
                    if (isGhostMode) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                    contentDescription = "Ghost Mode",
                    tint = if (isGhostMode) TextSecondary else Color.White
                )
            }
        }

        // ---- FRIENDS NEARBY COUNT BADGE ----
        if (friendLocations.isNotEmpty()) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 80.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.horizontalGradient(listOf(Blue40, Purple60)))
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Text(
                    "🟢 ${friendLocations.size} friend(s) nearby",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
            }
        }

        // ---- BOTTOM PANEL ----
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        ) {
            // Pull Tab
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(4.dp)
                        .clip(CircleShape)
                        .background(GlassBorder)
                        .clickable { showFriendPanel = !showFriendPanel }
                )
            }
            Spacer(modifier = Modifier.height(8.dp))

            // Friends Panel (collapsible)
            AnimatedVisibility(
                visible = showFriendPanel,
                enter = slideInVertically { it },
                exit = slideOutVertically { it }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                        .background(SurfaceDark)
                        .padding(16.dp)
                ) {
                    Column {
                        Text("Friends Nearby", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        if (friendLocations.isEmpty()) {
                            Text("No friends nearby right now.", color = TextSecondary)
                        } else {
                            LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
                                items(friendLocations) { loc ->
                                    FriendListItem(loc, onClick = { onFriendClick(loc) })
                                }
                            }
                        }
                    }
                }
            }
        }

        // ---- SOS FAB (Bottom Right) ----
        FloatingActionButton(
            onClick = onSOSPress,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp, 80.dp),
            containerColor = SOSRed,
            shape = CircleShape
        ) {
            Text("🆘", fontSize = 22.sp)
        }
    }
}

// ---- OpenStreetMap Composable ----
@Composable
fun OSMMapView(
    modifier: Modifier = Modifier,
    friendLocations: List<FriendLocation>,
    context: Context
) {
    Configuration.getInstance().userAgentValue = "GeoFrenzy/1.0"

    AndroidView(
        factory = { ctx ->
            MapView(ctx).apply {
                setTileSource(TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)
                controller.setZoom(15.0)
                controller.setCenter(GeoPoint(23.8103, 90.4125)) // Dhaka default
            }
        },
        update = { mapView ->
            mapView.overlays.clear()
            // Add a marker for each friend
            friendLocations.forEach { loc ->
                val marker = Marker(mapView).apply {
                    position = GeoPoint(loc.latitude, loc.longitude)
                    title = loc.user.name
                    snippet = "📍 ${loc.user.name}"
                }
                mapView.overlays.add(marker)
            }
            mapView.invalidate()
        },
        modifier = modifier
    )
}

// ---- Friend List Row ----
@Composable
fun FriendListItem(loc: FriendLocation, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(Blue40),
            contentAlignment = Alignment.Center
        ) {
            Text(loc.user.name.first().toString(), color = Color.White, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(loc.user.name, fontWeight = FontWeight.SemiBold)
            Text("Updated recently", style = MaterialTheme.typography.bodySmall)
        }
        // Battery indicator
        loc.user.batteryLevel?.let { battery ->
            val batteryColor = when {
                battery > 50 -> OnlineGreen
                battery > 20 -> WarningAmber
                else -> SOSRed
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(SurfaceLight)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text("🔋 $battery%", color = batteryColor, fontSize = 12.sp)
            }
        }
        Spacer(modifier = Modifier.width(8.dp))
        Icon(Icons.Default.ChevronRight, null, tint = TextSecondary)
    }
}
