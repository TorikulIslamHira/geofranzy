/**
 * Web Theme Toggle Component
 * Theme switcher for Next.js web app
 * 
 * Usage:
 * import { WebThemeToggle } from '@/src/components/WebThemeToggle';
 * 
 * <WebThemeToggle style="icon" />
 */

'use client';

import React, { useState } from 'react';
import { useWebTheme } from '@/src/context/WebThemeContext';
import styles from './WebThemeToggle.module.css';

interface WebThemeToggleProps {
  /**
   * Display style: 'button', 'icon', or 'select'
   */
  style?: 'button' | 'icon' | 'select';
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Custom onClick callback
   */
  onClick?: () => void;
}

/**
 * Web-based theme toggle component
 */
export function WebThemeToggle({
  style = 'icon',
  className,
  onClick,
}: WebThemeToggleProps) {
  const { isDark, theme, toggleTheme, setTheme, colors } = useWebTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const iconSvg = isDark
    ? // Moon icon
      `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`
    : // Sun icon
      `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 2v6m0 4v6M4.22 4.22l4.24 4.24m2.98 2.98l4.24 4.24M2 12h6m4 0h6m-14.78 5.78l4.24-4.24m2.98-2.98l4.24-4.24"/>
      </svg>`;

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    await setTheme(newTheme);
    setShowDropdown(false);
    onClick?.();
  };

  const handleToggle = async () => {
    await toggleTheme();
    onClick?.();
  };

  // Icon-only style
  if (style === 'icon') {
    return (
      <button
        onClick={handleToggle}
        className={`${styles.iconButton} ${className || ''}`}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label="Toggle theme"
      >
        <span
          className={styles.icon}
          dangerouslySetInnerHTML={{ __html: iconSvg }}
        />
      </button>
    );
  }

  // Button style
  if (style === 'button') {
    return (
      <button
        onClick={handleToggle}
        className={`${styles.button} ${className || ''}`}
        style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
      >
        <span dangerouslySetInnerHTML={{ __html: iconSvg }} className={styles.icon} />
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>
    );
  }

  // Select/dropdown style
  return (
    <div className={`${styles.selectContainer} ${className || ''}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={styles.selectButton}
        style={{
          backgroundColor: colors.surface,
          color: colors.text,
          borderColor: colors.border,
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: iconSvg }} className={styles.icon} />
        <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
      </button>

      {showDropdown && (
        <div
          className={styles.dropdown}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`${styles.option} ${theme === t ? styles.active : ''}`}
              style={{
                color: theme === t ? colors.primary : colors.text,
                backgroundColor: theme === t ? colors.surfaceVariant : 'transparent',
              }}
            >
              <span className={styles.label}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
              {theme === t && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Theme toggle as command/keyboard shortcut
 */
export function useThemeShortcut() {
  const { toggleTheme } = useWebTheme();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + T for theme toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);
}

export default WebThemeToggle;
