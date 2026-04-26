import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, PermissionsAndroid, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

export const manager = Platform.OS === 'web' ? null : new BleManager();

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

const solicitarPermisosBluetooth = async () => {
  if (Platform.OS === 'ios') return true;
  
  if (Platform.OS === 'android') {
    const apiLevel = parseInt(Platform.Version.toString(), 10);

    if (apiLevel < 31) {
      const concedido = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return concedido === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (apiLevel >= 31) {
      const resultado = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ]);

      return (
        resultado['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        resultado['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }
  return true;
};

export const monitorDevice = async (deviceId, onDataReceived) => {
  if (Platform.OS === 'web') {
    console.warn("La simulación Web no soporta Bluetooth real.");
    return;
  }

  try {
    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.log("Error de monitoreo BLE:", error);
          return;
        }
        
        if (characteristic?.value) {
            try {
              const buffer = Buffer.from(characteristic.value, 'base64');
              // Según tu código C++:
              // packet[0] = 255 (marcador de inicio)
              // packet[1] = ecg
              // packet[2] = bpm <-- Este es el latido
              // packet[3] = status
              
              if (buffer.length === 4 && buffer[0] === 255) {
                 const bpm = buffer[2];
                 onDataReceived(bpm);
              }
            } catch (e) {
               console.log("Error leyendo Buffer BLE", e);
            }
        }
      }
    );
  } catch (error) {
    console.log("Error conectando a BLE:", error);
  }
};

export default function ScanScreen({ navigation, route }) {
  const user = route?.params?.user;
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingTo, setConnectingTo] = useState(null);

  useEffect(() => {
    // Escaneo BLE en lugar de Classic
    startScanning();
    return () => {
      if (manager) manager.stopDeviceScan();
    };
  }, []);

  const startScanning = async () => {
    if (Platform.OS === 'web') return;
    const permisosOtorgados = await solicitarPermisosBluetooth();
    if (!permisosOtorgados) {
      console.warn("Permisos de Bluetooth denegados.");
      return;
    }
    setDevices([]);
    setIsScanning(true);
    
    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Error en escaneo BLE:", error);
        setIsScanning(false);
        return;
      }
      
      // Filtrar, idealmente que tenga nombre
      if (device && device.name) {
        setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    // Detener escaneo luego de 10s
    setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
    }, 10000);
  };

  const connectToDevice = async (device) => {
    if (Platform.OS === 'web') return;
    setConnectingTo(device.id); // BLE usa ID
    manager.stopDeviceScan();
    setIsScanning(false);
    
    // Lo mismo, delegamos conexión profunda a Dashboard / monitorDevice
    navigation.navigate('DashboardScreen', { deviceId: device.id });
    setConnectingTo(null);
  };


  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deviceItem} 
      onPress={() => connectToDevice(item)} 
      disabled={connectingTo === item.address}
    >
      <View>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceId}>{item.address}</Text>
      </View>
      {connectingTo === item.address && <ActivityIndicator color="#4285F4" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* HEADER DE USUARIO */}
      <View style={styles.header}>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, { backgroundColor: '#4285F4', justifyContent: 'center' }]}>
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 24 }}>?</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Bienvenido,</Text>
          <Text style={styles.userName}>{user?.name || "Invitado"}</Text>
        </View>
      </View>

      {/* CUERPO PRINCIPAL (AQUÍ VA EL ESCANEO) */}
      <View style={styles.body}>
        <Text style={styles.title}>Buscando Dispositivos Bluetooth...</Text>
        {isScanning ? (
          <ActivityIndicator size="large" color="#4285F4" style={{ marginBottom: 20 }} />
        ) : (
          <TouchableOpacity style={styles.simulateButton} onPress={startScanning}>
            <Text style={styles.buttonText}>Volver a Escanear</Text>
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && (
          <Text style={styles.warningAlert}>⚠️ Bluetooth no disponible en Web</Text>
        )}

        <FlatList
          data={devices}
          keyExtractor={(item) => item.address}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            !isScanning && <Text style={styles.subtitle}>No se encontraron dispositivos</Text>
          }
        />

        {/* Botón para ir al Dashboard en caso de simulación u omitir escaneo */}
        <TouchableOpacity
          style={[styles.simulateButton, { backgroundColor: '#94A3B8' }]}
          onPress={() => navigation.navigate('DashboardScreen')}
        >
          <Text style={styles.buttonText}>Omitir y ver Monitor</Text>
        </TouchableOpacity>
      </View>

      {/* BARRA DE NAVEGACIÓN INFERIOR (BOTTOM TAB BAR) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navTextActive}>🔍 Escanear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DashboardScreen')}>
          <Text style={styles.navText}>📈 Monitor</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navText}>⚙️ Ajustes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Color de fondo limpio
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60, // Ajuste para darle espacio a la barra de estado del celular
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Para que la imagen se vea circular
  },
  userInfo: {
    marginLeft: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B', // Gris sutil
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 10,
  },
  list: {
    width: '100%',
    flex: 1,
    marginTop: 10,
  },
  deviceItem: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  deviceId: {
    fontSize: 12,
    color: '#94A3B8',
  },
  warningAlert: {
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  simulateButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 70, // Altura de la barra
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 10, // Espacio inferior de seguridad
  },
  navItem: {
    alignItems: 'center',
    padding: 10,
  },
  navText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 5,
  },
  navTextActive: {
    fontSize: 12,
    color: '#4285F4',
    fontWeight: 'bold',
    marginTop: 5,
  }
});