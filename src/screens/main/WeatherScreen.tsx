import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLocation } from '../../services/locationService';
import { shareWeather } from '../../services/firestoreService';
import { Colors, Spacing, Typography } from '../../theme/theme';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

const WeatherScreen = () => {
  const { user, userProfile } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);

      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Could not get location');
        return;
      }

      // Using OpenWeatherMap API (you need to set OPENWEATHER_API_KEY in .env)
      const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) {
        Alert.alert('Error', 'Weather API key not configured');
        return;
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${apiKey}`
      );

      const data = response.data;
      setWeather({
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch weather data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWeather = async () => {
    if (!user || !userProfile || !weather) return;

    try {
      setSharing(true);
      // Share with all friends (you'd want to fetch actual friend list in production)
      await shareWeather(user.uid, userProfile.displayName, weather, []);
      Alert.alert('Success', 'Weather shared with your friends!');
    } catch (error) {
      Alert.alert('Error', 'Failed to share weather');
      console.error(error);
    } finally {
      setSharing(false);
    }
  };

  const getWeatherEmoji = (condition: string): string => {
    const conditions: Record<string, string> = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Snow: '❄️',
      Thunderstorm: '⛈️',
      Drizzle: '🌦️',
      Mist: '🌫️',
      Smoke: '💨',
    };
    return conditions[condition] || '🌡️';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {weather ? (
          <>
            <View style={styles.weatherCard}>
              <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.condition)}</Text>
              <Text style={styles.temperature}>{weather.temp}°C</Text>
              <Text style={styles.condition}>{weather.condition}</Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Humidity</Text>
                  <Text style={styles.detailValue}>{weather.humidity}%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Wind Speed</Text>
                  <Text style={styles.detailValue}>{weather.windSpeed} m/s</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.shareButton, sharing && styles.buttonDisabled]}
              onPress={handleShareWeather}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color={Colors.dark.background} />
              ) : (
                <Text style={styles.buttonText}>Share with Friends</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={fetchWeather}
              disabled={loading}
            >
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌥️</Text>
              <Text style={styles.emptyTitle}>Get Weather Info</Text>
              <Text style={styles.emptySubtext}>
                Tap the button below to fetch current weather at your location
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.fetchButton, loading && styles.buttonDisabled]}
              onPress={fetchWeather}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.dark.background} />
              ) : (
                <Text style={styles.buttonText}>Get Weather</Text>
              )}
            </TouchableOpacity>
          </>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  weatherCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderColor: Colors.dark.secondary,
    borderWidth: 2,
  },
  weatherEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.dark.secondary,
    marginBottom: Spacing.md,
  },
  condition: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopColor: Colors.dark.border,
    borderTopWidth: 1,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  button: {
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  shareButton: {
    backgroundColor: Colors.dark.primary,
  },
  refreshButton: {
    backgroundColor: Colors.dark.surfaceVariant,
  },
  fetchButton: {
    backgroundColor: Colors.dark.primary,
  },
  buttonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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

export default WeatherScreen;
