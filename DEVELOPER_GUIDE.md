# GeoFrenzy — Comprehensive Developer Guide
> **Last Updated**: February 20, 2026
> **For**: New developers onboarding to the project

---

## 📌 Table of Contents
1. [What is GeoFrenzy?](#1-what-is-geofrenzy)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Current Status — What's Done & What's Not](#5-current-status)
6. [Remaining Tasks (To-Do List)](#6-remaining-tasks)
7. [Feature Breakdown](#7-feature-breakdown)
8. [UI/UX Design Specification](#8-uiux-design-specification)
9. [How to Run the Project Locally](#9-how-to-run-the-project-locally)
10. [Environment Configuration](#10-environment-configuration)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Battery Optimization Logic](#12-battery-optimization-logic)
13. [Verification & Testing Plan](#13-verification--testing-plan)
14. [Key Design Decisions](#14-key-design-decisions)

---

## 1. What is GeoFrenzy?

**GeoFrenzy** is a real-time friend-location and weather-sharing Android application. It lets friends see each other on a live map, receive "Nearby" pop-up notifications when they are within 500m, share current weather conditions, and send emergency SOS alerts — all at **zero cost** using free-tier services.

### Core Features
| Feature | Description |
|---|---|
| 📍 Live Friend Map | See friends' real-time locations on an OpenStreetMap-powered map |
| 🔔 Nearby Pop Notification | Get alerted when a friend comes within 500m of you |
| ☁️ Weather Sharing | View and share your live weather conditions with friends |
| 🚨 Emergency SOS | One-tap emergency alert that vibrates all friends' phones |
| 🗓️ Meeting History | Automatic log of when/where you met a friend (>5 min, <50m) |
| 🗺️ Meeting Point Finder | Suggests a café or park halfway between you and a friend |
| 🎭 Ghost Mode | Temporarily hide your location from everyone |
| 🛣️ On My Way (ETA) | Share live ETA/route to a friend's location |

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────┐
│             📱 Android App (Kotlin)           │
│   Jetpack Compose + OSMDroid + Retrofit +     │
│              Socket.io Client                 │
└──────────────┬───────────────────────────────┘
               │  REST (HTTP) + WebSocket
               ▼
┌──────────────────────────────────────────────┐
│           🌐 Node.js Server (Express)         │
│    Auth / Location / Weather / Friends / SOS  │
│              + Socket.io Server               │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┼───────────┐
       ▼       ▼           ▼
  🗄️ MongoDB  ☁️ OpenWeather  🗺️ OpenStreetMap
  (Atlas Free) (Free API)     (OSM / Overpass)
```

### Real-Time Event Flow
```
Phone A moves → REST POST /api/location/update
→ Server calculates Haversine distance to all friends
→ If distance < 500m → Server emits Socket.io "nearbyAlert"
→ Phone B receives push notification instantly
```

---

## 3. Tech Stack

### ⚠️ Zero-Cost Constraint
All services used are 100% free with no credit card required.

| Layer | Technology | Why Chosen |
|---|---|---|
| **Android Language** | Kotlin | Modern, official Android language |
| **Android UI** | Jetpack Compose + Material3 | Declarative, modern UI framework |
| **Maps** | OSMDroid (OpenStreetMap) | Free, no API key needed |
| **HTTP Client** | Retrofit 2 | Industry standard REST client for Android |
| **Real-time** | Socket.io (client + server) | Faster than polling, battery-friendly |
| **Backend Runtime** | Node.js 18+ (Express) | Lightweight, fast, JavaScript |
| **Database** | MongoDB Atlas Free Tier | 512MB free forever |
| **Hosting** | Render.com or Fly.io | Free tier available |
| **Authentication** | JWT (jsonwebtoken) | Stateless, no session server needed |
| **Geocoding** | Nominatim (OSM) | Free reverse geocoding |
| **Routing/ETA** | OSRM (Open Source Routing Machine) | Free, no API key |
| **Weather** | OpenWeatherMap (Free Tier) | 1,000 calls/day free |
| **Local Storage** | DataStore (Android) | Modern replacement for SharedPreferences |
| **Offline DB** | Room (pending) | SQLite wrapper for offline mode |

---

## 4. Project Structure

```
d:/Github/Test/
├── backend/                          ← 🌐 Node.js REST + Socket.io Server
│   ├── .env                          ← 🔑 Secrets (MongoDB URI, JWT secret, Weather API key)
│   ├── .env.example                  ← Template for new developers
│   ├── server.js                     ← Entry point (starts Express + Socket.io)
│   ├── config/
│   │   └── db.js                     ← MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js         ← Register, Login, Google OAuth
│   │   ├── locationController.js     ← Update location, get friends, proximity engine
│   │   ├── weatherController.js      ← Fetch & proxy weather from OpenWeatherMap
│   │   ├── friendsController.js      ← Add/remove friends, ghost mode, meeting point
│   │   └── sosController.js          ← Send SOS, resolve SOS
│   ├── models/
│   │   ├── User.js                   ← User schema (name, email, password, friends[])
│   │   ├── Location.js               ← Location schema (userId, lat, lng, timestamp)
│   │   ├── MeetingHistory.js         ← Meeting log (userA, userB, place, duration)
│   │   └── SOSAlert.js               ← SOS schema (sender, message, resolved)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── weatherRoutes.js
│   │   ├── friendsRoutes.js
│   │   └── sosRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js         ← JWT verification (protects all private routes)
│   └── utils/
│       ├── haversine.js              ← Distance calculation (lat/lng → meters)
│       └── jwtHelper.js             ← Token generation & verification helpers
│
└── android/                          ← 📱 Android App (Kotlin + Jetpack Compose)
    ├── build.gradle.kts              ← Project-level Gradle config
    ├── settings.gradle.kts           ← Module definition
    ├── gradle/libs.versions.toml     ← Centralized dependency versions (TOML catalog)
    └── app/
        ├── build.gradle.kts          ← App-level dependencies + build config
        └── src/main/
            ├── AndroidManifest.xml   ← Permissions, services, activities declared here
            ├── res/values/
            │   ├── strings.xml
            │   └── themes.xml
            └── java/com/geofrenzy/
                ├── GeoFrenzyApp.kt   ← Application class (OSMDroid init)
                ├── MainActivity.kt   ← Single Activity, auto-login check
                ├── data/
                │   ├── api/
                │   │   ├── ApiService.kt       ← All REST endpoint declarations (Retrofit)
                │   │   └── ApiClient.kt        ← Retrofit builder + JWT auth interceptor
                │   ├── local/
                │   │   └── PreferenceManager.kt ← DataStore wrapper (token storage)
                │   └── model/
                │       └── Models.kt           ← All Kotlin data classes (User, Location, etc.)
                ├── services/
                │   └── LocationTrackingService.kt ← Battery-optimized foreground GPS service
                ├── utils/
                │   └── SocketManager.kt        ← Socket.io client (singleton)
                └── ui/
                    ├── theme/
                    │   ├── Color.kt            ← Dark blue/purple/pink palette
                    │   ├── Type.kt             ← Typography (Inter font)
                    │   └── Theme.kt            ← Material3 dark theme definition
                    ├── navigation/
                    │   └── AppNavigation.kt    ← NavHost with 5 routes
                    └── screens/
                        ├── auth/
                        │   └── LoginScreen.kt  ← Login + Register with glassmorphism
                        ├── map/
                        │   └── MapScreen.kt    ← Full-screen OSM map + friend markers
                        ├── sos/
                        │   └── SOSScreen.kt    ← Pulsing SOS button + "I'm Safe" confirm
                        ├── weather/
                        │   └── WeatherScreen.kt ← Dynamic gradient weather card
                        └── history/
                            └── HistoryScreen.kt ← Meeting log (cards)
```

---

## 5. Current Status

### ✅ Phase 1: Planning & Design — COMPLETE
- Feature set and requirements defined
- System architecture designed (zero-cost services)
- UI/UX wireframes created (see Section 8)
- Tech stack finalized
- Beginner-friendly folder structure laid out

### ✅ Phase 2: Backend Development — COMPLETE
All backend code lives in `d:/Github/Test/backend/`.

| Component | File | Status |
|---|---|---|
| Auth API (Register/Login) | `controllers/authController.js` | ✅ Done |
| Location API (Update/Proximity) | `controllers/locationController.js` | ✅ Done |
| Weather API Wrapper | `controllers/weatherController.js` | ✅ Done |
| Friends API (Add/Remove/Ghost/Meeting Point) | `controllers/friendsController.js` | ✅ Done |
| SOS API (Send/Resolve) | `controllers/sosController.js` | ✅ Done |
| MongoDB Models | `models/*.js` | ✅ Done |
| Routes | `routes/*.js` | ✅ Done |
| JWT Middleware | `middleware/authMiddleware.js` | ✅ Done |
| Haversine Distance Util | `utils/haversine.js` | ✅ Done |
| Socket.io (Nearby, Weather, SOS, ETA events) | `server.js` | ✅ Done |

### ✅ Phase 3 (Partial): Android App Scaffold — COMPLETE
The Android project is initialized at `d:/Github/Test/android/` with the foundation fully built.

| Component | File | Status |
|---|---|---|
| Android Studio project initialized | `android/` | ✅ Done |
| Gradle / dependency catalog | `gradle/libs.versions.toml` | ✅ Done |
| Material3 dark theme + colors | `ui/theme/` | ✅ Done |
| All data models (Kotlin) | `data/model/Models.kt` | ✅ Done |
| Retrofit API client + interceptor | `data/api/ApiClient.kt` | ✅ Done |
| All REST endpoint declarations | `data/api/ApiService.kt` | ✅ Done |
| DataStore (token storage) | `data/local/PreferenceManager.kt` | ✅ Done |
| Battery-optimized GPS Service | `services/LocationTrackingService.kt` | ✅ Done |
| Socket.io Manager (singleton) | `utils/SocketManager.kt` | ✅ Done |
| Navigation graph (5 routes) | `ui/navigation/AppNavigation.kt` | ✅ Done |
| Login Screen (UI scaffold) | `ui/screens/auth/LoginScreen.kt` | ✅ Scaffolded |
| Map Screen (UI scaffold) | `ui/screens/map/MapScreen.kt` | ✅ Scaffolded |
| SOS Screen (UI scaffold) | `ui/screens/sos/SOSScreen.kt` | ✅ Scaffolded |
| Weather Screen (UI scaffold) | `ui/screens/weather/WeatherScreen.kt` | ✅ Scaffolded |
| History Screen (UI scaffold) | `ui/screens/history/HistoryScreen.kt` | ✅ Scaffolded |

> **Note**: Screen files are scaffolded (structure exists) but need full UI implementation and API wiring.

### ❌ Phase 3 (Remaining) + Phase 4 & 5 — TODO
See Section 6 below.

---

## 6. Remaining Tasks

> This is the prioritized backlog. Work top-to-bottom.

### 🔴 Priority 1 — Android Screen Implementation (Phase 3)

#### Screen: `LoginScreen.kt`
- [ ] Build email/password form with validation
- [ ] Wire "Login" button → `ApiService.login()` → save JWT via `PreferenceManager`
- [ ] Build "Register" form (toggle below login)
- [ ] Wire "Register" button → `ApiService.register()`
- [ ] Add Google OAuth button (using Google Sign-In SDK)
- [ ] On success → navigate to `MapScreen`
- [ ] Show loading spinner during API calls
- [ ] Show error messages (wrong password, user not found)

#### Screen: `MapScreen.kt`
- [ ] Embed OSMDroid `MapView` into Compose (via `AndroidView`)
- [ ] Show user's own live location pin (updates in real-time from `LocationTrackingService`)
- [ ] Fetch friend locations from API (`ApiService.getFriendLocations()`)
- [ ] Place friend avatars as custom map markers
- [ ] Connect `SocketManager` to receive `nearbyAlert` event → show pop-up notification
- [ ] Add "Ghost Mode" toggle switch in the top bar
- [ ] Add swipeable bottom sheet listing nearby friends with distance
- [ ] Add long-press SOS FAB (navigates to `SOSScreen`)

#### Screen: `WeatherScreen.kt`
- [ ] Fetch user's own weather from API
- [ ] Display dynamic gradient background (blue for cold, orange for hot, grey for rain)
- [ ] Show temperature, condition, wind speed, humidity
- [ ] "Share with Friend" button → call `ApiService.shareWeather(friendId)`
- [ ] Receive shared weather via `SocketManager.onWeatherShare()`

#### Screen: `SOSScreen.kt`
- [ ] Display large pulsing SOS button with animation (ring expanding out)
- [ ] On tap → call `ApiService.sendSOS(message)` → emit socket event
- [ ] Text field for custom message ("I'm at the station")
- [ ] "I'm Safe" button → calls `ApiService.resolveSOS(id)`
- [ ] Show countdown "SOS sent 00:30 ago"

#### Screen: `HistoryScreen.kt`
- [ ] Fetch meeting history from API (`ApiService.getMeetingHistory()`)
- [ ] Display each meeting as a card (friend name, location name, date, duration)
- [ ] Pull-to-refresh
- [ ] Empty state placeholder ("No meetings yet")

### 🟡 Priority 2 — Advanced Features (Phase 4)

- [ ] **"On My Way" ETA Feature**
  - [ ] Search bar for destination (using Nominatim / OSM geocoding)
  - [ ] Select which friend to notify
  - [ ] Calculate route + ETA using OSRM
  - [ ] Emit `onMyWay` socket event every 30 seconds with updated ETA
  - [ ] Receiving friend sees countdown banner on their `MapScreen`

- [ ] **Meeting Point Finder**
  - [ ] Calculate midpoint from User A & B coordinates
  - [ ] Call Overpass API (OSM) to find nearby cafés or parks
  - [ ] Display results as list with map tap-to-navigate

- [ ] **Offline Mode (Room Database)**
  - [ ] Add Room dependency to `build.gradle.kts`
  - [ ] Create `FriendLocationEntity` and `DAO`
  - [ ] Cache last known friend locations locally
  - [ ] On network loss, show cached data with "Offline" badge

### 🟢 Priority 3 — Testing & Deployment (Phase 5)

- [ ] **Backend Tests**
  - [ ] Unit test Haversine formula (500m should trigger alert, 501m should not)
  - [ ] API integration tests for auth flow

- [ ] **Android Tests**
  - [ ] Verify `LocationTrackingService` pauses GPS when stationary
  - [ ] Verify JWT token is stored and sent on all requests

- [ ] **End-to-End Test**
  - [ ] Run 2 emulators side-by-side
  - [ ] Set both to the same GPS coordinates
  - [ ] Confirm "Nearby!" notification appears on both

- [ ] **Deployment**
  - [ ] Deploy backend to Render.com or Fly.io
  - [ ] Update `ApiClient.kt` base URL to production server URL
  - [ ] Test against live server

---

## 7. Feature Breakdown

### How Each Feature Works (Logic)

| Feature | Trigger | Processing | Output |
|---|---|---|---|
| **Nearby Alert** | Phone sends GPS to server | Server runs Haversine → < 500m? | Socket.io push to both phones |
| **Weather Sharing** | User taps "Share" | Server forwards to friend via socket | Friend sees weather card pop-up |
| **SOS** | User taps SOS button | Server broadcasts to all friends | All friends get vibration + alert |
| **Meeting Log** | Both users < 50m for 5+ min | Server saves `MeetingHistory` record | Appears in History screen |
| **Ghost Mode** | User toggles switch | Server stops returning their location | Friends see "Offline" for that user |
| **On My Way** | User starts sharing route | Client pings server with ETA every 30s | Friend sees live countdown |
| **Meeting Point** | User taps "Meet in Middle" | Midpoint → Overpass API → venues | List of suggested spots |

---

## 8. UI/UX Design Specification

### Design Language
- **Theme**: Dark Mode primary
- **Style**: Glassmorphism cards, vibrant gradients
- **Colors**: Blue/Purple/Pink palette (defined in `Color.kt`)
- **Typography**: Inter font (clean, modern)
- **Animations**: Smooth screen transitions, pulsing SOS, spinning weather icons, avatar glow when online

### User Flows

#### Onboarding Flow
```
App Launch → Check for saved JWT token
  ├── Token exists & valid → Go directly to MapScreen
  └── No token → Show LoginScreen → Permissions dialog → MapScreen
```

#### Nearby Notification Flow
```
Phone GPS updates → REST POST to server
→ Server checks Haversine distance to all friends
→ distance < 500m → Socket.io "nearbyAlert" event
→ Android receives event → System Notification + in-app pop-up
→ User taps notification → MapScreen centers on friend
→ "Meet Up?" button appears
```

### Screen Design Reference

| Screen | Key Visual Elements |
|---|---|
| **LoginScreen** | Blurred animated map background, glassmorphism card, gradient "Login" button |
| **MapScreen** | Full-screen OSM dark map, glowing friend avatars, floating top bar, swipeable bottom sheet |
| **WeatherScreen** | Full-screen dynamic gradient, large temperature text, animated weather icon, share button |
| **SOSScreen** | Dark background, large red pulsing ring animation, custom message field, "I'm Safe" button |
| **HistoryScreen** | Card list, friend photo, location pin icon, date/duration details |

---

## 9. How to Run the Project Locally

### Step 1: Start the Backend

```bash
# Navigate to backend folder
cd d:/Github/Test/backend

# Install dependencies (first time only)
npm install

# Start dev server (auto-restarts on file change)
npm run dev
```

> Server starts on **http://localhost:5000**

### Step 2: Open the Android App

1. Open **Android Studio** (version Hedgehog or later recommended)
2. Click **"Open"** → select `d:/Github/Test/android/`
3. Wait for Gradle sync (~2–5 minutes on first run)
4. Start an **Android Emulator** (API Level 26 / Android 8.0 minimum)
5. Press the **▶ Run** button

> **Emulator note**: The base URL in `ApiClient.kt` is set to `http://10.0.2.2:5000` — Android's special loopback address that maps to `localhost` on your PC.

---

## 10. Environment Configuration

### Backend `.env` File

The file lives at `d:/Github/Test/backend/.env`. Copy from `.env.example` and fill in your values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas (Free Tier)
# Get from: https://cloud.mongodb.com → Connect → Drivers
MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DBNAME>

# JWT — use any long random string
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# OpenWeatherMap (Free API key)
# Register at: https://openweathermap.org/api
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Google OAuth (Optional for social login)
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Android API Base URL

Location: `d:/Github/Test/android/app/src/main/java/com/geofrenzy/data/api/ApiClient.kt`

```kotlin
// For emulator:
private const val BASE_URL = "http://10.0.2.2:5000/api/"

// For physical phone on same Wi-Fi — change to your PC's local IP:
// private const val BASE_URL = "http://192.168.1.X:5000/api/"

// For production deployment:
// private const val BASE_URL = "https://your-app.onrender.com/api/"
```

---

## 11. API Endpoints Reference

### Auth Routes (`/api/auth`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register with email + password |
| POST | `/api/auth/login` | No | Login, returns JWT token |
| POST | `/api/auth/google` | No | Google OAuth login |

### Location Routes (`/api/location`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/location/update` | Yes | Send current GPS coordinates |
| GET | `/api/location/friends` | Yes | Get all friends' current locations |
| GET | `/api/location/history` | Yes | Get own location history |

### Weather Routes (`/api/weather`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/api/weather/current` | Yes | Get weather at current location |
| POST | `/api/weather/share/:friendId` | Yes | Share weather with a friend |

### Friends Routes (`/api/friends`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/api/friends` | Yes | Get friends list |
| POST | `/api/friends/add` | Yes | Send friend request |
| DELETE | `/api/friends/:id` | Yes | Remove a friend |
| POST | `/api/friends/ghost` | Yes | Toggle ghost mode |
| GET | `/api/friends/meeting-point/:friendId` | Yes | Get suggested meeting point |

### SOS Routes (`/api/sos`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/sos/send` | Yes | Broadcast SOS to all friends |
| POST | `/api/sos/resolve/:id` | Yes | Mark SOS as resolved |

### Socket.io Events
| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `nearbyAlert` | Server → Client | `{ friendName, distance }` | Friend is within 500m |
| `weatherShare` | Server → Client | `{ from, weatherData }` | Friend shared their weather |
| `sosAlert` | Server → Client | `{ from, message, location }` | Emergency SOS received |
| `onMyWay` | Server → Client | `{ from, eta, route }` | Friend is heading to you |
| `batteryLow` | Client → Server | `{ batteryLevel }` | Notify server to reduce GPS calls |

---

## 12. Battery Optimization Logic

The `LocationTrackingService.kt` runs as a foreground Android service and automatically adjusts GPS frequency based on movement:

| Movement State | Detection | GPS Interval |
|---|---|---|
| **Fast moving** | Speed > 5 m/s (~18 km/h) | Every **30 seconds** |
| **Slow moving** | Speed 1–5 m/s | Every **1 minute** |
| **Stationary** | Speed < 1 m/s for 5+ minutes | **Paused entirely** |

This dramatically reduces battery drain compared to constant GPS polling.

---

## 13. Verification & Testing Plan

### Backend Tests
```bash
# Test that 500m triggers alert but 501m does not (in haversine.test.js)
npm test
```

### Android Tests
- Verify `LocationTrackingService` actually pauses when device is stationary
- Verify JWT token is passed on every authenticated request (check in ApiClient interceptor)

### End-to-End Simulation
1. Start backend: `npm run dev`
2. Launch 2 Android emulators
3. Set Emulator 1 GPS: Latitude `23.8041`, Longitude `90.4152`
4. Set Emulator 2 GPS: Latitude `23.8041`, Longitude `90.4152` (same coordinates)
5. Expected: Both phones receive `nearbyAlert` Socket.io event within 2 seconds
6. Move Emulator 2 GPS more than 500m away → alert should clear

---

## 14. Key Design Decisions

| Decision | Choice Made | Reason |
|---|---|---|
| Maps | OSMDroid (OpenStreetMap) instead of Google Maps | Zero cost, no API key, completely free |
| Database | MongoDB Atlas Free Tier | 512MB free, flexible schema for location data |
| Real-time | Socket.io instead of HTTP polling | Lower latency, battery-friendly, bidirectional |
| UI | Jetpack Compose instead of XML layouts | Modern, less code, animation-friendly |
| Auth | JWT (stateless) instead of sessions | Works with REST APIs, no server-side session storage |
| Routing (ETA) | OSRM instead of Google Directions API | Completely free, open-source |
| Geocoding | Nominatim (OSM) instead of Google Places | Free, no quota limits for reasonable use |
| Architecture | Single Activity + Navigation Compose | Simpler, modern, avoids Fragment-back-stack complexity |
| Local Storage | DataStore instead of SharedPreferences | Coroutine-safe, recommended by Google for new apps |

---

*This document is a living guide. Update it whenever a new feature is added, a task is completed, or an architectural decision changes.*
