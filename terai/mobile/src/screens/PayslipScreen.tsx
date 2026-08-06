import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import mobileApiService from '../services/api.service';
import { Payslip } from '../types';

type PayslipScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payslip'>;

interface Props {
  navigation: PayslipScreenNavigationProp;
}

const PayslipScreen: React.FC<Props> = ({ navigation }) => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockPayslips: Payslip[] = [
        {
          id: 1,
          employeeId: 1,
          period: 'December 2023',
          basicSalary: 15000000,
          allowances: 2000000,
          deductions: 500000,
          netSalary: 16500000,
          status: 'paid',
          paymentDate: '2024-01-05',
          components: [
            { type: 'allowance', name: 'Transport Allowance', amount: 1000000, description: 'Monthly transport' },
            { type: 'allowance', name: 'Meal Allowance', amount: 500000, description: 'Lunch allowance' },
            { type: 'allowance', name: 'Position Allowance', amount: 500000, description: 'Senior position' },
            { type: 'deduction', name: 'BPJS Kesehatan', amount: 300000, description: 'Health insurance' },
            { type: 'deduction', name: 'BPJS Ketenagakerjaan', amount: 200000, description: 'Employment insurance' },
          ]
        },
        {
          id: 2,
          employeeId: 1,
          period: 'November 2023',
          basicSalary: 15000000,
          allowances: 2000000,
          deductions: 500000,
          netSalary: 16500000,
          status: 'paid',
          paymentDate: '2023-12-05',
          components: []
        },
        {
          id: 3,
          employeeId: 1,
          period: 'October 2023',
          basicSalary: 15000000,
          allowances: 2000000,
          deductions: 500000,
          netSalary: 16500000,
          status: 'paid',
          paymentDate: '2023-11-05',
          components: []
        }
      ];
      setPayslips(mockPayslips);
      if (mockPayslips.length > 0) {
        setSelectedPayslip(mockPayslips[0]);
      }
    } catch (error) {
      console.error('Failed to load payslips:', error);
      Alert.alert('Error', 'Failed to load payslip data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payslip: Payslip) => {
    try {
      // Mock download - in real app, this would download the actual PDF
      Alert.alert('Download Started', `Downloading payslip for ${payslip.period}`);

      // Share functionality as alternative
      await Share.share({
        message: `Payslip for ${payslip.period}\nNet Salary: Rp ${payslip.netSalary.toLocaleString()}`,
        title: `Payslip - ${payslip.period}`,
      });
    } catch (error) {
      console.error('Failed to download payslip:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading payslips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Payslip List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Your Payslips</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.payslipScroll}>
          {payslips.map((payslip) => (
            <TouchableOpacity
              key={payslip.id}
              style={[
                styles.payslipCard,
                selectedPayslip?.id === payslip.id && styles.selectedPayslipCard
              ]}
              onPress={() => setSelectedPayslip(payslip)}
            >
              <Text style={styles.payslipPeriod}>{payslip.period}</Text>
              <Text style={styles.payslipAmount}>Rp {payslip.netSalary.toLocaleString()}</Text>
              <Text style={[styles.payslipStatus, { color: getStatusColor(payslip.status) }]}>
                {payslip.status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Payslip Details */}
      {selectedPayslip && (
        <ScrollView style={styles.detailsContainer}>
          <View style={styles.payslipHeader}>
            <Text style={styles.companyName}>RecruitAI</Text>
            <Text style={styles.payslipTitle}>Payslip</Text>
            <Text style={styles.periodText}>{selectedPayslip.period}</Text>
          </View>

          {/* Employee Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employee Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>John Doe</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue}>EMP001</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Position</Text>
                <Text style={styles.infoValue}>Senior Software Engineer</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>Engineering</Text>
              </View>
            </View>
          </View>

          {/* Salary Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Breakdown</Text>

            {/* Earnings */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Earnings</Text>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Basic Salary</Text>
                <Text style={styles.breakdownValue}>Rp {selectedPayslip.basicSalary.toLocaleString()}</Text>
              </View>

              {selectedPayslip.components
                .filter(comp => comp.type === 'allowance')
                .map((component, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>{component.name}</Text>
                    <Text style={styles.breakdownValue}>Rp {component.amount.toLocaleString()}</Text>
                  </View>
                ))}

              <View style={[styles.breakdownItem, styles.totalItem]}>
                <Text style={[styles.breakdownLabel, styles.totalLabel]}>Total Earnings</Text>
                <Text style={[styles.breakdownValue, styles.totalValue]}>
                  Rp {(selectedPayslip.basicSalary + selectedPayslip.allowances).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Deductions */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>Deductions</Text>
              {selectedPayslip.components
                .filter(comp => comp.type === 'deduction')
                .map((component, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>{component.name}</Text>
                    <Text style={styles.breakdownValue}>(Rp {component.amount.toLocaleString()})</Text>
                  </View>
                ))}

              <View style={[styles.breakdownItem, styles.totalItem]}>
                <Text style={[styles.breakdownLabel, styles.totalLabel]}>Total Deductions</Text>
                <Text style={[styles.breakdownValue, styles.totalValue]}>
                  (Rp {selectedPayslip.deductions.toLocaleString()})
                </Text>
              </View>
            </View>

            {/* Net Salary */}
            <View style={[styles.breakdownItem, styles.netSalaryItem]}>
              <Text style={[styles.breakdownLabel, styles.netSalaryLabel]}>Net Salary</Text>
              <Text style={[styles.breakdownValue, styles.netSalaryValue]}>
                Rp {selectedPayslip.netSalary.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Payment Date</Text>
                <Text style={styles.infoValue}>
                  {selectedPayslip.paymentDate ? new Date(selectedPayslip.paymentDate).toLocaleDateString() : 'Pending'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>Bank Transfer</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: getStatusColor(selectedPayslip.status) }]}>
                  {selectedPayslip.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownloadPayslip(selectedPayslip)}
            >
              <Text style={styles.downloadButtonText}>📄 Download PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => handleDownloadPayslip(selectedPayslip)}
            >
              <Text style={styles.shareButtonText}>📤 Share Payslip</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
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
  },
  listContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  payslipScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  payslipCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPayslipCard: {
    borderColor: '#4F46E5',
    backgroundColor: '#f0f4ff',
  },
  payslipPeriod: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  payslipAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  payslipStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  payslipHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  payslipTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  periodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontWeight: '600',
    color: '#1f2937',
  },
  netSalaryItem: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  netSalaryLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  netSalaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PayslipScreen;