import { Redirect, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Alert } from 'react-native';
import { Colors } from '../constants/theme';
import { useEffect } from 'react';

function RootLayoutNav() {
  const { isAuthenticated, isLoading, status, acknowledgeSessionExpired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // SESSION_EXPIRED is transient: show one alert, then settle into UNAUTHENTICATED. The
  // effect above already redirects to /login as soon as isAuthenticated flips false, so the
  // user sees the login screen with this explanation on top rather than a silent bounce.
  useEffect(() => {
    if (status === 'SESSION_EXPIRED') {
      Alert.alert('Session Expired', 'Your session has expired. Please sign in again.', [
        { text: 'OK', onPress: acknowledgeSessionExpired },
      ]);
    }
  }, [status, acknowledgeSessionExpired]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="job/[id]" options={{ headerShown: true, title: 'Job Detail', headerTintColor: Colors.primary }} />
        <Stack.Screen name="screening/[id]" options={{ headerShown: true, title: 'Screening Detail', headerTintColor: Colors.primary }} />
        <Stack.Screen name="upload" options={{ headerShown: true, title: 'Upload CV', headerTintColor: Colors.primary, presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
