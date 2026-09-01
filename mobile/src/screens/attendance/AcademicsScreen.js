import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { transformAttendance } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';

export default function AcademicsScreen({ navigation }) {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [attRes, crsRes] = await Promise.allSettled([
        api.get('/attendance'),
        api.get('/courses'),
      ]);
      const attData = attRes.status === 'fulfilled' ? attRes.value.data : [];
      const crsData = crsRes.status === 'fulfilled' ? crsRes.value.data : [];
      setAttendance(transformAttendance(attData, Array.isArray(crsData) ? crsData : []));
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const { overall, subjects } = attendance || {};

  const modules = [
    { icon: 'trophy', label: 'Grades', screen: 'Grades', color: '#059669' },
    { icon: 'calendar', label: 'Timetable', screen: 'Timetable', color: '#7c3aed' },
    { icon: 'book', label: 'Assignments', screen: 'Assignments', color: '#d97706' },
    { icon: 'folder', label: 'Materials', screen: 'Materials', color: '#ea580c' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Module Quick Links */}
      <View style={styles.modulesRow}>
        {modules.map((m) => (
          <TouchableOpacity key={m.label} style={styles.moduleItem} onPress={() => navigation.navigate(m.screen)}>
            <View style={[styles.moduleIcon, { backgroundColor: m.color + '15' }]}>
              <Ionicons name={m.icon} size={20} color={m.color} />
            </View>
            <Text style={styles.moduleLabel}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overall Attendance */}
      <Card variant="elevated" style={styles.overallCard}>
        <Text style={styles.cardTitle}>📊 Overall Attendance</Text>
        <View style={styles.overallContent}>
          <View style={styles.circle}>
            <Text style={styles.circlePercent}>{overall?.percentage || 0}%</Text>
          </View>
          <View style={styles.overallStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{overall?.attended_classes || 0}</Text>
              <Text style={styles.statLabel}>Attended</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.error }]}>{overall?.classes_missed || 0}</Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{overall?.total_classes || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>
        {overall?.percentage < 75 && overall?.total_classes > 0 && (
          <View style={styles.warning}>
            <Ionicons name="warning" size={16} color="#e65100" />
            <Text style={styles.warningText}>Attendance below 75% threshold</Text>
          </View>
        )}
      </Card>

      {/* Subject-wise */}
      {subjects && subjects.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Subject-wise Attendance</Text>
          {subjects.map((s) => (
            <Card key={s.id} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{s.subject?.name}</Text>
                <Text style={[styles.subjectPercent, s.percentage < 75 && { color: COLORS.error }]}>{s.percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${s.percentage}%`, backgroundColor: s.percentage >= 75 ? COLORS.primary : COLORS.error }]} />
              </View>
              <View style={styles.subjectMeta}>
                <Text style={styles.subjectMetaText}>{s.subject?.code}</Text>
                <Text style={styles.subjectMetaText}>{s.attended_classes}/{s.total_classes} classes</Text>
              </View>
            </Card>
          ))}
        </>
      )}

      {subjects && subjects.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="school-outline" size={40} color={COLORS.disabled} />
          <Text style={styles.emptyText}>No attendance records yet</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  modulesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  moduleItem: { alignItems: 'center', flex: 1 },
  moduleIcon: { width: 52, height: 52, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  moduleLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  overallCard: { marginBottom: SPACING.lg, padding: SPACING.md },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  overallContent: { flexDirection: 'row', alignItems: 'center' },
  circle: { width: 90, height: 90, borderRadius: 45, borderWidth: 5, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xl },
  circlePercent: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.primary },
  overallStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  warning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff3e0', padding: SPACING.sm, borderRadius: RADIUS.sm, marginTop: SPACING.md },
  warningText: { fontSize: FONT_SIZES.sm, color: '#e65100', marginLeft: SPACING.sm, fontWeight: '600' },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  subjectCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  subjectName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  subjectPercent: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.primary },
  progressBar: { height: 6, backgroundColor: COLORS.surfaceVariant, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.sm },
  progressFill: { height: '100%', borderRadius: 3 },
  subjectMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectMetaText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  emptyCard: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.sm },
});
