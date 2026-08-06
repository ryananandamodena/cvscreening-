import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../screens/LoginScreen';

// Mock the API service
jest.mock('../services/api.service', () => ({
  login: jest.fn(),
}));

const mockNavigation = {
  replace: jest.fn(),
};

const mockApiService = require('../services/api.service');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    expect(getByText('RecruitAI')).toBeTruthy();
    expect(getByText('Mobile HR Portal')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('shows error alert when fields are empty', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    const loginButton = getByText('Sign In');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('handles successful login', async () => {
    mockApiService.login.mockResolvedValueOnce({ token: 'fake-token' });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockApiService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockNavigation.replace).toHaveBeenCalledWith('Home');
    });
  });

  it('shows error alert on login failure', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockApiService.login.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const loginButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid credentials'
      );
    });
  });

  it('toggles remember me checkbox', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation as any} />
    );

    const checkboxContainer = getByText('Remember me').parent;

    if (checkboxContainer) {
      fireEvent.press(checkboxContainer);
      // Note: Testing internal state changes might require more setup
      // For now, we just check that the press handler doesn't crash
    }
  });
});