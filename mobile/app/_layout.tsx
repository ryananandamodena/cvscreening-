import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/theme';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

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
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="login" />
        )}
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
