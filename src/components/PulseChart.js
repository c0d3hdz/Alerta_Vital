import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LineChart, Grid, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';

export default function PulseChart({ data, color }) {
  // Ajuste dinámico del rango visible
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  
  // Agregar margen superior e inferior del 15% para que no toque los bordes
  const range = maxVal - minVal;
  const padding = range === 0 ? 10 : range * 0.15;
  const calculatedMax = maxVal + padding;
  const calculatedMin = Math.max(0, minVal - padding);

  const finalColor = color || COLORS.primary;

  const Gradient = () => (
    <Defs key={'gradient'}>
        <LinearGradient id={'gradientPulse'} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
            <Stop offset={'0%'} stopColor={finalColor} stopOpacity={0.2} />
            <Stop offset={'100%'} stopColor={finalColor} stopOpacity={0.0} />
        </LinearGradient>
    </Defs>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de pulsaciones</Text>
      
      <View style={styles.chartWrapper}>
        <YAxis
            data={[calculatedMin, calculatedMax]}
            min={calculatedMin}
            max={calculatedMax}
            contentInset={{ top: 10, bottom: 10 }}
            svg={{
                fill: COLORS.textMuted || 'grey',
                fontSize: 10,
                fontWeight: 'bold'
            }}
            numberOfTicks={5}
            formatLabel={(value) => `${Math.round(value)}`}
        />
        
        <View style={styles.chartContainer}>
          <LineChart
            style={{ flex: 1, marginLeft: 8 }}
            data={data}
            yMin={calculatedMin}
            yMax={calculatedMax}
            svg={{ stroke: finalColor, strokeWidth: 3 }}
            contentInset={{ top: 10, bottom: 10 }}
            curve={shape.curveMonotoneX}
          >
            <Grid svg={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1 }} />
            <Gradient />
          </LineChart>
        </View>
      </View>
      
      <View style={styles.legendContainer}>
         <View style={styles.legendItem}>
             <View style={[styles.legendColor, {backgroundColor: finalColor}]} />
             <Text style={styles.legendText}>Latidos por Minuto (BPM)</Text>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginHorizontal: SIZES.padding,
    marginTop: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
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
  },
  legendColor: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6
  },
  legendText: {
      fontSize: 12,
      color: COLORS.textMuted,
      fontWeight: '700'
  }
});
