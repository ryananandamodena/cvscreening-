import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import mobileApiService from '../services/api.service';
import { DashboardStats, QuickAction } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    todaysAttendance: null,
    upcomingLeaves: [],
    recentNotifications: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await mobileApiService.getCurrentUser();
      setUser(currentUser);

      // Mock data for now - replace with actual API calls
      const mockStats: DashboardStats = {
        pendingRequests: 2,
        todaysAttendance: {
          id: 1,
          employeeId: 1,
          date: new Date().toISOString().split('T')[0],
          checkIn: '09:00',
          status: 'present'
        },
        upcomingLeaves: [
          {
            id: 1,
            employeeId: 1,
            leaveType: 'annual',
            startDate: '2024-01-25',
            endDate: '2024-01-30',
            totalDays: 4,
            reason: 'Family vacation',
            status: 'approved'
          }
        ],
        recentNotifications: [
          {
            id: '1',
            title: 'Payslip Available',
            message: 'Your December payslip is now available',
            type: 'info',
            read: false,
            createdAt: new Date().toISOString()
          }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'attendance',
      title: 'Clock In/Out',
      subtitle: stats.todaysAttendance?.checkIn ? 'Clocked In' : 'Clock In Now',
      icon: 'clock',
      action: () => navigation.navigate('Attendance'),
      badge: stats.todaysAttendance?.checkIn ? undefined : 1
    },
    {
      id: 'leave',
      title: 'Request Leave',
      subtitle: 'Submit leave request',
      icon: 'calendar',
      action: () => navigation.navigate('Leave')
    },
    {
      id: 'payslip',
      title: 'View Payslip',
      subtitle: 'Latest salary slip',
      icon: 'document',
      action: () => navigation.navigate('Payslip')
    },
    {
      id: 'profile',
      title: 'My Profile',
      subtitle: 'Update information',
      icon: 'user',
      action: () => navigation.navigate('Profile')
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await mobileApiService.logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning! 👋</Text>
          <Text style={styles.userName}>{user?.fullName || 'Employee'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingRequests}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {stats.todaysAttendance?.checkIn || '--:--'}
          </Text>
          <Text style={styles.statLabel}>Today's Check-in</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {stats.upcomingLeaves.length}
          </Text>
          <Text style={styles.statLabel}>Upcoming Leaves</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.action}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>
                  {action.icon === 'clock' ? '⏰' :
                   action.icon === 'calendar' ? '📅' :
                   action.icon === 'document' ? '📄' :
                   action.icon === 'user' ? '👤' : '📱'}
                </Text>
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              {action.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Attendance */}
      {stats.todaysAttendance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Attendance</Text>
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceRow}>
              <Text style={styles.attendanceLabel}>Check-in:</Text>
              <Text style={styles.attendanceValue}>
                {stats.todaysAttendance.checkIn || 'Not checked in'}
              </Text>
            </View>
            <View style={styles.attendanceRow}>
              <Text style={styles.attendanceLabel}>Check-out:</Text>
              <Text style={styles.attendanceValue}>
                {stats.todaysAttendance.checkOut || 'Not checked out'}
              </Text>
            </View>
            <View style={styles.attendanceRow}>
              <Text style={styles.attendanceLabel}>Status:</Text>
              <Text style={[styles.attendanceValue, styles.statusText]}>
                {stats.todaysAttendance.status}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Upcoming Leaves */}
      {stats.upcomingLeaves.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Leaves</Text>
          {stats.upcomingLeaves.map((leave) => (
            <View key={leave.id} style={styles.leaveCard}>
              <View style={styles.leaveHeader}>
                <Text style={styles.leaveType}>{leave.leaveType}</Text>
                <Text style={[styles.leaveStatus, styles[leave.status]]}>
                  {leave.status}
                </Text>
              </View>
              <Text style={styles.leaveDates}>
                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
              </Text>
              <Text style={styles.leaveDays}>{leave.totalDays} days</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Notifications */}
      {stats.recentNotifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {stats.recentNotifications.slice(0, 3).map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>
                {new Date(notification.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4F46E5',
  },
  greeting: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  attendanceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusText: {
    textTransform: 'capitalize',
  },
  leaveCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  leaveStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approved: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  pending: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  rejected: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  leaveDates: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  leaveDays: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default HomeScreen;