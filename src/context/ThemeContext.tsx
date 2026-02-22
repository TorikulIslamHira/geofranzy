import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors } from '@theme/theme';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = (await AsyncStorage.getItem('theme')) as Theme | null;
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Determine if currently in dark mode
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemColorScheme === 'dark');

  // Toggle theme between light and dark
  const toggleTheme = async () => {
    try {
      const newTheme: Theme = isDark ? 'light' : 'dark';
      setThemeState(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Set specific theme
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
    toggleTheme,
    setTheme,
  };

  if (!isLoaded) {
    return null; // Or return a splash screen
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
/**
 * Hook to get theme colors only
 */
export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};

/**
 * Hook to check if dark mode is enabled
 */
export const useIsDarkMode = () => {
  const { isDark } = useTheme();
  return isDark;
};

/**
 * Hook to get a specific color
 */
export const useThemeColor = (colorKey: keyof typeof Colors.light) => {
  const { colors } = useTheme();
  return colors[colorKey];
};