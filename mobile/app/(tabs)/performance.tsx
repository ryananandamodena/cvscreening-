import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// Backend fields only (models/extended_models.go PerformanceGoal / PerformanceReview) — no
// KPI/target-numeric-tracking beyond the free-text target/current strings the backend actually
// stores, and no separate "feedback history" endpoint (managerComments/employeeComments on the
// review itself are the only feedback fields that exist).
type Tab = 'goals' | 'reviews';

export default function PerformanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('goals');
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [goalsData, reviewsData] = await Promise.all([
        apiService.getMyGoals(),
        apiService.getMyPerformanceReviews(),
      ]);
      setGoals(goalsData);
      setReviews(reviewsData);
      setError(false);
    } catch (err) {
      console.log('Performance fetch error:', err);
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

  const handleCreateGoal = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Judul wajib diisi', 'Masukkan judul goal terlebih dahulu.');
      return;
    }
    setCreating(true);
    try {
      await apiService.createGoal({ title: newTitle.trim(), target: newTarget.trim() || undefined });
      setNewTitle('');
      setNewTarget('');
      setModalVisible(false);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal membuat goal', err?.message || 'Silakan coba lagi.');
    } finally {
      setCreating(false);
    }
  };

  const getGoalStatusTone = (status: string) => {
    switch (status) {
      case 'completed': return { bg: Colors.successBg, text: Colors.success };
      case 'in_progress': return { bg: Colors.infoBg, text: Colors.info };
      case 'overdue': return { bg: Colors.dangerBg, text: Colors.danger };
      default: return { bg: Colors.borderLight, text: Colors.textSecondary };
    }
  };

  const getReviewStatusTone = (status: string) => {
    switch (status) {
      case 'completed': case 'approved': return { bg: Colors.successBg, text: Colors.success };
      case 'calibration': case 'manager_review': return { bg: Colors.infoBg, text: Colors.info };
      case 'self_assessment': return { bg: Colors.warningBg, text: Colors.warning };
      default: return { bg: Colors.borderLight, text: Colors.textSecondary };
    }
  };

  const stats = {
    total: goals.length,
    completed: goals.filter((g) => g.status === 'completed').length,
    overdue: goals.filter((g) => g.status === 'overdue').length,
  };

  const renderGoal = ({ item }: { item: any }) => {
    const tone = getGoalStatusTone(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/goal/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.text }]}>{(item.status || '').replace('_', ' ')}</Text>
          </View>
        </View>
        {(item.target || item.current) && (
          <Text style={styles.cardSubtitle}>
            Target: {item.target || '—'} {item.current ? `• Progress: ${item.current}` : ''}
          </Text>
        )}
        <View style={styles.cardFooter}>
          {item.dueDate && (
            <View style={styles.cardStat}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.cardStatText}>Deadline {new Date(item.dueDate).toLocaleDateString()}</Text>
            </View>
          )}
          {item.weight > 0 && <Text style={styles.weightText}>{item.weight}%</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  const renderReview = ({ item }: { item: any }) => {
    const tone = getReviewStatusTone(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/review/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.reviewPeriod || 'Review'}</Text>
          <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.text }]}>{(item.status || '').replace('_', ' ')}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{(item.reviewType || 'annual').replace('_', ' ')}</Text>
        <View style={styles.cardFooter}>
          {item.overallRating > 0 && (
            <View style={styles.cardStat}>
              <Ionicons name="star-outline" size={14} color={Colors.warning} />
              <Text style={styles.cardStatText}>{item.overallRating.toFixed(1)} {item.overallRatingLabel ? `(${item.overallRatingLabel})` : ''}</Text>
            </View>
          )}
          {item.reviewerName && (
            <Text style={styles.cardStatText}>Reviewer: {item.reviewerName}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (error && goals.length === 0 && reviews.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat data performance. Periksa koneksi Anda.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const data = tab === 'goals' ? goals : reviews;
  const renderItem = tab === 'goals' ? renderGoal : renderReview;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance</Text>
        {tab === 'goals' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Goals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, stats.overdue > 0 && { color: Colors.danger }]}>{stats.overdue}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'goals' && styles.tabBtnActive]} onPress={() => setTab('goals')}>
          <Text style={[styles.tabText, tab === 'goals' && styles.tabTextActive]}>My Goals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'reviews' && styles.tabBtnActive]} onPress={() => setTab('reviews')}>
          <Text style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}>Reviews</Text>
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
            <Ionicons name="trending-up-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              {tab === 'goals' ? 'Belum ada goal. Tambahkan goal pertama Anda.' : 'Belum ada review performance.'}
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Goal Baru</Text>
            <TextInput
              style={styles.input}
              placeholder="Judul goal"
              placeholderTextColor={Colors.textTertiary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Target (opsional)"
              placeholderTextColor={Colors.textTertiary}
              value={newTarget}
              onChangeText={setNewTarget}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateGoal} disabled={creating}>
                {creating ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.modalSaveText}>Simpan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.md, padding: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.md },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabBtnActive: { backgroundColor: Colors.primaryBg },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, flex: 1 },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  weightText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  modalCancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalCancelText: { color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  modalSaveBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', backgroundColor: Colors.primary },
  modalSaveText: { color: Colors.white, fontWeight: FontWeight.bold },
});
