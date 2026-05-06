import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

export default function BottomNav({ navigation }) {
  return (
    <View style={styles.navContainer}>
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ScanScreen')}>
        <Text style={styles.navTextActive}>🔍 Escanear</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DashboardScreen')}>
        <Text style={styles.navText}>📈 Monitor</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Text style={styles.navText}>⚙️ Ajustes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    height: 70,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
    padding: SIZES.margin,
  },
  navText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 5,
  },
  navTextActive: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 5,
  },
});
