import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../core/constants/theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  error,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, isFocused && styles.focused, error && styles.error]}>
        {icon && (
          <Ionicons name={icon} size={20} color={isFocused ? COLORS.primary : COLORS.textSecondary} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.disabled}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textSecondary}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}
          />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: SPACING.md,
  },
  focused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  error: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});

export default Input;
