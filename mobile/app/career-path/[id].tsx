import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// GET /succession/career-paths/:id is authorized server-side against the path's actual
// employeeId (career_path_handlers.go) — a 403 here means this genuinely isn't the viewer's
// own career path (or their direct report's), not a network failure.
export default function CareerPathDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [path, setPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      const data = await apiService.getCareerPathByID(Number(id));
      setPath(data);
      setError(false);
      setForbidden(false);
    } catch (err: any) {
      console.log('Career path detail fetch error:', err);
      if (err?.message?.toLowerCase().includes('forbidden')) {
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
        <Text style={styles.emptyText}>Anda tidak memiliki akses untuk melihat career path ini.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!path && error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat career path. Silakan coba lagi.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!path) {
    return (
      <View style={styles.center}>
        <Ionicons name="trail-sign-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Career path tidak ditemukan</Text>
      </View>
    );
  }

  const getMilestoneTone = (status: string) => {
    switch (status) {
      case 'completed': return { icon: 'checkmark-circle', color: Colors.success };
      case 'overdue': return { icon: 'alert-circle', color: Colors.danger };
      case 'in_progress': return { icon: 'time', color: Colors.info };
      default: return { icon: 'ellipse-outline', color: Colors.textTertiary };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Career Path</Text>

      <View style={[styles.pathChain, Shadow.sm]}>
        <View style={styles.pathNode}>
          <Text style={styles.pathNodeLabel}>Saat Ini</Text>
          <Text style={styles.pathNodeValue}>{path.currentPosition || '—'}</Text>
        </View>
        <Ionicons name="arrow-down" size={20} color={Colors.textTertiary} style={{ marginVertical: Spacing.sm }} />
        {(path.targetPositions || []).map((pos: string, i: number) => (
          <View key={i} style={styles.pathNode}>
            <Text style={styles.pathNodeLabel}>Target {i + 1}</Text>
            <Text style={styles.pathNodeValue}>{pos}</Text>
          </View>
        ))}
      </View>

      {(path.mentorName || path.performanceScore != null) && (
        <View style={[styles.infoCard, Shadow.sm]}>
          {path.mentorName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Mentor</Text>
              <Text style={styles.infoValue}>{path.mentorName}</Text>
            </View>
          )}
          {path.performanceScore != null && (
            <View style={styles.infoRow}>
              <Ionicons name="star-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Skor Performa</Text>
              <Text style={styles.infoValue}>{Number(path.performanceScore).toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}

      {path.timeline?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development Plan</Text>
          {path.timeline.map((item: any, i: number) => (
            <View key={i} style={[styles.timelineCard, Shadow.sm]}>
              <Text style={styles.timelinePosition}>{item.position}</Text>
              {item.estimatedTime > 0 && (
                <Text style={styles.timelineTime}>Estimasi: {item.estimatedTime} bulan</Text>
              )}
              {item.requirements?.length > 0 && (
                <View style={styles.timelineBlock}>
                  <Text style={styles.timelineBlockTitle}>Requirements</Text>
                  {item.requirements.map((r: string, j: number) => (
                    <Text key={j} style={styles.timelineItem}>• {r}</Text>
                  ))}
                </View>
              )}
              {item.developmentActivities?.length > 0 && (
                <View style={styles.timelineBlock}>
                  <Text style={styles.timelineBlockTitle}>Development Activities</Text>
                  {item.developmentActivities.map((a: string, j: number) => (
                    <Text key={j} style={styles.timelineItem}>• {a}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {path.milestones?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          {path.milestones.map((m: any) => {
            const tone = getMilestoneTone(m.status);
            return (
              <View key={m.id} style={[styles.milestoneRow, Shadow.sm]}>
                <Ionicons name={tone.icon as any} size={20} color={tone.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.milestoneTitle, m.completed && styles.milestoneCompleted]}>{m.title}</Text>
                  {m.dueDate && <Text style={styles.milestoneDue}>Deadline: {new Date(m.dueDate).toLocaleDateString()}</Text>}
                </View>
              </View>
            );
          })}
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
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  pathChain: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg, alignItems: 'center' },
  pathNode: { backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', width: '100%' },
  pathNodeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 2 },
  pathNodeValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  infoCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg, gap: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  timelineCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.sm },
  timelinePosition: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  timelineTime: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  timelineBlock: { marginTop: Spacing.sm },
  timelineBlockTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary, marginBottom: 4 },
  timelineItem: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.sm },
  milestoneTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
  milestoneCompleted: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  milestoneDue: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
