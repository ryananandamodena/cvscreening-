import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, Gradients } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const QuickAction = ({ icon, label, onPress, gradient }: any) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
    <LinearGradient colors={gradient || Gradients.softBlue} style={styles.quickIcon}>
      <Ionicons name={icon} size={24} color={Colors.primary} />
    </LinearGradient>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ totalJobs: 0, totalScreenings: 0, todayInterviews: 0, upcomingInterviews: 0 });
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const [dashboardStats, attendance] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getTodayAttendance().catch(() => null),
      ]);
      setStats(dashboardStats);
      setTodayAttendance(attendance);
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    }
  };

  useFocusEffect(useCallback(() => { fetchStats(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={Gradients.primary} style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerProfileRow}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name || user?.email || 'Employee'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => Alert.alert('Notifications', 'No new notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance Card */}
        <View style={[styles.attendanceCard, Shadow.md]}>
          <LinearGradient colors={Gradients.meshLight} style={styles.attendanceGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
            <View style={styles.attendanceHeader}>
              <Text style={styles.attendanceTitle}>Today's Attendance</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/my-work' as any)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.attendanceRow}>
              <View style={styles.attendanceItem}>
                <View style={[styles.attendanceIconWrap, { backgroundColor: Colors.successBg }]}>
                  <Ionicons name="enter-outline" size={20} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.attendanceLabel}>Clock In</Text>
                  <Text style={styles.attendanceTime}>{formatTime(todayAttendance?.clockIn)}</Text>
                </View>
              </View>
              <View style={styles.attendanceDivider} />
              <View style={styles.attendanceItem}>
                <View style={[styles.attendanceIconWrap, { backgroundColor: Colors.warningBg }]}>
                  <Ionicons name="exit-outline" size={20} color={Colors.warning} />
                </View>
                <View>
                  <Text style={styles.attendanceLabel}>Clock Out</Text>
                  <Text style={styles.attendanceTime}>{formatTime(todayAttendance?.clockOut)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, Shadow.sm]}>
            <View style={[styles.statIconWrapper, { backgroundColor: Colors.infoBg }]}>
              <Ionicons name="briefcase" size={20} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>{stats.totalJobs}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={[styles.statCard, Shadow.sm]}>
            <View style={[styles.statIconWrapper, { backgroundColor: Colors.warningBg }]}>
              <Ionicons name="document-text" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.statValue}>{stats.totalScreenings}</Text>
            <Text style={styles.statLabel}>Screenings</Text>
          </View>
          <View style={[styles.statCard, Shadow.sm]}>
            <View style={[styles.statIconWrapper, { backgroundColor: Colors.successBg }]}>
              <Ionicons name="videocam" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.todayInterviews}</Text>
            <Text style={styles.statLabel}>Interviews Today</Text>
          </View>
          <View style={[styles.statCard, Shadow.sm]}>
            <View style={[styles.statIconWrapper, { backgroundColor: Colors.primaryBg }]}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.upcomingInterviews}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickGrid}>
          {/* Employee Self-Service */}
          <QuickAction icon="calendar" label="Time Off" onPress={() => router.push('/(tabs)/leave-request' as any)} gradient={Gradients.softOrange} />
          <QuickAction icon="time" label="Overtime" onPress={() => router.push('/(tabs)/overtime-request' as any)} gradient={Gradients.softPink} />
          <QuickAction icon="receipt" label="Claim" onPress={() => router.push('/(tabs)/claim-form' as any)} gradient={Gradients.softGreen} />
          <QuickAction icon="card" label="PaySlip" onPress={() => router.push('/(tabs)/payslip' as any)} gradient={Gradients.softBlue} />
          
          {/* Recruitment & Directory */}
          <QuickAction icon="cloud-upload" label="Upload CV" onPress={() => router.push('/upload')} gradient={Gradients.softTeal} />
          <QuickAction icon="people" label="Directory" onPress={() => router.push('/(tabs)/employees' as any)} gradient={Gradients.softPurple} />
          <QuickAction icon="briefcase" label="Jobs" onPress={() => router.push('/(tabs)/jobs' as any)} gradient={Gradients.softOrange} />
          <QuickAction icon="videocam" label="Interviews" onPress={() => router.push('/(tabs)/interviews' as any)} gradient={Gradients.softBlue} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xl, borderBottomRightRadius: BorderRadius.xl,
  },
  headerProfileRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    gap: Spacing.md
  },
  avatarPlaceholder: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  greeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, marginTop: 2 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: Spacing.xl },
  attendanceCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl, marginTop: -Spacing.md,
    overflow: 'hidden',
  },
  attendanceGradient: { padding: Spacing.lg },
  attendanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  attendanceTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  attendanceRow: { flexDirection: 'row', alignItems: 'center' },
  attendanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  attendanceIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  attendanceDivider: { width: 1, height: 30, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  attendanceLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  attendanceTime: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xxl },
  statCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  statIconWrapper: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  statValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: -0.5 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  quickAction: { alignItems: 'center', width: 72 },
  quickIcon: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickLabel: { fontSize: FontSize.xs, color: Colors.text, textAlign: 'center', fontWeight: FontWeight.medium },
});
