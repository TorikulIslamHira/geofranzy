/**
 * PWA (Progressive Web App) Implementation Guide
 * Complete PWA setup for GeoFrenzy
 */

/**
 * ==========================================
 * OVERVIEW
 * ==========================================
 */

/*
 * Progressive Web Apps provide:
 * 
 * ✓ Installable app experience
 * ✓ Offline functionality
 * ✓ Background sync and push notifications
 * ✓ app-like UI (no browser chrome)
 * ✓ Fast loading and performance
 * ✓ Secure (HTTPS required)
 * ✓ Share Target API
 * ✓ Keyboard shortcuts
 */

/**
 * ==========================================
 * FILES CREATED
 * ==========================================
 */

const FILES = {
  'public/manifest.json': {
    description: 'PWA manifest with app metadata',
    includes: [
      'App name and icons',
      'Theme colors',
      'Display mode',
      'Shortcuts',
      'Screenshots',
      'Share target',
    ],
  },

  'public/sw.js': {
    description: 'Service Worker for offline and caching',
    features: [
      'Network-first caching',
      'Cache-first for images',
      'Background sync',
      'Push notifications',
      'Offline fallback',
    ],
  },

  'src/utils/pwaUtils.ts': {
    description: 'PWA utilities and helpers',
    exports: [
      'registerServiceWorker',
      'initializePWA',
      'isInstalledPWA',
      'promptPWAInstall',
      'sendNotification',
      'registerBackgroundSync',
      'isOnline',
      'shareContent',
    ],
  },

  'public/offline.html': {
    description: 'Offline fallback page',
    features: [
      'Offline UI',
      'Connection status',
      'Available features list',
      'Auto-reload on reconnect',
    ],
  },
};

/**
 * ==========================================
 * QUICK START
 * ==========================================
 */

/*
 * 1. Add manifest to HTML:
 * 
 * In your layout.tsx or _app.tsx:
 */

<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#FF6B6B" />
  <meta name="description" content="Share location safely." />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="GeoFrenzy" />
</head>

/*
 * 2. Initialize PWA in your app root:
 */

import { initializePWA } from '@/src/utils/pwaUtils';

useEffect(() => {
  initializePWA();
}, []);

/*
 * 3. Add theme toggle integration:
 */

import { useWebTheme } from '@/src/context/WebThemeContext';

function App() {
  const { colors } = useWebTheme();
  
  useEffect(() => {
    // Update theme color meta tag
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', colors.primary);
  }, [colors]);

  return ...;
}

/**
 * ==========================================
 * MANIFEST.JSON CONFIGURATION
 * ==========================================
 */

/*
 * Key fields in manifest.json:
 * 
 * - name: Full app name
 * - short_name: Name shown on home screen
 * - description: App description
 * - start_url: App entry point
 * - display: 'standalone' for full app experience
 * - theme_color: Toolbar color
 * - background_color: Launch screen color
 * - orientation: Lock orientation
 * - icons: Multiple sizes for all devices (192x192, 512x512 required)
 * - screenshots: App store screenshots
 * - shortcuts: Quick actions
 * - share_target: Share API integration
 * 
 * Required icons:
 * - 192x192 (manifest, shortcuts)
 * - 512x512 (install dialog)
 * - 180x180 (iOS)
 * - Maskable variants (for adaptive icons)
 * 
 * Generate icons at: https://www.simicart.com/manifest-generator.html
 */

/**
 * ==========================================
 * SERVICE WORKER CACHING STRATEGIES
 * ==========================================
 */

/*
 * 1. Network-First Strategy:
 *    - Try network first
 *    - Fall back to cache if offline
 *    - Updates cache with fresh responses
 *    - Good for: API calls, dynamic content
 *    - Used by: API requests, HTML pages
 * 
 * 2. Cache-First Strategy:
 *    - Check cache first
 *    - Use network if not cached
 *    - Good for: Static assets, images
 *    - Used by: Images, stylesheets
 * 
 * 3. Stale-While-Revalidate:
 *    - Return cached version immediately
 *    - Update cache in background
 *    - Good for: Content that can be slightly outdated
 * 
 * Current Implementation:
 * - API requests: Network-first
 * - Images: Cache-first
 * - HTML/Navigation: Network-first
 * - Other assets: Network-first
 */

/**
 * ==========================================
 * INSTALLATION & DETECTION
 * ==========================================
 */

/*
 * Browser Support:
 * - Chrome/Edge: Native support
 * - Firefox: Desktop only
 * - Safari: Limited support (iOS 16.4+)
 * - Samsung Internet: Full support
 * 
 * Installation Methods:
 * 
 * 1. Automatic Install Prompt:
 *    - Browser shows native install UI
 *    - Dismiss by user suppresses for 3 months
 *    - Most reliable method
 * 
 * 2. Custom Install Button:
 *    - Deferred beforeinstallprompt event
 *    - Show custom UI/banner
 *    - More control over UX
 * 
 * 3. iOS (limited):
 *    - No native install prompt
 *    - Use "Add to Home Screen" in Safari
 *    - Detect with: isInstalledPWA()
 */

import { isInstalledPWA, showInstallPrompt } from '@/src/utils/pwaUtils';

// Check if already installed
if (!isInstalledPWA()) {
  // Show install banner/button
}

/**
 * ==========================================
 * OFFLINE FUNCTIONALITY
 * ==========================================
 */

/*
 * The app works offline for:
 * - Previously viewed pages (cached)
 * - Cached images
 * - Stored location data (via IndexedDB)
 * - Cached API responses
 * 
 * Users will see offline.html if they:
 * - Go offline before any pages are loaded
 * - Navigate to uncached pages
 * 
 * To improve offline experience:
 * 1. Implement IndexedDB storage
 * 2. Cache critical pages on install
 * 3. Queue actions for background sync
 * 4. Show cached data with offline indicator
 */

/**
 * ==========================================
 * PUSH NOTIFICATIONS
 * ==========================================
 */

/*
 * Setup Push Notifications:
 * 
 * 1. Request permission:
 */

import { requestNotificationPermission } from '@/src/utils/pwaUtils';

const permission = await requestNotificationPermission();

/*
 * 2. Send notification from app:
 */

import { sendNotification } from '@/src/utils/pwaUtils';

await sendNotification('Friend Nearby!', {
  body: 'John is 500m away',
  tag: 'friend-alert',
  requireInteraction: false,
});

/*
 * 3. Handle push from server:
 *    - Send push message from backend
 *    - Service Worker receives 'push' event
 *    - Display notification to user
 *    - User clicks -> 'notificationclick' event
 *    - App opens/focuses automatically
 * 
 * Backend: Use Firebase Cloud Messaging (FCM)
 * or Web Push API with VAPID keys
 */

/**
 * ==========================================
 * BACKGROUND SYNC
 * ==========================================
 */

/*
 * Background Sync allows offline actions to be:
 * - Queued while offline
 * - Synced automatically when online
 * - Retried if sync fails
 * 
 * Current implementation handles:
 * - Location updates (sync-location)
 * - Messages (sync-messages)
 * 
 * Setup:
 * 1. Queue action when offline
 * 2. Register sync event
 * 3. Service Worker syncs when online
 * 4. Handle sync failures gracefully
 */

import { registerBackgroundSync, isOnline } from '@/src/utils/pwaUtils';

async function sendMessage(message) {
  try {
    await fetch('/api/messages/', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  } catch (error) {
    if (!isOnline()) {
      // Queue message
      await storeMessage(message);
      // Register background sync
      await registerBackgroundSync('sync-messages');
    }
  }
}

/**
 * ==========================================
 * WEB APP MANIFEST ICONS
 * ==========================================
 */

/*
 * Required icon sizes for full PWA:
 * 
 * - 192x192: Manifest, install dialog
 * - 512x512: Large install dialog, upload
 * - 180x180: Apple touch icon (iOS)
 * - 16x16: Favicon
 * - 32x32: Favicon
 * - 96x96: Shortcuts
 * 
 * Adaptive Icons (Android 8+):
 * - Maskable variant of each size
 * - Design with circular/adaptive shape
 * - 108x108px minimum visible area
 * 
 * Generate at:
 * - https://www.pwabuilder.com/ (recommended)
 * - https://www.favicon-generator.org/
 * - https://realfavicongenerator.net/
 */

/**
 * ==========================================
 * INSTALLATION AND LINKING
 * ==========================================
 */

/*
 * 1. Update next.config.js or app settings:
 *    No special config needed - manifest.json works automatically
 * 
 * 2. Update _document.tsx or _app.tsx:
 */

import Head from 'next/head';

export default function Document() {
  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B6B" />
        <meta name="description" content="Share location safely with friends." />
        
        <!-- Apple iOS -->
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GeoFrenzy" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        <!-- Icons -->
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        
        <!-- Preconnect to critical domains -->
        <link rel="preconnect" href="https://firebaseapp.com" />
        <link rel="preconnect" href="https://api.mapbox.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

/*
 * 3. Initialize PWA in _app.tsx:
 */

import { initializePWA } from '@/src/utils/pwaUtils';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initializePWA();
  }, []);

  return <Component {...pageProps} />;
}

/**
 * ==========================================
 * TESTING PWA
 * ==========================================
 */

/*
 * Chrome DevTools:
 * 1. Open DevTools (F12)
 * 2. Go to Application tab
 * 3. Check Manifest validity
 * 4. Check Service Worker status
 * 5. View Cache Storage
 * 6. Simulate offline/online
 * 
 * Audit PWA:
 * 1. Go to Lighthouse tab
 * 2. Run "Progressive Web App" audit
 * 3. Fix any issues
 * 4. Target score: 90+
 * 
 * Manual Testing:
 * 1. Test on actual device (preferably Android)
 * 2. Test install flow
 * 3. Test offline functionality
 * 4. Test push notifications
 * 5. Test background sync
 * 6. Check icon display
 * 7. Verify display modes
 */

/**
 * ==========================================
 * DEPLOYMENT CHECKLIST
 * ==========================================
 */

/*
 * Before production:
 * 
 * Security:
 * [ ] HTTPS enabled (required!)
 * [ ] Service Worker served over HTTPS
 * [ ] No mixed HTTP/HTTPS content
 * 
 * Manifest:
 * [ ] manifest.json valid JSON
 * [ ] All icons present
 * [ ] Icon sizes correct
 * [ ] start_url points to root
 * [ ] Valid display mode
 * [ ] theme_color set
 * 
 * Service Worker:
 * [ ] sw.js caching strategy correct
 * [ ] Offline page works
 * [ ] Cache versioning set
 * [ ] Update mechanism works
 * 
 * Installation:
 * [ ] Manifest linked in HTML
 * [ ] Meta tags added for theming
 * [ ] Apple touch icons added
 * [ ] Favicon set
 * 
 * Testing:
 * [ ] Lighthouse audit passed
 * [ ] Works offline
 * [ ] Installs on Android
 * [ ] Performance > 90
 * [ ] PWA score > 90
 * 
 * API Endpoints (if needed):
 * [ ] /manifest.json (correct MIME type)
 * [ ] /sw.js (correct MIME type)
 * [ ] /offline.html (accessible offline)
 */

/**
 * ==========================================
 * MIME TYPES
 * ==========================================
 */

/*
 * Make sure your web server serves with correct MIME types:
 * 
 * .json  -> application/json
 * .js    -> application/javascript or text/javascript
 * .html  -> text/html
 * .png   -> image/png
 * .svg   -> image/svg+xml
 * .ico   -> image/x-icon
 * .webp  -> image/webp
 * 
 * Next.js handles this automatically
 * Firebase Hosting handles this automatically
 * Vercel handles this automatically
 */

/**
 * ==========================================
 * FIREBASE HOSTING SETUP
 * ==========================================
 */

/*
 * In firebase.json:
 */

{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/manifest.json",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ]
      },
      {
        "source": "/sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          },
          {
            "key": "Content-Type",
            "value": "application/javascript"
          }
        ]
      },
      {
        "source": "/offline.html",
        "headers": [
          {
            "key": "Content-Type",
            "value": "text/html"
          }
        ]
      }
    ]
  }
}

/**
 * ==========================================
 * LIGHTHOUSE OPTIMIZATION
 * ==========================================
 */

/*
 * To achieve 90+ score:
 * 
 * Performance:
 * - Optimize images (WebP format)
 * - Code splitting
 * - Lazy loading
 * - Minify CSS/JS
 * - Preconnect to APIs
 * 
 * Accessibility:
 * - Add alt text to images
 * - Use semantic HTML
 * - Sufficient color contrast
 * - ARIA labels where needed
 * 
 * Best Practices:
 * - Use HTTPS everywhere
 * - No console errors
 * - Proper viewport meta tag
 * - Secure cookies (SameSite)
 * 
 * SEO:
 * - Meta description
 * - Mobile friendly
 * - Proper heading structure
 * - Robots.txt
 * 
 * PWA:
 * - Manifest valid
 * - Service Worker
 * - HTTPS
 * - Icons present
 */

/**
 * ==========================================
 * TROUBLESHOOTING
 * ==========================================
 */

/*
 * Problem: Manifest not loading
 * Solution: Check Content-Type is application/json,
 *           ensure path is /manifest.json,
 *           validate JSON syntax
 * 
 * Problem: Service Worker not registering
 * Solution: Check HTTPS enabled,
 *           ensure /sw.js exists,
 *           check browser console for errors
 * 
 * Problem: Install prompt not showing
 * Solution: Must be HTTPS,
 *           must have manifest.json,
 *           must have valid icons,
 *           must have service worker,
 *           requires user engagement first
 * 
 * Problem: Offline page not showing
 * Solution: Check /offline.html exists,
 *           verify service worker caching,
 *           test with DevTools offline mode
 * 
 * Problem: Notifications not working
 * Solution: Check permission granted,
 *           verify service worker active,
 *           check browser notifications enabled
 */
