import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, SafeAreaView, StatusBar, InteractionManager } from 'react-native';
import { useBluetooth } from '../hooks/useBluetooth';
import UserHeader from '../components/UserHeader';
import DeviceList from '../components/DeviceList';
import { COLORS } from '../constants/theme';
import { registerDevice } from '../services/ApiService';

export default function ScanScreen({ navigation, route }) {
  const user = route?.params?.user;
  const { devices, isScanning, startScanning, stopScanning, enableBluetooth, bluetoothState, isBluetoothOn } = useBluetooth();
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    // Retrasar el escaneo bluetooth hasta que la transición gráfica de la pantalla haya terminado.
    // Esto evita que dispositivos no muy potentes entren en colapso (OOM/Crash) por exceso de peticiones al puente JS-Nativo.
    let timer;
    const task = InteractionManager.runAfterInteractions(() => {
        // En algunas tablets o teléfonos débiles, un pequeño timeout adicional asegura la estabilidad
        timer = setTimeout(() => {
          startScanning();
        }, 500);
    });

    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
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

    navigation.navigate('DashboardScreen', { deviceId: selectedDevice.id, user });
    setSelectedDevice(null);

    if (user) {
      registerDevice({
        user_id: user.id || user.google_id,
        device_id: selectedDevice.id,
        name: selectedDevice.name || selectedDevice.localName || 'Dispositivo',
        type: selectedDevice.id.startsWith('SIMULADO') ? 'simulated' : 'ble',
        is_simulated: selectedDevice.id.startsWith('SIMULADO'),
      }).catch((error) => {
        console.warn('No se pudo registrar el dispositivo en el backend:', error);
      });
    }
  };

  const handleCancelSelection = () => {
    setSelectedDevice(null);
    startScanning();
  };

  const handleSkip = () => navigation.navigate('DashboardScreen', { user });

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
    marginTop: -20, 
  }
});