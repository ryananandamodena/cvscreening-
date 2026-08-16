import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// No GET /performance/goals/:id exists — the goal is looked up from the caller's own goal
// list (GET /performance/goals), same approach as the training detail screen.
export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [current, setCurrent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      const goals = await apiService.getMyGoals();
      const found = goals.find((g: any) => String(g.id) === String(id));
      setGoal(found || null);
      setCurrent(found?.current || '');
      setError(false);
    } catch (err) {
      console.log('Goal detail fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [id]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleUpdateProgress = async () => {
    if (!goal) return;
    setSaving(true);
    try {
      await apiService.updateGoalProgress(goal.id, { current });
      await fetchData();
      Alert.alert('Berhasil', 'Progress goal berhasil diperbarui.');
    } catch (err: any) {
      Alert.alert('Gagal memperbarui progress', err?.message || 'Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!goal) return;
    setSaving(true);
    try {
      await apiService.updateGoalProgress(goal.id, { current, status: 'completed' });
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal', err?.message || 'Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!goal && error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat detail goal. Silakan coba lagi.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.center}>
        <Ionicons name="flag-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Goal tidak ditemukan</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = goal.status === 'completed';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>{goal.title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{(goal.category || 'individual').replace('_', ' ')}</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{(goal.status || '').replace('_', ' ')}</Text>
        </View>
      </View>

      {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}

      <View style={[styles.infoCard, Shadow.sm]}>
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Target</Text>
          <Text style={styles.infoValue}>{goal.target || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trending-up-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Progress Saat Ini</Text>
          <Text style={styles.infoValue}>{goal.current || '—'}</Text>
        </View>
        {goal.weight > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="scale-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Bobot</Text>
            <Text style={styles.infoValue}>{goal.weight}%</Text>
          </View>
        )}
        {goal.dueDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Deadline</Text>
            <Text style={styles.infoValue}>{new Date(goal.dueDate).toLocaleDateString()}</Text>
          </View>
        )}
        {goal.completedAt && (
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
            <Text style={styles.infoLabel}>Selesai</Text>
            <Text style={styles.infoValue}>{new Date(goal.completedAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      {!isCompleted && (
        <View style={[styles.updateCard, Shadow.sm]}>
          <Text style={styles.updateTitle}>Update Progress</Text>
          <TextInput
            style={styles.input}
            placeholder="Progress saat ini (mis. 60% atau deskripsi singkat)"
            placeholderTextColor={Colors.textTertiary}
            value={current}
            onChangeText={setCurrent}
          />
          <View style={styles.updateActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProgress} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.saveBtnText}>Simpan Progress</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={handleMarkComplete} disabled={saving}>
              <Text style={styles.completeBtnText}>Tandai Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.md, padding: Spacing.xl },
  backBtn: { marginBottom: Spacing.md, width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  metaChip: { backgroundColor: Colors.borderLight, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
  metaChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, textTransform: 'capitalize' },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  infoCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg, gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  updateCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, gap: Spacing.md },
  updateTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  updateActions: { flexDirection: 'row', gap: Spacing.md },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  completeBtn: { flex: 1, borderWidth: 1, borderColor: Colors.success, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  completeBtnText: { color: Colors.success, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
