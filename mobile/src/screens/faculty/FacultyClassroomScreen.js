import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

export default function FacultyClassroomScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [crsRes, stuRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get('/students'),
      ]);
      const crsData = crsRes.status === 'fulfilled' ? crsRes.value.data : [];
      const stuData = stuRes.status === 'fulfilled' ? stuRes.value.data : [];

      setCourses(Array.isArray(crsData) ? crsData : []);
      setStudents(Array.isArray(stuData) ? stuData : []);
    } catch (err) {
      setError('Failed to load classroom data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen message="Loading classroom..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Faculty Classroom Banner */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.banner}>
        <Text style={styles.bannerTitle}>Faculty Classroom Hub</Text>
        <Text style={styles.bannerSub}>Manage courses, student attendance & class evaluations</Text>
      </LinearGradient>

      {/* Quick Action Hub */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#eff6ff' }]}
          onPress={() => navigation.navigate('MarkAttendance')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#2563eb' }]}>
            <Ionicons name="checkmark-done" size={22} color="#fff" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Mark Attendance</Text>
            <Text style={styles.actionSub}>Take daily student attendance</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#f0fdf4' }]}
          onPress={() => navigation.navigate('Assignments')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#059669' }]}>
            <Ionicons name="book" size={22} color="#fff" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Course Assignments</Text>
            <Text style={styles.actionSub}>Post & review submissions</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Assigned Courses Section */}
      <Text style={styles.sectionTitle}>Assigned Courses ({courses.length})</Text>
      {courses.map((course) => (
        <Card key={course.id} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseName}>{course.name}</Text>
              <Text style={styles.courseCode}>{course.code} • {course.department || 'Computer Science'}</Text>
            </View>
            <Badge label={`${course.credits || 3} Credits`} variant="primary" />
          </View>

          <View style={styles.courseMeta}>
            <Text style={styles.metaText}>Semester: {course.semester || 1}</Text>
            <Text style={styles.metaText}>Students: {students.length || 30}</Text>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.markBtn}
              onPress={() => navigation.navigate('MarkAttendance', { courseId: course.id, courseName: course.name })}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.markBtnText}>Take Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => navigation.navigate('Materials', { courseId: course.id })}
            >
              <Ionicons name="folder-outline" size={16} color={COLORS.primary} />
              <Text style={styles.viewBtnText}>Materials</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {courses.length === 0 && (
        <Card style={{ padding: SPACING.xl, alignItems: 'center' }}>
          <Ionicons name="school-outline" size={40} color={COLORS.disabled} />
          <Text style={{ marginTop: SPACING.sm, color: COLORS.textSecondary }}>No assigned courses found</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  banner: { padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  bannerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  quickActions: { gap: SPACING.sm, marginBottom: SPACING.lg },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, ...SHADOWS.sm },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  actionText: { flex: 1 },
  actionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  actionSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  courseCard: { marginBottom: SPACING.md, padding: SPACING.md },
  courseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  courseName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  courseCode: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  courseMeta: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, marginVertical: SPACING.sm },
  metaText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  cardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  markBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, gap: 4 },
  markBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '600' },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, gap: 4 },
  viewBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.xs, fontWeight: '600' },
});
