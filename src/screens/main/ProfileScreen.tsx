import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../theme/theme';
import { toggleGhostMode } from '../../services/firestoreService';

const ProfileScreen = () => {
  const { user, userProfile, logOut, updateProfile } = useAuth();
  const [ghostMode, setGhostMode] = useState(userProfile?.ghostMode || false);
  const [toggling, setToggling] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleGhostModeToggle = async (value: boolean) => {
    if (!user) return;

    try {
      setToggling(true);
      await toggleGhostMode(user.uid, value);
      await updateProfile({ ghostMode: value });
      setGhostMode(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle ghost mode');
      console.error(error);
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await logOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
            console.error(error);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userProfile?.displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingName}>Ghost Mode</Text>
              <Text style={styles.settingDescription}>Hide location from friends</Text>
            </View>
            <Switch
              value={ghostMode}
              onValueChange={handleGhostModeToggle}
              disabled={toggling}
              trackColor={{ false: Colors.dark.border, true: Colors.dark.secondary }}
              thumbColor={Colors.dark.primary}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingButton} disabled={loggingOut}>
            <Text style={styles.settingButtonText}>
              {userProfile?.createdAt
                ? `Joined ${new Date(userProfile.createdAt).toLocaleDateString()}`
                : 'Member since'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity
            style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator color={Colors.dark.error} />
            ) : (
              <Text style={styles.logoutButtonText}>Logout</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Geofranzy v1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.xl,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.background,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  settingButton: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  settingButtonText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  dangerSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logoutButton: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.error,
    borderWidth: 2,
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: Colors.dark.error,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopColor: Colors.dark.border,
    borderTopWidth: 1,
  },
  versionText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});

export default ProfileScreen;
