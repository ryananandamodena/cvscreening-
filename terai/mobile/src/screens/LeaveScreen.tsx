import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import mobileApiService from '../services/api.service';
import { LeaveRequest } from '../types';

type LeaveScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Leave'>;

interface Props {
  navigation: LeaveScreenNavigationProp;
}

const LeaveScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockRequests: LeaveRequest[] = [
        {
          id: 1,
          employeeId: 1,
          leaveType: 'annual',
          startDate: '2024-01-25',
          endDate: '2024-01-30',
          totalDays: 4,
          reason: 'Family vacation',
          status: 'approved',
          createdAt: '2024-01-10'
        },
        {
          id: 2,
          employeeId: 1,
          leaveType: 'sick',
          startDate: '2024-01-15',
          endDate: '2024-01-16',
          totalDays: 1,
          reason: 'Medical appointment',
          status: 'approved',
          createdAt: '2024-01-12'
        }
      ];
      setLeaveRequests(mockRequests);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      Alert.alert('Error', 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaveDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmitRequest = async () => {
    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setSubmitting(true);
    try {
      const totalDays = calculateLeaveDays(formData.startDate, formData.endDate);
      const requestData = {
        employeeId: 1, // Get from user context
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays,
        reason: formData.reason,
      };

      // API call would go here
      // await mobileApiService.post('/leaves', requestData);

      // Mock success
      const newRequest: LeaveRequest = {
        id: Date.now(),
        ...requestData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      setLeaveRequests(prev => [newRequest, ...prev]);
      setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' });

      Alert.alert('Success', 'Leave request submitted successfully!', [
        { text: 'OK', onPress: () => setActiveTab('history') }
      ]);
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      Alert.alert('Error', 'Failed to submit leave request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading leave data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'request' && styles.activeTab]}
          onPress={() => setActiveTab('request')}
        >
          <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>
            Request Leave
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'request' && (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>New Leave Request</Text>

          {/* Leave Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Leave Type *</Text>
            <View style={styles.pickerContainer}>
              {['annual', 'sick', 'personal', 'maternity'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pickerOption, formData.leaveType === type && styles.selectedOption]}
                  onPress={() => setFormData({ ...formData, leaveType: type })}
                >
                  <Text style={[styles.pickerText, formData.leaveType === type && styles.selectedText]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.dateContainer}>
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>Start Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              />
            </View>
            <View style={styles.dateInput}>
              <Text style={styles.inputLabel}>End Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.endDate}
                onChangeText={(text) => setFormData({ ...formData, endDate: text })}
              />
            </View>
          </View>

          {/* Total Days */}
          {formData.startDate && formData.endDate && (
            <View style={styles.totalDaysContainer}>
              <Text style={styles.totalDaysText}>
                Total Days: {calculateLeaveDays(formData.startDate, formData.endDate)}
              </Text>
            </View>
          )}

          {/* Reason */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please provide a reason for your leave request..."
              value={formData.reason}
              onChangeText={(text) => setFormData({ ...formData, reason: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitRequest}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'history' && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Leave History</Text>

          {leaveRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📋</Text>
              <Text style={styles.emptyStateTitle}>No leave requests yet</Text>
              <Text style={styles.emptyStateText}>Your leave history will appear here</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setActiveTab('request')}
              >
                <Text style={styles.emptyStateButtonText}>Request Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {leaveRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestType}>
                      <Text style={styles.requestTypeIcon}>
                        {request.leaveType === 'annual' ? '🏖️' :
                         request.leaveType === 'sick' ? '🤒' :
                         request.leaveType === 'personal' ? '🏠' : '👶'}
                      </Text>
                      <View>
                        <Text style={styles.requestTypeText}>
                          {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave
                        </Text>
                        <Text style={styles.requestDays}>{request.totalDays} days</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                      <Text style={styles.statusIcon}>{getStatusIcon(request.status)}</Text>
                      <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.requestDates}>
                    <Text style={styles.dateRange}>
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text style={styles.requestReason}>{request.reason}</Text>

                  <View style={styles.requestFooter}>
                    <Text style={styles.requestDate}>
                      Requested on {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  selectedOption: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  pickerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
  },
  totalDaysContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  totalDaysText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    padding: 20,
  },
  requestsList: {
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestTypeIcon: {
    fontSize: 24,
  },
  requestTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  requestDays: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDates: {
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 14,
    color: '#6b7280',
  },
  requestReason: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  requestDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LeaveScreen;