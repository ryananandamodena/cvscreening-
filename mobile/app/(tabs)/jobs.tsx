import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await apiService.getJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Jobs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchJobs(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const filtered = jobs.filter(j =>
    (j.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (j.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': case 'active': return { bg: Colors.successBg, text: Colors.success };
      case 'closed': return { bg: Colors.dangerBg, text: Colors.danger };
      default: return { bg: Colors.warningBg, text: Colors.warning };
    }
  };

  const renderJob = ({ item }: { item: any }) => {
    const sc = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => router.push(`/job/${item.id || item.ID}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.department || 'No Department'} • {item.location || 'Remote'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{item.status || 'Open'}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.cardStat}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.cardStatText}>{item.applicants || item.total_candidates || 0} candidates</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchBar, Shadow.sm]}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item.ID)}
        renderItem={renderJob}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No jobs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginTop: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg,
    height: 44, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
});
