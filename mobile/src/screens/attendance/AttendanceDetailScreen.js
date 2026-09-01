import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { API_ENDPOINTS } from '../../core/constants/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';

export default function AttendanceDetailScreen({ route, navigation }) {
  const { subjectId } = route.params;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await api.get(API_ENDPOINTS.ATTENDANCE.LIST);
      const allRecords = Array.isArray(response.data) ? response.data : [];
      const filtered = allRecords.filter(
        (r) => (r.courseId || r.course_id) === Number(subjectId)
      );
      setRecords(filtered);
    } catch (err) {
      setError('Failed to load attendance details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const totalClasses = records.length;
  const attended = records.filter((r) => r.status === 'present').length;
  const percentage = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;
  const missed = totalClasses - attended;

  const courseName = records[0]?.courseName || records[0]?.course_name || 'Course';
  const courseCode = records[0]?.courseCode || records[0]?.course_code || '';

  const classesNeeded = percentage < 75
    ? Math.ceil((0.75 * totalClasses - attended) / 0.25)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Card variant="elevated" style={styles.mainCard}>
        <Text style={styles.subjectName}>{courseName}</Text>
        <Text style={styles.subjectCode}>{courseCode}</Text>

        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.circlePercent}>{percentage}%</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{attended}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: COLORS.error }]}>{missed}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
        </View>
      </Card>

      {classesNeeded > 0 && (
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#e65100" />
          <Text style={styles.infoText}>
            You need to attend {classesNeeded} more classes to reach 75% attendance
          </Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Recent Records</Text>
      {records.slice(0, 10).map((record, index) => (
        <Card key={record.id || index} style={styles.recordCard}>
          <View style={styles.recordRow}>
            <View style={[
              styles.statusDot,
              { backgroundColor: record.status === 'present' ? COLORS.success : COLORS.error }
            ]} />
            <View style={styles.recordInfo}>
              <Text style={styles.recordDate}>{record.date}</Text>
              <Text style={styles.recordPeriod}>{record.period || 'Lecture'}</Text>
            </View>
            <Text style={[
              styles.recordStatus,
              { color: record.status === 'present' ? COLORS.success : COLORS.error }
            ]}>
              {record.status === 'present' ? 'Present' : 'Absent'}
            </Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 4,
  },
  backText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  mainCard: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  subjectName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subjectCode: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  circleContainer: {
    marginBottom: SPACING.lg,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circlePercent: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: '#e65100',
    marginLeft: SPACING.sm,
    flex: 1,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  recordCard: {
    marginBottom: SPACING.sm,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  recordInfo: {
    flex: 1,
  },
  recordDate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  recordPeriod: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  recordStatus: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});
