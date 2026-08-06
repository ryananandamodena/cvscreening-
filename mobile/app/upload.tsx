import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { Picker } from '@react-native-picker/picker';

export default function UploadScreen() {
  const { jobId } = useLocalSearchParams();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>(jobId ? String(jobId) : '');
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobsData = await apiService.getJobs();
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (err) {
        console.log(err);
      } finally {
        setFetchingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleUpload = async () => {
    if (!selectedJob) {
      Alert.alert('Error', 'Please select a job first');
      return;
    }
    if (!file) {
      Alert.alert('Error', 'Please select a PDF file');
      return;
    }

    setLoading(true);
    try {
      const job = jobs.find(j => String(j.id || j.ID) === selectedJob);
      const jd = job?.description || 'No JD';

      const res = await apiService.uploadScreening(
        Number(selectedJob),
        jd,
        file.uri,
        file.name
      );
      
      Alert.alert('Success', 'CV has been screened successfully!', [
        { 
          text: 'View Result', 
          onPress: () => {
            router.back();
            router.push(`/screening/${res.id || res.ID || res.data?.id}`);
          }
        }
      ]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Job Position</Text>
      <View style={styles.pickerContainer}>
        {fetchingJobs ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Picker
            selectedValue={selectedJob}
            onValueChange={(itemValue) => setSelectedJob(itemValue)}
          >
            <Picker.Item label="Select a job..." value="" />
            {jobs.map(job => (
              <Picker.Item key={job.id || job.ID} label={job.title} value={String(job.id || job.ID)} />
            ))}
          </Picker>
        )}
      </View>

      <Text style={styles.label}>Upload CV (PDF)</Text>
      <TouchableOpacity style={[styles.uploadBox, Shadow.sm]} onPress={pickDocument}>
        <Ionicons name="document-text" size={48} color={file ? Colors.primary : Colors.textTertiary} />
        <Text style={[styles.uploadText, file && { color: Colors.primary, fontWeight: 'bold' }]}>
          {file ? file.name : 'Tap to select PDF file'}
        </Text>
        {file && (
          <Text style={styles.fileSize}>
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btn, (!file || !selectedJob || loading) && styles.btnDisabled]} 
        onPress={handleUpload}
        disabled={!file || !selectedJob || loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color={Colors.white} />
            <Text style={styles.btnText}>Screen CV with AI</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.xl },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
    height: 50,
  },
  uploadBox: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' },
  fileSize: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.xs },
  btn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: 'auto',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.lg },
});
