import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function InterviewsScreen() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchInterviews = async () => {
    try {
      const res = await apiService.getInterviewSchedules();
      const list = Array.isArray(res) ? res : res?.data || [];
      setInterviews(list);
      setError(false);
    } catch (err) {
      // Developer-facing log stays; the user gets a visible retry state below instead of a
      // silently empty list that looks the same as "no interviews scheduled".
      console.log('Interviews error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchInterviews(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInterviews();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return { icon: 'time-outline' as const, color: Colors.info };
      case 'confirmed': return { icon: 'checkmark-circle-outline' as const, color: Colors.success };
      case 'completed': return { icon: 'checkmark-done-circle-outline' as const, color: Colors.textSecondary };
      case 'cancelled': return { icon: 'close-circle-outline' as const, color: Colors.danger };
      default: return { icon: 'ellipse-outline' as const, color: Colors.textTertiary };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const si = getStatusIcon(item.status);
    const date = new Date(item.scheduled_at || item.scheduledAt);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <View style={[styles.card, Shadow.sm, isToday && styles.todayCard]}>
        <View style={styles.cardRow}>
          <View style={[styles.iconCircle, { backgroundColor: si.color + '15' }]}>
            <Ionicons name={si.icon} size={22} color={si.color} />
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.candidateName}>{item.candidate_name || item.candidateName || 'Candidate'}</Text>
            <Text style={styles.jobName}>{item.job_title || item.jobTitle || 'Position'}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
              <Text style={styles.timeText}>
                {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} at {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isToday && <View style={styles.todayBadge}><Text style={styles.todayText}>TODAY</Text></View>}
            </View>
          </View>
        </View>
        <View style={styles.typeRow}>
          <Ionicons name={item.interview_type === 'video' ? 'videocam' : 'person'} size={14} color={Colors.textSecondary} />
          <Text style={styles.typeText}>{item.interview_type || item.interviewType || 'Interview'}</Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (error && interviews.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Failed to load interviews.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchInterviews}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={interviews}
        keyExtractor={(item) => String(item.id || item.ID)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="videocam-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No interviews scheduled</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.xl, paddingBottom: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  todayCard: { borderColor: Colors.primary, borderWidth: 1.5 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  candidateName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  jobName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  todayBadge: { backgroundColor: Colors.primaryBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 6 },
  todayText: { fontSize: 9, fontWeight: FontWeight.extrabold, color: Colors.primary },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  typeText: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  retryText: { color: Colors.white, fontWeight: FontWeight.bold },
});
