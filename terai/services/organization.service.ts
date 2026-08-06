import { apiService } from './api.service';
import { Department, Position } from '../types';

export const organizationService = {
  // Departments
  getDepartments: async (): Promise<Department[]> => {
    return apiService.get<Department[]>('/departments');
  },

  getDepartmentById: async (id: number): Promise<Department> => {
    return apiService.get<Department>(`/departments/${id}`);
  },

  createDepartment: async (data: Partial<Department>) => {
    return apiService.post<any>('/departments', data);
  },

  updateDepartment: async (id: number, data: Partial<Department>) => {
    return apiService.put<any>(`/departments/${id}`, data);
  },

  deleteDepartment: async (id: number) => {
    return apiService.delete<any>(`/departments/${id}`);
  },

  // Positions
  getPositions: async (departmentId?: number): Promise<Position[]> => {
    let url = '/positions';
    if (departmentId) {
      url += `?departmentId=${departmentId}`;
    }
    return apiService.get<Position[]>(url);
  },

  getPositionById: async (id: number): Promise<Position> => {
    return apiService.get<Position>(`/positions/${id}`);
  },

  createPosition: async (data: Partial<Position>) => {
    return apiService.post<any>('/positions', data);
  },

  updatePosition: async (id: number, data: Partial<Position>) => {
    return apiService.put<any>(`/positions/${id}`, data);
  },

  deletePosition: async (id: number) => {
    return apiService.delete<any>(`/positions/${id}`);
  }
};

export default organizationService;
