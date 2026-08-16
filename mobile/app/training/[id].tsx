import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// No GET /training/programs/:id exists on the backend (extended_handlers.go only has
// list + enroll + my-trainings), so the program detail is looked up from the full catalog
// fetched here rather than a dedicated single-item call.
export default function TrainingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [myEnrollment, setMyEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      const [programs, myTrainings] = await Promise.all([
        apiService.getTrainingPrograms(),
        apiService.getMyTrainings(),
      ]);
      const found = programs.find((p: any) => String(p.id) === String(id));
      setProgram(found || null);
      setMyEnrollment(myTrainings.find((t: any) => String(t.programId) === String(id)) || null);
      setError(false);
    } catch (err) {
      console.log('Training detail fetch error:', err);
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

  const handleEnroll = async () => {
    if (!program) return;
    setEnrolling(true);
    try {
      await apiService.enrollInTraining(program.id);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Enrollment failed', err?.message || 'Please try again later.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!program && error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat detail training. Silakan coba lagi.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.center}>
        <Ionicons name="school-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Program training tidak ditemukan</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const full = program.maxSlots > 0 && program.filledSlots >= program.maxSlots;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>{program.title}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{program.category || 'General'}</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{program.format || 'online'}</Text>
        </View>
        {program.status && (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{program.status}</Text>
          </View>
        )}
      </View>

      {program.description ? (
        <Text style={styles.description}>{program.description}</Text>
      ) : null}

      <View style={[styles.infoCard, Shadow.sm]}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Provider</Text>
          <Text style={styles.infoValue}>{program.provider || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Durasi</Text>
          <Text style={styles.infoValue}>{program.duration ? `${program.duration} jam` : '—'}</Text>
        </View>
        {program.startDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Mulai</Text>
            <Text style={styles.infoValue}>{new Date(program.startDate).toLocaleDateString()}</Text>
          </View>
        )}
        {program.endDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Selesai</Text>
            <Text style={styles.infoValue}>{new Date(program.endDate).toLocaleDateString()}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.infoLabel}>Slot</Text>
          <Text style={styles.infoValue}>
            {program.maxSlots > 0 ? `${program.filledSlots || 0}/${program.maxSlots}` : '—'}
          </Text>
        </View>
      </View>

      {myEnrollment ? (
        <View style={[styles.enrollmentCard, Shadow.sm]}>
          <Text style={styles.enrollmentTitle}>Status Anda</Text>
          <View style={styles.metaRow}>
            <View style={[styles.metaChip, { backgroundColor: Colors.primaryBg }]}>
              <Text style={[styles.metaChipText, { color: Colors.primary }]}>{myEnrollment.status}</Text>
            </View>
          </View>
          {myEnrollment.score != null && (
            <Text style={styles.enrollmentDetail}>Skor: {myEnrollment.score}</Text>
          )}
          {myEnrollment.completedAt && (
            <Text style={styles.enrollmentDetail}>
              Selesai: {new Date(myEnrollment.completedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.enrollBtn, full && styles.enrollBtnDisabled]}
          onPress={handleEnroll}
          disabled={full || enrolling}
        >
          {enrolling ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.enrollBtnText}>{full ? 'Slot Penuh' : 'Enroll Sekarang'}</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 60 },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background, gap: Spacing.md, padding: Spacing.xl,
  },
  backBtn: { marginBottom: Spacing.md, width: 36, height: 36, justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  metaChip: {
    backgroundColor: Colors.borderLight, paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  metaChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, textTransform: 'capitalize' },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg, gap: Spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  enrollmentCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg,
  },
  enrollmentTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  enrollmentDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  enrollBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.lg, borderRadius: BorderRadius.md,
    alignItems: 'center', ...Shadow.md,
  },
  enrollBtnDisabled: { backgroundColor: Colors.textTertiary },
  enrollBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
