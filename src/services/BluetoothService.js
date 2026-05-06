import { BleManager } from 'react-native-ble-plx';
import { Platform } from 'react-native';

export const manager = Platform.OS === 'web' ? null : new BleManager();

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
