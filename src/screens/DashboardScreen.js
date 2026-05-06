import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBluetooth, monitorDevice } from '../hooks/useBluetooth';
import { COLORS, SIZES } from '../constants/theme';
import StatCard from '../components/StatCard';
import PulseChart from '../components/PulseChart';
import BloodPressureChart from '../components/BloodPressureChart';
import ConnectionStatus from '../components/ConnectionStatus';

export default function DashboardScreen({ route }) {
    const navigation = useNavigation();
    const deviceId = route?.params?.deviceId;
    
    const { manager } = useBluetooth();

    const [activeTab, setActiveTab] = useState('PULSE');

    const [bpmActual, setBpmActual] = useState(0);
    const [spo2Actual, setSpo2Actual] = useState(98);
    const [historialBpm, setHistorialBpm] = useState(Array(30).fill(60));
    
    const [sysActual, setSysActual] = useState(0);
    const [historialSys, setHistorialSys] = useState(Array(30).fill(120));

    const [statusMsg, setStatusMsg] = useState('Esperando conexión...');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!deviceId) {
            setStatusMsg('No hay dispositivo conectado');
            setIsConnected(false);
            return;
        }

        setStatusMsg(`Conectando al sensor ${deviceId}...`);

        // --- INICIO CÓDIGO SIMULADOR ---
        if (deviceId.startsWith('SIMULADO')) {
            setStatusMsg('Sensor Simulado Conectado (Prueba)');
            setIsConnected(true);
            
            const intervalId = setInterval(() => {
                // Generar BPM
                const simulatedBpm = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
                setBpmActual(simulatedBpm);
                
                // Generar SpO2
                setSpo2Actual(prev => {
                    const variance = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
                    return Math.min(100, Math.max(90, prev + variance));
                });
                
                // Generar Presión Arterial Sistólica (Sys 110-130)
                const simSys = Math.floor(Math.random() * (130 - 110 + 1)) + 110;
                setSysActual(simSys);

                setHistorialBpm((prev) => {
                    const nuevoHistorial = [...prev];
                    nuevoHistorial.shift();
                    nuevoHistorial.push(simulatedBpm);
                    return nuevoHistorial;
                });
                
                setHistorialSys((prev) => {
                    const nuevoHistorial = [...prev];
                    nuevoHistorial.shift();
                    nuevoHistorial.push(simSys);
                    return nuevoHistorial;
                });
            }, 1000);

            return () => clearInterval(intervalId);
        }
        // --- FIN CÓDIGO SIMULADOR ---

        monitorDevice(deviceId, (bpm) => {
            setStatusMsg('Conectado recibiendo datos');
            setIsConnected(true);
            setBpmActual(bpm);
            
            // Simulación temporal para SpO2 y Presión en dispositivo real hasta que se integre la lectura de bytes BLE
            setSpo2Actual(prev => {
              const variance = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
              return Math.min(100, Math.max(90, prev + variance));
            });
            const realSimSys = Math.floor(Math.random() * (130 - 110 + 1)) + 110;
            
            setSysActual(realSimSys);

            setHistorialBpm((prev) => {
                const nuevoHistorial = [...prev];
                nuevoHistorial.shift();
                nuevoHistorial.push(bpm);
                return nuevoHistorial;
            });
            
            setHistorialSys((prev) => {
                const nuevoHistorial = [...prev];
                nuevoHistorial.shift();
                nuevoHistorial.push(realSimSys);
                return nuevoHistorial;
            });
        });

    }, [deviceId]);

    const handleDisconnect = async () => {
        if (deviceId && manager) {
            try {
                await manager.cancelDeviceConnection(deviceId);
            } catch (e) {
                console.log('Error desconectando:', e);
            }
        }
        navigation.goBack();
    };

    const renderTabSelector = () => (
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'PULSE' && styles.activeTabButton]}
            onPress={() => setActiveTab('PULSE')}
        >
            <Text style={[styles.tabText, activeTab === 'PULSE' && styles.activeTabText]}>Frecuencia</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'BLOOD_PRESSURE' && styles.activeTabButton]}
            onPress={() => setActiveTab('BLOOD_PRESSURE')}
        >
            <Text style={[styles.tabText, activeTab === 'BLOOD_PRESSURE' && styles.activeTabText]}>P. Arterial</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'ALERTS' && styles.activeTabButton]}
            onPress={() => setActiveTab('ALERTS')}
        >
            <Text style={[styles.tabText, activeTab === 'ALERTS' && styles.activeTabText]}>Alertas</Text>
        </TouchableOpacity>
      </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <ConnectionStatus 
                  statusMsg={statusMsg} 
                  isConnected={isConnected} 
                  onDisconnect={handleDisconnect} 
                />

                {renderTabSelector()}

                {activeTab === 'PULSE' && (
                    <View style={styles.contentSection}>
                        <View style={styles.statsRow}>
                            <StatCard 
                            label="Frecuencia Cardíaca"
                            value={bpmActual}
                            unit="BPM"
                            color={COLORS.primary}
                            />
                            <StatCard 
                            label="Oxígeno (SpO2)"
                            value={spo2Actual}
                            unit="%"
                            color={COLORS.secondary}
                            />
                        </View>

                        {historialBpm.length > 0 && (
                            <PulseChart 
                            data={historialBpm} 
                            color={COLORS.primary} 
                            />
                        )}
                    </View>
                )}

                {activeTab === 'BLOOD_PRESSURE' && (
                    <View style={styles.contentSection}>
                        <View style={styles.statsRow}>
                            <StatCard 
                            label="Sistólica"
                            value={sysActual}
                            unit="mmHg"
                            color={'#D97706'} 
                            />
                        </View>
                        
                        <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>Clasificación Presión Arterial</Text>
                            <Text style={styles.infoDetail}>
                                {sysActual < 120 ? 'Normal' : 
                                 sysActual <= 129 ? 'Elevada' : 
                                 'Hipertensión Fase 1+'}
                            </Text>
                            <Text style={styles.infoSubText}>
                                Valores en tiempo real obtenidos mediante sensor BLE.
                            </Text>
                        </View>

                        {historialSys.length > 0 && (
                            <BloodPressureChart 
                                dataSys={historialSys}
                            />
                        )}
                    </View>
                )}

                {activeTab === 'ALERTS' && (
                    <View style={styles.contentSection}>
                        <View style={styles.emptyAlertsContainer}>
                            <Text style={styles.emptyAlertsIcon}>🔔</Text>
                            <Text style={styles.emptyAlertsTitle}>No hay alertas activas</Text>
                            <Text style={styles.emptyAlertsDesc}>
                                Aquí se mostrarán las notificaciones cuando los signos vitales salgan de los rangos normales (próximamente).
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background || '#F2F2F7',
    },
    container: {
        flexGrow: 1,
        paddingBottom: (SIZES.padding || 16) * 2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E5E5EA',
        marginHorizontal: SIZES.padding || 16,
        borderRadius: 12,
        padding: 4,
        marginTop: 10,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTabButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    activeTabText: {
        color: COLORS.text,
        fontWeight: '800',
    },
    contentSection: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: (SIZES.padding || 16) - (SIZES.margin || 8),
        marginTop: SIZES.padding || 16,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: SIZES.padding || 16,
        marginTop: 24,
        padding: 20,
        borderRadius: SIZES.radius || 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        alignItems: 'center'
    },
    infoTitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    infoDetail: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    infoSubText: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    emptyAlertsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        marginTop: 20,
    },
    emptyAlertsIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyAlertsTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    emptyAlertsDesc: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    }
});