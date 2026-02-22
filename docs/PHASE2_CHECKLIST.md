# Phase 2 Quick Reference

Quick reference for deploying Firebase backend for Geofranzy.

---

## Prerequisites

- [ ] Firebase account created
- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Google Cloud SDK installed (for scheduler only)
- [ ] Node.js 18+ installed

---

## Deployment Steps

### 1. Create Firebase Project (10 min)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: `geofranzy`
3. Enable services:
   - [ ] Authentication (Email/Password)
   - [ ] Firestore Database (production mode)
   - [ ] Storage (production mode)
   - [ ] Cloud Functions (upgrade to Blaze plan)
   - [ ] Cloud Messaging

### 2. Configure App (5 min)

1. Get Firebase config from Project Settings
2. Create `.env` file in project root
3. Add Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
```

### 3. Deploy Firebase (10-15 min)

**Windows:**
```powershell
.\deploy.ps1
```

**macOS/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

This deploys:
- [ ] Firestore security rules
- [ ] Firestore indexes (8 indexes)
- [ ] Storage rules
- [ ] Cloud Functions (9 functions)

### 4. Setup Cloud Scheduler (5 min) - Optional

**Windows:**
```powershell
.\setup-scheduler.ps1
```

**macOS/Linux:**
```bash
chmod +x setup-scheduler.sh
./setup-scheduler.sh
```

---

## Verification

### Firestore
- [ ] Go to Firestore → Rules → See published rules
- [ ] Go to Firestore → Indexes → See 8 indexes

### Storage
- [ ] Go to Storage → Rules → See published rules

### Cloud Functions
- [ ] Go to Functions → See 9 healthy functions

### Cloud Scheduler (if set up)
- [ ] Go to [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler)
- [ ] See `auto-log-meetings` job enabled

### Test App
```bash
npm install
npm run start
```

- [ ] Sign up works
- [ ] Login works
- [ ] Profile created in Firestore
- [ ] Location updates saved

---

## Deployed Functions

1. `handleLocationUpdate` - Proximity detection
2. `broadcastSOSAlert` - Emergency notifications
3. `resolveSOSAlert` - SOS resolution
4. `notifyFriendRequest` - Friend request alerts
5. `notifyFriendRequestAccepted` - Acceptance notifications
6. `autoLogMeetings` - Auto-log meetings (scheduled)
7. `initializeUserProfile` - User initialization
8. `cleanupUserData` - User cleanup
9. `notifyWeatherShare` - Weather share alerts

---

## Common Issues

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Not authenticated"
```bash
firebase login
```

### "Permission denied"
- Check IAM permissions (need Editor or Owner role)
- Verify you're logged in: `firebase login --reauth`

### Indexes still "Building"
- Wait 5-15 minutes for first build
- Check status: `firebase firestore:indexes`

### Cloud Functions deployment fails
- Ensure Blaze plan is enabled
- Check Node version: `node --version` (need 18+)
- Install dependencies: `cd firebase/functions && npm install`

---

## Cost Estimate

**Free Tier** (Monthly):
- Firestore: 50K reads, 20K writes
- Functions: 2M invocations
- Storage: 5GB

**Typical Usage** (10-20 users): **$0/month**
**Production** (1,000 users): **~$7/month**

---

## Files Created in Phase 2

- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Composite indexes
- `storage.rules` - Storage security rules
- `deploy.ps1` / `deploy.sh` - Deployment scripts
- `setup-scheduler.ps1` / `setup-scheduler.sh` - Scheduler setup
- `PHASE2_GUIDE.md` - Detailed guide
- `PHASE2_REPORT.md` - Implementation report

---

## Next Steps

After Phase 2:
1. Test app with real users
2. Monitor Firebase Console
3. Check Cloud Functions logs
4. Review billing dashboard

Optional Phase 3:
- Advanced UI/UX
- Offline support
- Analytics integration
- Production hardening

---

**Full Guide**: See [PHASE2_GUIDE.md](./PHASE2_GUIDE.md)
**Support**: Check troubleshooting section in guide
