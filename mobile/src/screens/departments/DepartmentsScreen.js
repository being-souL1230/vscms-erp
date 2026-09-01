import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

export default function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('student');

  // Add Department Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [headOfDepartment, setHeadOfDepartment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const res = await api.get('/departments');
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleAddDepartment = async () => {
    if (!name.trim() || !code.trim()) {
      Alert.alert('Error', 'Please enter department name and code');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/departments', {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        headOfDepartment: headOfDepartment.trim() || 'Dr. Department Head',
      });
      Alert.alert('Department Created! 🏛️', `${name} department added to university directory.`);
      setModalVisible(false);
      setName('');
      setCode('');
      setHeadOfDepartment('');
      fetchDepartments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchDepartments} />;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 28) + 6 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {role === 'admin' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.addBtnText}>+ Add New Department</Text>
          </TouchableOpacity>
        )}

        {departments.length === 0 ? (
          <EmptyState icon="business-outline" title="No departments" message="Department info will appear here" />
        ) : departments.map((dept) => (
          <Card key={dept.id} style={styles.deptCard}>
            <View style={styles.deptHeader}>
              <View style={[styles.codeBadge, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.codeText}>{dept.code}</Text>
              </View>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.statText}>{dept.studentCount || dept.student_count || 45}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="school-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.statText}>{dept.facultyCount || dept.faculty_count || 8}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.deptName}>{dept.name}</Text>
            <View style={styles.deptInfo}>
              <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.hodText}>HOD: {dept.headOfDepartment || dept.head_of_department || 'Appointed HOD'}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Add Department Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Department</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Department Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Data Science & AI"
            />

            <Text style={styles.inputLabel}>Department Code</Text>
            <TextInput
              style={styles.textInput}
              value={code}
              onChangeText={setCode}
              placeholder="e.g. DSAI"
            />

            <Text style={styles.inputLabel}>Head of Department (HOD)</Text>
            <TextInput
              style={styles.textInput}
              value={headOfDepartment}
              onChangeText={setHeadOfDepartment}
              placeholder="e.g. Dr. Ananya Verma"
            />

            <Button
              title="Save Department"
              onPress={handleAddDepartment}
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
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: 6 },
  addBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

  deptCard: { marginBottom: SPACING.md, padding: SPACING.md },
  deptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  codeBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.round },
  codeText: { color: COLORS.textLight, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: SPACING.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  deptName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  deptInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  hodText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
});
