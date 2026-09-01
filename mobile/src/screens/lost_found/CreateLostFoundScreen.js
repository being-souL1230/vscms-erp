import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import Input from '../../components/Input';
import Button from '../../components/Button';

const CATEGORIES = ['Electronics', 'Documents', 'Clothing', 'Accessories', 'Books', 'Other'];

export default function CreateLostFoundScreen({ navigation }) {
  const [type, setType] = useState('lost');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!itemName.trim()) newErrors.itemName = 'Item name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!category) newErrors.category = 'Category is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post(API_ENDPOINTS.LOST_FOUND.LIST, {
        type,
        item_name: itemName.trim(),
        description: description.trim(),
        category: category.toLowerCase(),
        location: location.trim(),
        date_reported: date.toISOString().split('T')[0],
        contact_preference: 'in_app',
      });

      Alert.alert('Success', 'Item posted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Report an Item</Text>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'lost' && styles.typeButtonActive]}
          onPress={() => setType('lost')}
        >
          <Ionicons name="search" size={20} color={type === 'lost' ? COLORS.textLight : COLORS.textSecondary} />
          <Text style={[styles.typeText, type === 'lost' && styles.typeTextActive]}>Lost</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === 'found' && styles.typeButtonActive]}
          onPress={() => setType('found')}
        >
          <Ionicons name="checkmark-circle" size={20} color={type === 'found' ? COLORS.textLight : COLORS.textSecondary} />
          <Text style={[styles.typeText, type === 'found' && styles.typeTextActive]}>Found</Text>
        </TouchableOpacity>
      </View>

      <Input
        label="Item Name"
        placeholder="e.g., Black Wallet"
        value={itemName}
        onChangeText={setItemName}
        icon="pricetag-outline"
        error={errors.itemName}
      />

      <Input
        label="Description"
        placeholder="Describe the item in detail..."
        value={description}
        onChangeText={setDescription}
        icon="document-text-outline"
        error={errors.description}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

      <Input
        label="Location"
        placeholder="e.g., Library Entrance"
        value={location}
        onChangeText={setLocation}
        icon="location-outline"
        error={errors.location}
      />

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
        <Text style={styles.dateText}>{date.toLocaleDateString('en-IN')}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
          }}
          maximumDate={new Date()}
        />
      )}

      <Button
        title="Post Item"
        onPress={handleSubmit}
        loading={loading}
        size="lg"
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.xs,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  typeTextActive: {
    color: COLORS.textLight,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceVariant,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.textLight,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  dateText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  submitButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});
