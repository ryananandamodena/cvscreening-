import { apiService } from './api.service';
import { LeaveType, LeaveBalance, LeaveRequest } from '../types';

export const leaveService = {
  // ── Leave Types ──────────────────────────────────────────────
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    return apiService.get<LeaveType[]>('/leave/types');
  },

  // ── Leave Balances ───────────────────────────────────────────
  getBalances: async (employeeId: number, year: number = new Date().getFullYear()): Promise<LeaveBalance[]> => {
    return apiService.get<LeaveBalance[]>(`/leave/balances?employeeId=${employeeId}&year=${year}`);
  },

  // ── Leave Requests ───────────────────────────────────────────
  getRequests: async (employeeId?: number, status?: string): Promise<LeaveRequest[]> => {
    let url = '/leave/requests';
    const params = [];
    if (employeeId) params.push(`employeeId=${employeeId}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiService.get<LeaveRequest[]>(url);
  },

  getRequestById: async (requestId: number): Promise<LeaveRequest> => {
    return apiService.get<LeaveRequest>(`/leave/requests/${requestId}`);
  },

  createRequest: async (data: {
    employeeId: number;
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    attachmentPath?: string;
  }): Promise<any> => {
    return apiService.post<any>('/leave/requests', data);
  },

  approveRequest: async (requestId: number, approverId: number): Promise<any> => {
    return apiService.put<any>(`/leave/requests/${requestId}/approve`, { approverId });
  },

  rejectRequest: async (requestId: number, approverId: number, rejectionReason: string): Promise<any> => {
    return apiService.put<any>(`/leave/requests/${requestId}/reject`, { approverId, rejectionReason });
  },

  cancelRequest: async (requestId: number, employeeId: number): Promise<any> => {
    return apiService.put<any>(`/leave/requests/${requestId}/cancel`, { employeeId });
  },

  // ── Holidays ─────────────────────────────────────────────────
  getHolidays: async (year: number = new Date().getFullYear()): Promise<any[]> => {
    return apiService.get<any[]>(`/holidays?year=${year}`);
  },
};

export default leaveService;
