import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Main screens
import MapScreen from '../screens/main/MapScreen';
import SOSScreen from '../screens/main/SOSScreen';
import WeatherScreen from '../screens/main/WeatherScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Map',
          tabBarLabel: 'Map',
          headerTitleStyle: { color: '#FFFFFF' },
          headerStyle: { backgroundColor: '#1a1a1a' },
        }}
      />
      <Tab.Screen
        name="SOS"
        component={SOSScreen}
        options={{
          title: 'Emergency',
          tabBarLabel: 'SOS',
          headerTitleStyle: { color: '#FFFFFF' },
          headerStyle: { backgroundColor: '#1a1a1a' },
        }}
      />
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{
          title: 'Weather',
          tabBarLabel: 'Weather',
          headerTitleStyle: { color: '#FFFFFF' },
          headerStyle: { backgroundColor: '#1a1a1a' },
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarLabel: 'History',
          headerTitleStyle: { color: '#FFFFFF' },
          headerStyle: { backgroundColor: '#1a1a1a' },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerTitleStyle: { color: '#FFFFFF' },
          headerStyle: { backgroundColor: '#1a1a1a' },
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};
