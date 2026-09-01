import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../core/constants/theme';

const Card = ({ children, style, onPress, variant = 'default' }) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  elevated: {
    ...SHADOWS.md,
  },
  outlined: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default Card;
