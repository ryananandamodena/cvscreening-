import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function OnboardingScreen() {
  // `user` (from /login) never carries an employeeId — only `employee` (from GET
  // /employees/me) does. This previously compared against `user?.employee_id`, which was
  // always undefined, so `mySession` could never match and this screen always rendered
  // "no tasks" for everyone regardless of their actual onboarding state.
  const { employee } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchTasks = async () => {
    try {
      const sessions = await apiService.getOnboardingSessions();
      // Must match the current employee explicitly — the backend can return other employees'
      // sessions to admin/recruiter callers, so falling back to sessions[0] here could display
      // someone else's onboarding tasks instead of an honest "no session" state.
      const mySession = sessions.find((s: any) => s.employee_id === employee?.id);
      if (!mySession) {
        setTasks([]);
        setSessionId(null);
        return;
      }
      setSessionId(mySession.id);
      const data = await apiService.getOnboardingTasks(mySession.id);
      setTasks(data);
    } catch (err) {
      console.log('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTasks(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const toggleTask = async (task: any) => {
    if (!sessionId) return;
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    setUpdatingId(task.id);
    try {
      await apiService.updateOnboardingTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    } catch (err) {
      console.log('Update onboarding task error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Onboarding Tasks</Text>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {tasks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="rocket-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No onboarding tasks assigned</Text>
            </View>
          ) : (
            tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.card, Shadow.sm]}
                onPress={() => toggleTask(task)}
                disabled={updatingId === task.id}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  {updatingId === task.id ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons
                      name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={task.status === 'completed' ? Colors.success : Colors.textTertiary}
                    />
                  )}
                  <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskCompleted]}>
                    {task.title || task.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: Spacing.lg },
  content: { paddingBottom: Spacing.xxxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  taskTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.text, flex: 1 },
  taskCompleted: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
