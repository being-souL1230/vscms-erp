import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES } from '../core/constants/theme';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';

// Shared
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NoticesScreen from '../screens/notices/NoticesScreen';
import NoticeDetailScreen from '../screens/notices/NoticeDetailScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import DepartmentsScreen from '../screens/departments/DepartmentsScreen';
import FacultyScreen from '../screens/faculty/FacultyScreen';
import CompetitionsScreen from '../screens/competitions/CompetitionsScreen';
import CMSBotScreen from '../screens/chat/CMSBotScreen';
import CampusScreen from '../screens/campus/CampusScreen';

// Student
import AcademicsScreen from '../screens/attendance/AcademicsScreen';
import AttendanceDetailScreen from '../screens/attendance/AttendanceDetailScreen';
import GradesScreen from '../screens/grades/GradesScreen';
import TimetableScreen from '../screens/timetable/TimetableScreen';
import AssignmentsScreen from '../screens/assignments/AssignmentsScreen';
import AssignmentDetailScreen from '../screens/assignments/AssignmentDetailScreen';
import MaterialsScreen from '../screens/materials/MaterialsScreen';
import FeesScreen from '../screens/fees/FeesScreen';
import IDCardScreen from '../screens/idcard/IDCardScreen';
import ExamsScreen from '../screens/exams/ExamsScreen';
import LeavesScreen from '../screens/leaves/LeavesScreen';

// Faculty & Admin Custom Screens
import FacultyClassroomScreen from '../screens/faculty/FacultyClassroomScreen';
import MarkAttendanceScreen from '../screens/faculty/MarkAttendanceScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import AdminLeaveApprovalsScreen from '../screens/admin/AdminLeaveApprovalsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOpts = {
  headerShown: false,
};

/**
 * Shared feature screens helper to include in all navigation stacks
 */
function renderSharedScreens() {
  return (
    <React.Fragment>
      <Stack.Screen name="AcademicsHub" component={AcademicsScreen} options={{ title: 'Academics & Attendance' }} />
      <Stack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ title: 'Attendance' }} />
      <Stack.Screen name="Grades" component={GradesScreen} options={{ title: 'Grades' }} />
      <Stack.Screen name="Timetable" component={TimetableScreen} options={{ title: 'Timetable' }} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} options={{ title: 'Assignments' }} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} options={{ title: 'Assignment Detail' }} />
      <Stack.Screen name="Materials" component={MaterialsScreen} options={{ title: 'Course Materials' }} />
      <Stack.Screen name="Fees" component={FeesScreen} options={{ title: 'Fees & Payments' }} />
      <Stack.Screen name="IDCard" component={IDCardScreen} options={{ title: 'Student Digital ID' }} />
      <Stack.Screen name="Exams" component={ExamsScreen} options={{ title: 'Exams & Schedule' }} />
      <Stack.Screen name="Leaves" component={LeavesScreen} options={{ title: 'Leaves' }} />
      <Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} options={{ title: 'Notice Details' }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Campus Events' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
      <Stack.Screen name="Departments" component={DepartmentsScreen} options={{ title: 'Departments' }} />
      <Stack.Screen name="Faculty" component={FacultyScreen} options={{ title: 'Faculty Directory' }} />
      <Stack.Screen name="Competitions" component={CompetitionsScreen} options={{ title: 'Competitions & Hackathons' }} />
      <Stack.Screen name="CMSBot" component={CMSBotScreen} options={{ title: 'CMSBot AI Assistant' }} />
      <Stack.Screen name="CampusHub" component={CampusScreen} options={{ title: 'Campus Hub' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />

      {/* Faculty / Admin Custom Screens */}
      <Stack.Screen name="ClassroomHub" component={FacultyClassroomScreen} options={{ title: 'Classroom Management' }} />
      <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} options={{ title: 'Mark Attendance' }} />
      <Stack.Screen name="UserManagement" component={AdminUserManagementScreen} options={{ title: 'User Management Hub' }} />
      <Stack.Screen name="LeaveApprovals" component={AdminLeaveApprovalsScreen} options={{ title: 'Leave Approvals' }} />
    </React.Fragment>
  );
}

/* ===================== STUDENT STACKS ===================== */

function StudentHomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function StudentAcademicsStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="AcademicsMain" component={AcademicsScreen} options={{ title: 'Academics' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function StudentExploreStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ExploreMain" component={CampusScreen} options={{ title: 'Campus Hub' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function StudentFinanceStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="FeesMain" component={FeesScreen} options={{ title: 'Fees & Payments' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function StudentMoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'More' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const icons = { Home: 'home', Academics: 'people', Explore: 'compass', Notifications: 'notifications', Profile: 'person' };
          const iconName = focused ? icons[route.name] || 'home' : `${icons[route.name] || 'home'}-outline`;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#1d61e7',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeStack} />
      <Tab.Screen name="Academics" component={StudentAcademicsStack} options={{ title: 'User Management' }} />
      <Tab.Screen name="Explore" component={StudentExploreStack} options={{ title: 'Explore' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarBadge: 3, tabBarBadgeStyle: { backgroundColor: '#1d61e7', fontSize: 10, fontWeight: '700' } }} />
      <Tab.Screen name="Profile" component={StudentMoreStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

/* ===================== FACULTY STACKS ===================== */

function FacultyHomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function FacultyClassroomStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ClassroomMain" component={FacultyClassroomScreen} options={{ title: 'Classroom Management' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function FacultyCampusStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="CampusMain" component={CampusScreen} options={{ title: 'Campus Hub' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function FacultyMoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'More' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function FacultyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const icons = { Home: 'home', Classroom: 'people', Campus: 'business', Notifications: 'notifications', Profile: 'person' };
          const iconName = focused ? icons[route.name] || 'home' : `${icons[route.name] || 'home'}-outline`;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#1d61e7',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      })}
    >
      <Tab.Screen name="Home" component={FacultyHomeStack} />
      <Tab.Screen name="Classroom" component={FacultyClassroomStack} options={{ title: 'User Management' }} />
      <Tab.Screen name="Campus" component={FacultyCampusStack} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarBadge: 3, tabBarBadgeStyle: { backgroundColor: '#1d61e7', fontSize: 10, fontWeight: '700' } }} />
      <Tab.Screen name="Profile" component={FacultyMoreStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

/* ===================== ADMIN STACKS ===================== */

function AdminHomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function AdminManageStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ManageMain" component={AdminUserManagementScreen} options={{ title: 'User Management' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function AdminCampusStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="CampusMain" component={CampusScreen} options={{ title: 'Campus Hub' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function AdminFinanceStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="FeesMain" component={FeesScreen} options={{ title: 'Fees & Collections' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function AdminMoreStack() {
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'More' }} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const icons = { Home: 'home', Manage: 'people', Notifications: 'notifications', Profile: 'person' };
          const iconName = focused ? icons[route.name] || 'home' : `${icons[route.name] || 'home'}-outline`;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: '#1d61e7',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 10,
          shadowColor: '#0F172A',
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      })}
    >
      <Tab.Screen name="Home" component={AdminHomeStack} />
      <Tab.Screen name="Manage" component={AdminManageStack} options={{ title: 'User Management' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarBadge: 3, tabBarBadgeStyle: { backgroundColor: '#1d61e7', fontSize: 10, fontWeight: '700' } }} />
      <Tab.Screen name="Profile" component={AdminMoreStack} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

/* ===================== ROOT NAVIGATOR ===================== */

export default function AppNavigator({ isLoggedIn, userRole, onLogout }) {
  const getMainTabs = () => {
    switch (userRole) {
      case 'admin': return <AdminTabs />;
      case 'faculty': return <FacultyTabs />;
      default: return <StudentTabs />;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main">
            {() => getMainTabs()}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
