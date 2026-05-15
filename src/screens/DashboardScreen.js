import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBluetooth, monitorDevice } from '../hooks/useBluetooth';
import { COLORS, SIZES } from '../constants/theme';
import StatCard from '../components/StatCard';
import PulseChart from '../components/PulseChart';
import ECGChart from '../components/ECGChart';
import BloodPressureChart from '../components/BloodPressureChart';
import ConnectionStatus from '../components/ConnectionStatus';
import { createSession, createReading, createAlert } from '../services/ApiService';

export default function DashboardScreen({ route }) {
    const navigation = useNavigation();
    const deviceId = route?.params?.deviceId;

    const { manager } = useBluetooth();

    const [activeTab, setActiveTab] = useState('PULSE');

    const [bpmActual, setBpmActual] = useState(0);
    const [spo2Actual, setSpo2Actual] = useState(98);
    const [historialBpm, setHistorialBpm] = useState(Array(150).fill(60));

    const [sysActual, setSysActual] = useState(0);
    const [historialSys, setHistorialSys] = useState(Array(100).fill(120));
    const [historialEcg, setHistorialEcg] = useState(Array(100).fill(0));
    const ecgPhaseRef = useRef(0);
    const bpmActualRef = useRef(bpmActual);
    const spo2Ref = useRef(spo2Actual);
    const sysRef = useRef(sysActual);
    const readingCounterRef = useRef(0);
    const [sessionId, setSessionId] = useState(null);
    const [user, setUser] = useState(route?.params?.user || null);

    const [alerts, setAlerts] = useState([]);
    const [currentAlertSession, setCurrentAlertSession] = useState(null);
    const currentAlertSessionRef = useRef(null);
    const [activeAlert, setActiveAlert] = useState(null);
    const activeAlertRef = useRef(null);
    const historialEcgRef = useRef(historialEcg);
    const monitorCleanupRef = useRef(null);
    const [alertFlash, setAlertFlash] = useState(false);

    const [statusMsg, setStatusMsg] = useState('Esperando conexión...');
    const [isConnected, setIsConnected] = useState(false);
    const [signalQuality, setSignalQuality] = useState('Sin señal');

    const generateEcgSamples = (phase, count, isArrhythmia = false) => {
        const template = [
            0.10, 0.12, 0.14, 0.16, 0.18, 0.22, 0.28, 0.36, 0.60, 0.92,
            1.15, 0.72, 0.48, 0.34, 0.24, 0.18, 0.16, 0.15, 0.14, 0.12,
        ];
        const result = [];
        for (let i = 0; i < count; i++) {
            const index = (phase + i) % template.length;
            let value = template[index] + (Math.random() - 0.5) * 0.03;
            if (isArrhythmia && index > 7 && index < 14) {
                value += 0.1;
            }
            result.push(Math.max(0.05, Math.min(1.2, value)));
        }
        return result;
    };

    const appendEcgValues = (values) => {
        setHistorialEcg((prev) => {
            const sliceCount = values.length;
            return [...prev.slice(sliceCount), ...values];
        });
    };

    const normalizeRawEcg = (rawValue) => {
        if (typeof rawValue !== 'number' || Number.isNaN(rawValue)) {
            return null;
        }
        const clipped = Math.max(0, Math.min(rawValue, 4095));
        const normalized = clipped / 4095;
        return Math.max(0.08, Math.min(1.15, 0.25 + normalized * 0.85));
    };

    const buildEcgSegment = (nextValue, previousValue) => {
        const prev = typeof previousValue === 'number' ? previousValue : 0.28;
        const mid = (prev + nextValue) / 2;
        return [
            prev * 0.88 + mid * 0.12,
            mid,
            nextValue * 0.86 + mid * 0.14,
        ];
    };

    useEffect(() => {
        if (!deviceId) {
            setStatusMsg('No hay dispositivo conectado');
            setIsConnected(false);
            return;
        }

        setStatusMsg((prev) =>
            prev === `Conectando al sensor ${deviceId}...`
                ? prev
                : `Conectando al sensor ${deviceId}...`
        );

        // --- INICIO CÓDIGO SIMULADOR ---
        if (deviceId.startsWith('SIMULADO')) {
            setStatusMsg('Sensor Simulado Conectado (Prueba)');
            setIsConnected(true);

            let currentBpm = 72; // Ritmo cardíaco sano al reposo
            let currentSys = 115; // Presión sistólica normal
            let tickCount = 0;

            const intervalId = setInterval(() => {
                tickCount++;

                // 1. Simulación BPM: Deriva natural y suave
                if (Math.random() > 0.6) {
                    currentBpm += (Math.random() > 0.5 ? 1 : -1);
                    currentBpm = Math.max(60, Math.min(85, currentBpm)); // Límite persona sana
                }

                let simulatedBpm = currentBpm;
                const cycleLength = 600; // ~2.5 minutos de demo para ver alertas con más rapidez
                const cyclePos = tickCount % cycleLength;
                const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
                const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

                if (cyclePos >= 520 && cyclePos < 545) {
                    // Patrón de irregularidad tipo fibrilación auricular / variabilidad alta
                    currentBpm = clamp(currentBpm + randomInt(-2, 2), 60, 95);
                    simulatedBpm = clamp(currentBpm + randomInt(-12, 12), 50, 120);
                } else if (cyclePos >= 545 && cyclePos < 565) {
                    // Taquicardia sostenida de inicio gradual
                    currentBpm = clamp(currentBpm + 1, 80, 100);
                    simulatedBpm = clamp(currentBpm + randomInt(5, 15), 85, 125);
                } else if (cyclePos >= 565 && cyclePos < 585) {
                    // Episodio de pico brusco / posible arritmia ventricular
                    simulatedBpm = currentBpm + randomInt(18, 35);
                } else if (cyclePos >= 585 && cyclePos < 610) {
                    // Bradiarritmia sostenida
                    currentBpm = clamp(currentBpm - 1, 42, 60);
                    simulatedBpm = clamp(currentBpm + randomInt(-5, 5), 40, 65);
                } else if (cyclePos >= 610 && cyclePos < 620) {
                    // Contracciones prematuras aisladas (picos y caídas cortas)
                    if (Math.random() > 0.5) {
                        simulatedBpm = currentBpm + randomInt(18, 28);
                    } else {
                        simulatedBpm = currentBpm - randomInt(18, 28);
                    }
                } else if (cyclePos >= 620 && cyclePos < 630) {
                    // Ruido de señal/artifacto para probar tolerancia
                    simulatedBpm = clamp(currentBpm + randomInt(-20, 20), 50, 120);
                } else {
                    if (Math.random() > 0.6) {
                        currentBpm += (Math.random() > 0.5 ? 1 : -1);
                        currentBpm = clamp(currentBpm, 60, 85);
                    }
                    simulatedBpm = currentBpm;
                }

                setBpmActual(simulatedBpm);

                // 2. Generar SpO2 estable para persona sana (97% - 100%)
                setSpo2Actual(prev => {
                    const variance = Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0;
                    return Math.min(100, Math.max(97, prev + variance));
                });

                // 3. Generar Presión Arterial Sistólica con deriva realista (110 - 125 mmHg)
                if (Math.random() > 0.7) {
                    currentSys += (Math.random() > 0.5 ? 1 : -1);
                    currentSys = Math.max(110, Math.min(125, currentSys));
                }
                const simSys = currentSys;
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

                if (sessionId && user) {
                    readingCounterRef.current += 1;
                    if (readingCounterRef.current % 4 === 0) {
                        sendReading({
                            bpm: simulatedBpm,
                            spo2: spo2Ref.current,
                            sys: simSys,
                            ecg_value: historialEcgRef.current[historialEcgRef.current.length - 1] || 0,
                        });
                    }
                }
            }, 250); // Actualiza cada 250ms para un flujo más continuo y visual (tipo monitor médico)

            return () => clearInterval(intervalId);
        }
        // --- FIN CÓDIGO SIMULADOR ---

        let isMounted = true;

        const connectToDevice = async () => {
            monitorCleanupRef.current?.remove?.();
            const cleanup = await monitorDevice(deviceId, ({ bpm, leadOff, reason, rawEcg, quality }) => {
                if (reason === 'ble-disconnect') {
                    setStatusMsg('Sensor BLE desconectado');
                    setIsConnected(false);
                    setSignalQuality('Desconectado');
                    setBpmActual(0);
                    return;
                }

                if (leadOff) {
                    setStatusMsg('Electrodos desconectados o señal inválida');
                    setSignalQuality('Electrodos sueltos');
                } else {
                    setStatusMsg('Conectado recibiendo datos');
                    if (typeof quality === 'number') {
                        const qualityState = quality >= 80 ? 'Señal buena' : quality >= 50 ? 'Señal regular' : 'Señal baja';
                        setSignalQuality(qualityState);
                    } else {
                        setSignalQuality('Señal activa');
                    }
                }

                setIsConnected(true);

                setHistorialBpm((prev) => {
                    const nuevoHistorial = [...prev];
                    nuevoHistorial.shift();
                    nuevoHistorial.push(0);
                    return nuevoHistorial;
                });

                const normalizedEcg = normalizeRawEcg(rawEcg);
                const nextEcg = normalizedEcg !== null ? normalizedEcg : (leadOff ? 0.08 : 0.35);

                setHistorialEcg((prev) => {
                    const bufferSize = prev.length;
                    const next = Math.max(0.05, Math.min(1.15, nextEcg));
                    return [...prev.slice(1), next];
                });

                if (sessionId && user && !leadOff) {
                    readingCounterRef.current += 1;
                    if (readingCounterRef.current % 4 === 0) {
                        sendReading({
                            bpm,
                            spo2: spo2Ref.current,
                            sys: sysRef.current,
                            ecg_value: historialEcgRef.current[historialEcgRef.current.length - 1] || 0,
                        });
                    }
                }
            });

            if (isMounted && cleanup) {
                monitorCleanupRef.current = cleanup;
            }
        };

        connectToDevice();

        return () => {
            isMounted = false;
            monitorCleanupRef.current?.remove?.();
        };

    }, [deviceId]);

    useEffect(() => {
        if (isConnected && user && deviceId && !sessionId) {
            const create = async () => {
                try {
                    const result = await createSession({
                        user_id: user.id || user.google_id,
                        device_id: deviceId,
                        start_ts: Math.floor(Date.now() / 1000),
                        end_ts: null,
                        avg_bpm: null,
                        avg_spo2: null,
                        avg_sys: null,
                    });
                    setSessionId(result.id);
                } catch (error) {
                    console.warn('No se pudo crear sesión en el backend:', error);
                }
            };
            create();
        }
    }, [isConnected, user, deviceId, sessionId]);

    useEffect(() => {
        spo2Ref.current = spo2Actual;
    }, [spo2Actual]);

    useEffect(() => {
        sysRef.current = sysActual;
    }, [sysActual]);

    useEffect(() => {
        historialEcgRef.current = historialEcg;
    }, [historialEcg]);

    const sendReading = async ({ bpm, spo2, sys, ecg_value }) => {
        if (!user || !sessionId) return;
        try {
            await createReading({
                session_id: sessionId,
                timestamp: Math.floor(Date.now() / 1000),
                bpm,
                spo2,
                sys,
                ecg_value,
            });
        } catch (error) {
            console.warn('No se pudo enviar lectura al backend:', error);
        }
    };

    const handleSaveAlert = async (completedSession) => {
        if (!user) return;
        try {
            await createAlert({
                session_id: completedSession.id || null,
                user_id: user.id || user.google_id,
                type: completedSession.type,
                message: completedSession.message,
                start_ts: Math.floor(completedSession.startTimestamp / 1000),
                end_ts: Math.floor(completedSession.endTimestamp / 1000),
                avg_bpm: completedSession.avgBpm,
                duration_sec: Math.round((completedSession.durationMs || 0) / 1000),
                preview_data: completedSession.previewData,
            });
        } catch (error) {
            console.warn('No se pudo guardar alerta en el backend:', error);
        }
    };

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

    const MIN_ALERT_DURATION_MS = 5000;
    const PRE_ALERT_MS = 5000;
    const PRE_ALERT_SAMPLES = 40; // 10 segundos de datos previos en simulación a 250ms por muestra
    const MAX_ALERT_PREVIEW_SAMPLES = PRE_ALERT_SAMPLES + 120; // conserva buffer previo y parte del evento
    const formatTime = (timestamp) => timestamp ? new Date(timestamp).toLocaleTimeString() : '-';
    const computeAverageBpm = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const computeMaxBpm = (values) => values.length ? Math.max(...values) : 0;
    const computeMinBpm = (values) => values.length ? Math.min(...values) : 0;
    const getAlertDurationMs = (alert) => alert?.durationMs ?? ((alert?.duration_sec || 0) * 1000);

    const buildAlertPreviewData = (history, latestBpm) => {
        const preAlert = history.slice(-PRE_ALERT_SAMPLES - 1, -1);
        return [...preAlert, latestBpm];
    };

    const setCurrentAlertSessionState = (session) => {
        currentAlertSessionRef.current = session;
        setCurrentAlertSession(session);
    };

    const areAlertsEqual = (a, b) => {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a.type === b.type && a.message === b.message;
    };

    const finalizeAlertSession = (session, latestBpm) => {
        if (!session) return;
        const previewData = [...session.previewData, latestBpm];
        const durationMs = Date.now() - session.startTimestamp;
        if (durationMs < MIN_ALERT_DURATION_MS) {
            return;
        }

        const avgBpm = computeAverageBpm(previewData);
        const completedSession = {
            ...session,
            timestamp: session.startTimestamp,
            endTimestamp: Date.now(),
            avgBpm,
            maxBpm: computeMaxBpm(previewData),
            minBpm: computeMinBpm(previewData),
            previewData,
            durationMs,
        };
        setAlerts((prev) => [{ ...completedSession }, ...prev].slice(0, 10));
        handleSaveAlert(completedSession);
    };

    useEffect(() => {
        const detected = evaluateBpmAlerts(historialBpm);
        const latestBpm = historialBpm[historialBpm.length - 1] ?? bpmActual;
        const currentSession = currentAlertSessionRef.current;

        if (!areAlertsEqual(detected, activeAlert)) {
            setActiveAlert(detected);
        }

        if (detected) {
            if (!currentSession) {
                setCurrentAlertSessionState({
                    type: detected.type,
                    message: detected.message,
                    startTimestamp: Date.now(),
                    previewData: buildAlertPreviewData(historialBpm, latestBpm),
                    consecutiveMatches: 1,
                    isConfirmed: false,
                });
                return;
            }

            if (currentSession.type === detected.type && currentSession.message === detected.message) {
                let previewData = [...currentSession.previewData, latestBpm];
                if (previewData.length > MAX_ALERT_PREVIEW_SAMPLES) {
                    previewData = previewData.slice(-MAX_ALERT_PREVIEW_SAMPLES);
                }
                const durationMs = Date.now() - currentSession.startTimestamp;
                setCurrentAlertSessionState({
                    ...currentSession,
                    previewData,
                    consecutiveMatches: (currentSession.consecutiveMatches || 0) + 1,
                    isConfirmed: currentSession.isConfirmed || durationMs >= MIN_ALERT_DURATION_MS,
                });
                return;
            }

            finalizeAlertSession(currentSession, latestBpm);
            setCurrentAlertSessionState({
                type: detected.type,
                message: detected.message,
                startTimestamp: Date.now(),
                previewData: [latestBpm],
                consecutiveMatches: 1,
                isConfirmed: false,
            });
            return;
        }

        if (currentSession) {
            finalizeAlertSession(currentSession, latestBpm);
            setCurrentAlertSessionState(null);
        }
    }, [historialBpm]);

    useEffect(() => {
        bpmActualRef.current = bpmActual;
    }, [bpmActual]);

    useEffect(() => {
        activeAlertRef.current = activeAlert;
    }, [activeAlert]);

    useEffect(() => {
        if (!activeAlert) {
            setAlertFlash((prev) => (prev ? false : prev));
            return;
        }

        Vibration.vibrate([0, 150, 100, 150], false);
        setAlertFlash(true);
        const timeout = setTimeout(() => setAlertFlash(false), 800);
        return () => clearTimeout(timeout);
    }, [activeAlert]);

    const evaluateBpmAlerts = (history) => {
        if (!history || history.length < 50) return null;

        const recent = history.slice(-60);
        const lastBpm = recent[recent.length - 1];
        const mean = recent.reduce((total, value) => total + value, 0) / recent.length;
        const variance = recent.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / recent.length;
        const stdDev = Math.sqrt(variance);
        const deltas = recent.slice(1).map((value, index) => value - recent[index]);
        const absDeltas = deltas.map((delta) => Math.abs(delta));
        const largeJumps = absDeltas.filter((delta) => delta >= 15).length;
        const veryLargeJump = absDeltas.some((delta) => delta >= 25);
        const directionChanges = deltas.slice(-15).reduce((count, delta, index, array) => {
            if (index === 0) return 0;
            return count + (delta * array[index - 1] < 0 && Math.abs(delta) >= 5 && Math.abs(array[index - 1]) >= 5 ? 1 : 0);
        }, 0);
        const sustainedHigh = recent.slice(-20).every((value) => value >= 100);
        const sustainedLow = recent.slice(-20).every((value) => value <= 55);
        const sustainedRise = recent.slice(-15).every((value, index, array) => index === 0 || value >= array[index - 1]);
        const sustainedFall = recent.slice(-15).every((value, index, array) => index === 0 || value <= array[index - 1]);

        if (veryLargeJump) {
            return { type: 'anomaly', message: 'Cambio brusco de pulso detectado. Posible arritmia inmediata.' };
        }

        if (largeJumps >= 3 && stdDev >= 8) {
            return { type: 'anomaly', message: 'Variabilidad cardiaca inestable detectada. Posible arritmia inmediata.' };
        }

        if (directionChanges >= 3 && stdDev >= 7) {
            return { type: 'warning', message: 'Pulso con oscilaciones rápidas e irregulares. Vigila el ritmo.' };
        }

        if (sustainedHigh && mean >= 105) {
            return { type: 'warning', message: 'Tachicardia sostenida detectada. Revisa al paciente.' };
        }

        if (sustainedLow && mean <= 52) {
            return { type: 'warning', message: 'Bradicardia sostenida detectada. Consulta médica.' };
        }

        if (sustainedRise && mean >= 90) {
            return { type: 'warning', message: 'Incremento rápido de pulso. Puede indicar arritmia emergente.' };
        }

        if (sustainedFall && mean <= 70) {
            return { type: 'warning', message: 'Descenso progresivo de pulso. Atención recomendada.' };
        }

        if (stdDev >= 9 && mean >= 85) {
            return { type: 'warning', message: 'Alta variabilidad de pulso. Riesgo de irregularidad cardiaca.' };
        }

        if (lastBpm >= 110) {
            return { type: 'warning', message: 'Pulso elevado sostenido. Revisa el estado en corto plazo.' };
        }

        if (lastBpm <= 50) {
            return { type: 'warning', message: 'Pulso bajo sostenido. Podría requerir atención.' };
        }

        return null;
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
                                label="Pulsaciones"
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

                        {activeAlert && (
                            <View style={[
                                styles.alertBanner,
                                activeAlert.type === 'anomaly' ? styles.alertDanger : styles.alertWarning,
                                alertFlash && styles.alertBannerFlash,
                            ]}>
                                <Text style={styles.alertBannerText}>{activeAlert.message}</Text>
                            </View>
                        )}

                        {historialEcg.length > 0 && (
                            <View style={styles.ecgHeaderRow}>
                                <Text style={styles.ecgHeaderTitle}>Electrocardiograma</Text>
                                <Text style={styles.ecgHeaderStatus}>{signalQuality}</Text>
                            </View>
                        )}
                        {historialEcg.length > 0 && (
                            <ECGChart
                                data={historialEcg}
                                color={'#10B981'}
                                height={200}
                                showTitle={false}
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
                        {(!currentAlertSession && alerts.length === 0) ? (
                            <View style={styles.emptyAlertsContainer}>
                                <Text style={styles.emptyAlertsIcon}>🔔</Text>
                                <Text style={styles.emptyAlertsTitle}>No hay alertas activas</Text>
                                <Text style={styles.emptyAlertsDesc}>
                                    Aquí se mostrarán las notificaciones cuando los signos vitales salgan de los rangos normales.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.alertListContainer}>
                                {currentAlertSession && (
                                    <View style={[styles.alertItem, currentAlertSession.type === 'anomaly' ? styles.alertItemDanger : styles.alertItemWarning]}>
                                        <View style={styles.alertCardHeader}>
                                            <Text style={styles.alertType}>{currentAlertSession.type === 'anomaly' ? 'Alerta activa' : 'Advertencia activa'}</Text>
                                            <Text style={styles.alertStatus}>En curso</Text>
                                        </View>
                                        <Text style={styles.alertMessage}>{currentAlertSession.message}</Text>
                                        <View style={styles.alertMetaRow}>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Inicio</Text>
                                                <Text style={styles.alertMetaValue}>{formatTime(currentAlertSession.startTimestamp)}</Text>
                                            </View>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Fin</Text>
                                                <Text style={styles.alertMetaValue}>En curso</Text>
                                            </View>
                                        </View>
                                        <View style={styles.alertMetaRow}>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Promedio</Text>
                                                <Text style={styles.alertMetaValue}>{computeAverageBpm(currentAlertSession.previewData)} BPM</Text>
                                            </View>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Duración</Text>
                                                <Text style={styles.alertMetaValue}>{Math.round((Date.now() - currentAlertSession.startTimestamp) / 1000)} s</Text>
                                            </View>
                                        </View>
                                        <View style={styles.alertMetaRow}>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Máximo</Text>
                                                <Text style={styles.alertMetaValue}>{computeMaxBpm(currentAlertSession.previewData)} BPM</Text>
                                            </View>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Mínimo</Text>
                                                <Text style={styles.alertMetaValue}>{computeMinBpm(currentAlertSession.previewData)} BPM</Text>
                                            </View>
                                        </View>
                                        {currentAlertSession.previewData?.length > 0 && (
                                            <View style={styles.alertPreviewChart}>
                                                <PulseChart
                                                    data={currentAlertSession.previewData}
                                                    color={currentAlertSession.type === 'anomaly' ? '#DC2626' : '#F59E0B'}
                                                    height={140}
                                                    showTitle={false}
                                                    showLegend={false}
                                                    hideYAxis={false}
                                                    scrollable={true}
                                                    pointWidth={16}
                                                    containerStyle={styles.alertChartContainer}
                                                />
                                            </View>
                                        )}
                                    </View>
                                )}
                                {alerts.map((alert, index) => (
                                    <View key={`${alert.timestamp}-${index}`} style={[styles.alertItem, alert.type === 'anomaly' ? styles.alertItemDanger : styles.alertItemWarning]}>
                                        <View style={styles.alertCardHeader}>
                                            <Text style={styles.alertType}>{alert.type === 'anomaly' ? 'Alerta' : 'Advertencia'}</Text>
                                            <Text style={styles.alertStatus}>Finalizada</Text>
                                        </View>
                                        <Text style={styles.alertMessage}>{alert.message}</Text>
                                        <View style={styles.alertMetaRow}>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Inicio</Text>
                                                <Text style={styles.alertMetaValue}>{formatTime(alert.startTimestamp)}</Text>
                                            </View>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Fin</Text>
                                                <Text style={styles.alertMetaValue}>{formatTime(alert.endTimestamp)}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.alertMetaRow}>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Promedio</Text>
                                                <Text style={styles.alertMetaValue}>{alert.avgBpm} BPM</Text>
                                            </View>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Duración</Text>
                                                <Text style={styles.alertMetaValue}>{Math.round(getAlertDurationMs(alert) / 1000)} s</Text>
                                            </View>
                                        </View>
                                        <View style={styles.alertMetaRow}>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Máximo</Text>
                                                <Text style={styles.alertMetaValue}>{alert.maxBpm ?? computeMaxBpm(alert.previewData || [])} BPM</Text>
                                            </View>
                                            <View style={styles.alertMetaItem}>
                                                <Text style={styles.alertMetaLabel}>Mínimo</Text>
                                                <Text style={styles.alertMetaValue}>{alert.minBpm ?? computeMinBpm(alert.previewData || [])} BPM</Text>
                                            </View>
                                        </View>
                                        {alert.previewData?.length > 0 && (
                                            <View style={styles.alertPreviewChart}>
                                                <PulseChart
                                                    data={alert.previewData}
                                                    color={alert.type === 'anomaly' ? '#DC2626' : '#F59E0B'}
                                                    height={140}
                                                    showTitle={false}
                                                    showLegend={false}
                                                    hideYAxis={false}
                                                    scrollable={true}
                                                    pointWidth={16}
                                                    containerStyle={styles.alertChartContainer}
                                                />
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
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
    },
    alertBanner: {
        marginHorizontal: SIZES.padding || 16,
        borderRadius: 14,
        padding: 14,
        marginTop: 16,
        marginBottom: 6,
    },
    alertBannerText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    alertWarning: {
        backgroundColor: '#F59E0B',
    },
    alertDanger: {
        backgroundColor: '#DC2626',
    },
    alertListContainer: {
        paddingHorizontal: SIZES.padding || 16,
        paddingVertical: 14,
    },
    alertItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    alertItemWarning: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    alertItemDanger: {
        borderLeftWidth: 4,
        borderLeftColor: '#DC2626',
    },
    alertType: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    alertStatus: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textMuted,
    },
    alertCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    alertMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    alertMetaItem: {
        flex: 1,
    },
    alertMetaLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    alertMetaValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    alertPreviewChart: {
        marginTop: 10,
    },
    alertChartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 6,
    },
    ecgHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: SIZES.padding || 16,
        marginTop: 4,
    },
    ecgHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    ecgHeaderStatus: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    alertMessage: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 6,
    },
    alertTime: {
        fontSize: 12,
        color: COLORS.textMuted,
    }
});