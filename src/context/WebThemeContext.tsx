/**
 * Web Theme Context
 * Dark mode support for Next.js app
 * 
 * Usage in _app.tsx or layout.tsx:
 * import { WebThemeProvider } from '@/src/context/WebThemeContext';
 * 
 * export default function App({ Component, pageProps }) {
 *   return (
 *     <WebThemeProvider>
 *       <Component {...pageProps} />
 *     </WebThemeProvider>
 *   );
 * }
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Colors } from '@theme/theme';

export type Theme = 'light' | 'dark' | 'system';

interface WebThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
}

const WebThemeContext = createContext<WebThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_preference';

export function WebThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isLoaded, setIsLoaded] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Derive isDark from current state (available before any effects)
  const isDark = (theme === 'system' ? systemTheme : theme) === 'dark';

  // Load saved theme preference and detect system theme
  useEffect(() => {
    loadThemePreference();
    detectSystemTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;
    const theme = isDark ? 'dark' : 'light';

    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;

    // Apply theme to body
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      document.body.style.backgroundColor = Colors.dark.background;
      document.body.style.color = Colors.dark.text;
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      document.body.style.backgroundColor = Colors.light.background;
      document.body.style.color = Colors.light.text;
    }
  }, [isLoaded, isDark]);

  const loadThemePreference = async () => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        setThemeState(saved as Theme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const detectSystemTheme = () => {
    if (typeof window !== 'undefined') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemTheme(isDark ? 'dark' : 'light');
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    await setTheme(newTheme);
  };

  const colors = isDark ? Colors.dark : Colors.light;

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <WebThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </WebThemeContext.Provider>
  );
}

export function useWebTheme() {
  const context = useContext(WebThemeContext);
  if (!context) {
    throw new Error('useWebTheme must be used within WebThemeProvider');
  }
  return context;
}

export function useWebThemeColors() {
  const { colors } = useWebTheme();
  return colors;
}

export function useWebIsDarkMode() {
  const { isDark } = useWebTheme();
  return isDark;
}

/**
 * Get theme colors on server side
 */
export function getServerThemeColors(isDark: boolean = false) {
  return isDark ? Colors.dark : Colors.light;
}
