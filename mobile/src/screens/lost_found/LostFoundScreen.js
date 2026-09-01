import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { formatDate, truncate } from '../../core/utils/helpers';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';

const TABS = ['Lost', 'Found'];

export default function LostFoundScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Lost');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = async () => {
    try {
      setError(null);
      const params = { type: activeTab.toLowerCase() };
      if (searchQuery) params.search = searchQuery;

      const response = await api.get(API_ENDPOINTS.LOST_FOUND.LIST, { params });
      setItems(response.data.items);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2 || query.length === 0) {
      fetchItems();
    }
  };

  const renderItem = ({ item }) => (
    <Card
      style={styles.itemCard}
      onPress={() => navigation.navigate('LostFoundDetail', { itemId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Badge
          label={item.type}
          variant={item.type === 'lost' ? 'danger' : 'success'}
        />
        <Text style={styles.date}>{formatDate(item.date_reported)}</Text>
      </View>
      <Text style={styles.itemName}>{item.item_name}</Text>
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
        <Text style={styles.location}>{item.location}</Text>
      </View>
    </Card>
  );

  if (loading && items.length === 0) return <LoadingScreen />;
  if (error && items.length === 0) return <ErrorState message={error} onRetry={fetchItems} />;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SearchBar placeholder="Search items..." onSearch={handleSearch} style={styles.searchBar} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={`No ${activeTab.toLowerCase()} items`}
            message={`No ${activeTab.toLowerCase()} items have been reported yet`}
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateLostFound')}
      >
        <Ionicons name="add" size={28} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.sm,
    marginHorizontal: SPACING.xs,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.textLight,
  },
  searchBar: {
    margin: SPACING.md,
  },
  list: {
    padding: SPACING.md,
  },
  itemCard: {
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  itemName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
