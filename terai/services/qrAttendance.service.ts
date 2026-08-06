import { apiService } from './api.service';

export const qrAttendanceService = {
  getToken: async (): Promise<{ token: string; issuedAt: number; expiresInSeconds: number }> => {
    return apiService.get('/attendance/qr-token');
  },
};

export default qrAttendanceService;
