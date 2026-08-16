import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiService } from '../../services/api';
import RequireAccess from '../../components/RequireAccess';

export default function OrgStructureScreen() {
  return (
    <RequireAccess permission="employee.view">
      <OrgStructureScreenContent />
    </RequireAccess>
  );
}

function OrgStructureScreenContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const data = await apiService.getDepartments();
      setDepartments(data || []);
      setError(false);
    } catch (err) {
      console.log('Error fetching departments', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Organizational Structure</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : error && departments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Failed to load departments.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchDepartments}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : departments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No departments found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {departments.map((dept) => (
            <View key={dept.id} style={[styles.card, Shadow.sm]}>
              <View style={styles.cardHeader}>
                <View style={styles.deptIcon}>
                  <Ionicons name="business" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  {dept.description ? (
                    <Text style={styles.deptDesc}>{dept.description}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color={Colors.info} />
                  <Text style={styles.statText}>{dept.employee_count || 0} Members</Text>
                </View>
                {dept.head_name ? (
                  <View style={styles.statItem}>
                    <Ionicons name="person" size={16} color={Colors.success} />
                    <Text style={styles.statText}>{dept.head_name}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  content: { padding: Spacing.lg },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  retryText: { color: Colors.white, fontWeight: FontWeight.bold },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  deptIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  deptName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  deptDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  statsRow: { flexDirection: 'row', gap: Spacing.xl },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});
