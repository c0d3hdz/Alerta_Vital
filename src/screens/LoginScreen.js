import React, { useEffect } from 'react';
import { Image, View, StyleSheet, Text, Pressable, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../constants/theme';
import HeroLogin from '../components/heroLogin';
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
    const redirectUri = makeRedirectUri({
        native: 'com.alertavital.app:/oauth2redirect',
        scheme: 'com.alertavital.app',
        path: 'oauth2redirect',
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: "845543473091-t4ttmj25o3qeq142to9fve1ohp2coin9.apps.googleusercontent.com",
        webClientId: "845543473091-6es3phc8bja77abhjjol17huv466cu02.apps.googleusercontent.com",
        redirectUri,
    });

    const enviarTokenAlBackend = async (token) => {
        console.log("Enviando token al backend:", token);
    }

    const guardarSesion = async (userInfo, accessToken) => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem('user', JSON.stringify(userInfo));
                localStorage.setItem('authToken', accessToken);
            } else {
                await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
                await SecureStore.setItemAsync('authToken', accessToken);
            }
        } catch (error) {
            console.error('Error guardando sesión:', error);
        }
    };

    useEffect(() => {
        const procesarAutenticacion = async () => {
            if (response) {
                if (response.type === 'success') {
                    const { authentication } = response;
                    await enviarTokenAlBackend(authentication.accessToken);

                    // Obtener la información del perfil de Google
                    try {
                        const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
                            headers: { Authorization: `Bearer ${authentication.accessToken}` },
                        });
                        const userInfo = await userInfoResponse.json();
                        await guardarSesion(userInfo, authentication.accessToken);
                        // Pasamos los datos del usuario a la pantalla de escaneo
                        navigation.replace('ScanScreen', { user: userInfo });
                    } catch (error) {
                        console.error("Error obteniendo datos del usuario", error);
                        await guardarSesion({ name: 'Usuario' }, authentication.accessToken);
                        navigation.replace('ScanScreen');
                    }
                } else if (response.type === 'error' || response.type === 'cancel') {
                    console.warn("Autenticación fallida o cancelada:", response.error);
                }
            }
        };

        procesarAutenticacion();
    }, [response, navigation]);

    return (
        <View style={styles.container}>
            <HeroLogin />
            <View style={styles.buttonContainer}>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        pressed && styles.buttonPressed,
                        !request && styles.buttonDisabled,
                    ]}
                    disabled={!request}
                    onPress={() => promptAsync().catch((e) => console.log("Error en autenticación:", e))}
                >
                    <FontAwesome name="google" size={24} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
                </Pressable>
                <TouchableOpacity onPress={() => navigation.navigate('ScanScreen')}>
                    <Text style={styles.guestButtonText}>Entrar como invitado</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.background,
        flex: 1,
        alignItems: 'center',
        fontFamily: 'Outfit-Regular',
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DB4437',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
        width: '80%',
    },
    buttonPressed: {
        opacity: 0.85,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    guestButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
})