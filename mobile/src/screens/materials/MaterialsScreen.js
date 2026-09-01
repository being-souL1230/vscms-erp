import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

const TYPE_ICONS = { PDF: 'document-text', VIDEO: 'play-circle', DOC: 'document', SLIDE: 'easel', LINK: 'link' };
const TYPE_COLORS = { PDF: '#ef4444', VIDEO: '#7c3aed', DOC: '#2563eb', SLIDE: '#f59e0b', LINK: '#059669' };

export default function MaterialsScreen() {
  const insets = useSafeAreaInsets();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('student');

  // Add Material Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('CS301');
  const [courseName, setCourseName] = useState('Computer Networks');
  const [type, setType] = useState('PDF');
  const [fileUrl, setFileUrl] = useState('https://vscms.edu/docs/notes.pdf');
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const res = await api.get('/course-materials');
      setMaterials(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, []);

  const handleUploadMaterial = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter material title');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/course-materials', {
        title: title.trim(),
        courseCode,
        courseName,
        type,
        fileUrl,
        downloadCount: 0,
      });
      Alert.alert('Material Uploaded! 📂', `${title} is now available to enrolled students.`);
      setModalVisible(false);
      setTitle('');
      fetchMaterials();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to upload material');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchMaterials} />;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 28) + 6 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {(role === 'faculty' || role === 'admin') && (
          <TouchableOpacity style={styles.uploadBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="cloud-upload" size={18} color="#fff" />
            <Text style={styles.uploadBtnText}>+ Upload Course Material</Text>
          </TouchableOpacity>
        )}

        {materials.length === 0 ? (
          <EmptyState icon="folder-open-outline" title="No materials" message="Course materials will appear here" />
        ) : materials.map((m) => {
          const matType = (m.type || 'PDF').toUpperCase();
          return (
            <Card key={m.id} style={styles.materialCard}>
              <View style={styles.materialHeader}>
                <View style={[styles.typeIcon, { backgroundColor: (TYPE_COLORS[matType] || COLORS.primary) + '15' }]}>
                  <Ionicons name={TYPE_ICONS[matType] || 'document'} size={20} color={TYPE_COLORS[matType] || COLORS.primary} />
                </View>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialTitle} numberOfLines={2}>{m.title}</Text>
                  <Text style={styles.materialCourse}>{m.courseCode || m.course_code} • {m.courseName || m.course_name}</Text>
                </View>
                <Badge label={matType} variant="info" />
              </View>
              {m.description && <Text style={styles.materialDesc} numberOfLines={2}>{m.description}</Text>}
              <View style={styles.materialFooter}>
                <View style={styles.footerItem}>
                  <Ionicons name="person-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.footerText}>{m.facultyName || m.faculty_name || 'Faculty'}</Text>
                </View>
                <View style={styles.footerItem}>
                  <Ionicons name="download-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.footerText}>{m.downloadCount || m.download_count || 0} downloads</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(m.fileUrl || m.file_url || 'https://vscms.edu')}>
                <Ionicons name="download-outline" size={16} color={COLORS.textLight} />
                <Text style={styles.downloadText}>Download Resource</Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>

      {/* Upload Material Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Resource</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Material Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Unit 3 - Network Layer Notes"
            />

            <Text style={styles.inputLabel}>Course Name & Code</Text>
            <TextInput
              style={styles.textInput}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g. Computer Networks (CS301)"
            />

            <Text style={styles.inputLabel}>Resource Type</Text>
            <View style={styles.typePicker}>
              {['PDF', 'VIDEO', 'SLIDE', 'DOC'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeOpt, type === t && styles.typeOptActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeOptText, type === t && styles.typeOptTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>File / Drive Link URL</Text>
            <TextInput
              style={styles.textInput}
              value={fileUrl}
              onChangeText={setFileUrl}
              placeholder="https://drive.google.com/file/..."
            />

            <Button
              title="Upload Resource"
              onPress={handleUploadMaterial}
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
  content: { padding: SPACING.md },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: 6 },
  uploadBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

  materialCard: { marginBottom: SPACING.md, padding: SPACING.md },
  materialHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  typeIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  materialCourse: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  materialDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
  materialFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.sm, borderRadius: RADIUS.sm, marginTop: SPACING.sm, gap: SPACING.xs },
  downloadText: { color: COLORS.textLight, fontSize: FONT_SIZES.sm, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
  typePicker: { flexDirection: 'row', gap: SPACING.xs, marginVertical: 4 },
  typeOpt: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.xs, backgroundColor: COLORS.surfaceVariant, alignItems: 'center' },
  typeOptActive: { backgroundColor: COLORS.primary },
  typeOptText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary },
  typeOptTextActive: { color: '#fff' },
});
