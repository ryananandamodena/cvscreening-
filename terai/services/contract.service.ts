import { apiService } from './api.service';

export interface EmployeeContract {
  id: number;
  employeeId: number;
  contractType: string;
  contractNumber: string;
  startDate: string;
  endDate?: string;
  documentPath?: string;
  status: string;
  renewalCount: number;
  previousContractId?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employeeName?: string;
  daysToExpiry?: number;
  signatureUrl?: string;
  signedAt?: string;
}

export const contractService = {
  getEmployeeContracts: async (employeeId: number): Promise<EmployeeContract[]> => {
    return apiService.get<EmployeeContract[]>(`/employees/${employeeId}/contracts`);
  },

  createContract: async (employeeId: number, data: Partial<EmployeeContract>): Promise<{ id: number; message: string }> => {
    return apiService.post<{ id: number; message: string }>(`/employees/${employeeId}/contracts`, data);
  },

  getExpiringContracts: async (days: number = 30): Promise<EmployeeContract[]> => {
    return apiService.get<EmployeeContract[]>(`/contracts/expiring?days=${days}`);
  },

  signContract: async (contractId: number, signatureBase64: string): Promise<{ message: string; signatureUrl: string }> => {
    return apiService.post<{ message: string; signatureUrl: string }>(`/contracts/${contractId}/sign`, { signatureBase64 });
  },
};

export default contractService;
