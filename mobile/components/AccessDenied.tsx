import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../constants/theme';

// Shown when a user reaches a screen's route directly (deep link, manual navigation, stale tab
// state) without the permission it requires. Hiding the tab is not security — this is the
// screen-level backstop so the route itself refuses to render its content. The backend remains
// the final authorization layer regardless of what this screen shows.
export default function AccessDenied() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="lock-closed" size={36} color={Colors.danger} />
      </View>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>Anda tidak memiliki akses ke halaman ini.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, backgroundColor: Colors.background },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.dangerBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, marginBottom: Spacing.sm },
  message: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },
  button: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg },
  buttonText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
