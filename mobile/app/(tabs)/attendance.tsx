import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Clock In/Out live here: app/(tabs)/clock.tsx. That screen is the only place attendance is
// recorded because it requires a live selfie + real GPS fix per anti-fraud policy — this screen
// is a read-only status/history view and must not offer a second, unverified way to clock in/out.
export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [todayData, setTodayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      setError(null);
      const data = await apiService.getTodayAttendance();
      setTodayData(data);
    } catch (err: any) {
      // A failed fetch must not silently render as "no data yet" (blank --:-- times) — that's
      // indistinguishable from a genuine first-clock-in-of-the-day empty state.
      console.log('Attendance error:', err);
      setError(err?.message || 'Failed to load today’s attendance');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAttendance(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Backend already computes and returns the real status (`present`/`late`/etc, plus
  // `late_minutes`) on the attendance record — reflect that instead of a hardcoded label.
  const clockInStatus = (): { label: string; color: string; bg: string } | null => {
    if (!todayData?.clockIn) return null;
    if (todayData.status === 'late' || (todayData.lateMinutes || 0) > 0) {
      return { label: `Late${todayData.lateMinutes ? ` (${todayData.lateMinutes}m)` : ''}`, color: Colors.warning, bg: Colors.warningBg };
    }
    if (todayData.status === 'present') {
      return { label: 'On Time', color: Colors.success, bg: Colors.successBg };
    }
    if (todayData.status) {
      // Any other backend-defined status (absent/leave/remote/etc) — show it as-is rather
      // than mislabeling it "On Time".
      return { label: todayData.status.charAt(0).toUpperCase() + todayData.status.slice(1), color: Colors.textSecondary, bg: Colors.border };
    }
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchAttendance}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Status Card */}
        <View style={[styles.statusCard, Shadow.md]}>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          <View style={styles.clockCircle}>
            <Text style={styles.clockTime}>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, !todayData?.clockIn ? styles.btnIn : styles.btnOut]}
              onPress={() => router.push('/(tabs)/clock')}
            >
              <Ionicons name={!todayData?.clockIn ? 'enter-outline' : 'exit-outline'} size={24} color={Colors.white} />
              <Text style={styles.btnText}>{!todayData?.clockIn ? 'Clock In' : todayData?.clockOut ? 'View Clock' : 'Clock Out'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Clock in/out requires a live selfie and location check</Text>
        </View>

        {/* Logs */}
        <Text style={styles.sectionTitle}>Today's Log</Text>
        <View style={[styles.logCard, Shadow.sm]}>
          <View style={styles.logItem}>
            <View style={[styles.logIcon, { backgroundColor: Colors.successBg }]}>
              <Ionicons name="enter-outline" size={20} color={Colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logLabel}>Clock In</Text>
              <Text style={styles.logTime}>{formatTime(todayData?.clockIn)}</Text>
            </View>
            {clockInStatus() && (
              <View style={[styles.statusBadge, { backgroundColor: clockInStatus()!.bg }]}>
                <Text style={[styles.statusText, { color: clockInStatus()!.color }]}>{clockInStatus()!.label}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.logItem}>
            <View style={[styles.logIcon, { backgroundColor: Colors.warningBg }]}>
              <Ionicons name="exit-outline" size={20} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logLabel}>Clock Out</Text>
              <Text style={styles.logTime}>{formatTime(todayData?.clockOut)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  content: { padding: Spacing.xl, paddingBottom: 100 },
  errorCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  errorText: { flex: 1, fontSize: FontSize.sm, color: Colors.danger },
  retryText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.danger },
  statusCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.xxl,
  },
  dateText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.semibold, marginBottom: Spacing.lg },
  clockCircle: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 8, borderColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  clockTime: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.primary },
  actionButtons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.sm,
  },
  btnIn: { backgroundColor: Colors.success },
  btnOut: { backgroundColor: Colors.warning },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  hintText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md,
  },
  logCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg,
  },
  logItem: { flexDirection: 'row', alignItems: 'center' },
  logIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  logLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logTime: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.lg },
  statusBadge: { backgroundColor: Colors.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold },
});
