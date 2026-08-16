import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// GET /performance/reviews/:id exists and is authorized server-side (authorizeEmployeeTarget
// against the review's actual employeeId) — unlike training/goals, this one fetches directly.
export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      const data = await apiService.getPerformanceReviewByID(Number(id));
      setReview(data);
      setError(false);
      setForbidden(false);
    } catch (err: any) {
      console.log('Review detail fetch error:', err);
      if (err?.message?.toLowerCase().includes('forbidden') || err?.message?.toLowerCase().includes('not_found')) {
        setForbidden(true);
      } else {
        setError(true);
      }
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (forbidden) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Anda tidak memiliki akses untuk melihat review ini.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!review && error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat review. Silakan coba lagi.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!review) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Review tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>{review.reviewPeriod || 'Performance Review'}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{(review.reviewType || 'annual').replace('_', ' ')}</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{(review.status || '').replace('_', ' ')}</Text>
        </View>
      </View>

      {review.overallRating > 0 && (
        <View style={[styles.scoreCard, Shadow.sm]}>
          <Ionicons name="star" size={28} color={Colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreValue}>{review.overallRating.toFixed(1)} / 5</Text>
            {review.overallRatingLabel ? <Text style={styles.scoreLabel}>{review.overallRatingLabel}</Text> : null}
          </View>
        </View>
      )}

      <View style={[styles.infoCard, Shadow.sm]}>
        {review.reviewerName && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Reviewer</Text>
            <Text style={styles.infoValue}>{review.reviewerName}</Text>
          </View>
        )}
        {review.dueDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Deadline</Text>
            <Text style={styles.infoValue}>{new Date(review.dueDate).toLocaleDateString()}</Text>
          </View>
        )}
        {review.submittedAt && (
          <View style={styles.infoRow}>
            <Ionicons name="paper-plane-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Dikirim</Text>
            <Text style={styles.infoValue}>{new Date(review.submittedAt).toLocaleDateString()}</Text>
          </View>
        )}
        {review.approvedAt && (
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-done-outline" size={18} color={Colors.success} />
            <Text style={styles.infoLabel}>Disetujui</Text>
            <Text style={styles.infoValue}>{new Date(review.approvedAt).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      {review.achievements ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pencapaian</Text>
          <Text style={styles.sectionBody}>{review.achievements}</Text>
        </View>
      ) : null}

      {review.challenges ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tantangan</Text>
          <Text style={styles.sectionBody}>{review.challenges}</Text>
        </View>
      ) : null}

      {review.developmentPlan ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rencana Pengembangan</Text>
          <Text style={styles.sectionBody}>{review.developmentPlan}</Text>
        </View>
      ) : null}

      {review.managerComments ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback Manager</Text>
          <Text style={styles.sectionBody}>{review.managerComments}</Text>
        </View>
      ) : null}

      {review.employeeComments ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Komentar Anda</Text>
          <Text style={styles.sectionBody}>{review.employeeComments}</Text>
        </View>
      ) : null}

      {!review.achievements && !review.challenges && !review.managerComments && !review.employeeComments && (
        <Text style={styles.emptyText}>Belum ada detail feedback untuk review ini.</Text>
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
  scoreCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg,
  },
  scoreValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  scoreLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg, gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  sectionBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
