import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../core/constants/theme';
import api from '../../core/network/api';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import SearchBar from '../../components/SearchBar';

export default function FacultyScreen() {
  const [faculty, setFaculty] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/faculty');
        const data = Array.isArray(res.data) ? res.data : [];
        setFaculty(data);
        setFiltered(data);
      } catch (err) {
        setError('Failed to load faculty');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (q) => {
    setSearch(q);
    if (!q) { setFiltered(faculty); return; }
    setFiltered(faculty.filter(f =>
      f.name?.toLowerCase().includes(q.toLowerCase()) ||
      f.department?.toLowerCase().includes(q.toLowerCase()) ||
      (f.designation || '').toLowerCase().includes(q.toLowerCase())
    ));
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SearchBar placeholder="Search faculty..." onSearch={handleSearch} style={styles.search} />

      {filtered.length === 0 ? (
        <EmptyState icon="people-outline" title="No faculty found" message="Try a different search" />
      ) : filtered.map((f) => (
        <Card key={f.id} style={styles.facultyCard}>
          <View style={styles.facultyRow}>
            <Avatar name={f.name} imageUri={f.avatarUrl || f.avatar_url} size={56} />
            <View style={styles.facultyInfo}>
              <Text style={styles.facultyName}>{f.name}</Text>
              <Text style={styles.facultyDesignation}>{f.designation || 'Faculty'}</Text>
              <View style={styles.facultyMeta}>
                <Ionicons name="business-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.facultyDept}>{f.department}</Text>
              </View>
              <View style={styles.facultyMeta}>
                <Ionicons name="mail-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.facultyEmail}>{f.email}</Text>
              </View>
              {f.rollNo && (
                <View style={styles.facultyMeta}>
                  <Ionicons name="card-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.facultyId}>ID: {f.rollNo}</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  search: { marginBottom: SPACING.md },
  facultyCard: { marginBottom: SPACING.sm, padding: SPACING.md },
  facultyRow: { flexDirection: 'row', gap: SPACING.md },
  facultyInfo: { flex: 1 },
  facultyName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  facultyDesignation: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  facultyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  facultyDept: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  facultyEmail: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  facultyId: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
});
