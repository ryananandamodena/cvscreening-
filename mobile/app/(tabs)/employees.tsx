import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RequireAccess from '../../components/RequireAccess';

export default function EmployeesScreen() {
  return (
    <RequireAccess permission="employee.view">
      <EmployeesScreenContent />
    </RequireAccess>
  );
}

function EmployeesScreenContent() {
  const insets = useSafeAreaInsets();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchEmployees(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    setRefreshing(false);
  };

  const filtered = employees.filter(e =>
    (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderEmployee = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={[styles.card, Shadow.sm]}
        onPress={() => Alert.alert(
          item.name || 'Employee',
          [
            `Position: ${item.position || '-'}`,
            `Department: ${item.department || '-'}`,
            `Email: ${item.email || '-'}`,
            `Status: ${item.status || 'active'}`,
          ].join('\n')
        )}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(item.name || 'E').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>{item.position || 'Employee'} • {item.department || 'No Dept'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: item.status === 'active' ? Colors.successBg : Colors.warningBg }]}>
            <Text style={[styles.badgeText, { color: item.status === 'active' ? Colors.success : Colors.warning }]}>
              {item.status || 'active'}
            </Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.cardStat}>
            <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.cardStatText}>{item.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Directory</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Not available yet', 'Adding employees from the mobile app is not supported yet — use the web admin portal.')}
        >
          <Ionicons name="person-add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, Shadow.sm]}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id || item.ID)}
          renderItem={renderEmployee}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No employees found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', ...Shadow.md,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg,
    height: 44, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  cardSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase' },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
});
