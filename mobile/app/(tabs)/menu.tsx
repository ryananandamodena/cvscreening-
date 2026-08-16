import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, Gradients } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { TAB_PERMISSIONS } from '../../constants/rbac';

type MenuItem = {
  icon: string;
  label: string;
  route?: string;
};

// Maps a menu item's route (e.g. '/(tabs)/screenings') to its TAB_PERMISSIONS key ('screenings')
// so the same permission used to guard the tab/route itself also controls menu visibility —
// hiding a menu item is UX only, the backend route/tab guard remains the real boundary.
function routeToTabName(route?: string): string | null {
  if (!route) return null;
  const match = route.match(/\(tabs\)\/([^/]+)/);
  return match ? match[1] : null;
}

type MenuSection = {
  title: string;
  gradient: readonly [string, string];
  items: MenuItem[];
};

const MENU_DATA: MenuSection[] = [
  {
    title: 'Organization',
    gradient: Gradients.softBlue,
    items: [
      { icon: 'git-network', label: 'Organizational\nStructure', route: '/(tabs)/org-structure' },
    ],
  },
  {
    title: 'Employee',
    gradient: Gradients.softPurple,
    items: [
      { icon: 'people', label: 'Employee\nInformation', route: '/(tabs)/employees' },
      { icon: 'clipboard', label: 'Employee\nSurvey', route: '/(tabs)/employee-survey' },
      { icon: 'rocket', label: 'Onboarding', route: '/(tabs)/onboarding' },
      { icon: 'school', label: 'Training', route: '/(tabs)/training' },
      { icon: 'trending-up', label: 'My\nPerformance', route: '/(tabs)/performance' },
      { icon: 'shield-checkmark', label: 'My\nBenefits', route: '/(tabs)/benefits' },
      { icon: 'trail-sign', label: 'Career &\nLeadership', route: '/(tabs)/career' },
    ],
  },
  {
    title: 'Time & Attendance',
    gradient: Gradients.softOrange,
    items: [
      { icon: 'time', label: 'Time\nRecording', route: '/(tabs)/my-work' },
      { icon: 'calendar', label: 'My\nCalendar', route: '/(tabs)/my-work' },
      { icon: 'list', label: 'Attendance\nList', route: '/(tabs)/attendance' },
      { icon: 'business', label: 'Office\nLocation', route: '/(tabs)/office-location' },
      { icon: 'globe-outline', label: 'Remote Work\nExemptions', route: '/(tabs)/remote-exemptions' },
    ],
  },
  {
    title: 'Attendance Request',
    gradient: Gradients.softPink,
    items: [
      { icon: 'swap-horizontal', label: 'Swap Shift\nRequest', route: '/(tabs)/swap-shift' },
      { icon: 'document-text', label: 'Leave\nRequest', route: '/(tabs)/leave-request' },
      { icon: 'timer', label: 'Overtime\nRequest', route: '/(tabs)/overtime-request' },
      { icon: 'alert-circle', label: 'Absence\nRequest', route: '/(tabs)/absence-request' },
    ],
  },
  {
    title: 'Recruitment',
    gradient: Gradients.softTeal,
    items: [
      { icon: 'briefcase', label: 'Job\nPostings', route: '/(tabs)/jobs' },
      { icon: 'document-text', label: 'CV\nScreening', route: '/(tabs)/screenings' },
      { icon: 'videocam', label: 'Interview\nSchedules', route: '/(tabs)/interviews' },
    ],
  },
  {
    title: 'Reimbursement',
    gradient: Gradients.softGreen,
    items: [
      { icon: 'receipt', label: 'Claim Form', route: '/(tabs)/claim-form' },
    ],
  },
  {
    title: 'Loan',
    gradient: Gradients.softOrange,
    items: [
      { icon: 'wallet', label: 'Loan\nRequest', route: '/(tabs)/loan-request' },
    ],
  },
  {
    title: 'Payroll',
    gradient: Gradients.softBlue,
    items: [
      { icon: 'card', label: 'My PaySlip', route: '/(tabs)/payslip' },
    ],
  },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { canAccess } = useAuth();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredSections = MENU_DATA.map(section => ({
    ...section,
    items: section.items.filter(item => {
      const tabName = routeToTabName(item.route);
      if (tabName && !canAccess(TAB_PERMISSIONS[tabName])) return false;
      return item.label.toLowerCase().replace('\n', ' ').includes(search.toLowerCase());
    }),
  })).filter(section => section.items.length > 0);

  const handleMenuPress = (item: MenuItem) => {
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, Shadow.sm]}>
          <Ionicons name="search" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Menu"
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Menu Features</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={16} color={viewMode === 'grid' ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? Colors.primary : Colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredSections.map((section, idx) => (
          <View key={idx}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {/* Items */}
            {viewMode === 'grid' ? (
              <View style={styles.gridContainer}>
                {section.items.map((item, itemIdx) => (
                  <TouchableOpacity
                    key={itemIdx}
                    style={styles.gridItem}
                    onPress={() => handleMenuPress(item)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient colors={section.gradient} style={styles.gridIcon}>
                      <Ionicons name={item.icon as any} size={24} color={Colors.primaryDark} />
                    </LinearGradient>
                    <Text style={styles.gridLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.listContainer}>
                {section.items.map((item, itemIdx) => (
                  <TouchableOpacity
                    key={itemIdx}
                    style={styles.listItem}
                    onPress={() => handleMenuPress(item)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient colors={section.gradient} style={styles.listIcon}>
                      <Ionicons name={item.icon as any} size={20} color={Colors.primaryDark} />
                    </LinearGradient>
                    <Text style={styles.listLabel}>{item.label.replace('\n', ' ')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  searchContainer: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, height: 48,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  viewToggle: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, overflow: 'hidden' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.white },
  toggleBtnActive: { backgroundColor: Colors.primaryBg },
  scrollContent: { paddingBottom: 20 },
  sectionHeader: {
    backgroundColor: Colors.sectionBg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    gap: Spacing.xl,
  },
  gridItem: { alignItems: 'center', width: 72 },
  gridIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.md, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  gridLabel: { fontSize: FontSize.xs, color: Colors.text, textAlign: 'center', lineHeight: 14 },
  listContainer: { paddingHorizontal: Spacing.xl },
  listItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  listIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm, backgroundColor: Colors.primaryBg,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  listLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text },
});
