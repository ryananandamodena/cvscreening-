import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, Gradients } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileMenuItem = ({ icon, label, value, onPress, showChevron = true, isLast = false }: any) => (
  <TouchableOpacity style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {showChevron && <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  // `user` (from /login) only ever has { id, email, name, role } — employeeId/position/
  // department all live on `employee` (GET /employees/me), which previously wasn't fetched
  // at all here, so every one of these fields always rendered as "-".
  const { user, employee, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [licenseWarningEnabled, setLicenseWarningEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const showEmployeeInfo = () => {
    Alert.alert(user?.name || 'Employee Information', [
      `Employee ID: ${employee?.employeeId || '-'}`,
      `Position: ${employee?.positionName || '-'}`,
      `Department: ${employee?.departmentName || '-'}`,
      `Email: ${user?.email || '-'}`,
    ].join('\n'));
  };

  const notAvailableYet = (feature: string) =>
    Alert.alert('Not available yet', `${feature} is not supported yet in the mobile app.`);

  const initials = (user?.name || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient colors={Gradients.primary} style={[styles.headerBg, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerRow}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => Alert.alert('Language', 'Only English is currently supported.')}
          >
            <Ionicons name="globe-outline" size={16} color={Colors.white} />
            <Text style={styles.langText}>EN</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Avatar overlapping header */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <TouchableOpacity style={styles.editAvatarBtn} onPress={() => notAvailableYet('Changing your profile photo')}>
          <Ionicons name="pencil" size={14} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.position}>{user?.position || 'Employee'}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* General Section */}
        <Text style={styles.sectionTitle}>General</Text>
        <View style={[styles.menuGroup, Shadow.sm]}>
          <ProfileMenuItem icon="person-outline" label="Employee Information" onPress={showEmployeeInfo} />
          <ProfileMenuItem icon="camera-outline" label="Attendance Base Photo" onPress={() => router.push('/(tabs)/clock' as any)} />
          <ProfileMenuItem icon="business-outline" label="Company" value="COMPANY" showChevron={false} />
          <ProfileMenuItem icon="language-outline" label="Language Preference" value="English (EN)" onPress={() => notAvailableYet('Changing your language preference')} />
          <ProfileMenuItem icon="globe-outline" label="Time Zone" value="(GMT +07:00)" showChevron={false} isLast />
        </View>

        {/* Notification Section */}
        <Text style={styles.sectionTitle}>Notification</Text>
        <View style={[styles.menuGroup, Shadow.sm]}>
          <View style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <View style={styles.menuIcon}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>License warning</Text>
            <Switch
              trackColor={{ false: Colors.border, true: Colors.primaryBg }}
              thumbColor={Colors.primary}
              value={licenseWarningEnabled}
              onValueChange={setLicenseWarningEnabled}
            />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBg: {
    paddingBottom: 60,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 40 },
  langText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.bold },
  avatarContainer: {
    alignItems: 'center', marginTop: -50,
  },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: Colors.background,
    ...Shadow.md,
  },
  avatarText: { fontSize: FontSize.hero, fontWeight: FontWeight.extrabold, color: Colors.primary },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: '35%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.background,
  },
  nameContainer: { alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  position: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: 4, fontWeight: FontWeight.medium },
  scrollContent: { paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.lg, marginLeft: Spacing.sm },
  menuGroup: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIcon: { marginRight: Spacing.md, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  menuValue: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.xxxl, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dangerBg,
  },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.danger },
});
