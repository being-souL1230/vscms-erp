import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { formatDate } from '../../core/utils/helpers';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function LostFoundDetailScreen({ route }) {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItem = async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.LOST_FOUND.DETAIL(itemId));
      setItem(response.data.item);
    } catch (err) {
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const handleResolve = async () => {
    Alert.alert(
      'Mark as Resolved',
      'Mark this item as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await api.put(API_ENDPOINTS.LOST_FOUND.DETAIL(itemId), { status: 'resolved' });
              Alert.alert('Success', 'Item marked as resolved');
              fetchItem();
            } catch (err) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchItem} />;
  if (!item) return <ErrorState message="Item not found" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Badge
          label={item.type}
          variant={item.type === 'lost' ? 'danger' : 'success'}
          size="lg"
        />
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Badge label={item.status} variant={item.status === 'active' ? 'warning' : 'success'} />
      </View>

      <Card style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.date_reported)}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{item.category}</Text>
          </View>
        </View>
        {item.contact_preference && (
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Contact Preference</Text>
              <Text style={styles.detailValue}>{item.contact_preference}</Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{item.description}</Text>
      </Card>

      {item.user_name && (
        <Card style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Reported by</Text>
          <Text style={styles.reporter}>{item.user_name}</Text>
          <Text style={styles.email}>{item.user_email}</Text>
        </Card>
      )}

      {item.status === 'active' && (
        <Button
          title="Mark as Resolved"
          onPress={handleResolve}
          variant="secondary"
          size="lg"
          style={styles.resolveButton}
        />
      )}
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
  header: {
    marginBottom: SPACING.lg,
  },
  itemName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: SPACING.sm,
    lineHeight: 34,
  },
  detailsCard: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  detailContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  descriptionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  contactCard: {
    marginBottom: SPACING.md,
  },
  reporter: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  email: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resolveButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});
