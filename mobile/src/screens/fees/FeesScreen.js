import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUser, getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

export default function FeesScreen() {
  const insets = useSafeAreaInsets();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('student');
  const [user, setUser] = useState(null);

  // Student Payment Modal State
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paying, setPaying] = useState(false);

  // Admin Add Fee Modal State
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [feeTitle, setFeeTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [department, setDepartment] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  const fetchFees = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      const userData = await getUser();
      setRole(userRole || 'student');
      setUser(userData);

      const res = await api.get('/fees');
      setFees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Failed to load fee statement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFees(); }, []);

  const handlePaySubmit = async () => {
    if (!selectedFee) return;
    setPaying(true);
    try {
      await api.post('/fees', {
        feeId: selectedFee.id,
        amountPaid: Number(selectedFee.amount || 0) - Number(selectedFee.paidAmount || selectedFee.paid_amount || 0),
        paymentMethod,
        transactionRef: `TXN-${Date.now()}`,
      });
      Alert.alert('Payment Successful! 🎉', `Payment for ${selectedFee.title || 'Fee'} processed successfully via ${paymentMethod.toUpperCase()}.`);
      setPayModalVisible(false);
      fetchFees();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to process fee payment');
    } finally {
      setPaying(false);
    }
  };

  const handleAdminAddFee = async () => {
    if (!feeTitle || !amount) {
      Alert.alert('Error', 'Please fill in Title and Amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/fees', {
        title: feeTitle,
        amount: Number(amount),
        dueDate,
        department,
        status: 'pending',
      });
      Alert.alert('Success! 🎉', `Fee structure "${feeTitle}" created successfully.`);
      setAdminModalVisible(false);
      setFeeTitle('');
      setAmount('');
      fetchFees();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create fee item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading fee statement..." />;
  if (error) return <ErrorState message={error} onRetry={fetchFees} />;

  const totalAmount = fees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const paidAmount = fees.reduce((sum, f) => sum + Number(f.paidAmount || f.paid_amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const pendingFees = fees.filter((f) => f.status !== 'paid');
  const paidFees = fees.filter((f) => f.status === 'paid');

  const paymentPct = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 100;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24) }]}>
      <StatusBar style="dark" />

      {/* Screen Title Bar (Clean Light Background) */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTag}>FINANCE & ACCOUNTS</Text>
          <Text style={styles.screenTitle}>Fee Portal</Text>
        </View>

        {role === 'admin' && (
          <TouchableOpacity style={styles.adminAddBtn} onPress={() => setAdminModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={styles.adminAddBtnText}>+ Add Fee</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Floating Dark Hero Card (Moved slightly down with clean margin) */}
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.heroSummaryCard}>
          <View style={styles.heroHeaderRow}>
            <View>
              <Text style={styles.heroSub}>TOTAL ACADEMIC FEE</Text>
              <Text style={styles.heroTitle}>₹{totalAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.pctBadge}>
              <Text style={styles.pctBadgeText}>{paymentPct}% PAID</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.fillBar, { width: `${paymentPct}%` }]} />
          </View>

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>PAID AMOUNT</Text>
              <Text style={[styles.metricValue, { color: '#34d399' }]}>₹{paidAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>REMAINING BALANCE</Text>
              <Text style={[styles.metricValue, { color: pendingAmount > 0 ? '#f87171' : '#34d399' }]}>
                ₹{pendingAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Pending Due Fees List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Dues ({pendingFees.length})</Text>
          <View style={styles.listCard}>
            {pendingFees.map((fee, idx) => {
              const due = Number(fee.amount || 0) - Number(fee.paidAmount || fee.paid_amount || 0);
              return (
                <View key={fee.id || idx} style={[styles.feeRow, idx < pendingFees.length - 1 && styles.feeRowBorder]}>
                  <View style={styles.feeIconBox}>
                    <Ionicons name="wallet" size={16} color={COLORS.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feeTitle} numberOfLines={1}>{fee.title || fee.fee_type || 'Academic Fee'}</Text>
                    <Text style={styles.feeSub}>Due: {fee.dueDate || fee.due_date || 'End of Semester'}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={styles.feeAmount}>₹{due.toLocaleString()}</Text>
                    <Text style={styles.feeStatusUnpaid}>Pending</Text>
                  </View>

                  {role === 'student' && (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={() => { setSelectedFee(fee); setPayModalVisible(true); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.payBtnText}>Pay</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {pendingFees.length === 0 && (
              <View style={styles.allPaidBox}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <Text style={styles.allPaidTitle}>All dues clear! 🎉</Text>
                <Text style={styles.allPaidSub}>You have no pending fee payments for this semester.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Paid Fee History List */}
        {paidFees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Payments ({paidFees.length})</Text>
            <View style={styles.listCard}>
              {paidFees.map((fee, idx) => (
                <View key={fee.id || idx} style={[styles.feeRow, idx < paidFees.length - 1 && styles.feeRowBorder]}>
                  <View style={[styles.feeIconBox, { backgroundColor: '#ecfdf5' }]}>
                    <Ionicons name="checkmark-done" size={16} color={COLORS.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feeTitle} numberOfLines={1}>{fee.title || fee.fee_type || 'Academic Fee'}</Text>
                    <Text style={styles.feeSub}>Paid on {fee.paidDate || fee.paid_date || '2026-08-15'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.feeAmount, { color: COLORS.success }]}>₹{Number(fee.amount).toLocaleString()}</Text>
                    <Text style={styles.feeStatusPaid}>Paid ✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Student Checkout Payment Modal */}
      <Modal visible={payModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fee Checkout</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedFee && (
              <View style={styles.checkoutSummary}>
                <Text style={styles.checkoutLabel}>{selectedFee.title || 'Semester Fee'}</Text>
                <Text style={styles.checkoutAmount}>
                  ₹{(Number(selectedFee.amount || 0) - Number(selectedFee.paidAmount || selectedFee.paid_amount || 0)).toLocaleString()}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Select Payment Method</Text>
            <View style={styles.methodGrid}>
              {[
                { id: 'upi', name: 'UPI / GPay', icon: 'qr-code-outline' },
                { id: 'card', name: 'Credit/Debit Card', icon: 'card-outline' },
                { id: 'netbanking', name: 'NetBanking', icon: 'business-outline' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodCard, paymentMethod === m.id && styles.methodCardActive]}
                  onPress={() => setPaymentMethod(m.id)}
                >
                  <Ionicons name={m.icon} size={20} color={paymentMethod === m.id ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.methodText, paymentMethod === m.id && styles.methodTextActive]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={paying ? 'Processing Payment...' : 'Proceed & Pay Now'}
              onPress={handlePaySubmit}
              loading={paying}
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Admin Add Fee Modal */}
      <Modal visible={adminModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Fee Structure</Text>
              <TouchableOpacity onPress={() => setAdminModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Fee Title</Text>
            <TextInput
              style={styles.textInput}
              value={feeTitle}
              onChangeText={setFeeTitle}
              placeholder="e.g. Semester 5 Tuition Fee"
            />

            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 45000"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Due Date</Text>
            <TextInput
              style={styles.textInput}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.inputLabel}>Target Department</Text>
            <TextInput
              style={styles.textInput}
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Computer Science or All"
            />

            <Button
              title="Publish Fee Structure"
              onPress={handleAdminAddFee}
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
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingTop: SPACING.xs, paddingBottom: SPACING.xs },
  screenTag: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  screenTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text, marginTop: 1 },
  adminAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.md, gap: 4 },
  adminAddBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  content: { paddingBottom: SPACING.xl },

  heroSummaryCard: { marginHorizontal: SPACING.md, marginTop: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.md },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroSub: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  heroTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: '#fff', marginTop: 2 },
  pctBadge: { backgroundColor: 'rgba(52,211,153,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.round },
  pctBadgeText: { fontSize: 10, fontWeight: '800', color: '#34d399' },

  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, marginVertical: SPACING.md, overflow: 'hidden' },
  fillBar: { height: '100%', backgroundColor: '#34d399', borderRadius: 3 },

  heroMetricsGrid: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.xs },
  heroMetricItem: { flex: 1 },
  heroDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: SPACING.md },
  metricLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  metricValue: { fontSize: FONT_SIZES.md, fontWeight: '800', marginTop: 2 },

  section: { marginTop: SPACING.lg, paddingHorizontal: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.xs, textTransform: 'uppercase', letterSpacing: 0.8 },

  listCard: { backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, ...SHADOWS.sm },
  feeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.sm },
  feeRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  feeIconBox: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  feeTitle: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text },
  feeSub: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  feeAmount: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.text },
  feeStatusUnpaid: { fontSize: 10, fontWeight: '700', color: COLORS.error, marginTop: 1 },
  feeStatusPaid: { fontSize: 10, fontWeight: '700', color: COLORS.success, marginTop: 1 },

  payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.xs },
  payBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  allPaidBox: { padding: SPACING.xl, alignItems: 'center' },
  allPaidTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text, marginTop: SPACING.xs },
  allPaidSub: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  checkoutSummary: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, alignItems: 'center' },
  checkoutLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  checkoutAmount: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.primary, marginTop: 2 },

  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 4 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },

  methodGrid: { gap: SPACING.xs, marginVertical: 6 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.sm },
  methodCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  methodText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  methodTextActive: { color: COLORS.primary, fontWeight: '700' },
});
