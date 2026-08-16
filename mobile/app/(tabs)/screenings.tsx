import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function ScreeningsScreen() {
  const router = useRouter();
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  const fetchScreenings = async (p = 1) => {
    try {
      const res = await apiService.getScreenings(p, 20);
      setScreenings(res.data || []);
      setError(false);
    } catch (err) {
      console.log('Screenings error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchScreenings(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchScreenings();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.danger;
  };

  const renderItem = ({ item }: { item: any }) => {
    const score = item.overall_score || item.overallScore || 0;
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/screening/${item.id || item.ID}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{Math.round(score)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Text style={styles.name} numberOfLines={1}>{item.candidate_name || item.candidateName || 'Unknown'}</Text>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.job_title || item.jobTitle || 'N/A'}</Text>
            <Text style={styles.date}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'shortlisted' ? Colors.successBg : item.status === 'rejected' ? Colors.dangerBg : Colors.infoBg }]}>
            <Text style={[styles.statusText, { color: item.status === 'shortlisted' ? Colors.success : item.status === 'rejected' ? Colors.danger : Colors.info }]}>
              {item.status || 'pending'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (error && screenings.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Failed to load screenings.</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => fetchScreenings()}>
          <Text style={styles.uploadBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={screenings}
        keyExtractor={(item) => String(item.id || item.ID)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No screenings yet</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/upload')}>
              <Text style={styles.uploadBtnText}>Upload CV</Text>
            </TouchableOpacity>
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
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white,
  },
  scoreText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  jobTitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  date: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'capitalize' },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  uploadBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg, marginTop: Spacing.md,
  },
  uploadBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
