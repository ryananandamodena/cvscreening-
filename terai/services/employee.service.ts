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
