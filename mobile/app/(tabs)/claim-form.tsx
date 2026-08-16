import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

const CLAIM_TYPES = ['Medical', 'Transport', 'Meal', 'Communication', 'Other'];

export default function ClaimFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [claimType, setClaimType] = useState('Medical');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const handlePickReceipt = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled && result.assets?.length) {
      setReceipt(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      // Backend (claim_handlers.go) reads "claimType" (lowercased: medical/transport/meal/
      // communication/other), not "type" — this used to be silently ignored since the whole
      // call went to the wrong (admin-only) endpoint anyway.
      formData.append('claimType', claimType.toLowerCase());
      formData.append('amount', amount);
      formData.append('description', description);
      if (receipt) {
        formData.append('receipt', {
          uri: receipt.uri,
          name: receipt.name,
          type: receipt.mimeType || 'application/octet-stream',
        } as any);
      }

      await apiService.submitClaim(formData);
      Alert.alert('Success', 'Claim request submitted successfully!', [
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
        <Text style={styles.headerTitle}>Claim / Reimbursement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Claim Type *</Text>
          <View style={styles.inputPicker}>
            <Picker
              selectedValue={claimType}
              onValueChange={(value) => setClaimType(value)}
              style={{ flex: 1 }}
            >
              {CLAIM_TYPES.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount (IDR) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description / Reason *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="What is this claim for?"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity style={styles.uploadBox} onPress={handlePickReceipt}>
          <Ionicons
            name={receipt ? 'document-attach' : 'cloud-upload-outline'}
            size={32}
            color={Colors.primary}
          />
          <Text style={styles.uploadText}>{receipt ? receipt.name : 'Upload Receipt (Optional)'}</Text>
        </TouchableOpacity>

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
  uploadBox: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: BorderRadius.md, padding: Spacing.xl,
    alignItems: 'center', marginTop: Spacing.md,
  },
  uploadText: { marginTop: Spacing.sm, color: Colors.textSecondary, fontSize: FontSize.sm },
  footer: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
    alignItems: 'center', ...Shadow.md,
  },
  submitText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
