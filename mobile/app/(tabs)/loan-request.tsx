import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Picker } from '@react-native-picker/picker';

const TENURE_OPTIONS = ['3 Months', '6 Months', '12 Months', '24 Months'];

export default function LoanRequestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [tenure, setTenure] = useState('3 Months');

  const handleSubmit = async () => {
    if (!amount || !reason) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await apiService.submitLoanRequest({
        amount: parseFloat(amount),
        reason: `${reason} (Tenure: ${tenure})`
      });
      Alert.alert('Success', 'Loan request submitted successfully!', [
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
        <Text style={styles.headerTitle}>Loan Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        
        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={24} color={Colors.warning} />
          <Text style={styles.warningText}>
            Loan requests are subject to approval by HR and Finance. Deductions will be made directly from your monthly payroll.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Loan Amount (IDR) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5000000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Repayment Tenure *</Text>
          <View style={styles.inputPicker}>
            <Picker
              selectedValue={tenure}
              onValueChange={(value) => setTenure(value)}
              style={{ flex: 1 }}
            >
              {TENURE_OPTIONS.map((option) => (
                <Picker.Item key={option} label={option} value={option} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Why do you need this loan?"
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
  warningBox: {
    flexDirection: 'row', backgroundColor: '#FFF9C4', padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  warningText: { flex: 1, color: '#F57F17', fontSize: FontSize.sm, lineHeight: 20 },
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
