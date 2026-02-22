import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography } from '../../theme/theme';
import { broadcastSOS, getActiveSOSAlerts, resolveSOSAlert } from '../../services/firestoreService';
import type { SOSAlert } from '../../services/firestoreService';
import { getCurrentLocation } from '../../services/locationService';
import { sendSOSNotification } from '../../services/notificationService';

const SOSScreen = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    refreshSOSAlerts();
    const interval = setInterval(refreshSOSAlerts, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const refreshSOSAlerts = async () => {
    try {
      const alerts = await getActiveSOSAlerts();
      setSOSAlerts(alerts);
    } catch (error) {
      console.error('Error fetching SOS alerts:', error);
    }
  };

  const handleBroadcastSOS = async () => {
    if (!user || !userProfile) return;

    try {
      setBroadcasting(true);

      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Could not get location. Please try again.');
        return;
      }

      await broadcastSOS(user.uid, userProfile.displayName, location.latitude, location.longitude);
      await sendSOSNotification(userProfile.displayName);

      Alert.alert('SOS Sent', 'Emergency alert has been sent to all your friends!');
      await refreshSOSAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to send SOS. Please try again.');
      console.error(error);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleResolveAlert = async (sosId: string) => {
    try {
      await resolveSOSAlert(sosId);
      await refreshSOSAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve alert');
      console.error(error);
    }
  };

  const renderSOSAlert = ({ item }: any) => (
    <View style={[styles.alertCard, { borderLeftColor: Colors.dark.error }]}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertName}>{item.userName}</Text>
        <Text style={styles.alertTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
      <TouchableOpacity
        style={styles.resolveButton}
        onPress={() => handleResolveAlert(item.id)}
      >
        <Text style={styles.resolveButtonText}>Mark Resolved</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sosButtonContainer}>
        <TouchableOpacity
          style={[styles.sosButton, broadcasting && styles.sosButtonDisabled]}
          onPress={handleBroadcastSOS}
          disabled={broadcasting}
        >
          {broadcasting ? (
            <ActivityIndicator color={Colors.dark.background} />
          ) : (
            <>
              <Text style={styles.sosButtonEmoji}>🆘</Text>
              <Text style={styles.sosButtonText}>Emergency SOS</Text>
              <Text style={styles.sosButtonSubtext}>Notify all friends</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.alertsContainer}>
        <Text style={styles.alertsTitle}>Active Alerts</Text>
        {sosAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active SOS alerts</Text>
          </View>
        ) : (
          <FlatList
            data={sosAlerts}
            renderItem={renderSOSAlert}
            keyExtractor={(item) => item.id ?? ''}
            scrollEnabled={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  sosButtonContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  sosButton: {
    width: '100%',
    backgroundColor: Colors.dark.error,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonDisabled: {
    opacity: 0.6,
  },
  sosButtonEmoji: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  sosButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.background,
    marginBottom: Spacing.sm,
  },
  sosButtonSubtext: {
    fontSize: 14,
    color: Colors.dark.background,
    opacity: 0.8,
  },
  alertsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  alertCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  alertName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  resolveButton: {
    backgroundColor: Colors.dark.success,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: Colors.dark.background,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
});

export default SOSScreen;
