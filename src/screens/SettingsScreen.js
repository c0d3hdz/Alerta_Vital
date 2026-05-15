import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SIZES } from '../constants/theme';

export default function SettingsScreen({ navigation }) {
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

    const handleLogout = async () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
            } else {
                await SecureStore.deleteItemAsync('user');
                await SecureStore.deleteItemAsync('authToken');
            }
        } catch (error) {
            console.warn('Error cerrando sesión:', error);
        }

        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginScreen' }],
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Configuración</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>General</Text>
                
                <View style={styles.settingRow}>
                    <View>
                        <Text style={styles.settingLabel}>Alertas y notificaciones</Text>
                        <Text style={styles.settingDesc}>Recibir avisos de anomalías</Text>
                    </View>
                    <Switch 
                        value={notificationsEnabled} 
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ true: COLORS.primary }}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seguridad</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderColor: '#EEEEEE',
    },
    backButton: {
        marginRight: 16,
    },
    backText: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginTop: 20,
        paddingHorizontal: SIZES.padding,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#EEEEEE',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textMuted,
        marginBottom: 15,
        textTransform: 'uppercase',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    settingLabel: {
        fontSize: 16,
        color: COLORS.text,
    },
    settingDesc: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    logoutButton: {
        marginTop: 10,
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: SIZES.padding,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    logoutText: {
        color: COLORS.alert || '#D32F2F',
        fontSize: 16,
        fontWeight: '700',
    }
});