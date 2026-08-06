import { apiService } from './api.service';

export interface AttendanceCorrection {
  id: number;
  employeeId: number;
  employeeName?: string;
  attendanceDate: string;
  correctionType: string;
  requestedClockIn?: string;
  requestedClockOut?: string;
  reason: string;
  evidenceUrl?: string;
  notes?: string;
  status: 'submitted' | 'manager_approved' | 'rejected_by_manager' | 'hr_approved' | 'rejected_by_hr' | 'cancelled';
  managerComment?: string;
  managerDecidedAt?: string;
  hrComment?: string;
  hrDecidedAt?: string;
  createdAt: string;
}

export const CORRECTION_TYPE_LABELS: Record<string, string> = {
  forgot_check_in: 'Lupa Check In',
  forgot_check_out: 'Lupa Check Out',
  wrong_check_in: 'Jam Check In Salah',
  wrong_check_out: 'Jam Check Out Salah',
  gps_failed: 'Validasi GPS Gagal',
  face_failed: 'Verifikasi Foto Gagal',
  system_error: 'Error Sistem',
  business_trip: 'Perjalanan Dinas',
  remote_working: 'Kerja Remote',
  official_duty: 'Tugas Resmi',
  other: 'Lainnya',
};

export const attendanceCorrectionService = {
  submit: async (data: {
    attendanceDate: string;
    correctionType: string;
    requestedClockIn?: string;
    requestedClockOut?: string;
    reason: string;
    evidenceUrl?: string;
    notes?: string;
  }): Promise<any> => {
    return apiService.post('/attendance/corrections', data);
  },

  getMine: async (): Promise<AttendanceCorrection[]> => {
    return apiService.get('/attendance/corrections?scope=mine');
  },

  getPendingForManager: async (): Promise<AttendanceCorrection[]> => {
    return apiService.get('/attendance/corrections?scope=manager');
  },

  getPendingForHR: async (): Promise<AttendanceCorrection[]> => {
    return apiService.get('/attendance/corrections?scope=hr');
  },

  managerReview: async (id: number, approve: boolean, comment: string): Promise<any> => {
    return apiService.put(`/attendance/corrections/${id}/manager-review`, { approve, comment });
  },

  hrReview: async (id: number, approve: boolean, comment: string): Promise<any> => {
    return apiService.put(`/attendance/corrections/${id}/hr-review`, { approve, comment });
  },

  cancel: async (id: number): Promise<any> => {
    return apiService.put(`/attendance/corrections/${id}/cancel`, {});
  },
};

export default attendanceCorrectionService;
