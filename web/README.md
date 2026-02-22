# Geofranzy Web Application

A simplified web version of the Geofranzy mobile app - real-time friend location sharing and emergency alerts.

## Features

- 🗺️ **Real-time Map** - See your friends' locations on an interactive map
- 🆘 **Emergency SOS** - Send emergency alerts to all friends
- 👻 **Ghost Mode** - Hide your location when needed
- 📍 **Location Tracking** - Automatic location updates
- 📅 **Meeting History** - Auto-logged meeting records
- 👥 **Friend Management** - Add, accept, and remove friends

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Maps**: Leaflet / React-Leaflet
- **State**: Zustand
- **Backend**: Firebase (Firestore, Auth, Functions)
- **Routing**: React Router v6
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+ and npm
- Firebase project (same as mobile app)
- Modern web browser with geolocation support

## Installation

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Environment

Create a `.env` file in the `web` directory:

```bash
cp .env.example .env
```

Update `.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize hosting (from `web` directory):
```bash
firebase init hosting
```

Select options:
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No`

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
npm run build
vercel --prod
```

### Deploy to Netlify

1. Build the app:
```bash
npm run build
```

2. Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## Project Structure

```
web/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   └── Layout.tsx   # Main layout with navigation
│   ├── pages/           # Page components
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MapPage.tsx
│   │   ├── SOSPage.tsx
│   │   ├── HistoryPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/        # API and Firebase services
│   │   ├── firebase.ts
│   │   └── firestoreService.ts
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useLocation.ts
│   ├── store/           # Zustand state management
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   └── location.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.js   # Tailwind CSS config
├── vite.config.ts       # Vite configuration
└── README.md            # This file
```

## Features Overview

### Dashboard
- Overview of friends and active alerts
- Quick stats (total friends, nearby friends, active SOS)
- Interactive map preview
- Real-time SOS alert notifications

### Map
- Full-screen interactive map
- See all friends' locations in real-time
- 500m proximity circle
- Distance to each friend
- Filter ghost mode users

### SOS Emergency
- Send emergency alerts to all friends
- Optional custom message
- Share exact location
- View and resolve active alerts

### Meeting History
- Auto-logged meetings with friends
- View past meetings with details
- Duration and location information
- Export to Google Maps

### Profile
- Update display name
- Toggle ghost mode
- Manage friends (add, accept, remove)
- View pending friend requests

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required**: Geolocation API support

## Security

- Firebase Authentication for user management
- Firestore Security Rules for data protection
- HTTPS required for geolocation
- Environment variables for API keys

## Performance

- Code splitting with React lazy loading
- Optimized map rendering
- Efficient state management with Zustand
- Production build minification

## Troubleshooting

### Location not working
- Ensure HTTPS (required for geolocation)
- Check browser permissions
- Allow location access when prompted

### Firebase connection issues
- Verify `.env` configuration
- Check Firebase project settings
- Ensure Firestore rules allow access

### Build errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Update dependencies: `npm update`

## Contributing

See the main project [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT - See LICENSE file

---

**Part of the Geofranzy Project**  
[Mobile App](../) • [Firebase Functions](../firebase/) • **Web App** (you are here)
