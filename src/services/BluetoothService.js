import { BleManager } from 'react-native-ble-plx';
import { Platform } from 'react-native';

let manager = null;
export function getManager() {
  if (Platform.OS === 'web') return null;
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

export const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
export const CHARACTERISTIC_UUID = 'abcdefab-1234-5678-1234-abcdefabcdef';
