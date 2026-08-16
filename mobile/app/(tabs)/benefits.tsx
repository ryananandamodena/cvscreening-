import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

// Fields shown here are exactly what the backend sends (models.EmployeeBenefit,
// InsurancePlan, EmployeeInsuranceEnrollment, EmployeeDependent, FlexibleBenefit,
// RetirementPlan — see sservice_cvsreening/models/*.go). Two things the master spec asks
// for don't exist server-side and are intentionally NOT shown: a numeric "balance/
// utilization" figure for flexible benefits (backend only has maxAmount on the catalog
// entry, no per-employee usage tracking), and self-service add/edit/delete for
// dependents (only HR/admin can write those — see routes_benefits_succession.go).
type Tab = 'my-benefits' | 'insurance' | 'dependents' | 'flexible' | 'retirement';

const TABS: { key: Tab; label: string }[] = [
  { key: 'my-benefits', label: 'My Benefits' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'dependents', label: 'Dependents' },
  { key: 'flexible', label: 'Flexible' },
  { key: 'retirement', label: 'Retirement' },
];

export default function BenefitsScreen() {
  const insets = useSafeAreaInsets();
  const { employee } = useAuth();
  const [tab, setTab] = useState<Tab>('my-benefits');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const [myBenefits, setMyBenefits] = useState<any[]>([]);
  const [benefitPlans, setBenefitPlans] = useState<any[]>([]);
  const [insurancePlans, setInsurancePlans] = useState<any[]>([]);
  const [insuranceEnrollments, setInsuranceEnrollments] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [flexibleBenefits, setFlexibleBenefits] = useState<any[]>([]);
  const [retirementPlans, setRetirementPlans] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [mb, bp, ip, ie, fb, rp] = await Promise.all([
        apiService.getMyBenefits(),
        apiService.getBenefitPlans(),
        apiService.getInsurancePlans(),
        apiService.getMyInsuranceEnrollments(),
        apiService.getFlexibleBenefits(),
        apiService.getRetirementPlans(),
      ]);
      setMyBenefits(mb);
      setBenefitPlans(bp);
      setInsurancePlans(ip);
      setInsuranceEnrollments(ie);
      setFlexibleBenefits(fb);
      setRetirementPlans(rp);

      // Dependents needs the caller's numeric employee id — skipped (not an error) if the
      // account isn't linked to an employee record yet, same as other self-service screens.
      if (employee?.id) {
        setDependents(await apiService.getMyDependents(employee.id));
      }
      setError(false);
    } catch (err) {
      console.log('Benefits fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [employee?.id]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const enrolledPlanIds = new Set(myBenefits.map((b) => b.planId));

  const handleEnrollBenefit = async (planId: number) => {
    if (!employee?.id) {
      Alert.alert('Akun belum terhubung', 'Akun Anda belum terhubung dengan data karyawan.');
      return;
    }
    setEnrollingId(planId);
    try {
      await apiService.enrollInBenefit(employee.id, planId);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal enroll', err?.message || 'Silakan coba lagi.');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleEnrollFlexible = async (benefitId: number) => {
    if (!employee?.id) return;
    setEnrollingId(benefitId);
    try {
      await apiService.enrollFlexibleBenefit(employee.id, benefitId);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal enroll', err?.message || 'Silakan coba lagi.');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleEnrollRetirement = async (planId: number) => {
    if (!employee?.id) return;
    setEnrollingId(planId);
    try {
      await apiService.enrollRetirementPlan(employee.id, planId);
      await fetchData();
    } catch (err: any) {
      Alert.alert('Gagal enroll', err?.message || 'Silakan coba lagi.');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (error && myBenefits.length === 0 && benefitPlans.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
        <Text style={styles.emptyText}>Gagal memuat data benefits. Periksa koneksi Anda.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderContent = () => {
    const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />;

    if (tab === 'my-benefits') {
      return (
        <FlatList
          data={benefitPlans}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={refreshControl}
          renderItem={({ item }) => {
            const enrolled = enrolledPlanIds.has(item.id);
            return (
              <View style={[styles.card, Shadow.sm]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.category} • {item.provider || 'Internal'}</Text>
                  </View>
                  {enrolled ? (
                    <View style={[styles.badge, { backgroundColor: Colors.successBg }]}>
                      <Text style={[styles.badgeText, { color: Colors.success }]}>Active</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.enrollBtn} onPress={() => handleEnrollBenefit(item.id)} disabled={enrollingId === item.id}>
                      {enrollingId === item.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.enrollBtnText}>Enroll</Text>}
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardStatText}>Coverage: Rp {Number(item.coverageAmount || 0).toLocaleString('id-ID')}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState icon="shield-outline" text="Belum ada benefit plan tersedia" />}
        />
      );
    }

    if (tab === 'insurance') {
      const enrolledInsuranceIds = new Set(insuranceEnrollments.map((e) => e.planId));
      return (
        <FlatList
          data={insurancePlans}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadow.sm]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>{item.type} • {item.provider}</Text>
                </View>
                {enrolledInsuranceIds.has(item.id) && (
                  <View style={[styles.badge, { backgroundColor: Colors.successBg }]}>
                    <Text style={[styles.badgeText, { color: Colors.success }]}>Enrolled</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardStatText}>Coverage: Rp {Number(item.coverageAmount || 0).toLocaleString('id-ID')}</Text>
                <Text style={styles.cardStatText}>Premi: Rp {Number(item.premiumAmount || 0).toLocaleString('id-ID')}/{item.premiumFrequency}</Text>
              </View>
              <Text style={styles.hintText}>Pendaftaran/perubahan polis dikelola oleh HR.</Text>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="medkit-outline" text="Belum ada polis asuransi tersedia" />}
        />
      );
    }

    if (tab === 'dependents') {
      return (
        <FlatList
          data={dependents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadow.sm]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>{item.relationship}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.isCovered ? Colors.successBg : Colors.borderLight }]}>
                  <Text style={[styles.badgeText, { color: item.isCovered ? Colors.success : Colors.textSecondary }]}>
                    {item.isCovered ? 'Covered' : 'Not Covered'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              text={employee?.id ? 'Belum ada dependent terdaftar' : 'Akun Anda belum terhubung dengan data karyawan'}
            />
          }
          ListFooterComponent={dependents.length > 0 ? (
            <Text style={styles.hintText}>Untuk menambah/mengubah dependent, hubungi HR.</Text>
          ) : null}
        />
      );
    }

    if (tab === 'flexible') {
      return (
        <FlatList
          data={flexibleBenefits}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadow.sm]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>{item.category}</Text>
                </View>
                <TouchableOpacity style={styles.enrollBtn} onPress={() => handleEnrollFlexible(item.id)} disabled={enrollingId === item.id}>
                  {enrollingId === item.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.enrollBtnText}>Enroll</Text>}
                </TouchableOpacity>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardStatText}>Maks: Rp {Number(item.maxAmount || 0).toLocaleString('id-ID')}</Text>
                {item.taxAdvantaged && <Text style={styles.cardStatText}>Tax-advantaged</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="wallet-outline" text="Belum ada flexible benefit tersedia" />}
        />
      );
    }

    return (
      <FlatList
        data={retirementPlans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={refreshControl}
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.sm]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.provider} • {(item.planType || '').replace('_', ' ')}</Text>
              </View>
              <TouchableOpacity style={styles.enrollBtn} onPress={() => handleEnrollRetirement(item.id)} disabled={enrollingId === item.id}>
                {enrollingId === item.id ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.enrollBtnText}>Enroll</Text>}
              </TouchableOpacity>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardStatText}>Kontribusi Karyawan: {item.employeeContribution}%</Text>
              <Text style={styles.cardStatText}>Kontribusi Perusahaan: {item.employerContribution}%</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="hourglass-outline" text="Belum ada program pensiun tersedia" />}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Benefits</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {renderContent()}
    </View>
  );
}

function EmptyState({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.md, padding: Spacing.xl },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  tabScroll: { flexGrow: 0, marginBottom: Spacing.md },
  tabRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  tabBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white, fontWeight: FontWeight.bold },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 20 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.sm,
    marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  hintText: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.sm, fontStyle: 'italic' },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  enrollBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, minWidth: 72, alignItems: 'center' },
  enrollBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryBtnText: { color: Colors.white, fontWeight: FontWeight.bold },
});
