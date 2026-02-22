/**
 * Theme Utilities
 * Helper functions for theming components
 */

import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from './theme';

export type ColorKey = keyof typeof Colors.light;

/**
 * Create theme-aware styles
 * Usage Example:
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *   },
 * }));
 */
export function createThemedStyles<T extends Record<string, ViewStyle | TextStyle>>(
  theme: typeof Colors.light | typeof Colors.dark,
  stylesFn: (colors: typeof Colors.light) => T
): T {
  return stylesFn(theme);
}

/**
 * Get contrast color for text based on background
 */
export function getContrastColor(
  backgroundColor: string,
  colors: typeof Colors.light | typeof Colors.dark
): string {
  const colorMap: Record<string, string> = {
    // Backgrounds
    [colors.background]: colors.text,
    [colors.surface]: colors.text,
    [colors.surfaceVariant]: colors.text,

    // Primary/Secondary
    [colors.primary]: '#FFFFFF',
    [colors.primaryVariant]: '#FFFFFF',
    [colors.secondary]: '#FFFFFF',
    [colors.secondaryVariant]: '#FFFFFF',

    // Status colors
    [colors.error]: '#FFFFFF',
    [colors.success]: '#FFFFFF',
    [colors.warning]: colors.text,
    [colors.info]: '#FFFFFF',
  };

  return colorMap[backgroundColor] || colors.text;
}

/**
 * Create shadow style based on theme
 */
export function getShadowStyle(isDark: boolean) {
  if (isDark) {
    return {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 5,
    };
  }

  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  };
}

/**
 * Create border color based on theme
 */
export function getBorderColor(colors: typeof Colors.light | typeof Colors.dark) {
  return colors.border;
}

/**
 * Create opacity value for disabled state
 */
export function getDisabledOpacity(isDark: boolean): number {
  return isDark ? 0.5 : 0.6;
}

/**
 * Blend colors
 */
export function blendColors(color1: string, color2: string, weight: number): string {
  // Simple hex color blending
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r = Math.round(((c1 >> 16) & 255) * (1 - weight) + ((c2 >> 16) & 255) * weight);
  const g = Math.round(((c1 >> 8) & 255) * (1 - weight) + ((c2 >> 8) & 255) * weight);
  const b = Math.round(((c1 & 255) * (1 - weight) + (c2 & 255) * weight));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Create a color with transparency
 */
export function withOpacity(color: string, opacity: number): string {
  // For React Native, we need to handle opacity differently
  // This returns the color as-is since RN handles opacity via the opacity property
  return color;
}

/**
 * Theme-aware button styles
 */
export const getButtonStyles = (
  colors: typeof Colors.light | typeof Colors.dark,
  variant: 'primary' | 'secondary' | 'ghost' = 'primary'
) => {
  const variants = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
      textColor: '#FFFFFF',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      textColor: colors.text,
    },
  };

  return variants[variant];
};

/**
 * Theme-aware input styles
 */
export const getInputStyles = (
  colors: typeof Colors.light | typeof Colors.dark,
  focused: boolean = false
) => {
  return {
    backgroundColor: colors.surface,
    borderColor: focused ? colors.primary : colors.border,
    color: colors.text,
    placeholderColor: colors.textSecondary,
    borderWidth: focused ? 2 : 1,
  };
};

/**
 * Theme-aware card styles
 */
export const getCardStyles = (
  colors: typeof Colors.light | typeof Colors.dark,
  isDark: boolean
) => {
  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...getShadowStyle(isDark),
  };
};

/**
 * Theme-aware text styles
 */
export const getTextStyles = (
  colors: typeof Colors.light | typeof Colors.dark,
  variant: 'primary' | 'secondary' | 'disabled' = 'primary'
) => {
  const variants = {
    primary: { color: colors.text },
    secondary: { color: colors.textSecondary },
    disabled: { color: colors.disabled },
  };

  return variants[variant];
};

/**
 * Create platform-specific theme colors
 */
export const getPlatformColors = (isDark: boolean) => {
  const baseColors = isDark ? Colors.dark : Colors.light;

  return {
    // React Navigation colors
    navigationColors: {
      primary: baseColors.primary,
      background: baseColors.background,
      card: baseColors.surface,
      text: baseColors.text,
      border: baseColors.border,
      notification: baseColors.error,
    },

    // Status bar colors
    statusBarColor: isDark ? baseColors.background : baseColors.surface,
    statusBarStyle: isDark ? 'light-content' : 'dark-content',

    // Tab bar colors
    tabBarColors: {
      backgroundColor: baseColors.surface,
      activeTintColor: baseColors.primary,
      inactiveTintColor: baseColors.textSecondary,
      borderTopColor: baseColors.border,
    },
  };
};
