import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { getRelativeTime } from '../../core/utils/helpers';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'new_notice': return 'megaphone';
    case 'assignment_deadline': return 'book';
    case 'event_reminder': return 'calendar';
    case 'attendance_warning': return 'warning';
    default: return 'notifications';
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'new_notice': return '#1565c0';
    case 'assignment_deadline': return '#e65100';
    case 'event_reminder': return '#6a1b9a';
    case 'attendance_warning': return '#d32f2f';
    default: return COLORS.primary;
  }
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setError(null);
      // Notifications endpoint may not exist in the backend yet
      // Try to fetch, but gracefully handle 404
      try {
        const response = await api.get('/notifications');
        const data = response.data;
        setNotifications(Array.isArray(data) ? data : data?.notifications || []);
      } catch (err) {
        if (err.response?.status === 404) {
          // Endpoint doesn't exist yet - show empty state
          setNotifications([]);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderNotification = ({ item }) => (
    <TouchableOpacity style={[styles.notificationCard, !item.is_read && styles.unread]}>
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '15' }]}>
        <Ionicons name={getNotificationIcon(item.type)} size={20} color={getNotificationColor(item.type)} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{getRelativeTime(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            message="You're all caught up!"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.md,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  unread: {
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.disabled,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    marginTop: 4,
  },
});
