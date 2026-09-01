import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

export default function ExamsScreen() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [examRes, marksRes] = await Promise.allSettled([
          api.get('/exams'),
          api.get('/internal-marks'),
        ]);
        const examData = examRes.status === 'fulfilled' ? (Array.isArray(examRes.value.data) ? examRes.value.data : []) : [];
        const marksData = marksRes.status === 'fulfilled' ? (Array.isArray(marksRes.value.data) ? marksRes.value.data : []) : [];
        setExams([...examData.map(e => ({ ...e, _type: 'schedule' })), ...marksData.map(m => ({ ...m, _type: 'marks' }))]);
      } catch (err) {
        setError('Failed to load exams');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;

  const schedules = exams.filter(e => e._type === 'schedule');
  const marks = exams.filter(e => e._type === 'marks');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Exam Schedules */}
      <Text style={styles.sectionTitle}>📅 Exam Schedule</Text>
      {schedules.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No exam schedules published yet</Text>
        </Card>
      ) : schedules.map((exam) => (
        <Card key={exam.id} style={styles.examCard}>
          <View style={styles.examHeader}>
            <Text style={styles.examName}>{exam.name || exam.courseName || exam.course_name}</Text>
            <Badge label={exam.status || 'scheduled'} variant={exam.status === 'completed' ? 'success' : 'warning'} />
          </View>
          <View style={styles.examDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
              <Text style={styles.detailText}>{exam.examType || exam.exam_type || exam.courseCode || exam.course_code}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.detailText}>{exam.examDate || exam.exam_date || exam.startDate || exam.start_date} → {exam.endDate || exam.end_date || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.primary} />
              <Text style={styles.detailText}>{exam.startTime || exam.start_time} - {exam.endTime || exam.end_time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.detailText}>Room: {exam.room}</Text>
            </View>
            {exam.semester && <Text style={styles.semBadge}>Semester {exam.semester}</Text>}
          </View>
        </Card>
      ))}

      {/* Internal Marks */}
      {marks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📝 Internal Marks</Text>
          {marks.map((mark) => (
            <Card key={mark.id} style={styles.examCard}>
              <View style={styles.examHeader}>
                <Text style={styles.examName}>{mark.courseName || mark.course_name}</Text>
                <Badge label={mark.result || mark.status || '-'} variant={mark.result === 'pass' ? 'success' : 'danger'} />
              </View>
              <View style={styles.marksGrid}>
                <View style={styles.markBox}>
                  <Text style={styles.markLabel}>Theory</Text>
                  <Text style={styles.markValue}>{mark.theoryMarks || mark.theory_marks}/{mark.maxTheory || mark.max_theory}</Text>
                </View>
                <View style={styles.markBox}>
                  <Text style={styles.markLabel}>Practical</Text>
                  <Text style={styles.markValue}>{mark.practicalMarks || mark.practical_marks}/{mark.maxPractical || mark.max_practical}</Text>
                </View>
                <View style={styles.markBox}>
                  <Text style={styles.markLabel}>Total</Text>
                  <Text style={[styles.markValue, { color: COLORS.primary }]}>{mark.totalMarks || mark.total_marks}/{mark.maxTotal || mark.max_total}</Text>
                </View>
                <View style={styles.markBox}>
                  <Text style={styles.markLabel}>Grade</Text>
                  <Text style={[styles.markValue, { color: COLORS.success }]}>{mark.gradeLetter || mark.grade_letter}</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {exams.length === 0 && <EmptyState icon="school-outline" title="No exam data" message="Exam schedules and marks will appear here" />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md, marginTop: SPACING.sm },
  emptyCard: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  examCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  examName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, flex: 1 },
  examDetails: { gap: SPACING.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  detailText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  semBadge: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '700', marginTop: SPACING.xs },
  marksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  markBox: { flex: 1, minWidth: '40%', backgroundColor: COLORS.surfaceVariant, padding: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center' },
  markLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: 2 },
  markValue: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
});
