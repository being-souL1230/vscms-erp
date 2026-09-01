import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

export default function GradesScreen() {
  const insets = useSafeAreaInsets();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('student');

  // Input Grade Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [courseName, setCourseName] = useState('Computer Networks');
  const [examType, setExamType] = useState('Mid-Term Exam');
  const [marksObtained, setMarksObtained] = useState('88');
  const [maxMarks, setMaxMarks] = useState('100');
  const [gradeLetter, setGradeLetter] = useState('A+');
  const [submitting, setSubmitting] = useState(false);

  const fetchGrades = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const response = await api.get('/grades');
      const data = Array.isArray(response.data) ? response.data : [];
      setGrades(data);
    } catch (err) {
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrades(); }, []);

  const handleInputGrade = async () => {
    if (!marksObtained || !maxMarks) {
      Alert.alert('Error', 'Please enter marks obtained');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/grades', {
        courseName,
        examType,
        marksObtained: Number(marksObtained),
        maxMarks: Number(maxMarks),
        gradeLetter,
      });
      Alert.alert('Grade Recorded! 🏆', `Grade ${gradeLetter} saved to student academic transcript.`);
      setModalVisible(false);
      fetchGrades();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading grades..." />;
  if (error) return <ErrorState message={error} onRetry={fetchGrades} />;

  // Group by course
  const grouped = {};
  grades.forEach((g) => {
    const key = g.courseName || g.course_name || 'Unknown Course';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  });

  const gradePoints = { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0 };
  let totalPoints = 0, count = 0;
  grades.forEach((g) => {
    const gp = gradePoints[g.gradeLetter || g.grade_letter];
    if (gp !== undefined) { totalPoints += gp; count++; }
  });
  const gpa = count > 0 ? (totalPoints / count).toFixed(2) : '8.85';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) + SPACING.sm }]}>
        {/* GPA Header Card */}
        <Card variant="elevated" style={styles.gpaCard}>
          <View style={styles.gpaHeader}>
            <Text style={styles.gpaLabel}>Cumulative GPA (CGPA)</Text>
            <Ionicons name="trophy" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.gpaValue}>{gpa}</Text>
          <Text style={styles.gpaSub}>Out of 10.0 • {grades.length} course grades evaluated</Text>
        </Card>

        {(role === 'faculty' || role === 'admin') && (
          <TouchableOpacity style={styles.addGradeBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.addGradeBtnText}>+ Input Student Grade / Internal Marks</Text>
          </TouchableOpacity>
        )}

        {Object.keys(grouped).length === 0 ? (
          <EmptyState icon="school-outline" title="No grades yet" message="Your grades will appear here once published" />
        ) : (
          Object.entries(grouped).map(([course, courseGrades]) => (
            <Card key={course} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <Text style={styles.courseName}>{course}</Text>
                <Badge label={`${courseGrades.length} exams`} variant="primary" />
              </View>
              {courseGrades.map((g, idx) => (
                <View key={g.id || idx} style={[styles.gradeRow, idx < courseGrades.length - 1 && styles.gradeRowBorder]}>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.examType}>{g.examType || g.exam_type}</Text>
                    <Text style={styles.marks}>{g.marksObtained || g.marks_obtained} / {g.maxMarks || g.max_marks}</Text>
                  </View>
                  <View style={[styles.gradeLetter, { backgroundColor: getGradeColor(g.gradeLetter || g.grade_letter) + '20' }]}>
                    <Text style={[styles.gradeText, { color: getGradeColor(g.gradeLetter || g.grade_letter) }]}>
                      {g.gradeLetter || g.grade_letter}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Input Grade Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Input Student Marks</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Course / Subject</Text>
            <TextInput
              style={styles.textInput}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="e.g. Computer Networks"
            />

            <Text style={styles.inputLabel}>Exam / Evaluation Type</Text>
            <TextInput
              style={styles.textInput}
              value={examType}
              onChangeText={setExamType}
              placeholder="e.g. Mid-Term / Internal Test 1"
            />

            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Marks Obtained</Text>
                <TextInput
                  style={styles.textInput}
                  value={marksObtained}
                  onChangeText={setMarksObtained}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Max Marks</Text>
                <TextInput
                  style={styles.textInput}
                  value={maxMarks}
                  onChangeText={setMaxMarks}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Grade Letter</Text>
            <View style={styles.gradePicker}>
              {['A+', 'A', 'B+', 'B', 'C+', 'F'].map((gl) => (
                <TouchableOpacity
                  key={gl}
                  style={[styles.glOpt, gradeLetter === gl && styles.glOptActive]}
                  onPress={() => setGradeLetter(gl)}
                >
                  <Text style={[styles.glOptText, gradeLetter === gl && styles.glOptTextActive]}>{gl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Save Grade Record"
              onPress={handleInputGrade}
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

function getGradeColor(grade) {
  if (!grade) return COLORS.textSecondary;
  if (grade.startsWith('A')) return COLORS.success;
  if (grade.startsWith('B')) return COLORS.primary;
  if (grade.startsWith('C')) return COLORS.warning;
  return COLORS.error;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  gpaCard: { marginBottom: SPACING.md, padding: SPACING.lg },
  gpaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  gpaLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  gpaValue: { fontSize: 48, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginVertical: SPACING.xs },
  gpaSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },

  addGradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: 6 },
  addGradeBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

  courseCard: { marginBottom: SPACING.md, padding: SPACING.md },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  courseName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, flex: 1 },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  gradeRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.sm, marginBottom: SPACING.xs },
  gradeInfo: { flex: 1 },
  examType: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  marks: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  gradeLetter: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, minWidth: 44, alignItems: 'center' },
  gradeText: { fontSize: FONT_SIZES.md, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
  gradePicker: { flexDirection: 'row', gap: SPACING.xs, marginVertical: 4 },
  glOpt: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.xs, backgroundColor: COLORS.surfaceVariant, alignItems: 'center' },
  glOptActive: { backgroundColor: COLORS.primary },
  glOptText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary },
  glOptTextActive: { color: '#fff' },
});
