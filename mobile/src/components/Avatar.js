import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_SIZES } from '../core/constants/theme';

const Avatar = ({ name, imageUri, size = 48, style }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: COLORS.surfaceVariant,
  },
  initials: {
    color: COLORS.textLight,
    fontWeight: '700',
  },
});

export default Avatar;
