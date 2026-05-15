import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRouteName, setInitialRouteName] = useState('LoginScreen');
  const [initialParams, setInitialParams] = useState(null);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        let storedUser = null;
        if (Platform.OS === 'web') {
          storedUser = localStorage.getItem('user');
        } else {
          storedUser = await SecureStore.getItemAsync('user');
        }

        if (storedUser) {
          const user = JSON.parse(storedUser);
          setInitialRouteName('ScanScreen');
          setInitialParams({ user });
        }
      } catch (error) {
        console.warn('Error leyendo sesión guardada:', error);
      }

      setIsReady(true);
    };

    prepareApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={{ marginTop: 20 }}>Cargando aplicación...</Text>
      </View>
    );
  }
  return (
    <SafeAreaProvider>
      <AppNavigator initialRouteName={initialRouteName} initialParams={initialParams} />
    </SafeAreaProvider>
  );
}
