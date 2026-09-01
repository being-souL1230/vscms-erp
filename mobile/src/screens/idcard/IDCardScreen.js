import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import { getUser } from '../../core/storage/authStorage';
import { transformUser } from '../../services/dataAdapter';
import Avatar from '../../components/Avatar';

export default function IDCardScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await getUser();
      setUser(transformUser(data));
    })();
  }, []);

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ID Card */}
      <View style={styles.card}>
        {/* Header stripe */}
        <View style={styles.cardHeader}>
          <Ionicons name="school" size={24} color={COLORS.textLight} />
          <View>
            <Text style={styles.collegeName}>VSCMS</Text>
            <Text style={styles.collegeSub}>College of Management Studies</Text>
          </View>
        </View>

        {/* Photo + Info */}
        <View style={styles.cardBody}>
          <Avatar name={user.name} imageUri={user.avatarUrl || user.avatar_url} size={80} />
          <View style={styles.cardInfo}>
            <Text style={styles.studentName}>{user.name}</Text>
            <Text style={styles.rollNo}>{user.student_id || user.rollNo || user.roll_no_or_emp_id}</Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>DEPARTMENT</Text>
            <Text style={styles.detailValue}>{user.department}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>SEMESTER</Text>
            <Text style={styles.detailValue}>{user.semester || '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>EMAIL</Text>
            <Text style={styles.detailValue}>{user.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PHONE</Text>
            <Text style={styles.detailValue}>{user.phone || '-'}</Text>
          </View>
          {user.gpa && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>GPA</Text>
              <Text style={styles.detailValue}>{user.gpa}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>Valid for Academic Year 2025-26</Text>
          <Text style={styles.footerText}>ID: {user.student_id || user.rollNo || user.id}</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.instructionText}>
          This is your digital student ID card. Show this at the college gate, library, and examination hall.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, alignItems: 'center' },
  card: { width: '100%', maxWidth: 380, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, padding: SPACING.lg },
  collegeName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textLight },
  collegeSub: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.8)' },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, paddingBottom: SPACING.md },
  cardInfo: { flex: 1 },
  studentName: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  rollNo: { fontSize: FONT_SIZES.lg, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  detailsGrid: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 1 },
  detailValue: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '600', textTransform: 'capitalize' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surfaceVariant, padding: SPACING.md },
  footerText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
  instructions: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.md, marginTop: SPACING.lg, ...SHADOWS.sm },
  instructionText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
});
