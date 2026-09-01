import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import { transformCompetitions } from '../../services/dataAdapter';
import { getUserRole } from '../../core/storage/authStorage';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export default function CompetitionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [role, setRole] = useState('student');

  // Register Modal State
  const [regModalVisible, setRegModalVisible] = useState(false);
  const [selectedComp, setSelectedComp] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Host Competition Modal State
  const [hostModalVisible, setHostModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Coding Hackathon');
  const [prizePool, setPrizePool] = useState('₹50,000 Cash Prize');
  const [deadline, setDeadline] = useState('2026-09-25');
  const [description, setDescription] = useState('');
  const [submittingHost, setSubmittingHost] = useState(false);

  const fetchCompetitions = async () => {
    try {
      setError(null);
      const userRole = await getUserRole();
      setRole(userRole || 'student');

      const res = await api.get('/competitions');
      const transformed = transformCompetitions(res.data);
      setCompetitions(transformed);
    } catch (err) {
      setError('Failed to load campus competitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompetitions(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompetitions();
    setRefreshing(false);
  };

  const handleOpenRegister = (comp) => {
    setSelectedComp(comp);
    setRegModalVisible(true);
  };

  const handleRegisterTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter your team name');
      return;
    }
    setSubmittingReg(true);
    try {
      await api.post('/competitions', {
        action: 'register',
        competitionId: selectedComp?.id,
        teamName: teamName.trim(),
        projectIdea: projectIdea.trim(),
      });
      Alert.alert('Registration Complete! 🚀', `Team "${teamName}" registered for ${selectedComp?.title}!`);
      setRegModalVisible(false);
      setTeamName('');
      setProjectIdea('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to register team');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleHostCompetition = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter competition name');
      return;
    }
    setSubmittingHost(true);
    try {
      await api.post('/competitions', {
        name: name.trim(),
        category,
        prizePool,
        registrationDeadline: deadline,
        description: description.trim(),
      });
      Alert.alert('Competition Hosted! 🏆', `${name} is now live for student registrations.`);
      setHostModalVisible(false);
      setName('');
      setDescription('');
      fetchCompetitions();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to host competition');
    } finally {
      setSubmittingHost(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading hackathons & events..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCompetitions} />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <LinearGradient
          colors={['#7c3aed', '#4c1d95']}
          style={[styles.banner, { paddingTop: Math.max(insets.top, 24) + SPACING.md }]}
        >
          <View style={styles.bannerHeader}>
            <View style={{ flex: 1 }}>
              <Ionicons name="trophy" size={28} color="#fff" style={{ marginBottom: 4 }} />
              <Text style={styles.bannerTitle}>Campus Hackathons</Text>
              <Text style={styles.bannerSub}>Compete, innovate & win awards</Text>
            </View>

            {(role === 'admin' || role === 'faculty') && (
              <TouchableOpacity style={styles.hostBtn} onPress={() => setHostModalVisible(true)}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.hostBtnText}>Host Event</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Active Events ({competitions.length})</Text>

        {competitions.map((item) => (
          <Card key={item.id} style={styles.eventCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <Badge label="Open" variant="success" />
            </View>

            <Text style={styles.descText} numberOfLines={2}>{item.description || 'Inter-college programming & innovation competition.'}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="gift-outline" size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.prize}</Text>
              </View>
              {item.deadline && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>Reg: {item.deadline}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={() => handleOpenRegister(item)}>
              <Text style={styles.registerBtnText}>Register Team Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </Card>
        ))}

        {competitions.length === 0 && (
          <Card style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={40} color={COLORS.disabled} />
            <Text style={styles.emptyText}>No active competitions scheduled right now</Text>
          </Card>
        )}
      </ScrollView>

      {/* Team Registration Modal */}
      <Modal visible={regModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Team Registration</Text>
              <TouchableOpacity onPress={() => setRegModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalCompTitle}>{selectedComp?.title}</Text>

            <Text style={styles.inputLabel}>Team Name</Text>
            <TextInput
              style={styles.textInput}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g. Code Ninjas"
            />

            <Text style={styles.inputLabel}>Project Idea (Optional)</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 80 }]}
              value={projectIdea}
              onChangeText={setProjectIdea}
              placeholder="Briefly describe your solution concept..."
              multiline
              textAlignVertical="top"
            />

            <Button
              title="Submit Team Registration"
              onPress={handleRegisterTeam}
              loading={submittingReg}
              size="lg"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Host Event Modal */}
      <Modal visible={hostModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Host Campus Event</Text>
              <TouchableOpacity onPress={() => setHostModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Competition Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. HackVSCMS 2026"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Coding / AI / Robotics"
              />

              <Text style={styles.inputLabel}>Prize Pool</Text>
              <TextInput
                style={styles.textInput}
                value={prizePool}
                onChangeText={setPrizePool}
                placeholder="e.g. ₹50,000 + Trophies"
              />

              <Text style={styles.inputLabel}>Registration Deadline</Text>
              <TextInput
                style={styles.textInput}
                value={deadline}
                onChangeText={setDeadline}
                placeholder="2026-09-25"
              />

              <Text style={styles.inputLabel}>Event Description</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Details & rules of the event..."
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <Button
              title="Publish Event"
              onPress={handleHostCompetition}
              loading={submittingHost}
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
  banner: { padding: SPACING.lg, borderRadius: RADIUS.md, marginBottom: SPACING.lg },
  bannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  hostBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.md, gap: 4 },
  hostBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  eventCard: { marginBottom: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs },
  eventTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  category: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  descText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginVertical: SPACING.xs, lineHeight: 18 },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: SPACING.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },

  registerBtn: { marginTop: SPACING.sm, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, gap: 6 },
  registerBtnText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '700' },

  emptyCard: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { marginTop: SPACING.sm, color: COLORS.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.text },
  modalCompTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  inputLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 2 },
  textInput: { backgroundColor: COLORS.surfaceVariant, padding: SPACING.md, borderRadius: RADIUS.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
});
