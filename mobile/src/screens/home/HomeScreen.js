import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import api from '../../core/network/api';
import { getUser, getUserRole } from '../../core/storage/authStorage';
import { transformUser, computeDashboardStats, transformNotices } from '../../services/dataAdapter';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';

const { width } = Dimensions.get('window');
const BLUE_PRIMARY = '#1d61e7';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('admin');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const userData = await getUser();
      const userRole = await getUserRole();
      setUser(transformUser(userData));
      setRole(userRole || 'admin');

      const results = await Promise.allSettled([
        api.get('/attendance'),
        api.get('/assignments'),
        api.get('/notices'),
        api.get('/grades'),
        api.get('/fees'),
        api.get('/courses'),
        api.get('/students'),
        api.get('/faculty'),
      ]);

      const attData = results[0].status === 'fulfilled' ? results[0].value.data : [];
      const asgData = results[1].status === 'fulfilled' ? results[1].value.data : null;
      const notData = results[2].status === 'fulfilled' ? results[2].value.data : null;
      const grdData = results[3].status === 'fulfilled' ? results[3].value.data : [];
      const feeData = results[4].status === 'fulfilled' ? results[4].value.data : [];
      const crsData = results[5].status === 'fulfilled' ? results[5].value.data : [];
      const stuData = results[6].status === 'fulfilled' ? results[6].value.data : [];
      const facData = results[7].status === 'fulfilled' ? results[7].value.data : [];

      const dash = computeDashboardStats(attData, asgData, notData, userData);
      dash.gradesCount = Array.isArray(grdData) ? grdData.length : 0;
      dash.fees = Array.isArray(feeData) ? feeData : [];
      dash.pendingFees = dash.fees.filter((f) => String(f.status).toLowerCase() !== 'paid').length;
      dash.courses = Array.isArray(crsData) ? crsData : [];
      dash.students = Array.isArray(stuData) ? stuData : [];
      dash.faculty = Array.isArray(facData) ? facData : [];
      dash.studentsCount = Array.isArray(stuData) ? stuData.length : 0;
      dash.formattedNotices = transformNotices(notData);

      setData(dash);
    } catch (err) {
      setError('Failed to load dashboard data from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  if (loading) return <LoadingScreen message="Loading portal data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Display user role or name dynamically from backend
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : role.charAt(0).toUpperCase() + role.slice(1);

  // Dynamic values computed strictly from backend API responses
  const totalStudentsVal = data?.studentsCount !== undefined ? data.studentsCount : 0;
  const attendanceVal = data?.attendance?.percentage !== undefined ? `${data.attendance.percentage}%` : '0%';
  const pendingTasksCount = (data?.pendingFees || 0) + (data?.assignments?.length || 0);
  const pendingTasksVal = String(pendingTasksCount).padStart(2, '0');

  // Quick Action Buttons linked to corresponding Backend Feature Screens
  const getActionTarget = (id) => {
    switch (id) {
      case 'students':
        return role === 'admin' ? 'UserManagement' : 'Faculty';
      case 'attendance':
        return role === 'faculty' ? 'MarkAttendance' : 'AcademicsHub';
      case 'exams':
        return 'Exams';
      case 'fees':
        return 'Fees';
      case 'competitions':
        return 'Competitions';
      case 'reports':
        return 'Grades';
      default:
        return 'AcademicsHub';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 12) + 4 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLUE_PRIMARY} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.logoRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CampusHub')}
          >
            <View style={styles.logoSeal}>
              <View style={styles.logoInnerCircle}>
                <Text style={styles.logoSealText}>VSCMS</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>
              <Text style={{ color: BLUE_PRIMARY, fontWeight: '800' }}>VSCMS </Text>
              <Text style={{ color: '#0F172A', fontWeight: '600' }}>ERP</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={BLUE_PRIMARY} />
            <View style={styles.bellBadgeDot} />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, <Text style={styles.roleHighlight}>{displayRole}</Text>
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Manage academics, operations and student services from your secure portal.
          </Text>
        </View>

        {/* Main Blue Portal Banner Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CampusHub')}
        >
          <LinearGradient
            colors={['#1E65E6', '#1455DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.portalCard}
          >
            <View style={styles.portalCardLeftIconBox}>
              <Ionicons name="school-outline" size={24} color="#FFFFFF" />
            </View>

            <View style={styles.portalCardCenterContent}>
              <Text style={styles.portalCardTitle}>Academic Operations Portal</Text>
              <View style={styles.portalLiveRow}>
                <View style={styles.greenDot} />
                <Text style={styles.portalLiveText}>2026 • Live</Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* 6 Quick Action Grid - 2 Rows of 3 Cards with flex:1 for Exact Equal Spacing */}
        <View style={styles.gridSection}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(getActionTarget('students'))}
            >
              <Ionicons name="people" size={26} color={BLUE_PRIMARY} />
              <Text style={styles.quickActionLabel}>Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(getActionTarget('attendance'))}
            >
              <Ionicons name="calendar" size={26} color={BLUE_PRIMARY} />
              <Text style={styles.quickActionLabel}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(getActionTarget('exams'))}
            >
              <Ionicons name="clipboard" size={26} color={BLUE_PRIMARY} />
              <Text style={styles.quickActionLabel}>Exams</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(getActionTarget('fees'))}
            >
              <Ionicons name="wallet" size={26} color={BLUE_PRIMARY} />
              <Text style={styles.quickActionLabel}>Fees</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(getActionTarget('competitions'))}
            >
              <Ionicons name="trophy" size={26} color={BLUE_PRIMARY} />
              <Text style={styles.quickActionLabel}>Competitions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(getActionTarget('reports'))}
            >
              <Ionicons name="bar-chart" size={26} color={BLUE_PRIMARY} />
              <Text style={styles.quickActionLabel}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today at a glance Section - Dynamic Real Backend Data */}
        <View style={styles.glanceSection}>
          <View style={styles.glanceHeaderRow}>
            <Text style={styles.glanceTitle}>Today at a glance</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AcademicsHub')}
              style={styles.viewAllBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={13} color={BLUE_PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* 3 Compact Stat Cards with flex:1 */}
          <View style={styles.statCardsRow}>
            {/* Stat Card 1: Students */}
            <TouchableOpacity
              style={styles.glanceCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(role === 'admin' ? 'UserManagement' : 'Faculty')}
            >
              <View style={styles.glanceIconBadge}>
                <Ionicons name="people" size={15} color={BLUE_PRIMARY} />
              </View>
              <Text style={styles.glanceCardLabel}>Students</Text>
              <Text style={styles.glanceCardValue}>{totalStudentsVal.toLocaleString()}</Text>
              <WavySparkline />
            </TouchableOpacity>

            {/* Stat Card 2: Attendance / Present */}
            <TouchableOpacity
              style={styles.glanceCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AcademicsHub')}
            >
              <View style={styles.glanceIconBadge}>
                <Ionicons name="checkmark-circle-outline" size={15} color={BLUE_PRIMARY} />
              </View>
              <Text style={styles.glanceCardLabel}>Present</Text>
              <Text style={styles.glanceCardValue}>{attendanceVal}</Text>
              <WavySparkline />
            </TouchableOpacity>

            {/* Stat Card 3: Pending Tasks */}
            <TouchableOpacity
              style={styles.glanceCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Assignments')}
            >
              <View style={styles.glanceIconBadge}>
                <Ionicons name="clipboard-outline" size={15} color={BLUE_PRIMARY} />
              </View>
              <Text style={styles.glanceCardLabel}>Pending Tasks</Text>
              <Text style={styles.glanceCardValue}>{pendingTasksVal}</Text>
              <WavySparkline />
            </TouchableOpacity>
          </View>
        </View>

        {/* Latest Announcements from Backend */}
        {data?.formattedNotices && data.formattedNotices.length > 0 && (
          <View style={styles.noticeSection}>
            <View style={styles.glanceHeaderRow}>
              <Text style={styles.glanceTitle}>Recent Notices</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CampusHub')}
                style={styles.viewAllBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={13} color={BLUE_PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.noticeList}>
              {data.formattedNotices.slice(0, 2).map((notice, idx) => (
                <TouchableOpacity
                  key={notice.id || idx}
                  style={[styles.noticeItem, idx < 1 && styles.noticeItemBorder]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('NoticeDetail', { noticeId: notice.id })}
                >
                  <View style={styles.noticeIconBox}>
                    <Ionicons name="megaphone" size={14} color={BLUE_PRIMARY} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeItemTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                    <Text style={styles.noticeItemMeta}>
                      {notice.category || 'Announcement'} • {notice.author_name || 'Admin'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* Wavy Blue Sparkline SVG Component */
function WavySparkline() {
  return (
    <View style={styles.sparklineContainer}>
      <Svg height="16" width="100%" viewBox="0 0 100 16">
        <Path
          d="M 0 11 Q 15 4, 30 9 T 60 6 T 90 10 T 100 6"
          fill="none"
          stroke={BLUE_PRIMARY}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  /* Header Bar */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSeal: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BLUE_PRIMARY,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1.5,
  },
  logoInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  logoSealText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: -0.3,
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BLUE_PRIMARY,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* Welcome Section */
  welcomeSection: {
    marginBottom: 14,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  roleHighlight: {
    color: BLUE_PRIMARY,
    fontWeight: '800',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
    fontWeight: '400',
  },

  /* Portal Banner Card */
  portalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 6,
    elevation: 4,
    shadowColor: BLUE_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 14,
  },
  portalCardLeftIconBox: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalCardCenterContent: {
    flex: 1,
    marginLeft: 12,
  },
  portalCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  portalLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
    marginRight: 5,
  },
  portalLiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DBEAFE',
  },

  /* 6 Quick Action Grid - Sharp Square Edges */
  gridSection: {
    gap: 10,
    marginBottom: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    height: 92,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 6,
    textAlign: 'center',
  },

  /* Today at a glance */
  glanceSection: {
    marginBottom: 14,
  },
  glanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  glanceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: BLUE_PRIMARY,
  },

  /* Stat Cards Row - Sharp Square Edges */
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  glanceIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glanceCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 6,
  },
  glanceCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  sparklineContainer: {
    marginTop: 4,
  },

  /* Notice Section - Sharp Square Edges */
  noticeSection: {
    marginTop: 4,
  },
  noticeList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  noticeItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  noticeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  noticeItemMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});


