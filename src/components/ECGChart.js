import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LineChart, Grid, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';

export default function ECGChart({ data, color = '#10B981', height = 160, showTitle = true }) {
  const maxVal = Math.max(...data, 1.2);
  const minVal = Math.min(...data, 0);
  const calculatedMin = 0;
  const calculatedMax = Math.max(1.2, maxVal * 1.05);

  const Gradient = () => (
    <Defs key={'gradient'}>
      <LinearGradient id={'gradientEcg'} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
        <Stop offset={'0%'} stopColor={color} stopOpacity={0.2} />
        <Stop offset={'100%'} stopColor={color} stopOpacity={0} />
      </LinearGradient>
    </Defs>
  );

  return (
    <View style={styles.container}>
      {showTitle && <Text style={styles.title}>Electrocardiograma</Text>}
      <View style={[styles.chartWrapper, { height }]}> 
        <YAxis
          data={[0, 0.3, 0.6, 0.9, 1.2]}
          min={calculatedMin}
          max={calculatedMax}
          contentInset={{ top: 10, bottom: 10 }}
          svg={{ fill: COLORS.textMuted || 'grey', fontSize: 10, fontWeight: 'bold' }}
          numberOfTicks={5}
          formatLabel={(value) => `${value.toFixed(1)}`}
        />
        <View style={styles.chartContainer}>
          <LineChart
            style={{ flex: 1, marginLeft: 8 }}
            data={data}
            yMin={calculatedMin}
            yMax={calculatedMax}
            svg={{ stroke: color, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}
            contentInset={{ top: 8, bottom: 8 }}
            curve={shape.curveLinear}
          >
            <Grid svg={{ stroke: 'rgba(16, 185, 129, 0.12)', strokeWidth: 1, strokeDasharray: [4, 4] }} />
            <Gradient />
          </LineChart>
        </View>
      </View>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Señal ECG</Text>
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
    color: COLORS.text,
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
  },
  chartContainer: {
    flex: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
});
