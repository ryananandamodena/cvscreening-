import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function ScreeningDetailScreen() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      if (!id) return;
      const res = await apiService.getScreeningByID(Number(id));
      setData(res.data || res);
    } catch (err) {
      console.log('Error fetching screening:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      await apiService.updateScreeningStatus(Number(id), status);
      Alert.alert('Success', `Candidate marked as ${status}`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!data) return <View style={styles.center}><Text>Data not found</Text></View>;

  const score = data.overall_score || data.overallScore || 0;
  let scoreColor = Colors.danger;
  if (score >= 80) scoreColor = Colors.success;
  else if (score >= 60) scoreColor = Colors.warning;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>{Math.round(score)}</Text>
        </View>
        <Text style={styles.name}>{data.candidate_name || data.candidateName}</Text>
        <Text style={styles.job}>{data.job_title || data.jobTitle}</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={styles.statusValue}>{data.status}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.success }]} onPress={() => updateStatus('shortlisted')}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.btnText}>Shortlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.danger }]} onPress={() => updateStatus('rejected')}>
          <Ionicons name="close-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>

      {/* Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.analysisText}>{data.analysis || 'No analysis available.'}</Text>
        </View>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreText: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  job: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, gap: Spacing.sm },
  statusLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  statusValue: { fontWeight: FontWeight.bold, color: Colors.text, textTransform: 'capitalize' },
  actions: {
    flexDirection: 'row',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  btnText: { color: Colors.white, fontWeight: FontWeight.bold },
  section: { padding: Spacing.xl, paddingTop: 0 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analysisText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
});
