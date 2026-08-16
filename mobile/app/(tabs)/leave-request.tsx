import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Picker } from '@react-native-picker/picker';

export default function LeaveRequestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<any[]>([]);
  
  // Form State
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const data = await apiService.getLeaveBalances();
      setBalances(data || []);
      if (data && data.length > 0) {
        setLeaveTypeId(data[0].leave_type_id);
      }
    } catch (err) {
      console.log('Error fetching balances', err);
    }
  };

  const handleSubmit = async () => {
    if (!leaveTypeId || !startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.submitLeaveRequest({
        leaveTypeId,
        startDate,
        endDate,
        reason
      });
      Alert.alert('Success', 'Leave request submitted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Balances summary */}
        <View style={styles.balanceContainer}>
          <Text style={styles.sectionTitle}>Your Leave Balances</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
            {balances.map((b, i) => (
              <View key={i} style={[styles.balanceCard, Shadow.sm]}>
                <Text style={styles.balanceVal}>{b.remaining_days}</Text>
                <Text style={styles.balanceLabel}>{b.leave_type?.name || 'Annual'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Form */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Leave Type *</Text>
          <View style={styles.inputPicker}>
            <Picker
              selectedValue={leaveTypeId}
              onValueChange={(value) => setLeaveTypeId(value)}
              style={{ flex: 1 }}
            >
              {balances.length === 0 && <Picker.Item label="No leave types available" value={null} />}
              {balances.map((b, i) => (
                <Picker.Item
                  key={i}
                  label={`${b.leave_type?.name || 'Leave'} (${b.remaining_days} days left)`}
                  value={b.leave_type_id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>End Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Why do you need leave?"
            multiline
            value={reason}
            onChangeText={setReason}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: Spacing.sm },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  content: { padding: Spacing.xl },
  balanceContainer: { marginBottom: Spacing.xxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.md },
  balanceCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.lg, minWidth: 100, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  balanceVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  balanceLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  formGroup: { marginBottom: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.text, backgroundColor: Colors.background,
  },
  inputPicker: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  footer: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    alignItems: 'center', ...Shadow.md,
  },
  submitText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
