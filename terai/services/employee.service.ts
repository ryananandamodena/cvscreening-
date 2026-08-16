import { apiService } from './api.service';
import { Employee, Department, ConvertCandidatePayload } from '../types';

export const employeeService = {
  // Current logged-in user's employee record
  getMyEmployee: async (): Promise<Employee> => {
    return apiService.get<Employee>('/employees/me');
  },

  // Employees
  getEmployees: async (params?: Record<string, string | number>) => {
    let queryParams = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      queryParams = `?${searchParams.toString()}`;
    }
    const res = await apiService.get<any>(`/employees${queryParams}`);
    return res; // returns { data: [...], total, page, limit, totalPages }
  },

  getEmployeeById: async (id: number): Promise<Employee> => {
    const res = await apiService.get<Employee>(`/employees/${id}`);
    return res;
  },

  // Pre-hire recruitment history (screenings/interviews) for an employee who was
  // converted from a candidate — empty candidateId means they weren't.
  getEmployeeCandidateHistory: async (id: number): Promise<{
    candidateId: number | null;
    screenings: Array<{ id: number; jobId?: number; score: number; status: string; createdAt: string }>;
    interviews: Array<{ id: number; interviewType: string; scheduledAt?: string; status: string; rating?: number; interviewerNotes?: string }>;
    assessments: Array<{ id: number; assessmentId: number; status: string; totalScore?: number; passed?: boolean; submittedAt?: string }>;
  }> => {
    return apiService.get(`/employees/${id}/candidate-history`);
  },

  createEmployee: async (data: Partial<Employee>) => {
    return apiService.post<any>('/employees', data);
  },

  updateEmployee: async (id: number, data: Partial<Employee>) => {
    return apiService.put<any>(`/employees/${id}`, data);
  },

  deleteEmployee: async (id: number) => {
    return apiService.delete<any>(`/employees/${id}`);
  },

  getStats: async () => {
    const res = await apiService.get<any>('/employees/stats/summary');
    return res;
  },

  // Profile photo (Module 15) — self-service, identity resolved server-side from the JWT, not
  // from any id passed here.
  uploadMyPhoto: async (file: File): Promise<{ photoUrl: string; updatedAt: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiService.postFormData('/employees/me/photo', formData);
  },

  deleteMyPhoto: async (): Promise<{ message: string }> => {
    return apiService.delete('/employees/me/photo');
  },

  // Admin/recruiter managing another employee's photo — backend enforces RecruiterOrAdmin() on
  // these routes; this is not itself an authorization mechanism.
  uploadEmployeePhoto: async (employeeId: number, file: File): Promise<{ photoUrl: string; updatedAt: string }> => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiService.postFormData(`/employees/${employeeId}/photo`, formData);
  },

  deleteEmployeePhoto: async (employeeId: number): Promise<{ message: string }> => {
    return apiService.delete(`/employees/${employeeId}/photo`);
  },

  convertCandidate: async (data: ConvertCandidatePayload) => {
    return apiService.post<any>('/candidates/convert', data);
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const res = await apiService.get<Department[]>('/departments');
    return res;
  },
};

export default employeeService;
