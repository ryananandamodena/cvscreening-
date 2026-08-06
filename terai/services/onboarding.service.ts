import { apiService } from './api.service';

export interface OnboardingSession {
  id: number;
  employeeId: number;
  employeeName?: string;
  templateId?: number;
  startDate: string;
  dueDate?: string;
  status: string;
  progress: number;
  completedAt?: string;
  tasks?: OnboardingTask[];
}

export interface OnboardingTask {
  id: number;
  sessionId: number;
  title: string;
  description?: string;
  category: string;
  assignedTo?: number;
  assignedRole: string;
  dueDate?: string;
  status: string;
  completedAt?: string;
  notes?: string;
  sortOrder: number;
}

export interface OnboardingTemplateTask {
  title: string;
  description?: string;
  category: string;
  dueDays: number;
  assignedRole: string;
}

export interface OnboardingTemplate {
  id: number;
  name: string;
  departmentId?: number;
  departmentName?: string;
  tasks: OnboardingTemplateTask[];
  isActive: boolean;
  createdAt: string;
}

export const onboardingService = {
  getSessions: async (status?: string): Promise<OnboardingSession[]> => {
    let url = '/onboarding/sessions';
    if (status) url += `?status=${status}`;
    const res = await apiService.get<OnboardingSession[]>(url);
    return res;
  },

  createSession: async (data: Partial<OnboardingSession>) => {
    return apiService.post<any>('/onboarding/sessions', data);
  },

  getTasks: async (sessionId: number): Promise<OnboardingTask[]> => {
    const res = await apiService.get<OnboardingTask[]>(`/onboarding/sessions/${sessionId}/tasks`);
    return res;
  },

  createTask: async (sessionId: number, data: { title: string; description?: string; category: string; assignedRole: string; dueDate?: string }) => {
    return apiService.post<any>(`/onboarding/sessions/${sessionId}/tasks`, data);
  },

  updateTaskStatus: async (taskId: number, sessionId: number, status: string) => {
    return apiService.put<any>(`/onboarding/tasks/${taskId}`, { status, sessionId });
  },

  // Templates
  getTemplates: async (): Promise<OnboardingTemplate[]> => {
    const raw = await apiService.get<any[]>('/onboarding/templates');
    return raw.map((t) => ({ ...t, tasks: typeof t.tasks === 'string' ? JSON.parse(t.tasks) : t.tasks }));
  },

  createTemplate: async (data: { name: string; departmentId?: number; tasks: OnboardingTemplateTask[] }) => {
    return apiService.post<any>('/onboarding/templates', data);
  },

  setTemplateActive: async (id: number, active: boolean) => {
    return apiService.put<any>(`/onboarding/templates/${id}/active`, { active });
  },

  deleteTemplate: async (id: number) => {
    return apiService.delete<any>(`/onboarding/templates/${id}`);
  },
};

export default onboardingService;
