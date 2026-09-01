import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Badge from '../../components/Badge';

const CATEGORIES = ['All Feed', 'Notices', 'Hackathons', 'Events', 'Departments'];

export default function CampusScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All Feed');
  const [role, setRole] = useState('student');

  // Post Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notices');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampusData = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const [noticesRes, compRes] = await Promise.all([
        api.get('/notices').catch(() => ({ data: [] })),
        api.get('/competitions').catch(() => ({ data: [] })),
      ]);

      const noticesData = (Array.isArray(noticesRes.data) ? noticesRes.data : []).map((n) => ({
        id: `notice-${n.id}`,
        type: 'Notices',
        title: n.title,
        content: n.content || n.description,
        category: n.category || 'Announcement',
        author: n.authorName || n.author_name || 'Administration',
        date: n.publishedDate || n.published_at || new Date().toISOString(),
        rawId: n.id,
      }));

      const compsData = (Array.isArray(compRes.data) ? compRes.data : []).map((c) => ({
        id: `comp-${c.id}`,
        type: 'Hackathons',
        title: c.name || c.title,
        content: c.description || 'Inter-college programming & tech competition',
        category: c.category || 'Hackathon',
        prize: c.prizePool || c.prize || '₹50,000 Cash Prize',
        author: 'Campus Innovation Cell',
        date: c.registrationDeadline || c.deadline || new Date().toISOString(),
        rawId: c.id,
      }));

      setFeed([...noticesData, ...compsData]);
    } catch (err) {
      setError('Failed to load campus feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampusData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampusData();
    setRefreshing(false);
  };

  const handlePostNotice = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/notices', { title: title.trim(), content: content.trim(), category });
      Alert.alert('Published! 📢', 'New announcement posted to campus feed.');
      setModalVisible(false);
      setTitle(''); setContent('');
      fetchCampusData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeed = feed.filter((item) => {
    if (selectedCategory === 'All Feed') return true;
    return item.type === selectedCategory || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  if (loading) return <LoadingScreen message="Loading campus hub..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCampusData} />;

  const noticesCount = feed.filter((f) => f.type === 'Notices').length;
  const hackathonsCount = feed.filter((f) => f.type === 'Hackathons').length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Gradient Hero Header */}
        <LinearGradient
          colors={['#1e1b4b', '#312e81', '#4338ca']}
          style={[styles.heroBanner, { paddingTop: Math.max(insets.top, 24) + SPACING.md }]}
        >
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTag}>VSCMS CAMPUS HUB</Text>
              <Text style={styles.heroTitle}>What's Happening on Campus</Text>
            </View>
            {(role === 'admin' || role === 'faculty') && (
              <TouchableOpacity style={styles.postHeroBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.postHeroBtnText}>Post Update</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Metrics Pills */}
          <View style={styles.heroStatsRow}>
            <View style={styles.statPill}>
              <Ionicons name="megaphone" size={16} color="#60a5fa" />
              <Text style={styles.statPillValue}>{noticesCount}</Text>
              <Text style={styles.statPillLabel}>Announcements</Text>
            </View>

            <View style={styles.statPill}>
              <Ionicons name="trophy" size={16} color="#a7f3d0" />
              <Text style={styles.statPillValue}>{hackathonsCount}</Text>
              <Text style={styles.statPillLabel}>Hackathons</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Minimal Category Pills Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeline Feed Section */}
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Campus Stream</Text>
          <Text style={styles.feedSub}>{filteredFeed.length} updates live</Text>
        </View>

        {filteredFeed.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx}
            style={styles.feedItem}
            activeOpacity={0.8}
            onPress={() => {
              if (item.type === 'Notices') navigation.navigate('NoticeDetail', { noticeId: item.rawId });
              else if (item.type === 'Hackathons') navigation.navigate('Competitions');
            }}
          >
            <View style={styles.timelineLeft}>
              <View style={[styles.avatarCircle, { backgroundColor: item.type === 'Hackathons' ? '#7c3aed' : COLORS.primary }]}>
                <Ionicons name={item.type === 'Hackathons' ? 'trophy' : 'megaphone'} size={14} color="#fff" />
              </View>
              {idx < filteredFeed.length - 1 && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.itemContent}>
              <View style={styles.itemMetaHeader}>
                <Badge label={item.category} variant={item.type === 'Hackathons' ? 'warning' : 'primary'} />
                <Text style={styles.dateText}>{item.date ? item.date.split('T')[0] : 'Today'}</Text>
              </View>

              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemBody} numberOfLines={3}>{item.content}</Text>

              <View style={styles.itemFooter}>
                <Text style={styles.authorText}>By {item.author}</Text>
                <View style={styles.readMoreRow}>
                  <Text style={styles.readMoreText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredFeed.length === 0 && (
          <View style={styles.emptyView}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.disabled} />
            <Text style={styles.emptyTitle}>No campus updates found</Text>
            <Text style={styles.emptySub}>Check back later for news, hackathons, and event announcements.</Text>
          </View>
        )}
      </ScrollView>

      {/* Post Update Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Campus Update</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput style={styles.textInput} value={title} onChangeText={setTitle} placeholder="Announcement or Event title..." />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.catPicker}>
              {['Notices', 'Academic', 'Event', 'Urgent'].map((c) => (
                <TouchableOpacity key={c} style={[styles.catPickerOpt, category === c && styles.catPickerOptActive]} onPress={() => setCategory(c)}>
                  <Text style={[styles.catPickerText, category === c && styles.catPickerTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Content Details</Text>
            <TextInput style={[styles.textInput, { minHeight: 90 }]} value={content} onChangeText={setContent} placeholder="Write announcement details..." multiline textAlignVertical="top" />

            <TouchableOpacity style={styles.submitPostBtn} onPress={handlePostNotice} disabled={submitting}>
              <Text style={styles.submitPostBtnText}>{submitting ? 'Publishing...' : 'Publish Update'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl },

  heroBanner: { padding: SPACING.lg, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTag: { fontSize: 10, fontWeight: '800', color: '#93c5fd', letterSpacing: 1.5, textTransform: 'uppercase' },
  heroTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#fff', marginTop: 2 },
  postHeroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.md, gap: 4 },
  postHeroBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  heroStatsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, gap: 6 },
  statPillValue: { fontSize: FONT_SIZES.md, fontWeight: '800', color: '#fff' },
  statPillLabel: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  categoryScroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.xs },
  catPill: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: RADIUS.round, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catPillText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '700' },
  catPillTextActive: { color: '#fff' },

  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  feedTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text },
  feedSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },

  feedItem: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  timelineLeft: { alignItems: 'center', marginRight: SPACING.md },
  avatarCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.border, marginTop: 4 },

  itemContent: { flex: 1, backgroundColor: '#fff', padding: SPACING.md, borderRadius: RADIUS.md, ...SHADOWS.sm },
  itemMetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  dateText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  itemTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  itemBody: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.xs, borderTopWidth: 1, borderColor: COLORS.border },
  authorText: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontWeight: '600' },
  readMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readMoreText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '700' },

  emptyView: { alignItems: 'center', padding: SPACING.xxl, marginTop: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginTop: SPACING.sm },
  emptySub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: SPACING.xl },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
  catPicker: { flexDirection: 'row', gap: SPACING.xs, marginVertical: 4 },
  catPickerOpt: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.xs, backgroundColor: COLORS.surfaceVariant, alignItems: 'center' },
  catPickerOptActive: { backgroundColor: COLORS.primary },
  catPickerText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary },
  catPickerTextActive: { color: '#fff' },
  submitPostBtn: { marginTop: SPACING.md, backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  submitPostBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },
});
