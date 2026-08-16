import { apiService } from './api.service';
import { Attendance, Shift } from '../types';

export const attendanceService = {
  // ── Attendance ──────────────────────────────────────────────
  clockIn: async (data: { employeeId: number; location?: any; photo?: string; latitude?: number; longitude?: number; qrToken?: string; faceDescriptor?: number[] }): Promise<any> => {
    return apiService.post<any>('/attendance/clock-in', data);
  },

  clockOut: async (data: { employeeId: number; location?: any; photo?: string; latitude?: number; longitude?: number; notes?: string; qrToken?: string }): Promise<any> => {
    return apiService.post<any>('/attendance/clock-out', data);
  },

  getTodayAttendance: async (employeeId: number): Promise<Attendance | { status: string }> => {
    return apiService.get<any>(`/attendance/today?employeeId=${employeeId}`);
  },

  getHistory: async (employeeId: number, startDate?: string, endDate?: string): Promise<Attendance[]> => {
    let url = `/attendance/history?employeeId=${employeeId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return apiService.get<Attendance[]>(url);
  },

  getTeamAttendance: async (date?: string): Promise<{
    date: string;
    data: Array<{
      employeeId: number;
      employeeName: string;
      department: string;
      position: string;
      status: 'present' | 'late' | 'absent' | 'leave' | 'holiday';
      clockIn?: string;
      clockOut?: string;
    }>;
    summary: { total: number; present: number; late: number; absent: number; leave: number; holiday: number };
  }> => {
    const url = date ? `/attendance/team?date=${date}` : '/attendance/team';
    return apiService.get<any>(url);
  },

  getOfficeLocation: async (): Promise<{ latitude: number; longitude: number; radiusMeters: number }> => {
    return apiService.get<any>('/attendance/office-location');
  },

  updateOfficeLocation: async (data: { latitude: number; longitude: number; radiusMeters?: number }): Promise<any> => {
    return apiService.put<any>('/attendance/office-location', data);
  },

  // Per-employee override letting HR/Admin dynamically allow a specific employee to clock
  // in/out from outside the office geofencing radius (remote workers, field staff, temporary
  // WFH), without touching the shared office location every other employee is checked against.
  getLocationExemptions: async (): Promise<{
    exemptions: Array<{
      employeeId: number;
      fullName: string;
      employeeCode: string;
      enabled: boolean;
      reason: string;
      startDate: string | null;
      endDate: string | null;
    }>;
  }> => {
    return apiService.get<any>('/attendance/location-exemptions');
  },

  setLocationExemption: async (
    employeeId: number,
    data: { enabled: boolean; reason?: string; startDate?: string | null; endDate?: string | null }
  ): Promise<any> => {
    return apiService.put<any>(`/attendance/location-exemptions/${employeeId}`, data);
  },

  breakStart: async (): Promise<any> => {
    return apiService.post<any>('/attendance/break-start', {});
  },

  breakEnd: async (): Promise<any> => {
    return apiService.post<any>('/attendance/break-end', {});
  },

  getTodayBreaks: async (): Promise<Array<{ id: number; breakStart: string; breakEnd?: string }>> => {
    return apiService.get<any>('/attendance/today-breaks');
  },

  getMonthlyReport: async (year: number, month: number, employeeId?: number): Promise<{
    year: number;
    month: number;
    data: Array<{
      employeeId: number;
      employeeName: string;
      department: string;
      workingDays: number;
      presentDays: number;
      lateDays: number;
      leaveDays: number;
      absentDays: number;
      totalLateMinutes: number;
      totalOvertimeHours: number;
    }>;
    daily: Array<{ date: string; present: number; late: number }>;
  }> => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (employeeId) params.append('employeeId', String(employeeId));
    return apiService.get<any>(`/attendance/reports/monthly?${params.toString()}`);
  },

  // ── Shifts ───────────────────────────────────────────────────
  getShifts: async (): Promise<Shift[]> => {
    return apiService.get<Shift[]>('/shifts');
  },

  createShift: async (data: Partial<Shift>): Promise<any> => {
    return apiService.post<any>('/shifts', data);
  },

  updateShift: async (id: number, data: Partial<Shift>): Promise<any> => {
    return apiService.put<any>(`/shifts/${id}`, data);
  },

  deleteShift: async (id: number): Promise<any> => {
    return apiService.delete<any>(`/shifts/${id}`);
  },

  getEmployeeShift: async (employeeId: number, date?: string): Promise<Shift | { status: string }> => {
    let url = `/employees/${employeeId}/shift`;
    if (date) url += `?date=${date}`;
    return apiService.get<any>(url);
  },

  // ── Shift Assignments ─────────────────────────────────────────
  assignShift: async (data: { employeeId: number; shiftId: number; effectiveDate: string; endDate?: string }): Promise<any> => {
    return apiService.post<any>('/shifts/assign', data);
  },

  getShiftAssignments: async (): Promise<any[]> => {
    return apiService.get<any[]>('/shifts/assignments');
  },

  removeShiftAssignment: async (id: number): Promise<any> => {
    return apiService.delete<any>(`/shifts/assignments/${id}`);
  },
};

export default attendanceService;
