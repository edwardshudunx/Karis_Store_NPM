import './global.css';
import 'react-native-gesture-handler';

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDB } from './src/database/db';
import { useAppStore } from './src/store/appStore';

function AppContent() {
  const loadAll = useAppStore(s => s.loadAll);

  useEffect(() => {
    initDB();
    loadAll();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="light" backgroundColor="#0f172a" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
