import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { LineChart, Grid, YAxis } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, SIZES } from '../constants/theme';

export default function PulseChart({ data, color, height = 180, showTitle = true, showLegend = true, hideYAxis = false, scrollable = false, pointWidth = 14, containerStyle }) {
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  
  const range = maxVal - minVal;
  const padding = range === 0 ? 10 : range * 0.15;
  const calculatedMax = maxVal + padding;
  const calculatedMin = Math.max(0, minVal - padding);

  const finalColor = color || '#FF2D55';
  const chartWidth = Math.max(data.length * pointWidth, 320);

  const Gradient = () => (
    <Defs key={'gradient'}>
        <LinearGradient id={'gradientPulse'} x1={'0%'} y1={'0%'} x2={'0%'} y2={'100%'}>
            <Stop offset={'0%'} stopColor={finalColor} stopOpacity={0.15} />
            <Stop offset={'100%'} stopColor={finalColor} stopOpacity={0.0} />
        </LinearGradient>
    </Defs>
  );

  const chartStyle = scrollable
    ? { width: chartWidth, height: '100%', marginLeft: hideYAxis ? 0 : 8 }
    : { flex: 1, marginLeft: hideYAxis ? 0 : 8 };

  return (
    <View style={[styles.container, containerStyle]}>
      {showTitle && <Text style={styles.title}>Historial de pulsaciones</Text>}
      
      <View style={[styles.chartWrapper, { height }]}> 
        {!hideYAxis && (
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
        )}
        
        <View style={[styles.chartContainer, hideYAxis && { marginLeft: 0 }]}> 
          <ScrollView
            horizontal={scrollable}
            showsHorizontalScrollIndicator={scrollable}
            contentContainerStyle={scrollable ? { width: chartWidth } : undefined}
          >
            <LineChart
              style={chartStyle}
              data={data}
              yMin={calculatedMin}
              yMax={calculatedMax}
              svg={{ stroke: finalColor, strokeWidth: 3, strokeLinecap: 'round' }}
              contentInset={{ top: 12, bottom: 20 }}
              curve={shape.curveNatural}
            >
              <Grid svg={{ stroke: 'rgba(0,0,0,0.12)', strokeWidth: 1 }} />
              <Gradient />
            </LineChart>
          </ScrollView>
        </View>
      </View>
      
      {showLegend && (
        <View style={styles.legendContainer}>
           <View style={styles.legendItem}>
               <View style={[styles.legendColor, {backgroundColor: finalColor}]} />
               <Text style={styles.legendText}>Latidos por Minuto (BPM)</Text>
           </View>
        </View>
      )}
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
    paddingBottom: 8,
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
