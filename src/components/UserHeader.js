import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES } from '../constants/theme';

export default function UserHeader({ user }) {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      {user?.picture ? (
        <Image source={{ uri: user.picture }} style={styles.profileImage} />
      ) : (
        <View style={[styles.profileImage, styles.placeholderBackground]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.welcomeText}>Bienvenido,</Text>
        <Text style={styles.userName}>{user?.name || 'Invitado'}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Pressable onPress={() => navigation.navigate('SettingsScreen')}>
          <Text style={styles.buttonConfig}>⚙️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding / 2,
    paddingBottom: 20,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: SIZES.padding,
    borderColor: COLORS.textMuted,
    borderWidth: 1,
    marginRight: SIZES.margin,

  },
  welcomeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: SIZES.title * 0.4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  buttonConfig: {
    color: COLORS.primary,
    fontSize: 34,
    backgroundColor: 'transparent',
  },
});
