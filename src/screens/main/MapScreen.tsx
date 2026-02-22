import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { Colors, Spacing, Typography } from '../../theme/theme';
import {
  requestLocationPermission,
  startLocationTracking,
  LocationCoordinates,
} from '../../services/locationService';
import { calculateDistance, formatDistance } from '../../utils/distance';

const MapScreen = () => {
  const { user, userProfile } = useAuth();
  const { currentLocation, setCurrentLocation, friendsLocations, refreshFriendsLocations } =
    useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, [user]);

  const initializeLocation = async () => {
    try {
      setLoading(true);

      // Request permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Location permission is required to use this app');
        return;
      }

      if (user) {
        // Start location tracking
        await startLocationTracking(user.uid, (location: LocationCoordinates) => {
          setCurrentLocation(location);
        });

        // Refresh friends locations
        await refreshFriendsLocations();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize location tracking');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderFriendCard = ({ item }: any) => {
    if (item.ghostMode) return null;

    const distance =
      currentLocation &&
      calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        item.latitude,
        item.longitude
      );

    return (
      <View style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.displayName}</Text>
          {distance && <Text style={styles.distance}>{formatDistance(distance)}</Text>}
        </View>
        <View style={styles.friendMeta}>
          <Text style={styles.coordText}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <>
          <View style={styles.currentLocationCard}>
            <Text style={styles.currentLocationTitle}>Your Location</Text>
            {currentLocation ? (
              <>
                <Text style={styles.coordText}>
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
                <Text style={styles.accuracyText}>Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</Text>
              </>
            ) : (
              <Text style={styles.noLocationText}>Getting location...</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Friends Nearby</Text>

          {friendsLocations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No friends nearby yet</Text>
              <Text style={styles.emptySubtext}>Invite friends to see their locations here</Text>
            </View>
          ) : (
            <FlatList
              data={friendsLocations}
              renderItem={renderFriendCard}
              keyExtractor={(item) => item.userId}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationCard: {
    backgroundColor: Colors.dark.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  coordText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  noLocationText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginLeft: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  friendCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  friendInfo: {
    marginBottom: Spacing.md,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  distance: {
    fontSize: 14,
    color: Colors.dark.secondary,
    fontWeight: '600',
  },
  friendMeta: {
    borderTopColor: Colors.dark.border,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});

export default MapScreen;
