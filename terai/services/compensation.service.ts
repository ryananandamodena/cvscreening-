import { apiService } from './api.service';

export interface SalaryGrade {
  id: number;
  name: string;
  level: number;
  minSalary: number;
  maxSalary: number;
  midpoint: number;
  currency: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompensationStructure {
  id: number;
  employeeId: number;
  employeeName: string;
  positionId: number;
  positionName: string;
  gradeId: number;
  gradeName: string;
  baseSalary: number;
  currency: string;
  effectiveDate: string;
  endDate?: string;
  status: 'active' | 'pending' | 'expired';
  allowances: AllowanceComponent[];
  bonuses: BonusComponent[];
  deductions: DeductionComponent[];
  totalCompensation: number;
  createdAt: string;
  updatedAt: string;
}

export interface AllowanceComponent {
  id: number;
  name: string;
  type: 'fixed' | 'percentage' | 'variable';
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  taxable: boolean;
  description?: string;
}

export interface BonusComponent {
  id: number;
  name: string;
  type: 'performance' | 'spot' | 'retention' | 'signing' | 'other';
  amount: number;
  percentage?: number; // for percentage-based bonuses
  target?: string; // performance target for achievement
  payoutDate?: string;
  status: 'earned' | 'pending' | 'paid' | 'forfeited';
  description?: string;
}

export interface DeductionComponent {
  id: number;
  name: string;
  type: 'tax' | 'insurance' | 'retirement' | 'loan' | 'other';
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annually';
  mandatory: boolean;
  description?: string;
}

export interface CompensationReview {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewPeriod: string;
  currentSalary: number;
  proposedSalary: number;
  percentageIncrease: number;
  effectiveDate: string;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  reviewerId?: number;
  reviewerName?: string;
  reviewDate?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompensationAnalytics {
  totalEmployees: number;
  averageSalary: number;
  medianSalary: number;
  salaryRange: {
    min: number;
    max: number;
    percentiles: { [key: string]: number };
  };
  byDepartment: Array<{
    department: string;
    employeeCount: number;
    averageSalary: number;
    totalCompensation: number;
  }>;
  byGrade: Array<{
    grade: string;
    employeeCount: number;
    averageSalary: number;
    utilization: number; // percentage of employees in this grade
  }>;
  genderPayGap: number;
  compaRatio: number; // actual pay vs market rate
  turnoverCost: number;
  budgetUtilization: number;
}

export interface MarketData {
  id: number;
  position: string;
  location: string;
  experienceLevel: string;
  source: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
  currency: string;
  effectiveDate: string;
  sampleSize: number;
}

export const compensationService = {
  // Salary Grades
  getSalaryGrades: async (): Promise<SalaryGrade[]> => {
    return apiService.get('/compensation/grades');
  },

  createSalaryGrade: async (data: Partial<SalaryGrade>): Promise<SalaryGrade> => {
    return apiService.post('/compensation/grades', data);
  },

  updateSalaryGrade: async (id: number, data: Partial<SalaryGrade>): Promise<SalaryGrade> => {
    return apiService.put(`/compensation/grades/${id}`, data);
  },

  deleteSalaryGrade: async (id: number): Promise<void> => {
    return apiService.delete(`/compensation/grades/${id}`);
  },

  // Compensation Structures
  getCompensationStructures: async (employeeId?: number): Promise<CompensationStructure[]> => {
    const url = employeeId ? `/compensation/structures?employeeId=${employeeId}` : '/compensation/structures';
    return apiService.get(url);
  },

  getCompensationStructure: async (id: number): Promise<CompensationStructure> => {
    return apiService.get(`/compensation/structures/${id}`);
  },

  createCompensationStructure: async (data: Partial<CompensationStructure>): Promise<CompensationStructure> => {
    return apiService.post('/compensation/structures', data);
  },

  updateCompensationStructure: async (id: number, data: Partial<CompensationStructure>): Promise<CompensationStructure> => {
    return apiService.put(`/compensation/structures/${id}`, data);
  },

  // Salary Reviews
  getCompensationReviews: async (params?: {
    employeeId?: number;
    status?: string;
    reviewerId?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: CompensationReview[]; total: number; page: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/compensation/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  createCompensationReview: async (data: Partial<CompensationReview>): Promise<CompensationReview> => {
    return apiService.post('/compensation/reviews', data);
  },

  updateCompensationReview: async (id: number, data: Partial<CompensationReview>): Promise<CompensationReview> => {
    return apiService.put(`/compensation/reviews/${id}`, data);
  },

  submitCompensationReview: async (id: number): Promise<CompensationReview> => {
    return apiService.post(`/compensation/reviews/${id}/submit`, {});
  },

  approveCompensationReview: async (id: number, data: { comments?: string }): Promise<CompensationReview> => {
    return apiService.post(`/compensation/reviews/${id}/approve`, data);
  },

  rejectCompensationReview: async (id: number, data: { comments: string }): Promise<CompensationReview> => {
    return apiService.post(`/compensation/reviews/${id}/reject`, data);
  },

  // Bonuses
  getBonuses: async (employeeId?: number): Promise<BonusComponent[]> => {
    const url = employeeId ? `/compensation/bonuses?employeeId=${employeeId}` : '/compensation/bonuses';
    return apiService.get(url);
  },

  createBonus: async (data: Partial<BonusComponent>): Promise<BonusComponent> => {
    return apiService.post('/compensation/bonuses', data);
  },

  updateBonus: async (id: number, data: Partial<BonusComponent>): Promise<BonusComponent> => {
    return apiService.put(`/compensation/bonuses/${id}`, data);
  },

  payoutBonus: async (id: number): Promise<void> => {
    return apiService.post(`/compensation/bonuses/${id}/payout`, {});
  },

  // Allowances
  getAllowances: async (employeeId?: number): Promise<AllowanceComponent[]> => {
    const url = employeeId ? `/compensation/allowances?employeeId=${employeeId}` : '/compensation/allowances';
    return apiService.get(url);
  },

  createAllowance: async (data: Partial<AllowanceComponent>): Promise<AllowanceComponent> => {
    return apiService.post('/compensation/allowances', data);
  },

  updateAllowance: async (id: number, data: Partial<AllowanceComponent>): Promise<AllowanceComponent> => {
    return apiService.put(`/compensation/allowances/${id}`, data);
  },

  // Deductions
  getDeductions: async (employeeId?: number): Promise<DeductionComponent[]> => {
    const url = employeeId ? `/compensation/deductions?employeeId=${employeeId}` : '/compensation/deductions';
    return apiService.get(url);
  },

  createDeduction: async (data: Partial<DeductionComponent>): Promise<DeductionComponent> => {
    return apiService.post('/compensation/deductions', data);
  },

  updateDeduction: async (id: number, data: Partial<DeductionComponent>): Promise<DeductionComponent> => {
    return apiService.put(`/compensation/deductions/${id}`, data);
  },

  // Market Data
  getMarketData: async (params?: {
    position?: string;
    location?: string;
    experienceLevel?: string;
  }): Promise<MarketData[]> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/compensation/market-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  importMarketData: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.postFormData('/compensation/market-data/import', formData);
  },

  // Analytics & Reporting
  getCompensationAnalytics: async (params?: {
    departmentId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<CompensationAnalytics> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/compensation/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  // Budget Management
  getCompensationBudget: async (year: number): Promise<{
    totalBudget: number;
    utilizedBudget: number;
    remainingBudget: number;
    utilizationRate: number;
    byDepartment: Array<{
      department: string;
      budget: number;
      utilized: number;
      remaining: number;
    }>;
  }> => {
    return apiService.get(`/compensation/budget/${year}`);
  },

  updateCompensationBudget: async (year: number, data: {
    totalBudget: number;
    departmentBudgets?: Array<{ departmentId: number; budget: number }>;
  }): Promise<void> => {
    return apiService.put(`/compensation/budget/${year}`, data);
  },

  // Equity Compensation (for future expansion)
  getEquityGrants: async (employeeId?: number): Promise<any[]> => {
    const url = employeeId ? `/compensation/equity?employeeId=${employeeId}` : '/compensation/equity';
    return apiService.get(url);
  },

  grantEquity: async (data: {
    employeeId: number;
    grantType: 'stock_options' | 'rsu' | 'phantom_shares';
    quantity: number;
    grantPrice?: number;
    vestingSchedule: string;
    cliffPeriod?: number;
  }): Promise<any> => {
    return apiService.post('/compensation/equity', data);
  },

  // Export & Reporting
  exportCompensationData: async (format: 'csv' | 'excel' | 'pdf', filters?: any): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    return apiService.get(`/compensation/export?${params.toString()}`);
  },

  generateCompensationReport: async (type: 'salary_review' | 'budget_analysis' | 'market_comparison', params?: any): Promise<any> => {
    return apiService.post('/compensation/reports', { type, ...params });
  }
};

export default compensationService;