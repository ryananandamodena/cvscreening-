import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import mobileApiService from '../services/api.service';
import { AttendanceRecord } from '../types';

type AttendanceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Attendance'>;

interface Props {
  navigation: AttendanceScreenNavigationProp;
}

const AttendanceScreen: React.FC<Props> = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [camera, setCamera] = useState<Camera | null>(null);

  useEffect(() => {
    initializeAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const initializeAttendance = async () => {
    try {
      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        const locationData = await Location.getCurrentPositionAsync({});
        setLocation(locationData);
      }

      // Request camera permissions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted');

      // Load today's attendance record
      await loadTodaysAttendance();
    } catch (error) {
      console.error('Error initializing attendance:', error);
      Alert.alert('Error', 'Failed to initialize attendance system');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Mock data - replace with actual API call
      const mockRecord: AttendanceRecord = {
        id: 1,
        employeeId: 1,
        date: today,
        checkIn: '09:15',
        status: 'present'
      };
      setTodayRecord(mockRecord);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to clock in');
      return;
    }

    setClockingIn(true);
    try {
      // Take photo for verification
      if (cameraPermission) {
        setShowCamera(true);
        return; // Wait for photo to be taken
      }

      // Clock in without photo
      await performClockIn();
    } catch (error) {
      console.error('Error during clock in:', error);
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    } finally {
      setClockingIn(false);
    }
  };

  const performClockIn = async () => {
    try {
      const clockInData = {
        employeeId: 1, // Get from user context
        location: {
          latitude: location?.coords.latitude,
          longitude: location?.coords.longitude,
        },
        photo: photo,
      };

      // API call would go here
      // await mobileApiService.post('/attendance/clock-in', clockInData);

      // Mock success
      const newRecord: AttendanceRecord = {
        id: Date.now(),
        employeeId: 1,
        date: new Date().toISOString().split('T')[0],
        checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkInLocation: {
          latitude: location?.coords.latitude || 0,
          longitude: location?.coords.longitude || 0,
        },
        status: 'present'
      };

      setTodayRecord(newRecord);
      setShowCamera(false);
      setPhoto(null);

      Alert.alert('Success', 'Successfully clocked in!', [
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('Error clocking in:', error);
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    } finally {
      setClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.checkIn) {
      Alert.alert('Error', 'You must clock in first before clocking out');
      return;
    }

    setClockingIn(true);
    try {
      const clockOutData = {
        employeeId: 1,
        location: {
          latitude: location?.coords.latitude,
          longitude: location?.coords.longitude,
        },
        photo: photo,
      };

      // API call would go here
      // await mobileApiService.post('/attendance/clock-out', clockOutData);

      // Mock success
      const updatedRecord: AttendanceRecord = {
        ...todayRecord,
        checkOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        checkOutLocation: {
          latitude: location?.coords.latitude || 0,
          longitude: location?.coords.longitude || 0,
        },
        workingHours: calculateWorkingHours(todayRecord.checkIn!, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      };

      setTodayRecord(updatedRecord);
      setShowCamera(false);
      setPhoto(null);

      Alert.alert('Success', 'Successfully clocked out!', [
        { text: 'OK' }
      ]);
    } catch (error) {
      console.error('Error clocking out:', error);
      Alert.alert('Error', 'Failed to clock out. Please try again.');
    } finally {
      setClockingIn(false);
    }
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string): number => {
    const [inHours, inMinutes] = checkIn.split(':').map(Number);
    const [outHours, outMinutes] = checkOut.split(':').map(Number);

    const inTotal = inHours * 60 + inMinutes;
    const outTotal = outHours * 60 + outMinutes;

    return Math.max(0, (outTotal - inTotal) / 60);
  };

  const takePhoto = async () => {
    if (!camera) return;

    try {
      const photoData = await camera.takePictureAsync({
        quality: 0.5,
        base64: true,
      });
      setPhoto(photoData.uri);
      await performClockIn();
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          type={Camera.Constants.Type.front}
          ref={(ref) => setCamera(ref)}
        >
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraText}>Position your face in the frame</Text>
            <View style={styles.cameraButtons}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cameraButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cameraButton, styles.primaryButton]}
                onPress={takePhoto}
              >
                <Text style={[styles.cameraButtonText, styles.primaryButtonText]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.currentTime}>
          {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </Text>
        <Text style={styles.currentDate}>
          {currentTime.toLocaleDateString([], {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Today's Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Today's Status</Text>
          <Text style={[styles.statusValue, styles[todayRecord?.status || 'not_present']]}>
            {todayRecord?.status ? todayRecord.status.toUpperCase() : 'NOT PRESENT'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Check-in Time</Text>
          <Text style={styles.statusValue}>
            {todayRecord?.checkIn || '--:--'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Check-out Time</Text>
          <Text style={styles.statusValue}>
            {todayRecord?.checkOut || '--:--'}
          </Text>
        </View>
      </View>

      {/* Clock In/Out Buttons */}
      <View style={styles.buttonContainer}>
        {!todayRecord?.checkIn ? (
          <TouchableOpacity
            style={[styles.clockButton, styles.clockInButton]}
            onPress={handleClockIn}
            disabled={clockingIn}
          >
            {clockingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.clockButtonIcon}>⏰</Text>
                <Text style={styles.clockButtonText}>Clock In</Text>
                <Text style={styles.clockButtonSubtext}>Start your workday</Text>
              </>
            )}
          </TouchableOpacity>
        ) : !todayRecord?.checkOut ? (
          <TouchableOpacity
            style={[styles.clockButton, styles.clockOutButton]}
            onPress={handleClockOut}
            disabled={clockingIn}
          >
            {clockingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.clockButtonIcon}>🏠</Text>
                <Text style={styles.clockButtonText}>Clock Out</Text>
                <Text style={styles.clockButtonSubtext}>End your workday</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.clockButton, styles.completedButton]}>
            <Text style={styles.clockButtonIcon}>✅</Text>
            <Text style={styles.clockButtonText}>Day Completed</Text>
            <Text style={styles.clockButtonSubtext}>
              {todayRecord?.workingHours?.toFixed(1)} hours worked
            </Text>
          </View>
        )}
      </View>

      {/* Location Info */}
      {location && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>📍 Current Location</Text>
          <Text style={styles.locationText}>
            Lat: {location.coords.latitude.toFixed(4)}, Lng: {location.coords.longitude.toFixed(4)}
          </Text>
          <Text style={styles.locationAccuracy}>
            Accuracy: ±{Math.round(location.coords.accuracy || 0)}m
          </Text>
        </View>
      )}

      {/* Recent Attendance History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Attendance</Text>
        <View style={styles.historyList}>
          {/* Mock data - replace with actual history */}
          {[
            { date: '2024-01-15', checkIn: '09:00', checkOut: '18:00', status: 'present' },
            { date: '2024-01-14', checkIn: '08:45', checkOut: '17:30', status: 'present' },
            { date: '2024-01-13', checkIn: '09:15', checkOut: '18:15', status: 'present' },
          ].map((record, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyDate}>
                <Text style={styles.historyDateText}>{record.date}</Text>
                <Text style={[styles.historyStatus, styles[record.status]]}>
                  {record.status}
                </Text>
              </View>
              <View style={styles.historyTimes}>
                <Text style={styles.historyTime}>In: {record.checkIn}</Text>
                <Text style={styles.historyTime}>Out: {record.checkOut}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Photo Verification Status */}
      {cameraPermission === false && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>📷 Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Camera access is needed for photo verification during clock in/out.
            Please enable camera permissions in your device settings.
          </Text>
        </View>
      )}

      {!location && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>📍 Location Access Required</Text>
          <Text style={styles.permissionText}>
            Location access is needed to record your attendance location.
            Please enable location permissions in your device settings.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  timeContainer: {
    backgroundColor: '#4F46E5',
    padding: 32,
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  currentDate: {
    fontSize: 18,
    color: '#e0e7ff',
  },
  statusContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  present: {
    color: '#10b981',
  },
  absent: {
    color: '#ef4444',
  },
  late: {
    color: '#f59e0b',
  },
  not_present: {
    color: '#6b7280',
  },
  buttonContainer: {
    padding: 20,
  },
  clockButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clockInButton: {
    backgroundColor: '#10b981',
  },
  clockOutButton: {
    backgroundColor: '#f59e0b',
  },
  completedButton: {
    backgroundColor: '#6b7280',
  },
  clockButtonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  clockButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  clockButtonSubtext: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  locationContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#9ca3af',
  },
  historyContainer: {
    padding: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  historyList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  permissionContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cameraButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    color: '#fff',
  },
});

export default AttendanceScreen;