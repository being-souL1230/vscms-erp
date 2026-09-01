import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

export default function EventDetailScreen({ route }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.EVENTS.LIST);
      const events = Array.isArray(response.data) ? response.data : [];
      const found = events.find((e) => e.id === Number(eventId));
      setEvent(found || null);
    } catch (err) {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchEvent} />;
  if (!event) return <ErrorState message="Event not found" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Badge label={event.type || 'Event'} variant="info" size="lg" />
        <Text style={styles.title}>{event.title}</Text>
        <Badge label={event.status} variant={event.status === 'open' ? 'success' : 'default'} />
      </View>

      <Card style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{event.compDate || event.comp_date || 'TBD'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={20} color={COLORS.primary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Team Size</Text>
            <Text style={styles.detailValue}>{event.teamSizeMin || 1} - {event.teamSizeMax || 4} members</Text>
          </View>
        </View>
        {event.eligibilityDept && (
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={20} color={COLORS.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Eligibility</Text>
              <Text style={styles.detailValue}>{event.eligibilityDept}</Text>
            </View>
          </View>
        )}
        {event.prizes && (
          <View style={styles.detailRow}>
            <Ionicons name="trophy-outline" size={20} color={COLORS.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Prizes</Text>
              <Text style={styles.detailValue}>{event.prizes}</Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>About this Event</Text>
        <Text style={styles.description}>{event.description}</Text>
      </Card>

      {event.rules && (
        <Card style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Rules</Text>
          <Text style={styles.description}>{event.rules}</Text>
        </Card>
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
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
});
