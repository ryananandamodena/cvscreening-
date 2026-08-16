import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const notAvailableYet = (feature: string) =>
    Alert.alert('Not available yet', `${feature} is not supported yet in the mobile app.`);

  const MenuItem = ({ icon, label, value, onPress, danger }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && { backgroundColor: Colors.dangerBg }]}>
        <Ionicons name={icon} size={20} color={danger ? Colors.danger : Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile Card */}
      <View style={[styles.profileCard, Shadow.md]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || user?.email || 'A').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'Administrator'}</Text>
        </View>
      </View>

      {/* Menu */}
      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={[styles.menuGroup, Shadow.sm]}>
        <MenuItem icon="person-outline" label="Profile" value={user?.email} onPress={() => router.push('/(tabs)/profile' as any)} />
        <MenuItem icon="notifications-outline" label="Notifications" onPress={() => Alert.alert('Notifications', 'No new notifications')} />
        <MenuItem icon="shield-checkmark-outline" label="Security" onPress={() => notAvailableYet('Changing your password/security settings')} />
      </View>

      <Text style={styles.sectionTitle}>APP</Text>
      <View style={[styles.menuGroup, Shadow.sm]}>
        <MenuItem icon="globe-outline" label="Language" value="English" onPress={() => Alert.alert('Language', 'Only English is currently supported.')} />
        <MenuItem icon="information-circle-outline" label="About" value="v1.0.0" onPress={() => Alert.alert('About SunFish HRIS', 'Version 1.0.0\nMobile Employee Portal')} />
      </View>

      <View style={[styles.menuGroup, Shadow.sm, { marginTop: Spacing.xxl }]}>
        <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  content: { padding: Spacing.xl, paddingBottom: 100 },
  profileCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.xxl,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  roleBadge: {
    backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.md,
    paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: Spacing.md,
  },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary, textTransform: 'uppercase' },
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary,
    letterSpacing: 1.5, marginBottom: Spacing.sm, marginLeft: Spacing.xs,
  },
  menuGroup: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  menuValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
});
