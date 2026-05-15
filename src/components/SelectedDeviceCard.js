import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function SelectedDeviceCard({ device, onConnect, onCancel }) {
  if (!device) return null;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🩺</Text>
        </View>
        <View style={styles.headerText}>
            <Text style={styles.titleInfo}>Sensor Preparado</Text>
            <Text style={styles.deviceName} numberOfLines={1}>{device.name || device.localName || 'Sensor Sin Nombre'}</Text>
        </View>
      </View>

      <View style={styles.deviceDetails}>
        <View style={styles.detailRow}>
           <Text style={styles.detailLabel}>Dirección MAC</Text>
           <Text style={styles.detailValue}>{device.address || device.id}</Text>
        </View>
        <View style={styles.detailRow}>
           <Text style={styles.detailLabel}>Estado</Text>
           <Text style={[styles.detailValue, { color: COLORS.alert, fontWeight: '700' }]}>Preparado</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.connectButton} 
        onPress={onConnect}
        activeOpacity={0.8}
      >
        <View style={styles.connectInner}>
            <Text style={styles.connectText}>Conectar y Monitorear</Text>
            <Text style={styles.connectIcon}>➔</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: width - (SIZES.padding * 2),
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF0F0', 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  titleInfo: {
    fontSize: 13,
    textTransform: 'uppercase',
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  deviceDetails: {
    backgroundColor: '#F9F9FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  connectInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  connectIcon: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
