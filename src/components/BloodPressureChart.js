import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LineChart, Grid, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { COLORS, SIZES } from '../constants/theme';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

export default function BloodPressureChart({ dataSys, colorSys = '#D97706' }) {
  // Creamos un degradado suave de fondo bajo la curva
  const Gradient = () => (
    <Defs key={'gradient'}>
        <LinearGradient id={'gradientSys'} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
            <Stop offset={'0%'} stopColor={colorSys} stopOpacity={0.15} />
            <Stop offset={'100%'} stopColor={colorSys} stopOpacity={0.0} />
        </LinearGradient>
    </Defs>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Presión Sistólica</Text>
      
      <View style={styles.chartWrapper}>
        <YAxis
            data={[40, 180]} 
            min={40}
            max={180}
            contentInset={{ top: 10, bottom: 10 }}
            svg={{
                fill: COLORS.textMuted || 'grey',
                fontSize: 10,
                fontWeight: 'bold',
            }}
            numberOfTicks={5}
            formatLabel={(value) => `${value}`}
        />
        
        <View style={styles.chartContainer}>
          <LineChart
            style={{ flex: 1, marginLeft: 8 }}
            data={dataSys}
            yMin={40} // Rango mínimo fijo esperado en reposo
            yMax={180} // Rango máximo (hipertensión alta)
            contentInset={{ top: 10, bottom: 10 }}
            curve={shape.curveMonotoneX}
            svg={{ stroke: colorSys, strokeWidth: 2 }}
          >
            <Grid svg={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1 }} />
            <Gradient />
          </LineChart>
        </View>
      </View>
      
      <View style={styles.legendContainer}>
         <View style={styles.legendItem}>
             <View style={[styles.legendColor, {backgroundColor: colorSys}]} />
             <Text style={styles.legendText}>Sistólica (mmHg)</Text>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius || 16,
    padding: SIZES.padding || 16,
    marginHorizontal: SIZES.padding || 16,
    marginTop: SIZES.padding || 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text || '#1C1C1E',
    marginBottom: 16,
  },
  chartWrapper: {
      flexDirection: 'row',
      height: 180,
  },
  chartContainer: {
    flex: 1,
    height: 180,
  },
  legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 18
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10
  },
  legendColor: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6
  },
  legendText: {
      fontSize: 12,
      color: COLORS.textMuted || '#8E8E93',
      fontWeight: '700'
  }
});