import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useBluetooth } from '../hooks/useBluetooth';
import UserHeader from '../components/UserHeader';
import DeviceList from '../components/DeviceList';
import { COLORS } from '../constants/theme';

export default function ScanScreen({ navigation, route }) {
  const user = route?.params?.user;
  const { devices, isScanning, startScanning, stopScanning, enableBluetooth, bluetoothState, isBluetoothOn } = useBluetooth();
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const selectDevice = (device) => {
    if (Platform.OS === 'web') return;
    setSelectedDevice(device);
    stopScanning();
  };

  // Simula la selección de un dispositivo para pruebas.
  const selectSimulatedDevice = () => {
    const simulatedDevice = {
      id: 'SIMULADO-0001',
      name: 'Simulador Pulso Oxímetro',
      address: 'XX:XX:XX:XX:XX:XX',
    };
    setSelectedDevice(simulatedDevice);
    stopScanning();
  };

  const handleConnect = () => {
    if (!selectedDevice) return;
    navigation.navigate('DashboardScreen', { deviceId: selectedDevice.id });
    setSelectedDevice(null);
  };

  const handleCancelSelection = () => {
    setSelectedDevice(null);
    startScanning();
  };

  const handleSkip = () => navigation.navigate('DashboardScreen');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <UserHeader user={user} />
        
        <View style={styles.contentWrapper}>
          <DeviceList
            devices={devices}
            selectedDevice={selectedDevice}
            isScanning={isScanning}
            startScanning={startScanning}
            enableBluetooth={enableBluetooth}
            isBluetoothOn={isBluetoothOn}
            onSelectDevice={selectDevice}
            onSimulateDevice={selectSimulatedDevice}
            onCancelSelection={handleCancelSelection}
            onConnectDevice={handleConnect}
            onSkip={handleSkip}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    marginTop: -20, // Reduces excessive gap between header and content
  }
});