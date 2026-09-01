import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { transformLeaveRequests } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

export default function AdminLeaveApprovalsScreen({ navigation }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaves = async () => {
    try {
      setError(null);
      const res = await api.get('/leaves');
      const transformed = transformLeaveRequests(res.data);
      setLeaves(transformed);
    } catch (err) {
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (leaveId, newStatus) => {
    try {
      await api.post('/leaves', { id: leaveId, status: newStatus });
      Alert.alert('Status Updated', `Leave request marked as ${newStatus}`);
      fetchLeaves();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update leave status');
    }
  };

  if (loading) return <LoadingScreen message="Loading leave applications..." />;
  if (error) return <ErrorState message={error} onRetry={fetchLeaves} />;

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const processedLeaves = leaves.filter((l) => l.status !== 'pending');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <Text style={styles.sectionTitle}>Pending Requests ({pendingLeaves.length})</Text>
      {pendingLeaves.map((item) => (
        <Card key={item.id} style={styles.leaveCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.applicantName}>{item.applicant_name}</Text>
              <Text style={styles.roleTag}>{item.role.toUpperCase()}</Text>
            </View>
            <Badge label="Pending" variant="warning" />
          </View>

          <Text style={styles.reasonText}>Reason: {item.reason || 'Medical / Personal Leave'}</Text>
          <Text style={styles.dateText}>Duration: {item.start_date} to {item.end_date}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleUpdateStatus(item.id, 'approved')}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleUpdateStatus(item.id, 'rejected')}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {pendingLeaves.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle-outline" size={40} color={COLORS.success} />
          <Text style={styles.emptyText}>No pending leave approvals</Text>
        </Card>
      )}

      {processedLeaves.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Recent Approvals History</Text>
          {processedLeaves.map((item) => (
            <Card key={item.id} style={styles.leaveCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.applicantName}>{item.applicant_name}</Text>
                <Badge label={item.status} variant={item.status === 'approved' ? 'success' : 'danger'} />
              </View>
              <Text style={styles.reasonText}>{item.reason}</Text>
              <Text style={styles.dateText}>{item.start_date} - {item.end_date}</Text>
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
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  leaveCard: { marginBottom: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs },
  applicantName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  roleTag: { fontSize: 10, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  reasonText: { fontSize: FONT_SIZES.sm, color: COLORS.text, marginVertical: 4 },
  dateText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, gap: 4 },
  approveBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.error },
  actionBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  emptyCard: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { marginTop: SPACING.sm, color: COLORS.textSecondary, fontWeight: '600' },
});
