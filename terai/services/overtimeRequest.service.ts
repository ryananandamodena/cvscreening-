import { apiService } from './api.service';

export interface OvertimeRequest {
  id: number;
  employeeId: number;
  overtimeDate: string;
  hours: number;
  reason: string;
  createdAt: string;
  approvalStatus: string;
}

export const overtimeRequestService = {
  submit: async (data: { overtimeDate: string; hours: number; reason: string }): Promise<any> => {
    return apiService.post('/overtime/requests', data);
  },
  getMine: async (): Promise<OvertimeRequest[]> => {
    return apiService.get('/overtime/requests/mine');
  },
};

export default overtimeRequestService;
