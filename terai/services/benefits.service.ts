import { apiService } from './api.service';

export interface InsurancePlan {
  id: number;
  name: string;
  provider: string;
  type: 'health' | 'dental' | 'life' | 'disability';
  coverageAmount: number;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'annually';
  description: string;
  terms: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// InsuranceEnrollment mirrors models.EmployeeInsuranceEnrollment (Go) — the real
// shape returned by /benefits/insurance-enrollments. Distinct from EmployeeBenefit
// below, which describes the generic benefit_plans enrollment model.
export interface InsuranceEnrollment {
  id: number;
  employeeId: number;
  planId: number;
  effectiveDate: string;
  endDate?: string;
  status: 'active' | 'pending' | 'inactive' | 'terminated';
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
  employeeName?: string;
  planName?: string;
  planType?: string;
}

export interface EmployeeBenefit {
  id: number;
  employeeId: number;
  employeeName: string;
  benefitType: 'insurance' | 'allowance' | 'flexible' | 'retirement';
  planId?: number;
  planName?: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  effectiveDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'pending' | 'terminated';
  enrollmentDate: string;
  dependents: Dependent[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Dependent {
  id: number;
  employeeId: number;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  isCovered: boolean;
  coverageStartDate?: string;
  coverageEndDate?: string;
}

export interface Allowance {
  id: number;
  name: string;
  description: string;
  category: 'transport' | 'meal' | 'housing' | 'education' | 'health' | 'other';
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  taxable: boolean;
  active: boolean;
  eligibilityCriteria?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlexibleBenefit {
  id: number;
  name: string;
  description: string;
  category: 'health' | 'wellness' | 'learning' | 'commuter' | 'other';
  maxAmount: number;
  taxAdvantaged: boolean;
  provider?: string;
  terms: string;
  active: boolean;
  enrollmentPeriodStart?: string;
  enrollmentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetirementPlan {
  id: number;
  name: string;
  provider: string;
  planType: 'defined_benefit' | 'defined_contribution' | 'hybrid';
  employeeContribution: number; // percentage
  employerContribution: number; // percentage
  vestingSchedule: string;
  retirementAge: number;
  description: string;
  terms: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BenefitsAnalytics {
  totalActiveBenefits: number;
  totalMonthlyCost: number;
  totalAnnualCost: number;
  benefitsByType: Record<string, number>;
  benefitsByDepartment: Array<{
    department: string;
    count: number;
    cost: number;
  }>;
  enrollmentTrends: Array<{
    month: string;
    enrollments: number;
    terminations: number;
  }>;
  topBenefits: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

// BenefitPlan / real backend model — matches models.BenefitPlan in sservice_cvsreening.
// This is the plan type actually persisted in the database today (benefit_plans table);
// InsurancePlan/Allowance/FlexibleBenefit/RetirementPlan below describe a richer benefit
// taxonomy the UI was designed for, but no backend tables/endpoints exist for them yet.
export interface BenefitPlan {
  id: number;
  name: string;
  category: 'health' | 'life' | 'dental' | 'vision' | 'pension' | 'other';
  provider: string;
  description: string;
  coverageAmount: number;
  employeeContribution: number;
  employerContribution: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceContinuation {
  id: number;
  employeeId: number;
  originalEnrollmentId?: number;
  terminationDate: string;
  continuationEndDate: string;
  monthlyPremium: number;
  status: 'active' | 'expired' | 'cancelled';
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
  employeeName?: string;
}

export const benefitsService = {
  // Benefit Plans (real, database-backed — see BenefitPlan above)
  getBenefitPlans: async (): Promise<BenefitPlan[]> => {
    return apiService.get('/benefits/plans');
  },

  createBenefitPlan: async (data: Partial<BenefitPlan>): Promise<{ id: number }> => {
    return apiService.post('/benefits/plans', data);
  },

  updateBenefitPlan: async (id: number, data: Partial<BenefitPlan>): Promise<void> => {
    return apiService.put(`/benefits/plans/${id}`, data);
  },

  deleteBenefitPlan: async (id: number): Promise<void> => {
    return apiService.delete(`/benefits/plans/${id}`);
  },

  enrollInBenefitPlan: async (employeeId: number, planId: number, startDate?: string): Promise<{ id: number }> => {
    return apiService.post('/benefits/enroll', { employeeId, planId, startDate });
  },

  unenrollFromBenefitPlan: async (employeeId: number, planId: number): Promise<void> => {
    return apiService.post('/benefits/unenroll', { employeeId, planId });
  },

  // Insurance Plans
  getInsurancePlans: async (type?: string): Promise<InsurancePlan[]> => {
    const params = type ? `?type=${type}` : '';
    return apiService.get(`/benefits/insurance-plans${params}`);
  },

  createInsurancePlan: async (data: Partial<InsurancePlan>): Promise<InsurancePlan> => {
    return apiService.post('/benefits/insurance-plans', data);
  },

  updateInsurancePlan: async (id: number, data: Partial<InsurancePlan>): Promise<InsurancePlan> => {
    return apiService.put(`/benefits/insurance-plans/${id}`, data);
  },

  deleteInsurancePlan: async (id: number): Promise<void> => {
    return apiService.delete(`/benefits/insurance-plans/${id}`);
  },

  // Insurance enrollment — distinct from enrollEmployeeBenefit/enrollInBenefitPlan
  // below, which both post to the shared /benefits/enroll route for the generic
  // benefit_plans model. Insurance plans have their own enroll endpoint per plan.
  enrollInInsurancePlan: async (planId: number, employeeId: number, effectiveDate?: string): Promise<{ id: number }> => {
    return apiService.post(`/benefits/insurance-plans/${planId}/enroll`, { employeeId, effectiveDate });
  },

  getEmployeeInsuranceEnrollments: async (employeeId?: number): Promise<InsuranceEnrollment[]> => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    return apiService.get(`/benefits/insurance-enrollments${params}`);
  },

  terminateInsuranceEnrollment: async (enrollmentId: number, endDate?: string, reason?: string): Promise<void> => {
    return apiService.put(`/benefits/insurance-enrollments/${enrollmentId}/terminate`, { endDate, reason });
  },

  // Dependents (see also getDependents/addDependent/etc. below, already matching
  // the real /benefits/dependents/:employeeId[...] endpoints)

  // Employee Benefits
  getEmployeeBenefits: async (employeeId?: number): Promise<EmployeeBenefit[]> => {
    const url = employeeId ? `/benefits/employee/${employeeId}` : '/benefits/employee';
    return apiService.get(url);
  },

  enrollEmployeeBenefit: async (data: {
    employeeId: number;
    benefitType: string;
    planId?: number;
    effectiveDate: string;
    dependents?: Partial<Dependent>[];
  }): Promise<EmployeeBenefit> => {
    return apiService.post('/benefits/enroll', data);
  },

  updateEmployeeBenefit: async (id: number, data: Partial<EmployeeBenefit>): Promise<EmployeeBenefit> => {
    return apiService.put(`/benefits/employee/${id}`, data);
  },

  terminateEmployeeBenefit: async (id: number, terminationDate: string, reason: string): Promise<void> => {
    return apiService.post(`/benefits/terminate/${id}`, { terminationDate, reason });
  },

  // Dependents
  getDependents: async (employeeId: number): Promise<Dependent[]> => {
    return apiService.get(`/benefits/dependents/${employeeId}`);
  },

  addDependent: async (employeeId: number, data: Partial<Dependent>): Promise<Dependent> => {
    return apiService.post(`/benefits/dependents/${employeeId}`, data);
  },

  updateDependent: async (employeeId: number, dependentId: number, data: Partial<Dependent>): Promise<Dependent> => {
    return apiService.put(`/benefits/dependents/${employeeId}/${dependentId}`, data);
  },

  removeDependent: async (employeeId: number, dependentId: number): Promise<void> => {
    return apiService.delete(`/benefits/dependents/${employeeId}/${dependentId}`);
  },

  // Allowances
  getAllowances: async (): Promise<Allowance[]> => {
    return apiService.get('/benefits/allowances');
  },

  createAllowance: async (data: Partial<Allowance>): Promise<Allowance> => {
    return apiService.post('/benefits/allowances', data);
  },

  updateAllowance: async (id: number, data: Partial<Allowance>): Promise<Allowance> => {
    return apiService.put(`/benefits/allowances/${id}`, data);
  },

  deleteAllowance: async (id: number): Promise<void> => {
    return apiService.delete(`/benefits/allowances/${id}`);
  },

  assignAllowanceToEmployee: async (employeeId: number, allowanceId: number, data: {
    amount: number;
    effectiveDate: string;
  }): Promise<void> => {
    return apiService.post(`/benefits/employee/${employeeId}/allowances/${allowanceId}`, data);
  },

  // Flexible Benefits
  getFlexibleBenefits: async (): Promise<FlexibleBenefit[]> => {
    return apiService.get('/benefits/flexible');
  },

  createFlexibleBenefit: async (data: Partial<FlexibleBenefit>): Promise<FlexibleBenefit> => {
    return apiService.post('/benefits/flexible', data);
  },

  updateFlexibleBenefit: async (id: number, data: Partial<FlexibleBenefit>): Promise<FlexibleBenefit> => {
    return apiService.put(`/benefits/flexible/${id}`, data);
  },

  enrollFlexibleBenefit: async (employeeId: number, benefitId: number, amount: number): Promise<void> => {
    return apiService.post(`/benefits/flexible/enroll`, {
      employeeId,
      benefitId,
      amount
    });
  },

  // Retirement Plans
  getRetirementPlans: async (): Promise<RetirementPlan[]> => {
    return apiService.get('/benefits/retirement');
  },

  createRetirementPlan: async (data: Partial<RetirementPlan>): Promise<RetirementPlan> => {
    return apiService.post('/benefits/retirement', data);
  },

  updateRetirementPlan: async (id: number, data: Partial<RetirementPlan>): Promise<RetirementPlan> => {
    return apiService.put(`/benefits/retirement/${id}`, data);
  },

  enrollRetirementPlan: async (employeeId: number, planId: number): Promise<void> => {
    return apiService.post(`/benefits/retirement/enroll`, {
      employeeId,
      planId
    });
  },

  // Open Enrollment
  startOpenEnrollment: async (data: {
    startDate: string;
    endDate: string;
    benefitTypes: string[];
    description: string;
  }): Promise<any> => {
    return apiService.post('/benefits/open-enrollment/start', data);
  },

  endOpenEnrollment: async (enrollmentId: number): Promise<void> => {
    return apiService.post(`/benefits/open-enrollment/${enrollmentId}/end`, {});
  },

  getOpenEnrollmentStatus: async (): Promise<any> => {
    return apiService.get('/benefits/open-enrollment/status');
  },

  // Insurance Continuation — Indonesian-context equivalent of "COBRA" (a US law
  // concept that doesn't apply here; employees typically rely on BPJS/private
  // insurance self-continuation after leaving employer-sponsored coverage).
  initiateInsuranceContinuation: async (employeeId: number, terminationDate: string, originalEnrollmentId?: number, monthlyPremium?: number): Promise<{ id: number }> => {
    return apiService.post('/benefits/insurance-continuation/initiate', {
      employeeId,
      terminationDate,
      originalEnrollmentId,
      monthlyPremium
    });
  },

  getInsuranceContinuations: async (employeeId?: number): Promise<InsuranceContinuation[]> => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    return apiService.get(`/benefits/insurance-continuation${params}`);
  },

  recordInsuranceContinuationPayment: async (continuationId: number, amount: number, paymentDate?: string): Promise<{ id: number }> => {
    return apiService.post(`/benefits/insurance-continuation/${continuationId}/payment`, { amount, paymentDate });
  },

  // Analytics & Reporting
  getBenefitsAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    departmentId?: number;
  }): Promise<BenefitsAnalytics> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/benefits/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  // Bulk Operations
  bulkEnrollBenefits: async (data: {
    employeeIds: number[];
    benefitType: string;
    planId?: number;
    effectiveDate: string;
  }): Promise<any> => {
    return apiService.post('/benefits/bulk-enroll', data);
  },

  bulkTerminateBenefits: async (data: {
    benefitIds: number[];
    terminationDate: string;
    reason: string;
  }): Promise<any> => {
    return apiService.post('/benefits/bulk-terminate', data);
  },

  // Export & Import
  exportBenefitsData: async (format: 'csv' | 'excel' | 'pdf', filters?: any): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    return apiService.get(`/benefits/export?${params.toString()}`);
  },

  importBenefitsData: async (file: File, type: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return apiService.postFormData('/benefits/import', formData);
  }
};

export default benefitsService;

