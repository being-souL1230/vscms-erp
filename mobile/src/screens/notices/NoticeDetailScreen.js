import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { formatDate } from '../../core/utils/helpers';
import { transformNoticeDetail } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';

export default function NoticeDetailScreen({ route, navigation }) {
  const { noticeId } = route.params;
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotice = async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.NOTICES.LIST);
      const found = transformNoticeDetail(response.data, noticeId);
      setNotice(found);
    } catch (err) {
      setError('Failed to load notice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotice();
  }, [noticeId]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchNotice} />;
  if (!notice) return <ErrorState message="Notice not found" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{notice.category?.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{notice.title}</Text>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>Published: {formatDate(notice.published_at)}</Text>
        </View>
        {notice.author_name && (
          <View style={styles.meta}>
            <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>By: {notice.author_name}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.description}>{notice.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 4,
  },
  backText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.md,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 34,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  body: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  description: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    lineHeight: 28,
  },
});
