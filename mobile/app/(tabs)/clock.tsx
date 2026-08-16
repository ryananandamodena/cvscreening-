import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

// Attendance is a fraud-sensitive flow: the server is the source of truth for geofencing
// and photo requirements, but the client must actually capture a live selfie + real GPS
// fix rather than send placeholder data. Steps: idle -> capturing (camera open) ->
// preview (retake/use) -> submitting (location fetched + API call).
type Step = 'idle' | 'capturing' | 'preview' | 'submitting';

export default function ClockScreen() {
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Both clock-in and clock-out are recorded for today — attendance is complete and another
  // clock-in would just hit the backend's "already_clocked_in" 409. Without this, clocking out
  // reset clockedIn to false, which looks identical to "never clocked in today" and invites
  // exactly that failed retry — this is the state that was missing.
  const isDoneForToday = !!clockInTime && !!clockOutTime;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingStatus(true);
      try {
        // Backend (`GET /attendance/today`) responds with camelCase field names
        // (`clockIn`/`clockOut`), not `clock_in`/`clock_out` — the mismatch previously meant
        // this check silently never matched, so a fresh app open/reload could never show that
        // the employee had already clocked in/out today.
        const data = await apiService.getTodayAttendance();
        if (data?.clockIn) {
          setClockedIn(true);
          setClockInTime(data.clockIn);
        }
        if (data?.clockOut) {
          setClockedIn(false);
          setClockOutTime(data.clockOut);
        }
      } catch {
        // No attendance record yet today — leave defaults.
      } finally {
        setLoadingStatus(false);
      }
    })();
  }, []);

  const startCapture = async () => {
    let permission = cameraPermission;
    if (!permission?.granted) {
      permission = await requestCameraPermission();
    }
    if (!permission?.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is required to take a live selfie for attendance verification. Please enable it in your device settings.'
      );
      return;
    }
    setPhotoUri(null);
    setPhotoBase64(null);
    setStep('capturing');
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, base64: true, skipProcessing: true });
      if (!photo?.base64) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        return;
      }
      setPhotoUri(photo.uri);
      setPhotoBase64(photo.base64);
      setStep('preview');
    } catch {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const retake = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setStep('capturing');
  };

  const submitAttendance = async () => {
    if (!photoBase64) return;
    setStep('submitting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location access is required to verify you are within the office area to clock in/out.'
        );
        setStep('preview');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;
      const photo = `data:image/jpeg;base64,${photoBase64}`;

      if (!clockedIn) {
        // clientType: 'mobile' declares to the backend that this client has no on-device face-
        // matching capability — an explicit, honest exemption from mandatory face verification
        // for employees who have enrolled a reference face via the web app (Module 15). Photo +
        // GPS/geofencing remain mandatory either way.
        await apiService.clockIn({ latitude, longitude, photo, clientType: 'mobile' });
        setClockedIn(true);
        setClockInTime(new Date().toISOString());
        Alert.alert('✅ Clock In', 'You have clocked in successfully!');
      } else {
        await apiService.clockOut({ latitude, longitude, photo });
        setClockedIn(false);
        setClockOutTime(new Date().toISOString());
        Alert.alert('✅ Clock Out', 'You have clocked out successfully!');
      }
      setStep('idle');
      setPhotoUri(null);
      setPhotoBase64(null);
    } catch (err: any) {
      const code = err?.message || '';
      let message = 'Failed to record attendance. Please try again.';
      if (code === 'geofencing_error' || /geofencing/i.test(code)) {
        message = 'Anda berada di luar area kantor. Clock in/out hanya bisa dilakukan di lokasi kantor.';
      } else if (code === 'already_clocked_in') {
        message = 'Anda sudah melakukan clock in hari ini.';
      } else if (code === 'UNAUTHORIZED') {
        message = 'Your session has expired. Please login again.';
      } else if (/network/i.test(code)) {
        message = 'Connection lost. Please check your internet connection.';
      }
      Alert.alert('Error', message);
      // "already_clocked_in" means today's record already has a clock-in (this may be the
      // employee's clock-OUT attempt hitting a stale UI: e.g. reopened the app after already
      // completing both clock-in and clock-out today) — refresh the on-screen status instead of
      // leaving the photo preview up inviting an identical retry that will fail the same way.
      if (code === 'already_clocked_in') {
        setStep('idle');
        setPhotoUri(null);
        setPhotoBase64(null);
        apiService.getTodayAttendance().then((data) => {
          if (data?.clockIn) {
            setClockedIn(!data?.clockOut);
            setClockInTime(data.clockIn);
          }
          if (data?.clockOut) {
            setClockOutTime(data.clockOut);
          }
        }).catch(() => {});
      } else {
        setStep('preview');
      }
    }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <LinearGradient colors={['#EEF1F8', '#F4F6F9']} style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <Text style={styles.title}>Time Recording</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        </View>

        {/* Camera / Selfie area */}
        <View style={styles.cameraContainer}>
          {isDoneForToday && step === 'idle' ? (
            <View style={styles.donePlaceholder}>
              <Ionicons name="checkmark-done-circle" size={48} color={Colors.success} />
              <Text style={styles.doneTitle}>Attendance complete for today</Text>
              <Text style={styles.doneSubtitle}>
                You clocked in at {new Date(clockInTime!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} and
                {' '}clocked out at {new Date(clockOutTime!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}.
              </Text>
            </View>
          ) : step === 'capturing' ? (
            <CameraView ref={cameraRef} style={styles.camera} facing="front">
              <View style={styles.captureOverlay}>
                <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie}>
                  <Ionicons name="camera" size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : step === 'preview' || step === 'submitting' ? (
            photoUri ? (
              <View style={styles.camera}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.success} style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }} />
                <View style={styles.previewImage}>
                  <Text style={{ color: Colors.textSecondary }}>Selfie captured</Text>
                </View>
              </View>
            ) : null
          ) : (
            <TouchableOpacity style={styles.cameraPlaceholder} onPress={startCapture} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={40} color={Colors.textTertiary} />
              <Text style={{ color: Colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }}>
                Tap to take a live selfie for {clockedIn ? 'Clock Out' : 'Clock In'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location Info */}
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={{ marginLeft: Spacing.sm }}>
            <Text style={styles.locationLabel}>Current Location</Text>
            <Text style={styles.locationValue}>
              {step === 'submitting' ? 'Checking location…' : 'Verified automatically when you submit'}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View style={{ height: 40, justifyContent: 'center', marginBottom: Spacing.lg }}>
          {loadingStatus ? (
            <ActivityIndicator color={Colors.primary} />
          ) : clockInTime ? (
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <View style={styles.iconCircle}>
                  <Ionicons name="enter" size={16} color={Colors.success} />
                </View>
                <Text style={styles.statusLabel}>In: {new Date(clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
              </View>
              {clockOutTime && (
                <View style={styles.statusItem}>
                  <View style={[styles.iconCircle, { backgroundColor: Colors.warningBg || Colors.successBg }]}>
                    <Ionicons name="exit" size={16} color={Colors.warning || Colors.success} />
                  </View>
                  <Text style={styles.statusLabel}>Out: {new Date(clockOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        {step === 'preview' ? (
          <View style={{ width: '100%', flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity onPress={retake} style={[styles.secondaryBtn, { flex: 1 }]} activeOpacity={0.8}>
              <Text style={styles.secondaryBtnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submitAttendance} style={{ flex: 1, ...Shadow.md }} activeOpacity={0.8}>
              <LinearGradient
                colors={clockedIn ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.clockBtn}
              >
                <Text style={styles.clockBtnText}>Use Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : step === 'capturing' ? (
          <TouchableOpacity onPress={() => setStep('idle')} style={[styles.secondaryBtn, { width: '100%' }]} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : isDoneForToday ? null : (
          <TouchableOpacity
            onPress={startCapture}
            disabled={step === 'submitting' || loadingStatus}
            activeOpacity={0.8}
            style={{ width: '100%', ...Shadow.md }}
          >
            <LinearGradient
              colors={clockedIn ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.clockBtn}
            >
              {step === 'submitting' ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name={clockedIn ? 'exit-outline' : 'finger-print-outline'} size={24} color={Colors.white} />
                  <Text style={styles.clockBtnText}>{clockedIn ? 'Clock Out' : 'Clock In'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primaryDark, marginBottom: Spacing.xl, letterSpacing: -0.5 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', width: '90%',
    ...Shadow.lg,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  dateText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.bold },
  timeText: { fontSize: FontSize.xl, color: Colors.primaryDark, fontWeight: FontWeight.extrabold },
  cameraContainer: {
    width: '100%',
    height: 280,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  captureOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  captureBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  previewImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.successBg,
  },
  doneTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
    marginBottom: Spacing.md,
  },
  locationLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  locationValue: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
  statusRow: { flexDirection: 'row', gap: Spacing.xxl },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.successBg, justifyContent: 'center', alignItems: 'center' },
  statusLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
  secondaryBtn: {
    paddingVertical: Spacing.xl, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.textSecondary, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  clockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    width: '100%', paddingVertical: Spacing.xl, borderRadius: BorderRadius.lg,
  },
  clockBtnText: { color: Colors.white, fontWeight: FontWeight.extrabold, fontSize: FontSize.lg, textTransform: 'uppercase', letterSpacing: 1 },
});
