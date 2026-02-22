/**
 * Dark Mode Implementation Guide
 * Complete dark mode/light mode theme support for GeoFrenzy
 */

/**
 * ==========================================
 * OVERVIEW
 * ==========================================
 */

/*
 * This implementation provides:
 * 
 * ✓ Light/Dark/System theme modes
 * ✓ Cross-platform support (Web + Mobile)
 * ✓ User preference persistence
 * ✓ System theme detection
 * ✓ Smooth theme transitions
 * ✓ Comprehensive color system
 * ✓ Theme utilities and helpers
 * ✓ Easy component theming
 */

/**
 * ==========================================
 * FILES CREATED
 * ==========================================
 */

const FILES = {
  // Mobile (React Native)
  'src/context/ThemeContext.tsx': {
    description: 'Mobile theme context and provider',
    exports: [
      'ThemeProvider',
      'useTheme',
      'useThemeColors',
      'useIsDarkMode',
      'useThemeColor',
    ],
    features: [
      'Supports light/dark/system modes',
      'Persists user preference in AsyncStorage',
      'Detects system color scheme',
      'Provides color values',
    ],
  },

  // Web (Next.js)
  'src/context/WebThemeContext.tsx': {
    description: 'Web theme context and provider for Next.js',
    exports: [
      'WebThemeProvider',
      'useWebTheme',
      'useWebThemeColors',
      'useWebIsDarkMode',
      'getServerThemeColors',
    ],
    features: [
      'React Server Component compatible',
      'Persists user preference in localStorage',
      'Detects system color scheme via CSS',
      'Updates DOM classes and attributes',
    ],
  },

  // Theme Utilities
  'src/theme/themeUtils.ts': {
    description: 'Helper functions for theme-aware styling',
    exports: [
      'createThemedStyles',
      'getContrastColor',
      'getShadowStyle',
      'getBorderColor',
      'getDisabledOpacity',
      'blendColors',
      'getButtonStyles',
      'getInputStyles',
      'getCardStyles',
      'getTextStyles',
      'getPlatformColors',
    ],
  },

  // Mobile Component
  'src/components/ThemeToggle.tsx': {
    description: 'Mobile theme toggle component',
    features: [
      'Icon-only toggle',
      'Button with label',
      'Modal with theme selector',
      'Three theme options (Light/Dark/System)',
      'Visual feedback for selected theme',
    ],
  },

  // Web Component
  'src/components/WebThemeToggle.tsx': {
    description: 'Web theme toggle component for Next.js',
    features: [
      'Icon toggle button',
      'Button with label',
      'Dropdown selector',
      'Keyboard shortcut (Ctrl+Shift+T)',
      'Smooth animations',
    ],
  },

  // Web Styles
  'src/components/WebThemeToggle.module.css': {
    description: 'Styling for web theme toggle',
    includes: [
      'CSS modules for scoped styling',
      'CSS variables for theming',
      'Animations and transitions',
      'Responsive design',
    ],
  },
};

/**
 * ==========================================
 * QUICK START - MOBILE (REACT NATIVE)
 * ==========================================
 */

/*
 * 1. Wrap your app with ThemeProvider:
 */

// App.tsx
import { ThemeProvider } from '@/src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <RootNavigator />
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/*
 * 2. Use theme in components:
 */

import { useTheme, useThemeColors, useIsDarkMode } from '@/src/context/ThemeContext';

function MyComponent() {
  const { isDark, colors, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const isDarkMode = useIsDarkMode();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
      <Button onPress={toggleTheme} />
    </View>
  );
}

/*
 * 3. Add theme toggle button to header/navigation:
 */

import { ThemeToggle } from '@/src/components/ThemeToggle';

export function MapScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => <ThemeToggle style="icon" />,
        }}
      />
      {/* Screen content */}
    </>
  );
}

/**
 * ==========================================
 * QUICK START - WEB (NEXT.JS)
 * ==========================================
 */

/*
 * 1. Wrap your app with WebThemeProvider:
 */

// app/layout.tsx or _app.tsx
import { WebThemeProvider } from '@/src/context/WebThemeContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebThemeProvider>
          {children}
        </WebThemeProvider>
      </body>
    </html>
  );
}

/*
 * 2. Use theme in components:
 */

'use client';

import { useWebTheme, useWebThemeColors } from '@/src/context/WebThemeContext';

export function MyComponent() {
  const { isDark, colors, toggleTheme } = useWebTheme();
  const colors = useWebThemeColors();

  return (
    <div style={{ backgroundColor: colors.background, color: colors.text }}>
      <h1>Hello</h1>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

/*
 * 3. Add theme toggle to navbar:
 */

import { WebThemeToggle } from '@/src/components/WebThemeToggle';

export function Header() {
  return (
    <header>
      <nav>
        {/* Navigation items */}
        <WebThemeToggle style="icon" />
      </nav>
    </header>
  );
}

/**
 * ==========================================
 * THEME STRUCTURE
 * ==========================================
 */

/*
 * Colors defined in src/theme/theme.ts:
 * 
 * Light Theme:
 * - background: #FFFFFF
 * - surface: #F5F5F5
 * - text: #000000
 * - primary: #FF6B6B
 * - secondary: #4ECDC4
 * - error: #FF6B6B
 * - success: #51CF66
 * - warning: #FFD93D
 * - info: #4ECDC4
 * 
 * Dark Theme:
 * - background: #0a0a0a
 * - surface: #1a1a1a
 * - text: #FFFFFF
 * - primary: #FF6B6B (same)
 * - secondary: #4ECDC4 (same)
 * - error: #FF6B6B (same)
 * - success: #51CF66 (same)
 * - warning: #FFD93D (same)
 * - info: #4ECDC4 (same)
 */

/**
 * ==========================================
 * COMMON PATTERNS
 * ==========================================
 */

// Pattern 1: Theme-aware styling with dynamic colors
function MapScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.background,
        },
        card: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        text: {
          color: colors.text,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.text}>Hello</Text>
      </View>
    </View>
  );
}

// Pattern 2: Using theme utilities
function Button({ isDark, onPress }) {
  const { colors } = useTheme();
  const buttonStyle = getButtonStyles(colors, 'primary');

  return (
    <TouchableOpacity
      style={{
        backgroundColor: buttonStyle.backgroundColor,
        ...getShadowStyle(isDark),
      }}
      onPress={onPress}
    >
      <Text style={{ color: buttonStyle.textColor }}>Press me</Text>
    </TouchableOpacity>
  );
}

// Pattern 3: Theme toggle in settings screen
function SettingsScreen() {
  const { theme, setTheme } = useTheme();

  return (
    <View>
      <Picker
        selectedValue={theme}
        onValueChange={setTheme}
      >
        <Picker.Item label="Light" value="light" />
        <Picker.Item label="Dark" value="dark" />
        <Picker.Item label="System" value="system" />
      </Picker>
    </View>
  );
}

// Pattern 4: React Navigation theming
function RootNavigator() {
  const { isDark, colors } = useTheme();

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {/* Navigation screens */}
    </NavigationContainer>
  );
}

/**
 * ==========================================
 * THEME UTILITIES USAGE
 * ==========================================
 */

/*
 * The themeUtils.ts file provides helpers:
 */

// Get contrast color for text
const textColor = getContrastColor(backgroundColor, colors);

// Get shadow style (different for light/dark)
const shadowStyle = getShadowStyle(isDark);

// Get button styles for different variants
const primaryBtn = getButtonStyles(colors, 'primary');
const ghostBtn = getButtonStyles(colors, 'ghost');

// Get input styles with focus state
const inputStyle = getInputStyles(colors, isFocused);

// Get card styles
const cardStyle = getCardStyles(colors, isDark);

// Get text color variants
const primaryText = getTextStyles(colors, 'primary');
const secondaryText = getTextStyles(colors, 'secondary');

// Get platform-specific colors for navigation
const navColors = getPlatformColors(isDark);

/**
 * ==========================================
 * INTEGRATING WITH SCREENS
 * ==========================================
 */

/*
 * Example: MapScreen with theme support
 */

import { useTheme, useThemeColors } from '@/src/context/ThemeContext';
import { getShadowStyle, getCardStyles } from '@/src/theme/themeUtils';

export function MapScreen() {
  const { isDark, colors } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        mapContainer: {
          flex: 1,
        },
        panel: {
          backgroundColor: colors.surface,
          ...getShadowStyle(isDark),
        },
        friendsList: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        friendItem: {
          paddingVertical: 12,
          borderBottomColor: colors.border,
        },
        friendName: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        friendDistance: {
          color: colors.textSecondary,
          fontSize: 14,
        },
        sosButton: {
          backgroundColor: colors.error,
          ...getShadowStyle(isDark),
        },
      }),
    [colors, isDark]
  );

  return (
    <View style={styles.container}>
      <MapView style={styles.mapContainer} />
      <View style={styles.panel}>
        <FlatList
          data={friends}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendDistance}>
                {item.distance}km away
              </Text>
            </View>
          )}
          style={styles.friendsList}
        />
        <TouchableOpacity style={styles.sosButton}>
          <Text style={{ color: '#fff' }}>Emergency SOS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * ==========================================
 * WEB SPECIFIC FEATURES
 * ==========================================
 */

/*
 * 1. CSS Variables (automatically set):
 *    --color-background
 *    --color-surface
 *    --color-text
 *    --color-primary
 *    --color-border
 * 
 * Usage in CSS:
 */

// MyComponent.module.css
.card {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/*
 * 2. HTML Attributes:
 *    <html data-theme="light|dark">
 *    <body class="light-mode|dark-mode">
 * 
 * Usage:
 */

// In CSS or JS
const theme = document.documentElement.getAttribute('data-theme');
const isDark = document.body.classList.contains('dark-mode');

/*
 * 3. Keyboard Shortcut:
 *    Ctrl+Shift+T (Windows/Linux)
 *    Cmd+Shift+T (Mac)
 */

import { useThemeShortcut } from '@/src/components/WebThemeToggle';

export function MyApp() {
  useThemeShortcut(); // Enable keyboard shortcut
  return ...;
}

/**
 * ==========================================
 * MOBILE SPECIFIC FEATURES
 * ==========================================
 */

/*
 * 1. Status Bar Theme Integration
 */

import { StatusBar } from 'react-native';

function MyComponent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0a0a0a' : '#ffffff'}
      />
      {/* Content */}
    </>
  );
}

/*
 * 2. Navigation Bar Theme
 */

function RootNavigator() {
  const { colors } = useTheme();

  return (
    <NavigationContainer
      theme={{
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.error,
        },
      }}
    >
      {/* Screens */}
    </NavigationContainer>
  );
}

/**
 * ==========================================
 * BEST PRACTICES
 * ==========================================
 */

/*
 * 1. Always use theme colors:
 *    ✓ const { colors } = useTheme();
 *    ✗ backgroundColor: '#000000'
 * 
 * 2. Memoize styles that depend on theme:
 *    ✓ const styles = React.useMemo(() => ..., [colors])
 *    ✗ const styles = StyleSheet.create(...) // without colors
 * 
 * 3. Use theme utilities for consistency:
 *    ✓ getShadowStyle(isDark)
 *    ✗ shadowColor: isDark ? '#000' : '#fff'
 * 
 * 4. Test both themes:
 *    ✓ Manually toggle between light/dark
 *    ✓ Test system theme detection
 *    ✗ Only test in one theme
 * 
 * 5. Avoid hardcoded colors in components:
 *    ✓ color: colors.primary
 *    ✗ color: '#FF6B6B'
 */

/**
 * ==========================================
 * TESTING DARK MODE
 * ==========================================
 */

/*
 * Mobile Testing:
 * 1. Settings > Appearance > Dark Mode
 * 2. Toggle theme in app
 * 3. Restart app (should remember setting)
 * 4. Check if system theme is detected
 * 
 * Web Testing:
 * 1. Settings > Appearance > Dark Mode
 * 2. Ctrl+Shift+T to toggle (if enabled)
 * 3. Refresh page (should remember setting)
 * 4. Check if CSS variables are applied
 * 5. Inspect <html data-theme>
 */

/**
 * ==========================================
 * TROUBLESHOOTING
 * ==========================================
 */

/*
 * Problem: Theme not persisting
 * Solution: Check AsyncStorage/localStorage permissions
 * 
 * Problem: System theme not detected
 * Solution: Verify useColorScheme / matchMedia setup
 * 
 * Problem: Colors not updating
 * Solution: Ensure styles are memoized with [colors] dependency
 * 
 * Problem: Flash of wrong theme on load
 * Solution: Check WebThemeProvider initialization timing
 */

/**
 * ==========================================
 * NEXT STEPS
 * ==========================================
 */

/*
 * 1. Test all screens in both themes
 * 2. Update any hardcoded colors
 * 3. Verify persistence works
 * 4. Test system theme detection
 * 5. Add keyboard shortcut (web)
 * 6. Update documentation
 */
