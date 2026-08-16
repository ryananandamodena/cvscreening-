import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { apiService } from '../../services/api';
import RequireAccess from '../../components/RequireAccess';

// HR/Admin screen to configure the office GPS geofencing center + radius that clockInHandler /
// clockOutHandler validate every employee's attendance against (haversineDistance <= radius).
// Without this screen there was no way to ever change the office_settings row from the app —
// employees would always be measured against whatever default/stale coordinates were in the DB.
function OfficeLocationScreenInner() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('100');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await apiService.getOfficeLocation();
        setLatitude(String(settings.latitude ?? ''));
        setLongitude(String(settings.longitude ?? ''));
        setRadiusMeters(String(settings.radiusMeters ?? 100));
      } catch {
        Alert.alert('Error', 'Failed to load office location settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required', 'Location access is needed to capture the office coordinates.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
    } catch {
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setLocating(false);
    }
  };

  const save = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(radiusMeters);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be a number between -90 and 90.');
      return;
    }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Invalid Longitude', 'Longitude must be a number between -180 and 180.');
      return;
    }
    if (Number.isNaN(radius) || radius <= 0) {
      Alert.alert('Invalid Radius', 'Radius must be a positive number of meters.');
      return;
    }

    setSaving(true);
    try {
      await apiService.updateOfficeLocation({ latitude: lat, longitude: lng, radiusMeters: radius });
      Alert.alert('Saved', 'Office location has been updated. Employees will now be checked against this location for clock in/out.');
    } catch (err: any) {
      const msg = /forbidden|403/i.test(err?.message || '') || err?.message === 'FORBIDDEN'
        ? 'You do not have permission to update the office location.'
        : 'Failed to save office location. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
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
        <Text style={styles.headerTitle}>Office Location</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          This is the GPS center point and radius employees must be within to clock in/out
          (geofencing). Employees outside this radius will be blocked with a "geofencing_error".
        </Text>

        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numbers-and-punctuation"
            placeholder="-6.1754"
          />

          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numbers-and-punctuation"
            placeholder="106.8272"
          />

          <Text style={styles.label}>Radius (meters)</Text>
          <TextInput
            style={styles.input}
            value={radiusMeters}
            onChangeText={setRadiusMeters}
            keyboardType="numeric"
            placeholder="100"
          />

          <TouchableOpacity style={styles.secondaryBtn} onPress={useCurrentLocation} disabled={locating} activeOpacity={0.8}>
            {locating ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="locate-outline" size={18} color={Colors.primary} />
                <Text style={styles.secondaryBtnText}>Use My Current Location</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Office Location</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default function OfficeLocationScreen() {
  return (
    <RequireAccess permission="attendance.manage_office_location">
      <OfficeLocationScreenInner />
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
  content: { padding: Spacing.xl, paddingBottom: 100 },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.xl, marginBottom: Spacing.xl,
  },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.text,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, marginTop: Spacing.xl,
  },
  secondaryBtnText: { color: Colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl, alignItems: 'center', ...Shadow.md,
  },
  saveBtnText: { color: Colors.white, fontWeight: FontWeight.extrabold, fontSize: FontSize.md },
});