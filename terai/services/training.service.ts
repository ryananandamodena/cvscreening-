import { apiService } from './api.service';

export interface TrainingProgram {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: number; // in hours
  cost: number;
  provider: string;
  maxParticipants: number;
  prerequisites: string[];
  skills: string[];
  certification: boolean;
  format: 'online' | 'offline' | 'hybrid';
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeTraining {
  id: number;
  employeeId: number;
  employeeName: string;
  programId: number;
  programTitle: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'cancelled' | 'waitlisted';
  enrollmentDate: string;
  startDate?: string;
  completionDate?: string;
  progress: number; // 0-100
  score?: number;
  grade?: string;
  certificateUrl?: string;
  feedback?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: number;
  programId: number;
  programTitle: string;
  instructor: string;
  startDate: string;
  endDate: string;
  location?: string;
  virtualLink?: string;
  maxParticipants: number;
  enrolledCount: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: number[]; // employee IDs
}

export interface SkillAssessment {
  id: number;
  employeeId: number;
  skillId: number;
  skillName: string;
  category: string;
  currentLevel: number; // 1-5
  targetLevel: number; // 1-5
  assessmentDate: string;
  assessorId: number;
  assessorName: string;
  notes?: string;
}

export interface TrainingAnalytics {
  totalPrograms: number;
  activePrograms: number;
  totalEnrollments: number;
  completionRate: number;
  averageScore: number;
  topSkills: Array<{ skill: string; count: number }>;
  departmentWise: Array<{
    department: string;
    enrollments: number;
    completions: number;
    avgScore: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    enrollments: number;
    completions: number;
  }>;
}

export const trainingService = {
  // Training Programs
  getPrograms: async (params?: {
    category?: string;
    level?: string;
    format?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: TrainingProgram[]; total: number; page: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/training/programs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  getProgramById: async (id: number): Promise<TrainingProgram> => {
    return apiService.get(`/training/programs/${id}`);
  },

  createProgram: async (data: Partial<TrainingProgram>): Promise<TrainingProgram> => {
    return apiService.post('/training/programs', data);
  },

  updateProgram: async (id: number, data: Partial<TrainingProgram>): Promise<TrainingProgram> => {
    return apiService.put(`/training/programs/${id}`, data);
  },

  deleteProgram: async (id: number): Promise<void> => {
    return apiService.delete(`/training/programs/${id}`);
  },

  // Employee Training Records
  getEmployeeTrainings: async (employeeId?: number, status?: string): Promise<EmployeeTraining[]> => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId.toString());
    if (status) params.append('status', status);
    const url = `/training/employee${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  enrollEmployee: async (data: {
    employeeId: number;
    programId: number;
    sessionId?: number;
  }): Promise<EmployeeTraining> => {
    return apiService.post('/training/enroll', data);
  },

  updateTrainingProgress: async (trainingId: number, data: {
    progress: number;
    score?: number;
    status?: string;
    notes?: string;
  }): Promise<EmployeeTraining> => {
    return apiService.put(`/training/progress/${trainingId}`, data);
  },

  completeTraining: async (trainingId: number, data: {
    score?: number;
    grade?: string;
    certificateUrl?: string;
    feedback?: string;
  }): Promise<EmployeeTraining> => {
    return apiService.post(`/training/complete/${trainingId}`, data);
  },

  cancelEnrollment: async (trainingId: number, reason?: string): Promise<void> => {
    return apiService.post(`/training/cancel/${trainingId}`, { reason });
  },

  // Training Sessions
  getSessions: async (programId?: number, status?: string): Promise<TrainingSession[]> => {
    const params = new URLSearchParams();
    if (programId) params.append('programId', programId.toString());
    if (status) params.append('status', status);
    const url = `/training/sessions${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  createSession: async (data: Partial<TrainingSession>): Promise<TrainingSession> => {
    return apiService.post('/training/sessions', data);
  },

  updateSession: async (id: number, data: Partial<TrainingSession>): Promise<TrainingSession> => {
    return apiService.put(`/training/sessions/${id}`, data);
  },

  enrollInSession: async (sessionId: number, employeeId: number): Promise<void> => {
    return apiService.post(`/training/sessions/${sessionId}/enroll`, { employeeId });
  },

  // Skill Assessments
  getSkillAssessments: async (employeeId?: number): Promise<SkillAssessment[]> => {
    const url = employeeId ? `/training/skills?employeeId=${employeeId}` : '/training/skills';
    return apiService.get(url);
  },

  createSkillAssessment: async (data: Partial<SkillAssessment>): Promise<SkillAssessment> => {
    return apiService.post('/training/skills', data);
  },

  updateSkillAssessment: async (id: number, data: Partial<SkillAssessment>): Promise<SkillAssessment> => {
    return apiService.put(`/training/skills/${id}`, data);
  },

  // Analytics & Reporting
  getTrainingAnalytics: async (params?: {
    departmentId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TrainingAnalytics> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/training/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  getEmployeeTrainingHistory: async (employeeId: number): Promise<{
    trainings: EmployeeTraining[];
    totalHours: number;
    certifications: number;
    avgScore: number;
  }> => {
    return apiService.get(`/training/employee/${employeeId}/history`);
  },

  // Categories & Skills
  getCategories: async (): Promise<string[]> => {
    return apiService.get('/training/categories');
  },

  getSkills: async (): Promise<Array<{ id: number; name: string; category: string }>> => {
    return apiService.get('/training/skills-list');
  },

  // Learning Paths
  getLearningPaths: async (): Promise<Array<{
    id: number;
    title: string;
    description: string;
    programs: number[];
    estimatedDuration: number;
    targetSkills: string[];
  }>> => {
    return apiService.get('/training/learning-paths');
  },

  createLearningPath: async (data: {
    title: string;
    description: string;
    programs: number[];
    targetSkills: string[];
  }): Promise<any> => {
    return apiService.post('/training/learning-paths', data);
  },

  // Recommendations
  getRecommendedPrograms: async (employeeId: number): Promise<TrainingProgram[]> => {
    return apiService.get(`/training/recommendations/${employeeId}`);
  },

  // Certificates
  getCertificates: async (employeeId?: number): Promise<Array<{
    id: number;
    employeeId: number;
    employeeName: string;
    programTitle: string;
    issueDate: string;
    expiryDate?: string;
    certificateUrl: string;
  }>> => {
    const url = employeeId ? `/training/certificates?employeeId=${employeeId}` : '/training/certificates';
    return apiService.get(url);
  },

  downloadCertificate: async (certificateId: number): Promise<Blob> => {
    return apiService.get(`/training/certificates/${certificateId}/download`);
  }
};

export default trainingService;