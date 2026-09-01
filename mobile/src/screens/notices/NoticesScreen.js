import React, { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Text, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import { getRelativeTime, truncate } from '../../core/utils/helpers';
import { transformNotices } from '../../services/dataAdapter';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import Button from '../../components/Button';

const CATEGORIES = ['All', 'Academic', 'Examination', 'Placement', 'Event', 'General', 'Urgent'];

export default function NoticesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [role, setRole] = useState('student');

  // Post Notice Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academic');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotices = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const response = await api.get(API_ENDPOINTS.NOTICES.LIST);
      const transformed = transformNotices(response.data);
      setNotices(transformed);
    } catch (err) {
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in notice title and content');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/notices', {
        title: title.trim(),
        content: content.trim(),
        category,
        publishedDate: new Date().toISOString(),
      });
      Alert.alert('Notice Published! 📢', 'New announcement posted to campus feed.');
      setModalVisible(false);
      setTitle('');
      setContent('');
      fetchNotices();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post notice');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotices = notices.filter((notice) => {
    const matchesCategory = selectedCategory === 'All' ||
      notice.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery ||
      notice.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderNotice = ({ item }) => (
    <Card
      style={styles.noticeCard}
      onPress={() => navigation.navigate('NoticeDetail', { noticeId: item.id })}
    >
      <View style={styles.noticeHeader}>
        <Ionicons name="megaphone" size={18} color={COLORS.primary} />
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{truncate(item.description, 120)}</Text>
      <Text style={styles.time}>{getRelativeTime(item.published_at)} • By {item.author_name || 'Administration'}</Text>
    </Card>
  );

  if (loading && notices.length === 0) return <LoadingScreen />;
  if (error && notices.length === 0) return <ErrorState message={error} onRetry={fetchNotices} />;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 24) + SPACING.xs }]}>
        <SearchBar placeholder="Search notices..." onSearch={setSearchQuery} style={{ flex: 1 }} />
        {(role === 'admin' || role === 'faculty') && (
          <TouchableOpacity style={styles.postBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.postBtnText}>Post</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredNotices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No notices found" message="Check back later for updates" />}
      />

      {/* Post Notice Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Broadcast Notice</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Notice Title</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. End Semester Exam Timetable Released"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPicker}>
                {['Academic', 'Examination', 'Event', 'General', 'Urgent'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catOpt, category === c && styles.catOptActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.catOptText, category === c && styles.catOptTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Content / Details</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 100 }]}
                value={content}
                onChangeText={setContent}
                placeholder="Write announcement details..."
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <Button
              title="Publish Announcement"
              onPress={handleCreateNotice}
              loading={submitting}
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.xs },
  postBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 10, borderRadius: RADIUS.md, gap: 2 },
  postBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

  categories: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  categoryChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.round, backgroundColor: COLORS.surfaceVariant, marginRight: SPACING.sm },
  categoryChipActive: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: COLORS.textLight },

  list: { padding: SPACING.md },
  noticeCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  category: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600', marginLeft: SPACING.xs, textTransform: 'uppercase' },
  title: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  description: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm, lineHeight: 20 },
  time: { fontSize: FONT_SIZES.xs, color: COLORS.disabled },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginVertical: 4 },
  catOpt: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: RADIUS.xs, backgroundColor: COLORS.surfaceVariant },
  catOptActive: { backgroundColor: COLORS.primary },
  catOptText: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  catOptTextActive: { color: '#fff' },
});
