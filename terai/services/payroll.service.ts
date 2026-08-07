import { apiService } from './api.service';

export interface PayrollPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  paymentDate?: string;
  status: string;
  totalDisbursement: number;
  createdAt: string;
}

export interface SalaryConfiguration {
  id: number;
  employeeId: number;
  employeeName?: string;
  baseSalary: number;
  transportAllowance: number;
  mealAllowance: number;
  positionAllowance: number;
  bpjsKesehatanType: string;
  bpjsKetenagakerjaanType: string;
  gradeLevel?: number;
  gradeName?: string;
  // Most recent completed performance_reviews rating — informational only, doesn't
  // drive any automatic salary change.
  latestPerformanceRating?: number;
}

export interface Payslip {
  id: number;
  periodId: number;
  employeeId: number;
  employeeName: string;
  employeeIdStr: string;
  basicSalary: number;
  totalAllowance: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
  paidAt?: string;
  departmentName?: string; // reused by self-service endpoints to carry the payroll period label
  components?: any[];
}

export interface SalaryComponent {
  id: number;
  payslipId: number;
  name: string;
  type: 'allowance' | 'deduction';
  amount: number;
  description?: string;
}

export interface PayGrade {
  id: number;
  level: number;
  name: string;
  minSalary: number;
  maxSalary: number;
  defaultTransportAllowance: number;
  defaultMealAllowance: number;
  defaultPositionAllowance: number;
  isOvertimeEligible: boolean;
  requiresApprovalForChange: boolean;
}

export interface BPJSRateConfig {
  kesehatanRateEmployee: number;
  kesehatanSalaryCap: number;
  jhtRateEmployee: number;
  jpRateEmployee: number;
  jpSalaryCap: number;
  updatedAt?: string;
}

export interface PPh21TERBracket {
  id?: number;
  category: 'A' | 'B' | 'C';
  bracketOrder: number;
  upTo: number | null; // null = unbounded (highest bracket)
  rate: number;
}

export interface DeductionType {
  id: number;
  name: string;
  description?: string;
  calculationType: 'fixed' | 'percentage_of_base';
  defaultAmount: number;
  defaultRate: number;
  isActive: boolean;
}

export interface EmployeeDeduction {
  id: number;
  employeeId: number;
  deductionTypeId: number;
  amount?: number | null;
  rate?: number | null;
  remainingBalance?: number | null;
  notes?: string;
  isActive: boolean;
  employeeName?: string;
  deductionName?: string;
  calculationType?: string;
}

export const payrollService = {
  getPeriods: async (): Promise<PayrollPeriod[]> => {
    return apiService.get<PayrollPeriod[]>('/payroll/periods');
  },

  createPeriod: async (data: Partial<PayrollPeriod>): Promise<PayrollPeriod> => {
    return apiService.post<PayrollPeriod>('/payroll/periods', data);
  },

  getSalaryConfigs: async (): Promise<SalaryConfiguration[]> => {
    return apiService.get<SalaryConfiguration[]>('/payroll/configurations');
  },

  updateSalaryConfig: async (data: Partial<SalaryConfiguration>): Promise<any> => {
    return apiService.post<any>('/payroll/configurations', data);
  },

  // Always routes through the salary_change approval flow, regardless of the
  // employee's grade — unlike updateSalaryConfig, which only requires approval
  // for grades flagged requiresApprovalForChange. HR still enters the figures.
  requestSalaryChange: async (data: {
    employeeId: number;
    baseSalary: number;
    transportAllowance?: number;
    mealAllowance?: number;
    positionAllowance?: number;
    reason?: string;
  }): Promise<{ message: string }> => {
    return apiService.post('/payroll/salary-change-requests', data);
  },

  generatePayroll: async (periodId: number): Promise<any> => {
    return apiService.post<any>(`/payroll/generate/${periodId}`, {});
  },

  updatePeriodStatus: async (periodId: number, status: 'draft' | 'processing' | 'closed' | 'cancelled'): Promise<any> => {
    return apiService.put<any>(`/payroll/periods/${periodId}/status`, { status });
  },

  getPayslips: async (periodId: number): Promise<Payslip[]> => {
    return apiService.get<Payslip[]>(`/payroll/payslips?periodId=${periodId}`);
  },

  getPayGrades: async (): Promise<PayGrade[]> => {
    return apiService.get<PayGrade[]>('/payroll/grades');
  },

  updatePayGrade: async (data: Partial<PayGrade>): Promise<any> => {
    return apiService.put<any>('/payroll/grades', data);
  },

  getMyPayslips: async (): Promise<Payslip[]> => {
    return apiService.get<Payslip[]>('/payroll/my-payslips');
  },

  getMyPayslipComponents: async (payslipId: number): Promise<SalaryComponent[]> => {
    return apiService.get<SalaryComponent[]>(`/payroll/my-payslips/${payslipId}/components`);
  },

  getTeamPayslips: async (): Promise<Payslip[]> => {
    return apiService.get<Payslip[]>('/payroll/team-payslips');
  },

  getBPJSConfig: async (): Promise<BPJSRateConfig> => {
    return apiService.get<BPJSRateConfig>('/payroll/bpjs-config');
  },

  updateBPJSConfig: async (data: BPJSRateConfig): Promise<any> => {
    return apiService.put<any>('/payroll/bpjs-config', data);
  },

  getTERBrackets: async (): Promise<PPh21TERBracket[]> => {
    return apiService.get<PPh21TERBracket[]>('/payroll/tax-brackets');
  },

  updateTERBrackets: async (category: 'A' | 'B' | 'C', brackets: PPh21TERBracket[]): Promise<any> => {
    return apiService.put<any>(`/payroll/tax-brackets/${category}`, { brackets });
  },

  simulate: async (data: {
    baseSalary: number;
    transportAllowance: number;
    mealAllowance: number;
    positionAllowance: number;
    taxStatus: string;
    bpjsKesehatanType: string;
    bpjsKetenagakerjaanType: string;
    extraDeductions?: { name: string; amount: number }[];
  }): Promise<SimulationResult> => {
    return apiService.post<SimulationResult>('/payroll/simulate', data);
  },

  getDeductionTypes: async (): Promise<DeductionType[]> => {
    return apiService.get<DeductionType[]>('/payroll/deduction-types');
  },

  createDeductionType: async (data: Partial<DeductionType>): Promise<any> => {
    return apiService.post<any>('/payroll/deduction-types', data);
  },

  updateDeductionType: async (id: number, data: Partial<DeductionType>): Promise<any> => {
    return apiService.put<any>(`/payroll/deduction-types/${id}`, data);
  },

  deleteDeductionType: async (id: number): Promise<any> => {
    return apiService.delete<any>(`/payroll/deduction-types/${id}`);
  },

  getEmployeeDeductions: async (employeeId: number): Promise<EmployeeDeduction[]> => {
    return apiService.get<EmployeeDeduction[]>(`/payroll/employees/${employeeId}/deductions`);
  },

  createEmployeeDeduction: async (data: Partial<EmployeeDeduction>): Promise<any> => {
    return apiService.post<any>('/payroll/employee-deductions', data);
  },

  setEmployeeDeductionActive: async (id: number, active: boolean): Promise<any> => {
    return apiService.put<any>(`/payroll/employee-deductions/${id}/active`, { active });
  },

  deleteEmployeeDeduction: async (id: number): Promise<any> => {
    return apiService.delete<any>(`/payroll/employee-deductions/${id}`);
  },
};

export interface SimulationResult {
  grossSalary: number;
  totalAllowance: number;
  bpjsKesehatan: number;
  bpjsJHT: number;
  bpjsJP: number;
  pph21: number;
  terCategory: string;
  extraDeductions: { name: string; amount: number }[];
  totalDeduction: number;
  netSalary: number;
}

export default payrollService;
