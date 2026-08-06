import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

const StatCard = ({ icon, label, value, color, bgColor }: any) => (
  <View style={[styles.statCard, Shadow.md]}>
    <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalJobs: 0, totalScreenings: 0, todayInterviews: 0, upcomingInterviews: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header Background */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primaryLight]}
        style={styles.headerBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        {/* Welcome */}
        <View style={styles.welcome}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.userName}>{user?.name || user?.email || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="briefcase" label="Active Jobs" value={stats.totalJobs} color={Colors.primary} bgColor={Colors.primaryBg} />
        <StatCard icon="document-text" label="Screenings" value={stats.totalScreenings} color={Colors.info} bgColor={Colors.infoBg} />
        <StatCard icon="today" label="Today's Interviews" value={stats.todayInterviews} color={Colors.success} bgColor={Colors.successBg} />
        <StatCard icon="calendar" label="Upcoming" value={stats.upcomingInterviews} color={Colors.warning} bgColor={Colors.warningBg} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => router.push('/upload')}>
          <Ionicons name="cloud-upload" size={24} color={Colors.white} />
          <Text style={styles.actionBtnText}>Upload CV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.info }]} onPress={() => router.push('/(tabs)/jobs')}>
          <Ionicons name="search" size={24} color={Colors.white} />
          <Text style={styles.actionBtnText}>Browse Jobs</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: { padding: Spacing.xl, paddingTop: 60, paddingBottom: 100 },
  welcome: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 40,
  },
  greeting: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.medium },
  userName: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.white, marginTop: 4 },
  notifBtn: {
    width: 48, height: 48, borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, borderWidth: 0,
  },
  statIcon: {
    width: 48, height: 48, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  statValue: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: 4 },
  statLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md,
  },
  quickActions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  actionBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
