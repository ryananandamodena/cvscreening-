import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Colors, Shadow } from '../../constants/theme';

function ClockFAB({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.fabContainer} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.fab}>
        <Ionicons name="alarm-outline" size={28} color={Colors.white} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'menu' : 'menu-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clock"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <ClockFAB onPress={() => props.onPress?.(undefined as any)} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: 'My Work',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* None of these are tab-bar items — they're reached via menu/my-work instead, so they're
          always absent from the bar (href: null) regardless of role. The RBAC check for each
          still happens inside the screen itself via RequireAccess; hiding a tab is UX only and
          doesn't stop someone from navigating to the route directly. */}
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="employees" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="screenings" options={{ href: null }} />
      <Tabs.Screen name="interviews" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />

      <Tabs.Screen name="leave-request" options={{ href: null }} />
      <Tabs.Screen name="overtime-request" options={{ href: null }} />
      <Tabs.Screen name="absence-request" options={{ href: null }} />
      <Tabs.Screen name="swap-shift" options={{ href: null }} />

      <Tabs.Screen name="payslip" options={{ href: null }} />
      <Tabs.Screen name="claim-form" options={{ href: null }} />
      <Tabs.Screen name="loan-request" options={{ href: null }} />

      <Tabs.Screen name="org-structure" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="employee-survey" options={{ href: null }} />
      <Tabs.Screen name="training" options={{ href: null }} />
      <Tabs.Screen name="performance" options={{ href: null }} />
      <Tabs.Screen name="benefits" options={{ href: null }} />
      <Tabs.Screen name="career" options={{ href: null }} />
      <Tabs.Screen name="office-location" options={{ href: null }} />
      <Tabs.Screen name="remote-exemptions" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.fabColor,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.lg,
    borderWidth: 4,
    borderColor: Colors.white,
  },
});
