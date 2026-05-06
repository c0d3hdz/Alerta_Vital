import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ScanScreen from '../screens/ScanScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const Stack = createNativeStackNavigator();

export default function AppNavigator({ initialRouteName = 'LoginScreen', initialParams = null }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom, flex: 1 }}>
      <NavigationContainer >
        <Stack.Navigator initialRouteName={initialRouteName}>
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ScanScreen"
            component={ScanScreen}
            options={{ headerShown: false }}
            initialParams={initialParams}
          />
          <Stack.Screen
            name="DashboardScreen"
            component={DashboardScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>

  );
}
