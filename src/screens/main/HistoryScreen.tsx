import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMeetingHistory } from '../../services/firestoreService';
import { Colors, Spacing, Typography } from '../../theme/theme';

interface Meeting {
  id?: string;
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  meetingTime: number;
  duration: number;
}

const HistoryScreen = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMeetingHistory();
  }, [user]);

  const fetchMeetingHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const history = await getMeetingHistory(user.uid);
      setMeetings(history as Meeting[]);
    } catch (error) {
      console.error('Error fetching meeting history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMeetingHistory();
    setRefreshing(false);
  };

  const renderMeetingItem = ({ item }: any) => {
    const friendName = item.user1Id === user?.uid ? item.user2Name : item.user1Name;
    const duration = Math.round(item.duration / 60000); // Convert to minutes
    const date = new Date(item.meetingTime);

    return (
      <View style={styles.meetingCard}>
        <View style={styles.meetingHeader}>
          <Text style={styles.meetingTitle}>
            {friendName} {duration > 0 ? `• ${duration}min` : ''}
          </Text>
          <Text style={styles.meetingDate}>{date.toLocaleDateString()}</Text>
        </View>
        <View style={styles.meetingTime}>
          <Text style={styles.meetingTimeText}>{date.toLocaleTimeString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : meetings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTitle}>No Meeting History</Text>
          <Text style={styles.emptySubtext}>
            Your meeting history will appear here when you meet friends within 50m
          </Text>
        </View>
      ) : (
        <FlatList
          data={meetings}
          renderItem={renderMeetingItem}
          keyExtractor={(item) => item.id || `${item.user1Id}-${item.user2Id}-${item.meetingTime}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.dark.primary}
            />
          }
        />
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
  list: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  meetingCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    borderLeftColor: Colors.dark.secondary,
    borderLeftWidth: 4,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    flex: 1,
  },
  meetingDate: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  meetingTime: {
    borderTopColor: Colors.dark.border,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  meetingTimeText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryScreen;
