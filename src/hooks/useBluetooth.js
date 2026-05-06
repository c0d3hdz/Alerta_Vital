import { useState, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert} from 'react-native';
import { Buffer } from 'buffer';
import { manager, SERVICE_UUID, CHARACTERISTIC_UUID } from '../services/BluetoothService';

export const solicitarPermisosBluetooth = async () => {
  if (Platform.OS === 'ios') return true;

  if (Platform.OS === 'android') {
    const apiLevel = parseInt(Platform.Version.toString(), 10);
    console.log("Nivel de API Android:", apiLevel);
    if (apiLevel < 31) {
      const concedido = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Permiso de Ubicación",
          message: "La aplicación necesita acceso a la ubicación para detectar dispositivos Bluetooth.",
          buttonNeutral: "Preguntar después",
          buttonNegative: "Cancelar",
          buttonPositive: "OK"
        }
      );
      
      // En API < 31 los permisos de BT son automáticos al instalar,
      // solo validamos que no haya rechazado la ubicación.
      if (concedido !== PermissionsAndroid.RESULTS.GRANTED) {
         Alert.alert('Permiso denegado', 'Se requiere acceso a la ubicación en versiones antiguas de Android para usar el Bluetooth.');
      }

      return concedido === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (apiLevel >= 31) {
      const grantedScan = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: 'Permiso de Escaneo Bluetooth',
          message: 'Esta aplicación necesita permiso para escanear dispositivos Bluetooth.',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
        }
      );

      const grantedConnect = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        {
          title: 'Permiso de Conexión Bluetooth',
          message: 'Esta aplicación necesita permiso para conectar dispositivos Bluetooth.',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
        }
      );

      const grantedLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'Se necesita la ubicación para descubrir dispositivos Bluetooth cercanos.',
          buttonPositive: 'Aceptar',
          buttonNegative: 'Cancelar',
        }
      );

      const todosConcedidos = (
        grantedScan === PermissionsAndroid.RESULTS.GRANTED &&
        grantedConnect === PermissionsAndroid.RESULTS.GRANTED &&
        grantedLocation === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!todosConcedidos) {
        Alert.alert('Permiso denegado', 'No se puede acceder a Bluetooth sin estos permisos.');
      }

      return todosConcedidos;
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

    manager.onDeviceDisconnected(deviceId, (error, device) => {
      console.log("Sensor apagado o fuera de rango");
      onDataReceived(0); // Forzar 0 BPM inmediato
    });

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

export function useBluetooth() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothState, setBluetoothState] = useState(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !manager) return;
    const subscription = manager.onStateChange((state) => {
      setBluetoothState(state);
    }, true);

    return () => subscription.remove();
  }, []);

  const isBluetoothOn = bluetoothState === 'PoweredOn';

  const enableBluetooth = useCallback(async () => {
    if (Platform.OS === 'web') return false;
    if (!manager) return false;

    try {
      const currentState = await manager.state();
      if (currentState === 'PoweredOn') {
        return true;
      }
      
      if (Platform.OS === 'android') {
        const apiLevel = parseInt(Platform.Version.toString(), 10);
        if (apiLevel < 33) {
           await manager.enable();
           return true;
        } else {
           Alert.alert(
            'Bluetooth Apagado',
            'Por favor, despliega el panel superior de tu teléfono y enciende el Bluetooth manualmente para poder conectar el sensor.'
          );
          return false;
        }
      } else {
         Alert.alert(
          'Bluetooth Apagado',
          'Por favor, enciende el Bluetooth en los ajustes de tu iPhone.'
        );
        return false;
      }
    } catch (error) {
      console.warn('No se pudo activar Bluetooth nativo, pidiendo encendido manual', error);
      Alert.alert(
        'Activar Bluetooth',
        'Por favor, actívalo manualmente en los ajustes rápidos de tu teléfono.'
      );
      return false;
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (Platform.OS === 'web') return;

    const permisosOtorgados = await solicitarPermisosBluetooth();
    if (!permisosOtorgados) {
      console.warn("Permisos de Bluetooth denegados.");
      return;
    }
    const currentState = await manager.state();
    if (currentState === 'PoweredOff' || currentState === 'Unknown') {
      const enabled = await enableBluetooth();
      if (!enabled) {
        console.warn('Bluetooth sigue apagado o el usuario debe prenderlo manualmente.');
        return;
      }
    }

    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log("Error en escaneo BLE:", error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  }, [bluetoothState, enableBluetooth]);

  const stopScanning = useCallback(() => {
    if (manager) manager.stopDeviceScan();
    setIsScanning(false);
  }, []);

  return {
    devices,
    isScanning,
    startScanning,
    stopScanning,
    enableBluetooth,
    manager,
    bluetoothState,
    isBluetoothOn,
  };
}
