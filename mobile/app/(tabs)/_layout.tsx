import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Colors, Shadow } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 32,
          height: 64,
          paddingBottom: 0,
          borderTopWidth: 0,
          ...Shadow.lg,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.borderLight,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 20,
          color: Colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Ionicons name={focused ? "grid" : "grid-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="screenings"
        options={{
          title: 'Screening',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Ionicons name={focused ? "document-text" : "document-text-outline"} size={20} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="interviews"
        options={{
          title: 'Interviews',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Ionicons name={focused ? "videocam" : "videocam-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.iconActive : styles.iconInactive}>
              <Ionicons name={focused ? "settings" : "settings-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconActive: {
    backgroundColor: Colors.primaryBg,
    padding: 8,
    borderRadius: 16,
  },
  iconInactive: {
    padding: 8,
  }
});
