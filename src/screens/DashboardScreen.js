import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet,ScrollView } from 'react-native';
import { LineChart, Grid } from 'react-native-svg-charts';
import * as shape from 'd3-shape';
import { monitorDevice } from './ScanScreen';

export default function DashboardScreen({ route }) {
  const deviceId = route?.params?.deviceId;

  const [bpmActual, setBpmActual] = useState(0);
  const [historialBpm, setHistorialBpm] = useState(Array(30).fill(0));
  const [estadoConexion, setEstadoConexion] = useState('🟡 Esperando conexión...');

  useEffect(() => {
    if (deviceId) {
      setEstadoConexion(`🟡 Conectando al sensor ${deviceId}...`);
      monitorDevice(deviceId, (bpm) => {
        setEstadoConexion('🟢 Sensor Conectado');
        setBpmActual(bpm);
        
        setHistorialBpm((datosAnteriores) => {
          const nuevoHistorial = [...datosAnteriores];
          nuevoHistorial.shift(); 
          nuevoHistorial.push(bpm);
          return nuevoHistorial;
        });
      });
    } else {
      setEstadoConexion('🔴 No hay dispositivo conectado');
    }
  }, [deviceId]);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Monitor Cardíaco</Text>

      {/* Indicador Numérico */}
      <View style={styles.circuloBpm}>
        <Text style={styles.numeroBpm}>{bpmActual}</Text>
        <Text style={styles.textoBpm}>BPM</Text>
      </View>

      {/* Gráfica  */}
      <View style={styles.contenedorGrafica}>
        <LineChart
          style={{ flex: 1 }}
          data={historialBpm}
          yMin={40} 
          yMax={150} 
          svg={{ stroke: '#ff4d4d', strokeWidth: 3 }} 
          contentInset={{ top: 20, bottom: 20 }}
          curve={shape.curveNatural} 
        >
          <Grid svg={{ stroke: 'rgba(255,255,255,0.2)' }} />
        </LineChart>
      </View>

      <Text style={styles.estadoConexion}>{estadoConexion}</Text>
    </View>
  );
}

// Estilos básicos
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    paddingTop: 60,
  },
  titulo: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  circuloBpm: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  numeroBpm: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
  },
  textoBpm: {
    color: '#ff4d4d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contenedorGrafica: {
    height: 200,
    width: '90%',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 10,
  },
  estadoConexion: {
    color: '#4ade80',
    marginTop: 30,
    fontSize: 16,
  }
});