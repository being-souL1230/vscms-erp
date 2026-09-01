import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function MarkAttendanceScreen({ route, navigation }) {
  const courseId = route?.params?.courseId || 1;
  const courseName = route?.params?.courseName || 'Computer Networks';

  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    try {
      setError(null);
      const res = await api.get('/students');
      const data = Array.isArray(res.data) ? res.data : [];
      setStudents(data);

      // Default attendance to present
      const initial = {};
      data.forEach((s) => {
        initial[s.id] = 'present';
      });
      setAttendanceState(initial);
    } catch (err) {
      setError('Failed to load student roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const toggleStatus = (studentId, status) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s.id] = status; });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = async () => {
    setSubmitting(true);
    try {
      const payload = students.map((s) => ({
        studentId: s.id,
        courseId: Number(courseId),
        date: new Date().toISOString().split('T')[0],
        status: attendanceState[s.id] || 'present',
      }));

      await api.post('/attendance', payload);
      Alert.alert('Success', 'Attendance marked and saved to database!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading student list..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStudents} />;

  const presentCount = Object.values(attendanceState).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceState).filter((s) => s === 'absent').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.courseTitle}>{courseName}</Text>
        <Text style={styles.dateText}>Date: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>

        <View style={styles.summaryBar}>
          <View style={styles.sumBadge}>
            <Text style={styles.sumLabel}>Present: </Text>
            <Text style={[styles.sumValue, { color: COLORS.success }]}>{presentCount}</Text>
          </View>
          <View style={styles.sumBadge}>
            <Text style={styles.sumLabel}>Absent: </Text>
            <Text style={[styles.sumValue, { color: COLORS.error }]}>{absentCount}</Text>
          </View>
          <View style={styles.sumBadge}>
            <Text style={styles.sumLabel}>Total: </Text>
            <Text style={styles.sumValue}>{students.length}</Text>
          </View>
        </View>

        <View style={styles.batchRow}>
          <TouchableOpacity style={styles.batchBtn} onPress={() => markAll('present')}>
            <Text style={styles.batchBtnText}>Mark All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.batchBtn, { backgroundColor: '#fee2e2' }]} onPress={() => markAll('absent')}>
            <Text style={[styles.batchBtnText, { color: COLORS.error }]}>Mark All Absent</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {students.map((student, idx) => {
          const status = attendanceState[student.id] || 'present';
          return (
            <Card key={student.id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{student.name?.charAt(0) || 'S'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.rollNo}>{student.rollNo || student.roll_no_or_emp_id || `STU-${1000 + idx}`}</Text>
                </View>
              </View>

              <View style={styles.toggleGroup}>
                <TouchableOpacity
                  style={[styles.toggleBtn, status === 'present' && styles.presentActive]}
                  onPress={() => toggleStatus(student.id, 'present')}
                >
                  <Text style={[styles.toggleText, status === 'present' && styles.toggleTextActive]}>P</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, status === 'absent' && styles.absentActive]}
                  onPress={() => toggleStatus(student.id, 'absent')}
                >
                  <Text style={[styles.toggleText, status === 'absent' && styles.toggleTextActive]}>A</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, status === 'late' && styles.lateActive]}
                  onPress={() => toggleStatus(student.id, 'late')}
                >
                  <Text style={[styles.toggleText, status === 'late' && styles.toggleTextActive]}>L</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Submit Attendance"
          onPress={handleSaveAttendance}
          loading={submitting}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border },
  courseTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.text },
  dateText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm, paddingVertical: SPACING.xs },
  sumBadge: { flexDirection: 'row', alignItems: 'center' },
  sumLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  sumValue: { fontSize: FONT_SIZES.sm, fontWeight: '700' },
  batchRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  batchBtn: { flex: 1, paddingVertical: 6, backgroundColor: '#f0fdf4', borderRadius: RADIUS.xs, alignItems: 'center' },
  batchBtnText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.success },

  list: { padding: SPACING.md },
  studentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm, padding: SPACING.sm },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.sm },
  studentName: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text },
  rollNo: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  toggleGroup: { flexDirection: 'row', gap: 6 },
  toggleBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  presentActive: { backgroundColor: COLORS.success },
  absentActive: { backgroundColor: COLORS.error },
  lateActive: { backgroundColor: '#d97706' },
  toggleText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary },
  toggleTextActive: { color: '#fff' },

  footer: { padding: SPACING.md, backgroundColor: '#fff', borderTopWidth: 1, borderColor: COLORS.border },
});
