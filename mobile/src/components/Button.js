import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../core/constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}_text`],
    styles[`size_${size}_text`],
    disabled && styles.disabled_text,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} size="small" />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  size_md: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  size_lg: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  text: {
    fontWeight: '600',
  },
  primary_text: {
    color: '#fff',
  },
  secondary_text: {
    color: COLORS.primary,
  },
  danger_text: {
    color: '#fff',
  },
  ghost_text: {
    color: COLORS.primary,
  },
  size_sm_text: {
    fontSize: FONT_SIZES.sm,
  },
  size_md_text: {
    fontSize: FONT_SIZES.md,
  },
  size_lg_text: {
    fontSize: FONT_SIZES.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  disabled_text: {
    color: COLORS.disabled,
  },
});

export default Button;
