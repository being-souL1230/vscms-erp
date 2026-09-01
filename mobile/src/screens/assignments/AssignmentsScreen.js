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
import { formatDate, getDueStatus, truncate } from '../../core/utils/helpers';
import { transformAssignments } from '../../services/dataAdapter';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

const STATUS_TABS = ['All', 'Pending', 'Submitted', 'Overdue'];

export default function AssignmentsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [role, setRole] = useState('student');

  // Create Assignment Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('Computer Networks');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [maxMarks, setMaxMarks] = useState('100');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const response = await api.get(API_ENDPOINTS.ASSIGNMENTS.LIST);
      const transformed = transformAssignments(response.data);
      setAssignments(transformed);
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in assignment title and description');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/assignments', {
        title: title.trim(),
        description: description.trim(),
        courseName,
        dueDate,
        maxMarks: Number(maxMarks),
        type: 'assignment',
      });
      Alert.alert('Assignment Posted! 📚', 'Students in your course can now view and submit answers.');
      setModalVisible(false);
      setTitle('');
      setDescription('');
      fetchAssignments();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'submitted': return 'success';
      case 'graded': return 'success';
      case 'overdue': return 'danger';
      case 'due_soon': return 'warning';
      default: return 'default';
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (selectedStatus === 'All') return true;
    if (selectedStatus === 'Overdue') return getDueStatus(a.due_date) === 'overdue';
    return a.status === selectedStatus.toLowerCase();
  });

  const renderAssignment = ({ item }) => (
    <Card
      style={styles.assignmentCard}
      onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.subject}>{item.subject?.name}</Text>
        <Badge label={item.status} variant={getStatusVariant(item.status)} />
      </View>
      <Text style={styles.title}>{truncate(item.title, 60)}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.dueInfo}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.dueText}>Due: {formatDate(item.due_date)}</Text>
        </View>
      </View>
    </Card>
  );

  if (loading && assignments.length === 0) return <LoadingScreen />;
  if (error && assignments.length === 0) return <ErrorState message={error} onRetry={fetchAssignments} />;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 24) + SPACING.xs }]}>
        <View style={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedStatus === tab && styles.tabActive]}
              onPress={() => setSelectedStatus(tab)}
            >
              <Text style={[styles.tabText, selectedStatus === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(role === 'faculty' || role === 'admin') && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAssignment}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No assignments found"
            message={selectedStatus === 'All' ? "No assignments yet" : `No ${selectedStatus.toLowerCase()} assignments`}
          />
        }
      />

      {/* Create Assignment Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Assignment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Subject / Course</Text>
              <TextInput
                style={styles.textInput}
                value={courseName}
                onChangeText={setCourseName}
                placeholder="e.g. Operating Systems"
              />

              <Text style={styles.inputLabel}>Assignment Title</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Lab Project 1 - Socket Programming"
              />

              <Text style={styles.inputLabel}>Description / Instructions</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 90 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detail task guidelines and submission format..."
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2026-09-30"
              />

              <Text style={styles.inputLabel}>Max Marks</Text>
              <TextInput
                style={styles.textInput}
                value={maxMarks}
                onChangeText={setMaxMarks}
                keyboardType="numeric"
              />
            </ScrollView>

            <Button
              title="Post Assignment"
              onPress={handleCreateAssignment}
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
  topHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.xs },
  tabs: { flex: 1, flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.sm, gap: 2 },
  createBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  list: { padding: SPACING.md },
  assignmentCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  subject: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueInfo: { flexDirection: 'row', alignItems: 'center' },
  dueText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginLeft: SPACING.xs },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
});
