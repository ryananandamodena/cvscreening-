import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';

export default function PayslipScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      setError(null);
      const data = await apiService.getMyPayslips();
      setPayslips(data || []);
    } catch (err: any) {
      // A failed fetch must render as a distinct error state, not the same "No payslips
      // available" empty state a genuinely-empty list would show — otherwise the user can't
      // tell "you have none yet" from "the request failed".
      console.log('Error fetching payslips', err);
      setError(err?.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0);
  };

  const showBreakdown = async (slip: any) => {
    try {
      const detail = await apiService.getPayslipDetail(slip.id);
      const components = detail?.components || detail?.data || [];
      const lines = components.length
        ? components.map((c: any) => `${c.name || c.component}: ${formatCurrency(c.amount)}`).join('\n')
        : `Take Home Pay: ${formatCurrency(slip.net_salary || slip.total)}`;
      Alert.alert(slip.period || 'Payslip', lines);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load payslip details');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My PaySlip</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
              <Text style={[styles.emptyText, { color: Colors.danger }]}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchPayslips}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : payslips.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No payslips available</Text>
            </View>
          ) : (
            payslips.map((slip, index) => (
              <TouchableOpacity key={index} style={[styles.card, Shadow.sm]} onPress={() => showBreakdown(slip)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.periodText}>{slip.period || 'Monthly Salary'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: slip.status === 'PAID' ? Colors.success : Colors.warning }]}>
                    <Text style={styles.statusText}>{slip.status || 'DRAFT'}</Text>
                  </View>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.amountRow}>
                  <Text style={styles.label}>Take Home Pay</Text>
                  <Text style={styles.amount}>{formatCurrency(slip.net_salary || slip.total)}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => Alert.alert('Not available yet', 'PDF export is not supported yet — check with HR/Finance for a physical copy.')}
                >
                  <Ionicons name="download-outline" size={16} color={Colors.primary} />
                  <Text style={styles.downloadText}>Download PDF</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  content: { padding: Spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: Spacing.xl },
  emptyText: { marginTop: Spacing.md, color: Colors.textSecondary, fontSize: FontSize.md, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.md,
  },
  retryBtnText: { color: Colors.danger, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, color: Colors.white, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  amount: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md, gap: Spacing.xs,
  },
  downloadText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
});
