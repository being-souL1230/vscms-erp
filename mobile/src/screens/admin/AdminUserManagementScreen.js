import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { transformUsersList } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

const ROLE_TABS = ['All', 'Student', 'Faculty', 'Admin'];

export default function AdminUserManagementScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo12345');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science');
  const [rollNo, setRollNo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setError(null);
      const res = await api.get('/users');
      const transformed = transformUsersList(res.data);
      setUsers(transformed);
    } catch (err) {
      setError('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleAddUser = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in Name, Email and Password');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', {
        name,
        email,
        password,
        role,
        department,
        rollNoOrEmpId: rollNo || `EMP-${Date.now().toString().slice(-4)}`,
        semester: 1,
        status: 'active',
      });
      Alert.alert('User Created! 🎉', `${name} has been added as ${role.toUpperCase()} to ${department}.`);
      setModalVisible(false);
      setName('');
      setEmail('');
      setRollNo('');
      fetchUsers();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (userItem) => {
    const newStatus = userItem.status === 'active' ? 'inactive' : 'active';
    try {
      await api.post('/users', { id: userItem.id, status: newStatus });
      Alert.alert('Status Updated', `${userItem.name}'s account is now ${newStatus}`);
      fetchUsers();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'All' || u.role.toLowerCase() === selectedRole.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.emp_or_roll?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleColor = (roleStr) => {
    switch (roleStr?.toLowerCase()) {
      case 'admin': return '#e11d48';
      case 'faculty': return '#7c3aed';
      default: return '#2563eb';
    }
  };

  if (loading) return <LoadingScreen message="Loading user directory..." />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Sleek Dark Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={[styles.banner, { paddingTop: Math.max(insets.top, 24) + SPACING.md }]}
        >
          <View style={styles.bannerHeader}>
            <View>
              <Text style={styles.bannerTag}>DIRECTORY CONTROL</Text>
              <Text style={styles.bannerTitle}>User Management ({users.length})</Text>
            </View>
            <TouchableOpacity style={styles.addBtnHeader} onPress={() => setModalVisible(true)}>
              <Ionicons name="person-add" size={14} color="#fff" />
              <Text style={styles.addBtnText}>+ Add Account</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input Bar Inside Banner */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search name, email, roll no..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Minimal Role Tabs Pills */}
        <View style={styles.roleTabsRow}>
          {ROLE_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.roleTabPill, selectedRole === tab && styles.roleTabPillActive]}
              onPress={() => setSelectedRole(tab)}
            >
              <Text style={[styles.roleTabPillText, selectedRole === tab && styles.roleTabPillTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Compact Directory List Container */}
        <View style={styles.directoryCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>Active Directory List</Text>
            <Text style={styles.listHeaderCount}>{filteredUsers.length} accounts</Text>
          </View>

          {filteredUsers.map((u, idx) => {
            const roleColor = getRoleColor(u.role);
            const isActive = u.status === 'active';
            return (
              <View key={u.id || idx} style={[styles.userRow, idx < filteredUsers.length - 1 && styles.userRowBorder]}>
                {/* Avatar */}
                <View style={[styles.avatarCircle, { backgroundColor: roleColor + '18' }]}>
                  <Text style={[styles.avatarText, { color: roleColor }]}>{u.name?.charAt(0) || 'U'}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameLine}>
                    <Text style={styles.userNameText} numberOfLines={1}>{u.name}</Text>
                    <View style={[styles.roleTag, { backgroundColor: roleColor + '15' }]}>
                      <Text style={[styles.roleTagText, { color: roleColor }]}>{u.role.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.userEmailText} numberOfLines={1}>{u.email}</Text>
                  <Text style={styles.userMetaText}>
                    {u.department} {u.emp_or_roll ? `• ID: ${u.emp_or_roll}` : ''}
                  </Text>
                </View>

                {/* Inline Compact Action Button */}
                <TouchableOpacity
                  style={[styles.compactStatusBtn, isActive ? styles.btnInactive : styles.btnActive]}
                  onPress={() => handleToggleUserStatus(u)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.compactStatusText}>{isActive ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={36} color={COLORS.disabled} />
              <Text style={styles.emptyTitle}>No matching accounts found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add System User</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="e.g. Dr. Rajesh Sharma" />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput style={styles.textInput} value={email} onChangeText={setEmail} placeholder="e.g. rajesh.s@vscms.edu" keyboardType="email-address" />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput style={styles.textInput} value={password} onChangeText={setPassword} secureTextEntry />

              <Text style={styles.inputLabel}>User Role</Text>
              <View style={styles.rolePicker}>
                {['student', 'faculty', 'admin'].map((r) => (
                  <TouchableOpacity key={r} style={[styles.roleOption, role === r && styles.roleOptionActive]} onPress={() => setRole(r)}>
                    <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextActive]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput style={styles.textInput} value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science" />

              <Text style={styles.inputLabel}>Roll No / Employee ID</Text>
              <TextInput style={styles.textInput} value={rollNo} onChangeText={setRollNo} placeholder="e.g. CSE-2024-089 or FAC-102" />
            </ScrollView>

            <Button title="Create Account" onPress={handleAddUser} loading={submitting} size="lg" style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xl },

  banner: { padding: SPACING.lg, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  bannerTag: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  bannerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#fff', marginTop: 2 },
  addBtnHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.md, gap: 4 },
  addBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', height: 38, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: FONT_SIZES.xs },

  roleTabsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, marginVertical: SPACING.md, gap: SPACING.xs },
  roleTabPill: { flex: 1, paddingVertical: 6, borderRadius: RADIUS.round, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  roleTabPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleTabPillText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary },
  roleTabPillTextActive: { color: '#fff' },

  directoryCard: { backgroundColor: '#fff', marginHorizontal: SPACING.md, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, ...SHADOWS.sm },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs, marginBottom: 4 },
  listHeaderTitle: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  listHeaderCount: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },

  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm },
  userRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },

  avatarCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FONT_SIZES.sm, fontWeight: '800' },

  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userNameText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleTagText: { fontSize: 9, fontWeight: '800' },

  userEmailText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  userMetaText: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },

  compactStatusBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.xs },
  btnInactive: { backgroundColor: '#fef2f2' },
  btnActive: { backgroundColor: '#ecfdf5' },
  compactStatusText: { fontSize: 10, fontWeight: '800', color: COLORS.text },

  emptyWrap: { padding: SPACING.xl, alignItems: 'center' },
  emptyTitle: { marginTop: SPACING.xs, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
  rolePicker: { flexDirection: 'row', gap: SPACING.xs, marginVertical: 4 },
  roleOption: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.xs, backgroundColor: COLORS.surfaceVariant, alignItems: 'center' },
  roleOptionActive: { backgroundColor: COLORS.primary },
  roleOptionText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary },
  roleOptionTextActive: { color: '#fff' },
});
