import React from 'react';
import { Platform, View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import SelectedDeviceCard from './SelectedDeviceCard';
import { COLORS, SIZES } from '../constants/theme';

export default function DeviceList({
    devices,
    selectedDevice,
    isScanning,
    startScanning,
    enableBluetooth,
    isBluetoothOn,
    onSelectDevice,
    onSimulateDevice,
    onConnectDevice,
    onCancelSelection,
    onSkip,
}) {
    const renderItem = ({ item }) => {
        const isSelected = selectedDevice && (selectedDevice.id === item.id || selectedDevice.address === item.address);

        return (
            <TouchableOpacity
                style={[styles.deviceCard, isSelected && styles.deviceCardSelected]}
                onPress={() => onSelectDevice(item)}
                activeOpacity={0.7}
                disabled={isSelected}
            >
                <View style={styles.deviceInfo}>
                    <View style={styles.deviceIconContainer}>
                        <Text style={styles.deviceIconText}>📱</Text>
                    </View>
                    <View style={styles.deviceTextContainer}>
                        <Text style={styles.deviceName} numberOfLines={1}>{item.name || item.localName || 'Dispositivo Desconocido'}</Text>
                        <Text style={styles.deviceAddress}>{item.address || item.id}</Text>
                    </View>
                </View>
                {isSelected ? (
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>Seleccionado</Text>
                    </View>
                ) : (
                    <View style={styles.connectArrow}>
                        <Text style={styles.arrowText}>→</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {selectedDevice ? (
                <View style={styles.stateContainer}>
                    <View style={styles.headerIndicator}>
                        <Text style={styles.headerTitle}>Dispositivo Listo</Text>
                        <Text style={styles.headerSubtitle}>Toca conectar para comenzar el monitoreo</Text>
                    </View>
                    
                    <SelectedDeviceCard
                        device={selectedDevice}
                        onConnect={onConnectDevice}
                        onCancel={onCancelSelection}
                    />

                    <TouchableOpacity 
                        style={styles.secondaryButton} 
                        onPress={onCancelSelection}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryButtonText}>Elegir otro dispositivo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.stateContainer}>
                    <View style={styles.headerIndicator}>
                        <Text style={styles.headerTitle}>Buscando Sensores</Text>
                        <Text style={styles.headerSubtitle}>Enciende tu monitor de signos vitales</Text>
                    </View>

                    {Platform.OS === 'web' && (
                        <View style={styles.warningAlert}>
                            <Text style={styles.warningAlertText}>⚠️ Bluetooth no está disponible en la versión Web</Text>
                        </View>
                    )}

                    <View style={styles.listWrapper}>
                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.address || item.id}
                            renderItem={renderItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.flatListContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    {!isScanning && (
                                        <Text style={styles.emptyText}>No hemos encontrado dispositivos cercanos.</Text>
                                    )}
                                </View>
                            }
                        />
                    </View>

                    <View style={styles.footerActions}>
                        <TouchableOpacity 
                            style={[styles.primaryAction, isScanning && styles.primaryActionDisabled]} 
                            onPress={startScanning}
                            disabled={isScanning}
                            activeOpacity={0.8}
                        >
                            {isScanning ? (
                                <>
                                    <ActivityIndicator size="small" color="#fff" style={styles.actionIcon} />
                                    <Text style={styles.primaryActionText}>Buscando...</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.actionIcon}>🔍</Text>
                                    <Text style={styles.primaryActionText}>Volver a Escanear</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.tertiaryAction} 
                            onPress={onSimulateDevice}
                        >
                            <Text style={styles.tertiaryActionText}>Simular Sensor para Pruebas</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: COLORS.background,
        paddingHorizontal: SIZES.padding,
    },
    stateContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'space-between',
    },
    headerIndicator: {
        marginTop: Platform.OS === 'ios' ? 20 : 40,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: COLORS.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    listWrapper: {
        flex: 1,
        marginBottom: 10,
    },
    flatListContent: {
        paddingBottom: 20,
        paddingTop: 10,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
    deviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    deviceCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#FFF0F0',
        shadowOpacity: 0.1,
        shadowColor: COLORS.primary,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    deviceIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    deviceIconText: {
        fontSize: 20,
    },
    deviceTextContainer: {
        flex: 1,
        paddingRight: 10,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    deviceAddress: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '500',
    },
    badgeContainer: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    connectArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '700',
    },
    footerActions: {
        paddingBottom: Platform.OS === 'ios' ? 20 : 30,
        paddingTop: 10,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryActionDisabled: {
        backgroundColor: '#ff7f77',
        elevation: 0,
        shadowOpacity: 0,
    },
    primaryActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionIcon: {
        marginRight: 8,
    },
    tertiaryAction: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    tertiaryActionText: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E5EA',
        borderRadius: 16,
        marginTop: 'auto',
        marginBottom: Platform.OS === 'ios' ? 30 : 40,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },
    warningAlert: {
        backgroundColor: '#FFF4CE',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE073',
    },
    warningAlertText: {
        color: '#8A6D00',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    }
});