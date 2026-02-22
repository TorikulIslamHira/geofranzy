import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeNotifications, setupNotificationListeners } from './src/services/notificationService';

const AppContent = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize notifications when user is logged in
      initializeNotifications(user.uid);
      setupNotificationListeners();
    }
  }, [user]);

  if (loading) {
    return null; // Could show a splash screen here
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style="light" />
    </>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
