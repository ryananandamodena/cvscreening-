import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobData = async () => {
    try {
      if (!id) return;
      const jobData = await apiService.getJobByID(Number(id));
      setJob(jobData.data || jobData);
      
      const boardData = await apiService.getLeaderboard(Number(id), 10);
      setLeaderboard(Array.isArray(boardData) ? boardData : boardData?.data || []);
    } catch (err) {
      console.log('Fetch job error:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchJobData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobData();
    setRefreshing(false);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!job) return <View style={styles.center}><Text>Job not found</Text></View>;

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.danger;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{job.status || 'Open'}</Text>
        </View>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.subtitle}>{job.department} • {job.location || 'Remote'}</Text>
        
        <TouchableOpacity 
          style={styles.uploadBtn}
          onPress={() => router.push({ pathname: '/upload', params: { jobId: id } })}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={Colors.white} />
          <Text style={styles.uploadBtnText}>Screen CV for this Job</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{job.description || 'No description provided.'}</Text>
      </View>

      {/* Leaderboard */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Candidates</Text>
        {leaderboard.length === 0 ? (
          <Text style={styles.emptyText}>No candidates screened yet.</Text>
        ) : (
          leaderboard.map((item, index) => {
            const score = item.overall_score || item.overallScore || 0;
            return (
              <TouchableOpacity 
                key={item.id || item.ID} 
                style={[styles.candidateCard, Shadow.sm]}
                onPress={() => router.push(`/screening/${item.id || item.ID}`)}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.candidateName}>{item.candidate_name || item.candidateName}</Text>
                  <Text style={styles.candidateStatus}>{item.status}</Text>
                </View>
                <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
                  <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>{Math.round(score)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  badgeText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  uploadBtnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  section: { padding: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  emptyText: { color: Colors.textTertiary, fontStyle: 'italic' },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  candidateName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  candidateStatus: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'capitalize', marginTop: 2 },
  scoreCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: { fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
