import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import AttendanceScreen from '../screens/AttendanceScreen';

// Mock expo modules
jest.mock('expo-location');
jest.mock('expo-camera');

// Mock API service
jest.mock('../services/api.service', () => ({
  clockIn: jest.fn(),
  clockOut: jest.fn(),
}));

const mockNavigation = {
  goBack: jest.fn(),
};

const mockLocation = Location as jest.Mocked<typeof Location>;
const mockCamera = Camera as jest.Mocked<typeof Camera>;
const mockApiService = require('../services/api.service');

describe('AttendanceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock location permissions
    mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    mockLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 37.7749, longitude: -122.4194 },
      timestamp: Date.now(),
    } as any);

    // Mock camera permissions
    mockCamera.requestCameraPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly', async () => {
    const { getByText } = render(
      <AttendanceScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByText('Attendance')).toBeTruthy();
    });
  });

  it('loads attendance data on mount', async () => {
    const { getByText } = render(
      <AttendanceScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('shows attendance status correctly', async () => {
    const { getByText } = render(
      <AttendanceScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      expect(getByText('Attendance')).toBeTruthy();
      expect(getByText('PRESENT')).toBeTruthy();
      expect(getByText('Clock Out')).toBeTruthy();
    });
  });

  it('handles clock out successfully', async () => {
    mockApiService.clockOut.mockResolvedValueOnce({ success: true });

    const { getByText } = render(
      <AttendanceScreen navigation={mockNavigation as any} />
    );

    await waitFor(() => {
      const clockOutButton = getByText('Clock Out');
      fireEvent.press(clockOutButton);
      expect(mockApiService.clockOut).toHaveBeenCalled();
    });
  });
});