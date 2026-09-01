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
import EmptyState from '../../components/EmptyState';
import Button from '../../components/Button';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_COLORS = ['#1d4ed8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [role, setRole] = useState('student');

  // Add Slot Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [courseName, setCourseName] = useState('Computer Networks');
  const [courseCode, setCourseCode] = useState('CS301');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [room, setRoom] = useState('Hall 402');
  const [facultyName, setFacultyName] = useState('Dr. Tanya Malhotra');
  const [submitting, setSubmitting] = useState(false);

  function getCurrentDay() {
    const dayIndex = new Date().getDay();
    return DAYS[dayIndex === 0 ? 6 : dayIndex - 1] || 'Monday';
  }

  const fetchTimetable = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const response = await api.get('/timetable');
      const data = Array.isArray(response.data) ? response.data : [];
      setTimetable(data);
    } catch (err) {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimetable(); }, []);

  const handleAddSlot = async () => {
    if (!courseName.trim() || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in course name and times');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/timetable', {
        dayOfWeek: selectedDay,
        courseName: courseName.trim(),
        courseCode: courseCode.trim().toUpperCase(),
        startTime,
        endTime,
        room,
        facultyName,
      });
      Alert.alert('Slot Added! 📅', `Class scheduled for ${selectedDay} (${startTime} - ${endTime}).`);
      setModalVisible(false);
      fetchTimetable();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add timetable slot');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading timetable..." />;
  if (error) return <ErrorState message={error} onRetry={fetchTimetable} />;

  const daySchedule = timetable.filter((slot) => {
    const slotDay = (slot.dayOfWeek || slot.day_of_week || '').toLowerCase();
    return slotDay === selectedDay.toLowerCase();
  }).sort((a, b) => (a.startTime || a.start_time || '').localeCompare(b.startTime || b.start_time || ''));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) + SPACING.sm }]}>
        {/* Day Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
          {DAYS.map((day, idx) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, selectedDay === day && { backgroundColor: DAY_COLORS[idx] }]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {(role === 'faculty' || role === 'admin') && (
          <TouchableOpacity style={styles.addSlotBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.addSlotBtnText}>+ Add Slot for {selectedDay}</Text>
          </TouchableOpacity>
        )}

        {/* Schedule */}
        {daySchedule.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No classes" message={`No classes scheduled for ${selectedDay}`} />
        ) : (
          daySchedule.map((slot, idx) => (
            <Card key={slot.id || idx} style={styles.slotCard}>
              <View style={styles.slotTime}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.timeText}>{slot.startTime || slot.start_time} - {slot.endTime || slot.end_time}</Text>
              </View>
              <Text style={styles.courseName}>{slot.courseName || slot.course_name}</Text>
              <View style={styles.slotDetails}>
                <View style={styles.detailChip}>
                  <Ionicons name="book-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>{slot.courseCode || slot.course_code}</Text>
                </View>
                <View style={styles.detailChip}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.detailText}>{slot.room}</Text>
                </View>
              </View>
              <Text style={styles.facultyName}>👤 {slot.facultyName || slot.faculty_name}</Text>
            </Card>
          ))
        )}

        {/* Weekly Overview */}
        <Text style={styles.sectionTitle}>📊 Weekly Overview</Text>
        <Card style={styles.overviewCard}>
          {DAYS.map((day, idx) => {
            const count = timetable.filter((s) => (s.dayOfWeek || s.day_of_week || '').toLowerCase() === day.toLowerCase()).length;
            return (
              <View key={day} style={[styles.overviewRow, idx < 5 && styles.overviewRowBorder]}>
                <Text style={styles.overviewDay}>{day}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: `${(count / 8) * 100}%`, backgroundColor: DAY_COLORS[idx] }]} />
                </View>
                <Text style={styles.overviewCount}>{count}</Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>

      {/* Add Slot Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Class Slot ({selectedDay})</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Course Name</Text>
              <TextInput
                style={styles.textInput}
                value={courseName}
                onChangeText={setCourseName}
                placeholder="e.g. Computer Networks"
              />

              <Text style={styles.inputLabel}>Course Code</Text>
              <TextInput
                style={styles.textInput}
                value={courseCode}
                onChangeText={setCourseCode}
                placeholder="e.g. CS301"
              />

              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.textInput}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00 AM"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.textInput}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="10:00 AM"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Room / Hall No.</Text>
              <TextInput
                style={styles.textInput}
                value={room}
                onChangeText={setRoom}
                placeholder="e.g. Lab 402"
              />

              <Text style={styles.inputLabel}>Faculty Name</Text>
              <TextInput
                style={styles.textInput}
                value={facultyName}
                onChangeText={setFacultyName}
                placeholder="Dr. Tanya Malhotra"
              />
            </ScrollView>

            <Button
              title="Save Timetable Slot"
              onPress={handleAddSlot}
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
  daysRow: { paddingBottom: SPACING.md },
  dayChip: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.round, backgroundColor: COLORS.surfaceVariant, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  dayText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '700' },
  dayTextActive: { color: COLORS.textLight },

  addSlotBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: 6 },
  addSlotBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },

  slotCard: { marginBottom: SPACING.sm, padding: SPACING.md, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  slotTime: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  timeText: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '700', marginLeft: SPACING.xs },
  courseName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  slotDetails: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs },
  detailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceVariant, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.round },
  detailText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginLeft: 4, fontWeight: '600' },
  facultyName: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginTop: SPACING.lg, marginBottom: SPACING.md },
  overviewCard: { padding: SPACING.md },
  overviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  overviewRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  overviewDay: { width: 90, fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  barContainer: { flex: 1, height: 8, backgroundColor: COLORS.surfaceVariant, borderRadius: 4, overflow: 'hidden', marginHorizontal: SPACING.sm },
  bar: { height: '100%', borderRadius: 4 },
  overviewCount: { width: 24, fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, textAlign: 'right' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
});
