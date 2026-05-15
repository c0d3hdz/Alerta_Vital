import { useState, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert} from 'react-native';
import { Buffer } from 'buffer';
import { getManager, SERVICE_UUID, CHARACTERISTIC_UUID } from '../services/BluetoothService';

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
    return null;
  }

  const manager = getManager();
  if (!manager) return null;

  try {
    const connectionOptions = Platform.OS === 'android' ? { autoConnect: false, transport: 1 } : null;
    const device = await manager.connectToDevice(deviceId, connectionOptions);
    await device.discoverAllServicesAndCharacteristics();

    if (Platform.OS === 'android') {
      try {
        await device.requestMTU(512);
      } catch (e) {
        console.log("El dispositivo no soporta MTU 512, continuamos con la configuración local...");
      }
    }

    const disconnectSubscription = manager.onDeviceDisconnected(deviceId, (error, disconnectedDevice) => {
      console.log("Sensor apagado o fuera de rango", error, disconnectedDevice?.id);
      onDataReceived({ bpm: 0, flags: 0, leadOff: true, reason: 'ble-disconnect' });
    });

    const charSubscription = device.monitorCharacteristicForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.log("Error de monitoreo BLE:", error);
          return;
        }

        if (!characteristic?.value) return;

        try {
          const buffer = Buffer.from(characteristic.value, 'base64');
          console.log('BLE packet received:', buffer.length, buffer);
          if (buffer.length === 5) {
            const rawEcg = (buffer[0] << 8) | buffer[1];
            const bpm = buffer[2];
            const quality = buffer[3];
            const flags = buffer[4];
            const leadOff = (flags & 0x01) !== 0;
            const validBpm = !leadOff && bpm > 0 && bpm < 220;

            onDataReceived({
              bpm: validBpm ? bpm : 0,
              flags,
              leadOff,
              quality,
              rawEcg,
              isValid: validBpm,
            });
          } else if (buffer.length === 4) {
            const rawEcg = buffer[0];
            const bpm = buffer[1];
            const quality = buffer[2];
            const flags = buffer[3];
            const leadOff = (flags & 0x03) !== 0;
            const validBpm = !leadOff && bpm > 0 && bpm < 220;

            onDataReceived({
              bpm: validBpm ? bpm : 0,
              flags,
              leadOff,
              quality,
              rawEcg,
              isValid: validBpm,
            });
          } else {
            const text = Buffer.from(characteristic.value, 'base64').toString('utf8').trim();
            if (text.includes(',')) {
              const parts = text.split(',').map((part) => part.trim());
              const parsedBpm = Number(parts[1] ?? parts[0]);
              onDataReceived({
                bpm: Number.isFinite(parsedBpm) ? parsedBpm : 0,
                flags: 0,
                leadOff: false,
                quality: null,
                rawEcg: null,
                isValid: Number.isFinite(parsedBpm),
              });
            } else {
              onDataReceived({ bpm: 0, flags: 0, leadOff: true, quality: null, rawEcg: null, isValid: false, reason: 'invalid-packet' });
            }
          }
        } catch (e) {
          console.log("Error leyendo Buffer BLE", e);
          onDataReceived({ bpm: 0, flags: 0, leadOff: true, quality: null, rawEcg: null, isValid: false, reason: 'parse-error' });
        }
      }
    );

    return {
      disconnectSubscription,
      charSubscription,
      remove: () => {
        disconnectSubscription?.remove?.();
        charSubscription?.remove?.();
      },
    };
  } catch (error) {
    console.log("Error conectando a BLE:", error);
    return null;
  }
};

export function useBluetooth() {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothState, setBluetoothState] = useState(null);

  useEffect(() => {
    const manager = getManager();
    if (Platform.OS === 'web' || !manager) return;
    const subscription = manager.onStateChange((state) => {
      setBluetoothState(state);
    }, true);

    return () => subscription.remove();
  }, []);

  const isBluetoothOn = bluetoothState === 'PoweredOn';

  const enableBluetooth = useCallback(async () => {
    if (Platform.OS === 'web') return false;
    const manager = getManager();
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
    const manager = getManager();
    if (!manager) return;
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

    const scanOptions = Platform.OS === 'android'
      ? { scanMode: 2, allowDuplicates: false }
      : { allowDuplicates: false };

    manager.startDeviceScan(null, scanOptions, (error, device) => {
      if (error) {
        console.log("Error en escaneo BLE:", error);
        setIsScanning(false);
        return;
      }

      if (device && device.id) {
        const deviceName = `${device.name || device.localName || ''}`.toUpperCase();
        const normalizedServiceUUID = SERVICE_UUID.toUpperCase().replace(/-/g, '');
        const hasCorrectUUID = !!device.serviceUUIDs?.some((uuid) => {
          const candidate = `${uuid}`.toUpperCase().replace(/-/g, '');
          return candidate === normalizedServiceUUID;
        });

        const isTargetDevice =
          deviceName.includes('ESP32') ||
          deviceName.includes('ECG') ||
          deviceName.includes('MONITOR') ||
          deviceName.includes('VITAL') ||
          deviceName.includes('AI') ||
          hasCorrectUUID;

        if (isTargetDevice) {
          setDevices((prev) => {
            if (!prev.find((d) => d.id === device.id)) {
              return [...prev, device];
            }
            return prev;
          });
        }
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  }, [bluetoothState, enableBluetooth]);

  const stopScanning = useCallback(() => {
    const manager = getManager();
    if (manager) manager.stopDeviceScan();
    setIsScanning(false);
  }, []);

  return {
    devices,
    isScanning,
    startScanning,
    stopScanning,
    enableBluetooth,
    manager: getManager(),
    bluetoothState,
    isBluetoothOn,
  };
}
