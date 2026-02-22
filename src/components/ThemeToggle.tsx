/**
 * Theme Toggle Component
 * Button to switch between light/dark/system themes
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  /**
   * Display style: 'button' for inline button, 'icon' for icon only, 'modal' for bottom sheet
   */
  style?: 'button' | 'icon' | 'modal';
  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Custom onPress callback
   */
  onPress?: () => void;
}

/**
 * Simple theme toggle button/icon
 */
export function ThemeToggle({ style = 'icon', size = 'medium', onPress }: ThemeToggleProps) {
  const { isDark, toggleTheme, theme, setTheme, colors } = useTheme();
  const [showModal, setShowModal] = React.useState(false);

  const handleToggle = async () => {
    await toggleTheme();
    onPress?.();
  };

  const handleSetTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    await setTheme(newTheme);
    setShowModal(false);
    onPress?.();
  };

  const iconSize = {
    small: 20,
    medium: 24,
    large: 32,
  }[size];

  const iconName = isDark ? 'sunny' : 'moon';

  // Icon-only style
  if (style === 'icon') {
    return (
      <TouchableOpacity
        onPress={handleToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={iconName} size={iconSize} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  // Button style
  if (style === 'button') {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
        ]}
        onPress={handleToggle}
      >
        <Ionicons name={iconName} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
          {isDark ? 'Light' : 'Dark'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Modal style with theme options
  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={iconName} size={iconSize} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Theme
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {/* Light Mode Option */}
            <TouchableOpacity
              style={[
                styles.option,
                {
                  backgroundColor: colors.surface,
                  borderColor: theme === 'light' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSetTheme('light')}
            >
              <Ionicons
                name="sunny"
                size={32}
                color={theme === 'light' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: theme === 'light' ? colors.primary : colors.text,
                  },
                ]}
              >
                Light
              </Text>
              {theme === 'light' && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>

            {/* Dark Mode Option */}
            <TouchableOpacity
              style={[
                styles.option,
                {
                  backgroundColor: colors.surface,
                  borderColor: theme === 'dark' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSetTheme('dark')}
            >
              <Ionicons
                name="moon"
                size={32}
                color={theme === 'dark' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: theme === 'dark' ? colors.primary : colors.text,
                  },
                ]}
              >
                Dark
              </Text>
              {theme === 'dark' && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>

            {/* System Option */}
            <TouchableOpacity
              style={[
                styles.option,
                {
                  backgroundColor: colors.surface,
                  borderColor: theme === 'system' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSetTheme('system')}
            >
              <Ionicons
                name="settings"
                size={32}
                color={theme === 'system' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  {
                    color: theme === 'system' ? colors.primary : colors.text,
                  },
                ]}
              >
                System
              </Text>
              {theme === 'system' && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.primary}
                  style={styles.checkmark}
                />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 16,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    position: 'absolute',
    right: 16,
  },
});

export default ThemeToggle;
