import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(date: Date) {
  const current = new Date(date);
  const day = current.getDay();
  const start = new Date(current);
  start.setDate(current.getDate() - day);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export default function MyWorkScreen() {
  const insets = useSafeAreaInsets();
  // `user` (from /login) has no employeeId/position — those live on `employee`
  // (GET /employees/me). Previously read from user?.employee_id/user?.position, which are
  // always undefined, so this always rendered the placeholder fallback for every employee.
  const { user, employee } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [todayData, setTodayData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const weekDates = getWeekDates(selectedDate);
  const today = new Date();

  const fetchAttendance = async () => {
    try {
      const data = await apiService.getTodayAttendance();
      setTodayData(data);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchAttendance(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  const navigateWeek = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir * 7));
    setSelectedDate(d);
  };

  const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullDate = selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isSelected = (d: Date) => d.toDateString() === selectedDate.toDateString();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{user?.name || 'Employee'}</Text>
          <Text style={styles.userDetail}>{employee?.employeeId || '0000.0000'}</Text>
          <Text style={styles.userDetail}>{employee?.positionName || 'Staff'}</Text>
        </View>
      </View>

      {/* Weekly/Monthly Toggle */}
      <View style={styles.toggleRow}>
        {(['Weekly', 'Monthly'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.toggleBtn, viewMode === mode && styles.toggleBtnActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Month Navigation */}
        <View style={styles.monthRow}>
          <View style={styles.monthLeft}>
            <Text style={styles.monthText}>{monthYear}</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text} />
          </View>
          <View style={styles.monthRight}>
            <TouchableOpacity style={styles.todayBtn} onPress={() => setSelectedDate(new Date())}>
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateWeek(-1)}>
              <Ionicons name="chevron-back" size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateWeek(1)}>
              <Ionicons name="chevron-forward" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekRow}>
          {weekDates.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={styles.dayCol}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[styles.dayLabel, d.getDay() === 0 && styles.dayLabelSun]}>{DAYS[i]}</Text>
              <View style={[
                styles.dayCircle,
                isToday(d) && styles.dayCircleToday,
                isSelected(d) && !isToday(d) && styles.dayCircleSelected,
              ]}>
                <Text style={[
                  styles.dayNum,
                  isToday(d) && styles.dayNumToday,
                  d.getDay() === 0 && styles.dayNumSun,
                  d.getDay() === 6 && styles.dayNumSat,
                ]}>{d.getDate()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Header */}
        <Text style={styles.dateHeader}>{fullDate}</Text>

        {/* Attendance Warning */}
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.warningText}>Your Attendance is not completed</Text>
        </View>

        {/* Shift Card */}
        <View style={[styles.shiftCard, Shadow.sm]}>
          <View style={styles.shiftRow}>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Shift code</Text>
              <Text style={styles.shiftValue}>FH01</Text>
            </View>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Day Type</Text>
              <Text style={styles.shiftValue}>WD</Text>
            </View>
          </View>

          <View style={styles.shiftRow}>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Shift time</Text>
              <Text style={styles.shiftValue}>08:08 – 17:08</Text>
            </View>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Shift break</Text>
              <Text style={styles.shiftValue}>12:08 – 13:08</Text>
            </View>
          </View>

          <View style={styles.shiftRow}>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Actual time</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.shiftValue}>{formatTime(todayData?.clockIn)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="close-circle" size={14} color={Colors.danger} />
                  <Text style={styles.shiftValue}>{formatTime(todayData?.clockOut)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.shiftCol}>
              <Text style={styles.shiftLabel}>Actual break</Text>
              <Text style={styles.shiftValue}>--:-- – --:--</Text>
            </View>
          </View>

          <View style={{ marginTop: Spacing.md }}>
            <Text style={styles.shiftLabel}>Status</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: 4 }}>
              <View style={styles.statusBadge}><Text style={styles.statusText}>No Swipe Out</Text></View>
              <View style={[styles.statusBadge, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.statusText, { color: Colors.success }]}>Present</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating + Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  userInfo: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  userName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  userDetail: { fontSize: FontSize.sm, color: Colors.textSecondary },
  toggleRow: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.lg,
    backgroundColor: Colors.background, borderRadius: BorderRadius.xl, padding: 3,
  },
  toggleBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.white, ...Shadow.sm },
  toggleText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  toggleTextActive: { color: Colors.text, fontWeight: FontWeight.bold },
  scrollContent: { paddingHorizontal: Spacing.xl },
  monthRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg,
  },
  monthLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  monthText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  monthRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  todayBtn: {
    borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: 4,
  },
  todayBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xxl },
  dayCol: { alignItems: 'center', width: 40 },
  dayLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  dayLabelSun: { color: Colors.textTertiary },
  dayCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dayCircleToday: { backgroundColor: Colors.primary },
  dayCircleSelected: { backgroundColor: Colors.primaryBg },
  dayNum: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  dayNumToday: { color: Colors.white, fontWeight: FontWeight.bold },
  dayNumSun: { color: Colors.textTertiary },
  dayNumSat: { color: Colors.textTertiary },
  dateHeader: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.md },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.sectionBg, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  warningText: { fontSize: FontSize.md, color: Colors.text },
  shiftCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  shiftRow: {
    flexDirection: 'row', marginBottom: Spacing.lg,
  },
  shiftCol: { flex: 1 },
  shiftLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 2 },
  shiftValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  statusBadge: {
    backgroundColor: Colors.warningBg, paddingHorizontal: Spacing.sm, paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.warning },
  fab: {
    position: 'absolute', right: Spacing.xl, bottom: 90,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    ...Shadow.lg,
  },
});
