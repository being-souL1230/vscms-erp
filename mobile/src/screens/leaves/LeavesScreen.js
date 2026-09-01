import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function LeavesScreen() {
  const insets = useSafeAreaInsets();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setError(null);
      const res = await api.get('/leaves');
      const data = Array.isArray(res.data) ? res.data : [];
      setLeaves(data);
    } catch (err) {
      setError('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async () => {
    if (!fromDate || !toDate || !reason.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/leaves', { fromDate, toDate, reason: reason.trim() });
      Alert.alert('Success', 'Leave request submitted!');
      setShowForm(false);
      setFromDate(''); setToDate(''); setReason('');
      fetchLeaves();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={[styles.container, { paddingTop: Math.max(insets.top, 28) + 6 }]} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
        <Ionicons name={showForm ? 'close' : 'add'} size={20} color={COLORS.textLight} />
        <Text style={styles.addButtonText}>{showForm ? 'Cancel' : 'New Leave Request'}</Text>
      </TouchableOpacity>

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>📝 Leave Request</Text>
          <Text style={styles.label}>From Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="2026-09-01" placeholderTextColor={COLORS.disabled} />
          <Text style={styles.label}>To Date (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="2026-09-03" placeholderTextColor={COLORS.disabled} />
          <Text style={styles.label}>Reason</Text>
          <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason} placeholder="Describe your reason..." placeholderTextColor={COLORS.disabled} multiline numberOfLines={3} textAlignVertical="top" />
          <Button title="Submit Request" onPress={handleSubmit} loading={submitting} size="lg" style={styles.submitBtn} />
        </Card>
      )}

      {leaves.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No leave requests" message="Submit a new request above" />
      ) : (
        <>
          <Text style={styles.sectionTitle}>📋 Your Requests ({leaves.length})</Text>
          {leaves.map((leave) => (
            <Card key={leave.id} style={styles.leaveCard}>
              <View style={styles.leaveHeader}>
                <Text style={styles.leaveDates}>{leave.fromDate || leave.from_date} → {leave.toDate || leave.to_date}</Text>
                <Badge
                  label={leave.status}
                  variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}
                />
              </View>
              <Text style={styles.leaveReason}>{leave.reason}</Text>
              {leave.remarks && <Text style={styles.leaveRemarks}>Remarks: {leave.remarks}</Text>}
              {leave.reviewedBy && <Text style={styles.reviewInfo}>Reviewed by: {leave.reviewedBy}</Text>}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: SPACING.sm },
  addButtonText: { color: COLORS.textLight, fontSize: FONT_SIZES.md, fontWeight: '700' },
  formCard: { marginBottom: SPACING.md, padding: SPACING.md },
  formTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.surfaceVariant, borderRadius: RADIUS.sm, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  textArea: { minHeight: 80 },
  submitBtn: { marginTop: SPACING.xs },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  leaveCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  leaveDates: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  leaveReason: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  leaveRemarks: { fontSize: FONT_SIZES.sm, color: COLORS.warning, fontStyle: 'italic' },
  reviewInfo: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs },
});
