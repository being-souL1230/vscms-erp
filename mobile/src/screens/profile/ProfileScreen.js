import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { getUser, removeSession } from '../../core/storage/authStorage';
import { transformUser } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) { setUser(transformUser(res.data.user)); return; }
        } catch (e) {}
        const userData = await getUser();
        setUser(transformUser(userData));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try { await api.post('/auth/logout'); } catch (e) {}
        await removeSession();
      }},
    ]);
  };

  if (loading) return <LoadingScreen />;

  const getMenuItems = () => {
    const role = user?.role || 'student';
    if (role === 'admin') {
      return [
        { icon: 'people-outline', label: 'User Management Hub', screen: 'UserManagement', color: '#2563eb' },
        { icon: 'checkmark-done-circle-outline', label: 'Leave Approvals', screen: 'LeaveApprovals', color: '#7c3aed' },
        { icon: 'sparkles-outline', label: 'CMSBot AI Assistant', screen: 'CMSBot', color: '#2563eb' },
        { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: '#d97706' },
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Admin Support', 'Contact system admin at admin@vscms.edu') },
      ];
    } else if (role === 'faculty') {
      return [
        { icon: 'checkmark-done-circle-outline', label: 'Leave Approvals', screen: 'LeaveApprovals', color: '#7c3aed' },
        { icon: 'time-outline', label: 'My Leaves', screen: 'Leaves', color: '#be185d' },
        { icon: 'sparkles-outline', label: 'CMSBot AI Assistant', screen: 'CMSBot', color: '#2563eb' },
        { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: '#d97706' },
        { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Faculty Support', 'Contact dean@vscms.edu') },
      ];
    }
    // Student
    return [
      { icon: 'card-outline', label: 'Student ID Card', screen: 'IDCard', color: '#2563eb' },
      { icon: 'document-text-outline', label: 'Exams & Schedule', screen: 'Exams', color: '#7c3aed' },
      { icon: 'time-outline', label: 'Leave Requests', screen: 'Leaves', color: '#be185d' },
      { icon: 'sparkles-outline', label: 'CMSBot AI Assistant', screen: 'CMSBot', color: '#2563eb' },
      { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', color: '#d97706' },
      { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Student Help', 'Contact studenthelp@vscms.edu') },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 24) + SPACING.sm }]}>
      {/* Profile Header */}
      <Card variant="elevated" style={styles.header}>
        <Avatar name={user?.name} imageUri={user?.avatarUrl || user?.avatar_url} size={80} />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.rollNo}>
          {user?.role === 'admin' ? 'Administrator' : user?.role === 'faculty' ? `Faculty ID: ${user?.student_id}` : `Roll No: ${user?.student_id}`}
        </Text>
        <Text style={styles.department}>{user?.department} {user?.semester ? `• Sem ${user.semester}` : ''}</Text>
      </Card>

      {/* Quick Info */}
      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-circle-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={[styles.infoValue, { color: COLORS.primary }]}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, { color: COLORS.success }]}>{user?.status || 'Active'}</Text>
        </View>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={item.onPress || (() => navigation.navigate(item.screen))}
          >
            <View style={[styles.menuIcon, { backgroundColor: (item.color || COLORS.primary) + '15' }]}>
              <Ionicons name={item.icon} size={20} color={item.color || COLORS.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.disabled} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>VSCMS ERP Mobile v1.1.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  header: { alignItems: 'center', paddingVertical: SPACING.xl, marginBottom: SPACING.md },
  name: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginTop: SPACING.md },
  rollNo: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: '700', marginTop: SPACING.xs },
  department: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: 2 },
  infoCard: { marginBottom: SPACING.md, padding: SPACING.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginLeft: SPACING.sm, flex: 1 },
  infoValue: { fontSize: FONT_SIZES.md, color: COLORS.text, fontWeight: '600' },
  menuCard: { marginBottom: SPACING.md, padding: SPACING.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: FONT_SIZES.md, color: COLORS.text, flex: 1, marginLeft: SPACING.md, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.error + '10', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  logoutText: { fontSize: FONT_SIZES.md, color: COLORS.error, fontWeight: '600', marginLeft: SPACING.sm },
  version: { textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.disabled, marginBottom: SPACING.xl },
});
