import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { truncate } from '../../core/utils/helpers';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

const TABS = ['All', 'Hackathon', 'Quiz', 'Seminar', 'Workshop'];

export default function EventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  const fetchEvents = async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.EVENTS.LIST);
      const data = Array.isArray(response.data) ? response.data : [];
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = activeTab === 'All'
    ? events
    : events.filter((e) => e.type?.toLowerCase() === activeTab.toLowerCase());

  const renderEvent = ({ item }) => (
    <Card style={styles.eventCard}>
      <View style={styles.cardHeader}>
        <Badge label={item.type || 'Event'} variant="info" />
        <Text style={styles.status}>{item.status}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{truncate(item.description, 80)}</Text>
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.compDate || item.comp_date || 'TBD'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            Team size: {item.teamSizeMin || 1}-{item.teamSizeMax || 4}
          </Text>
        </View>
        {item.eligibilityDept && (
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.eligibilityDept}</Text>
          </View>
        )}
      </View>
    </Card>
  );

  if (loading && events.length === 0) return <LoadingScreen />;
  if (error && events.length === 0) return <ErrorState message={error} onRetry={fetchEvents} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, activeTab === item && styles.categoryChipActive]}
            onPress={() => setActiveTab(item)}
          >
            <Text style={[styles.categoryText, activeTab === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No events found" message="Check back later for upcoming events" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  categories: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.surfaceVariant,
    marginRight: SPACING.sm,
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
  list: {
    padding: SPACING.md,
  },
  eventCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  status: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  details: {
    marginTop: SPACING.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
});
