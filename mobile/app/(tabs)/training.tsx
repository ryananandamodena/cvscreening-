import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// Backend only sends: id, title, description, category, format, provider, duration, maxSlots,
// filledSlots, startDate, endDate, status, cost (TrainingProgram — extended_models.go) and
// id, programId, employeeId, status, score, completedAt, createdAt, employeeName, programTitle
// (TrainingEnrollment). There is no "mandatory" flag and no progress percentage anywhere in the
// backend, so — unlike the master spec's "Mandatory Training" section — this screen doesn't
// show a mandatory badge or a progress bar for anything real. See training.service.ts on the
// web side for the same contract, and the Phase 1 report for this as a tracked gap.

type Tab = 'catalog' | 'my';

export default function TrainingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('my');
  const [programs, setPrograms] = useState<any[]>([]);
  const [myTrainings, setMyTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [programsData, myData] = await Promise.all([
        apiService.getTrainingPrograms(),
        apiService.getMyTrainings(),
      ]);
      setPrograms(programsData);
      setMyTrainings(myData);
      setError(false);
    } catch (err) {
      console.log('Training fetch error:', err);
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

  const enrolledProgramIds = new Set(myTrainings.map((t) => t.programId));

  const handleEnroll = async (programId: number) => {
    setEnrollingId(programId);
    try {
      await apiService.enrollInTraining(programId);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Enrollment failed', err?.message || 'Please try again later.');
    } finally {
      setEnrollingId(null);
    }
  };

  const completed = myTrainings.filter((t) => t.status === 'completed');
  const inProgress = myTrainings.filter((t) => t.status === 'enrolled');

  const stats = {
    total: myTrainings.length,
    completed: completed.length,
    inProgress: inProgress.length,
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case 'completed': return { bg: Colors.successBg, text: Colors.success };
      case 'enrolled': return { bg: Colors.infoBg, text: Colors.info };
      case 'cancelled': return { bg: Colors.dangerBg, text: Colors.danger };
      case 'no_show': return { bg: Colors.warningBg, text: Colors.warning };
      default: return { bg: Colors.borderLight, text: Colors.textSecondary };
    }
  };

  const renderCatalogItem = ({ item }: { item: any }) => {
    const alreadyEnrolled = enrolledProgramIds.has(item.id);
    const full = item.maxSlots > 0 && item.filledSlots >= item.maxSlots;
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/training/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.category || 'General'} • {item.format || 'online'}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.cardStat}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.cardStatText}>{item.duration ? `${item.duration}h` : '—'}</Text>
          </View>
          {alreadyEnrolled ? (
            <View style={[styles.badge, { backgroundColor: Colors.successBg }]}>
              <Text style={[styles.badgeText, { color: Colors.success }]}>Enrolled</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.enrollBtn, full && styles.enrollBtnDisabled]}
              onPress={() => handleEnroll(item.id)}
              disabled={full || enrollingId === item.id}
            >
              {enrollingId === item.id ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.enrollBtnText}>{full ? 'Full' : 'Enroll'}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMyTrainingItem = ({ item }: { item: any }) => {
    const tone = getStatusTone(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => item.programId && router.push(`/training/${item.programId}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.programTitle}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          {item.completedAt ? (
            <View style={styles.cardStat}>
              <Ionicons name="checkmark-circle-outline" size={14} color={Colors.success} />
              <Text style={styles.cardStatText}>Selesai {new Date(item.completedAt).toLocaleDateString()}</Text>
            </View>
          ) : item.createdAt ? (
            <View style={styles.cardStat}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.cardStatText}>Terdaftar {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          ) : <View />}
          {item.score != null && (
            <Text style={styles.scoreText}>Skor: {item.score}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (error && programs.length === 0 && myTrainings.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat data training. Periksa koneksi Anda.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const data = tab === 'catalog' ? programs : myTrainings;
  const renderItem = tab === 'catalog' ? renderCatalogItem : renderMyTrainingItem;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Training</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Terdaftar</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>Berjalan</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'my' && styles.tabBtnActive]}
          onPress={() => setTab('my')}
        >
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>My Training</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'catalog' && styles.tabBtnActive]}
          onPress={() => setTab('catalog')}
        >
          <Text style={[styles.tabText, tab === 'catalog' && styles.tabTextActive]}>Catalog</Text>
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
            <Ionicons name="school-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              {tab === 'catalog' ? 'Belum ada program training tersedia' : 'Anda belum terdaftar di training apapun'}
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
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabBtnActive: { backgroundColor: Colors.primaryBg },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, flex: 1 },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  enrollBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm, minWidth: 72, alignItems: 'center',
  },
  enrollBtnDisabled: { backgroundColor: Colors.textTertiary },
  enrollBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
