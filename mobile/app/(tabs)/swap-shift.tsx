import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Picker } from '@react-native-picker/picker';

export default function SwapShiftScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form State
  const [myShiftId, setMyShiftId] = useState<number | null>(null);
  // The backend needs the target employee's internal numeric id (employees.id), not their
  // display employee code (e.g. "EMP-001") — a freeform text field asking for "Target Employee
  // ID" invited exactly that confusion. A picker sourced from the real employee list removes the
  // ambiguity entirely.
  const [targetEmployeeId, setTargetEmployeeId] = useState<number | null>(null);
  const [targetShiftDate, setTargetShiftDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
  }, []);

  const fetchShifts = async () => {
    try {
      const data = await apiService.getShifts();
      setShifts(data || []);
      if (data && data.length > 0) {
        setMyShiftId(data[0].id);
      }
    } catch (err) {
      console.log('Error fetching shifts', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees();
      setEmployees(data || []);
    } catch (err) {
      console.log('Error fetching employees', err);
    }
  };

  const handleSubmit = async () => {
    if (!myShiftId || !targetEmployeeId || !targetShiftDate || !reason) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.submitSwapShiftRequest({
        shiftId: myShiftId,
        targetEmployeeId,
        date: targetShiftDate,
        reason,
      });
      Alert.alert('Success', 'Shift swap request submitted!', [
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
        <Text style={styles.headerTitle}>Swap Shift Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Your Shift *</Text>
          <View style={styles.inputPicker}>
            <Picker
              selectedValue={myShiftId}
              onValueChange={(value) => setMyShiftId(value)}
              style={{ flex: 1 }}
            >
              {shifts.length === 0 && <Picker.Item label="No shifts available" value={null} />}
              {shifts.map((shift) => (
                <Picker.Item
                  key={shift.id}
                  label={shift.name || `${shift.startTime} - ${shift.endTime}`}
                  value={shift.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Swap With *</Text>
          <View style={styles.inputPicker}>
            <Picker
              selectedValue={targetEmployeeId}
              onValueChange={(value) => setTargetEmployeeId(value)}
              style={{ flex: 1 }}
            >
              <Picker.Item label="Select an employee..." value={null} />
              {employees.map((employee) => (
                <Picker.Item
                  key={employee.id}
                  label={`${employee.fullName} (${employee.employeeId})`}
                  value={employee.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={targetShiftDate}
            onChangeText={setTargetShiftDate}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Why do you want to swap this shift?"
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
  formGroup: { marginBottom: Spacing.lg },
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
