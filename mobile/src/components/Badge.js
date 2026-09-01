import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../core/constants/theme';

const Badge = ({ label, variant = 'default', size = 'sm', style }) => {
  const variantStyles = {
    default: { bg: COLORS.surfaceVariant, text: COLORS.textSecondary },
    primary: { bg: COLORS.primary + '20', text: COLORS.primary },
    success: { bg: COLORS.success + '20', text: COLORS.success },
    warning: { bg: COLORS.warning + '20', text: '#e65100' },
    danger: { bg: COLORS.error + '20', text: COLORS.error },
    info: { bg: '#0288d1' + '20', text: '#0288d1' },
  };

  const { bg, text } = variantStyles[variant] || variantStyles.default;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'lg' && styles.lg, style]}>
      <Text style={[styles.text, { color: text }, size === 'lg' && styles.lgText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    alignSelf: 'flex-start',
  },
  lg: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lgText: {
    fontSize: FONT_SIZES.sm,
  },
});

export default Badge;
