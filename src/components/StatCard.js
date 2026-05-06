import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function StatCard({ label, value, unit, color }) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={styles.value} style={[{ color: color, fontSize: 42, fontWeight: 'bold' }]}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flex: 1,
    marginHorizontal: SIZES.margin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  unit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
    fontWeight: '500',
  }
});
