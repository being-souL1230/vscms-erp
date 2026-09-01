import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../core/constants/theme';

const SearchBar = ({ placeholder = 'Search...', onSearch, style }) => {
  const [query, setQuery] = useState('');

  const handleChange = useCallback((text) => {
    setQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  }, [onSearch]);

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.disabled}
        value={query}
        onChangeText={handleChange}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {query.length > 0 && (
        <Ionicons
          name="close-circle"
          size={20}
          color={COLORS.textSecondary}
          onPress={() => {
            setQuery('');
            if (onSearch) onSearch('');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});

export default SearchBar;
