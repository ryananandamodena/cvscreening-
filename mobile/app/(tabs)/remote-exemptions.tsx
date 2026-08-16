import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, FlatList, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { apiService } from '../../services/api';
import RequireAccess from '../../components/RequireAccess';

// HR/Admin screen to dynamically allow a specific employee to clock in/out from outside the
// office geofencing radius (permanent remote workers, field staff, a temporary WFH arrangement)
// — set per employee via PUT /attendance/location-exemptions/:employeeId, independent of the
// shared office location every other employee is still checked against (see office-location.tsx).
type ExemptionRow = {
  employeeId: number;
  fullName: string;
  employeeCode: string;
  enabled: boolean;
  reason: string;
  startDate: string | null;
  endDate: string | null;
};

function RemoteExemptionsScreenInner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exemptions, setExemptions] = useState<ExemptionRow[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [exemptionRes, employeeList] = await Promise.all([
        apiService.getLocationExemptions(),
        apiService.getEmployees(),
      ]);
      setExemptions(exemptionRes.exemptions || []);
      setEmployees(employeeList || []);
    } catch {
      Alert.alert('Error', 'Failed to load remote work exemptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exemptionByEmployeeId = useMemo(() => {
    const map = new Map<number, ExemptionRow>();
    exemptions.forEach((e) => map.set(e.employeeId, e));
    return map;
  }, [exemptions]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e: any) =>
      (e.fullName || '').toLowerCase().includes(q) || (e.employeeId || '').toLowerCase().includes(q)
    );
  }, [employees, search]);

  const toggle = async (employee: any, nextEnabled: boolean) => {
    const existing = exemptionByEmployeeId.get(employee.id);
    setSavingId(employee.id);
    try {
      await apiService.setLocationExemption(employee.id, {
        enabled: nextEnabled,
        reason: existing?.reason || (nextEnabled ? 'Remote work allowed' : ''),
        startDate: existing?.startDate || null,
        endDate: existing?.endDate || null,
      });
      setExemptions((prev) => {
        const others = prev.filter((e) => e.employeeId !== employee.id);
        return [
          ...others,
          {
            employeeId: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeId,
            enabled: nextEnabled,
            reason: existing?.reason || (nextEnabled ? 'Remote work allowed' : ''),
            startDate: existing?.startDate || null,
            endDate: existing?.endDate || null,
          },
        ];
      });
    } catch (err: any) {
      const msg = /forbidden|403/i.test(err?.message || '')
        ? 'You do not have permission to manage remote work exemptions.'
        : 'Failed to update this employee’s remote work exemption.';
      Alert.alert('Error', msg);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Remote Work Exemptions</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.description}>
        Employees toggled on here can clock in/out from anywhere — the office geofencing radius
        is skipped just for them. Everyone else is still checked against Office Location.
      </Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employee by name or ID"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const exemption = exemptionByEmployeeId.get(item.id);
          const enabled = !!exemption?.enabled;
          return (
            <View style={[styles.row, Shadow.sm]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.fullName}</Text>
                <Text style={styles.rowMeta}>{item.employeeId}{exemption?.reason ? ` · ${exemption.reason}` : ''}</Text>
              </View>
              {savingId === item.id ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Switch
                  value={enabled}
                  onValueChange={(v) => toggle(item, v)}
                  trackColor={{ true: Colors.primary }}
                />
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No employees found.</Text>}
      />
    </View>
  );
}

export default function RemoteExemptionsScreen() {
  return (
    <RequireAccess permission="attendance.manage_office_location">
      <RemoteExemptionsScreenInner />
    </RequireAccess>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, lineHeight: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  rowName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  rowMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: Spacing.xxl },
});