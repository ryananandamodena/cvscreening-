import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// Succession status/readiness (models.SuccessionPlan) is intentionally NOT shown anywhere in
// this screen — those endpoints are hrOrAdmin-only on the backend (sensitive HR data: risk
// level, readiness, incumbent). There is also no structured "skill gap" data model on the
// backend (no required/current/gap/priority fields exist) — CareerPath.timeline[].requirements
// is the closest real field, shown as plain requirement text under Development Plan instead of
// a fabricated gap score.
type Tab = 'career-path' | 'leadership';

export default function CareerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();
  const [tab, setTab] = useState<Tab>('career-path');
  const [careerPaths, setCareerPaths] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [paths, progs] = await Promise.all([
        apiService.getMyCareerPaths(),
        apiService.getLeadershipPrograms(),
      ]);
      setCareerPaths(paths);
      setPrograms(progs);
      setError(false);
    } catch (err) {
      console.log('Career fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleEnroll = async (programId: number) => {
    if (!employee?.id) {
      Alert.alert('Akun belum terhubung', 'Akun Anda belum terhubung dengan data karyawan.');
      return;
    }
    setEnrollingId(programId);
    try {
      await apiService.enrollInLeadershipProgram(programId, employee.id);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal enroll', err?.message || 'Silakan coba lagi.');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (error && careerPaths.length === 0 && programs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat data career. Periksa koneksi Anda.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCareerPath = ({ item }: { item: any }) => {
    const totalMilestones = item.milestones?.length || 0;
    const completedMilestones = item.milestones?.filter((m: any) => m.completed).length || 0;
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/career-path/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.pathChain}>
          <View style={styles.pathNode}>
            <Text style={styles.pathNodeLabel}>Saat Ini</Text>
            <Text style={styles.pathNodeValue} numberOfLines={1}>{item.currentPosition || '—'}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.textTertiary} />
          <View style={styles.pathNode}>
            <Text style={styles.pathNodeLabel}>Target</Text>
            <Text style={styles.pathNodeValue} numberOfLines={1}>{item.targetPositions?.[0] || '—'}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          {item.mentorName && (
            <View style={styles.cardStat}>
              <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.cardStatText}>Mentor: {item.mentorName}</Text>
            </View>
          )}
          {totalMilestones > 0 && (
            <Text style={styles.cardStatText}>{completedMilestones}/{totalMilestones} milestone</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderProgram = ({ item }: { item: any }) => {
    const enrolled = employee?.id && item.participants?.includes(employee.id);
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/leadership/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.programName}</Text>
            <Text style={styles.cardSubtitle}>{item.duration ? `${item.duration} minggu` : ''} • {(item.status || '').replace('_', ' ')}</Text>
          </View>
          {enrolled ? (
            <View style={[styles.badge, { backgroundColor: Colors.successBg }]}>
              <Text style={[styles.badgeText, { color: Colors.success }]}>Enrolled</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={() => handleEnroll(item.id)}
              disabled={enrollingId === item.id}
            >
              {enrollingId === item.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.enrollBtnText}>Enroll</Text>}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.cardStat}>
            <Ionicons name="layers-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.cardStatText}>{item.modules?.length || 0} modul</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const data = tab === 'career-path' ? careerPaths : programs;
  const renderItem = tab === 'career-path' ? renderCareerPath : renderProgram;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Career & Leadership</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'career-path' && styles.tabBtnActive]} onPress={() => setTab('career-path')}>
          <Text style={[styles.tabText, tab === 'career-path' && styles.tabTextActive]}>Career Path</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'leadership' && styles.tabBtnActive]} onPress={() => setTab('leadership')}>
          <Text style={[styles.tabText, tab === 'leadership' && styles.tabTextActive]}>Leadership Programs</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem as any}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trail-sign-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              {tab === 'career-path'
                ? (employee?.id ? 'Belum ada career path yang dibuat untuk Anda' : 'Akun Anda belum terhubung dengan data karyawan')
                : 'Belum ada program leadership tersedia'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.md, padding: Spacing.xl },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabBtnActive: { backgroundColor: Colors.primaryBg },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, flex: 1 },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  pathChain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pathNode: { flex: 1, backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md },
  pathNodeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 2 },
  pathNodeValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  enrollBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, minWidth: 72, alignItems: 'center' },
  enrollBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
