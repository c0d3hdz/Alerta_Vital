import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Esto arregla el cierre automático de la ventana en la web
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: "845543473091-t4ttmj25o3qeq142to9fve1ohp2coin9.apps.googleusercontent.com",
        webClientId: "845543473091-6es3phc8bja77abhjjol17huv466cu02.apps.googleusercontent.com",
        redirectUri: makeRedirectUri({
            scheme: 'com.alertavital.app',
            path: 'oauth2redirect/google'
        }),
    });

    const enviarTokenAlBackend = async (token) => {
        console.log("Enviando token al backend:", token);
    }

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
                        // Pasamos los datos del usuario a la pantalla de escaneo
                        navigation.navigate('ScanScreen', { user: userInfo });
                    } catch (error) {
                        console.error("Error obteniendo datos del usuario", error);
                        navigation.navigate('ScanScreen');
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
            <Pressable
                style={styles.button}
                disabled={!request}
                onPress={() => promptAsync().catch((e) => console.log("Error en autenticación:", e))}
            >
                <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
            </Pressable>
            <TouchableOpacity onPress={() => navigation.navigate('ScanScreen')}>
                <Text style={{ marginTop: 20, color: '#4285F4' }}>Entrar como invitado</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        backgroundColor: '#4285F4',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
