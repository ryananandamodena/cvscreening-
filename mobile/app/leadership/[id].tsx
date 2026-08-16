import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// No GET /succession/leadership-programs/:id exists — looked up from the full catalog
// fetched here, same approach as the training detail screen.
export default function LeadershipProgramDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { employee } = useAuth();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      const programs = await apiService.getLeadershipPrograms();
      const found = programs.find((p: any) => String(p.id) === String(id));
      setProgram(found || null);
      setError(false);
    } catch (err) {
      console.log('Leadership program detail fetch error:', err);
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
    if (!program || !employee?.id) {
      Alert.alert('Akun belum terhubung', 'Akun Anda belum terhubung dengan data karyawan.');
      return;
    }
    setEnrolling(true);
    try {
      await apiService.enrollInLeadershipProgram(program.id, employee.id);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal enroll', err?.message || 'Silakan coba lagi.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (!program && error) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat program. Silakan coba lagi.</Text>
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
        <Text style={styles.emptyText}>Program tidak ditemukan</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const enrolled = employee?.id && program.participants?.includes(employee.id);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>{program.programName}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{(program.status || '').replace('_', ' ')}</Text>
        </View>
        {program.duration > 0 && (
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>{program.duration} minggu</Text>
          </View>
        )}
      </View>

      {program.description ? <Text style={styles.description}>{program.description}</Text> : null}

      {program.targetAudience?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Peserta</Text>
          <View style={styles.metaRow}>
            {program.targetAudience.map((t: string, i: number) => (
              <View key={i} style={styles.metaChip}><Text style={styles.metaChipText}>{t}</Text></View>
            ))}
          </View>
        </View>
      )}

      {program.modules?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modul ({program.modules.length})</Text>
          {program.modules.map((m: any, i: number) => (
            <View key={m.id ?? i} style={[styles.moduleCard, Shadow.sm]}>
              <Text style={styles.moduleTitle}>{i + 1}. {m.title}</Text>
              {m.description ? <Text style={styles.moduleDesc}>{m.description}</Text> : null}
              <View style={styles.moduleFooter}>
                {m.duration > 0 && (
                  <View style={styles.cardStat}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.cardStatText}>{m.duration}h</Text>
                  </View>
                )}
                {m.instructor && (
                  <View style={styles.cardStat}>
                    <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.cardStatText}>{m.instructor}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {enrolled ? (
        <View style={[styles.enrolledBanner, Shadow.sm]}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.enrolledText}>Anda sudah terdaftar di program ini</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll} disabled={enrolling}>
          {enrolling ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.enrollBtnText}>Enroll Sekarang</Text>}
        </TouchableOpacity>
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
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  moduleCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.sm },
  moduleTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  moduleDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  moduleFooter: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  enrolledBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.successBg, borderRadius: BorderRadius.md, padding: Spacing.lg },
  enrolledText: { color: Colors.success, fontWeight: FontWeight.semibold },
  enrollBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', ...Shadow.md },
  enrollBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
