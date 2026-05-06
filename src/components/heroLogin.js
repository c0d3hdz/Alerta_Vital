import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function HeroLogin() {
    return (
        <View style={styles.HeroContainer}>
            <Image source={require('../assets/icon.png')} style={styles.HeroImage} />
            <View style={styles.titleRow}>
                <Text style={[styles.HeroText, { color: COLORS.primary }]}>Alerta</Text>
                <Text style={[styles.HeroText, { color: COLORS.secondary }]}>Vital</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    HeroContainer: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flex: 2,
    },
    HeroImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    HeroText: {
        fontSize: 54,
        fontWeight: 'bold',
        marginTop: -20,
        marginHorizontal: 4,
    },
});