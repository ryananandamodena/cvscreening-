import { apiService } from './api.service';

export interface ApprovalFlowLevel {
  id?: number;
  levelOrder: number;
  levelName: string;
  approverType: 'manager_of_requester' | 'role' | 'specific_user';
  approverRole?: string;
  approverEmployeeId?: number;
  approverEmployeeName?: string;
}

export interface ApprovalFlow {
  id: number;
  moduleName: string;
  flowName: string;
  isActive: boolean;
  effectiveDate: string;
  levels: ApprovalFlowLevel[];
}

export interface ApprovalRequest {
  id: number;
  moduleName: string;
  referenceId: number;
  requesterEmployeeId: number;
  requesterEmployeeName?: string;
  currentLevel: number;
  status: string;
  summary: string;
  createdAt: string;
  levels?: ApprovalFlowLevel[];
  history?: Array<{
    levelOrder: number;
    actorEmployeeName: string;
    action: string;
    comment: string;
    createdAt: string;
  }>;
}

export const MODULE_LABELS: Record<string, string> = {
  attendance_correction: 'Koreksi Absensi',
  overtime_request: 'Pengajuan Lembur',
  leave_request: 'Pengajuan Cuti',
  business_trip: 'Perjalanan Dinas',
  remote_working: 'Kerja Remote',
  shift_change: 'Perubahan Shift',
  payroll_adjustment: 'Penyesuaian Payroll',
  reimbursement: 'Reimbursement',
};

export const approvalEngineService = {
  // Flow configuration (HR/Admin)
  createFlow: async (data: {
    moduleName: string;
    flowName: string;
    isActive: boolean;
    levels: Array<{ levelOrder: number; levelName: string; approverType: string; approverRole?: string; approverEmployeeId?: number }>;
  }): Promise<any> => {
    return apiService.post('/approvals/flows', data);
  },

  getFlows: async (moduleName?: string): Promise<ApprovalFlow[]> => {
    return apiService.get(`/approvals/flows${moduleName ? `?module=${moduleName}` : ''}`);
  },

  setFlowActive: async (id: number, active: boolean): Promise<any> => {
    return apiService.put(`/approvals/flows/${id}/active`, { active });
  },

  deleteFlow: async (id: number): Promise<any> => {
    return apiService.delete(`/approvals/flows/${id}`);
  },

  // Requests
  getMine: async (moduleName?: string): Promise<ApprovalRequest[]> => {
    return apiService.get(`/approvals/requests/mine${moduleName ? `?module=${moduleName}` : ''}`);
  },

  getPending: async (): Promise<ApprovalRequest[]> => {
    return apiService.get('/approvals/requests/pending');
  },

  getById: async (id: number): Promise<ApprovalRequest> => {
    return apiService.get(`/approvals/requests/${id}`);
  },

  act: async (id: number, action: 'approve' | 'reject' | 'return' | 'delegate', comment: string, delegateToEmployeeId?: number): Promise<any> => {
    return apiService.put(`/approvals/requests/${id}/act`, { action, comment, delegateToEmployeeId });
  },

  cancel: async (id: number): Promise<any> => {
    return apiService.put(`/approvals/requests/${id}/cancel`, {});
  },

  // Delegations
  createDelegation: async (data: { delegateEmployeeId: number; moduleName?: string; startDate: string; endDate: string }): Promise<any> => {
    return apiService.post('/approvals/delegations', data);
  },

  getMyDelegations: async (): Promise<any[]> => {
    return apiService.get('/approvals/delegations');
  },

  deactivateDelegation: async (id: number): Promise<any> => {
    return apiService.put(`/approvals/delegations/${id}/deactivate`, {});
  },
};

export default approvalEngineService;
