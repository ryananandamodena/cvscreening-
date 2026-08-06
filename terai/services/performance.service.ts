import { apiService } from './api.service';

export interface PerformanceGoal {
  id: number;
  employeeId: number;
  title: string;
  description: string;
  category: 'individual' | 'team' | 'company';
  weight: number;
  target: string;
  current: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyAssessment {
  id: number;
  competencyId: number;
  competencyName: string;
  description: string;
  category: string;
  selfRating: number;
  managerRating: number;
  gap: string;
  developmentActions: string[];
  weight: number;
}

export interface PerformanceReview {
  id: number;
  employeeId: number;
  employeeName: string;
  reviewerId: number;
  reviewerName: string;
  reviewPeriod: string;
  reviewType: 'mid_year' | 'annual' | 'probation';
  status: 'draft' | 'self_assessment' | 'manager_review' | 'calibration' | 'approved' | 'completed';

  // Ratings & Scores
  overallRating: number;
  overallRatingLabel: string;
  quantitativeScore: number;
  qualitativeScore: number;

  // Content
  achievements: string;
  challenges: string;
  developmentPlan: string;
  managerComments: string;
  employeeComments: string;

  // Relations
  goals: PerformanceGoal[];
  competencies: CompetencyAssessment[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  dueDate: string;

  // AI Sentiment
  aiSentimentScore?: string;
  aiSummary?: string;
}

export interface Competency {
  id: number;
  name: string;
  description: string;
  category: string;
  levels: {
    level: number;
    description: string;
    behaviors: string[];
  }[];
  active: boolean;
}

export interface PerformanceTemplate {
  id: number;
  name: string;
  description: string;
  reviewType: 'mid_year' | 'annual' | 'probation';
  competencies: number[]; // competency IDs
  goalCategories: string[];
  ratingScale: {
    min: number;
    max: number;
    labels: { [key: number]: string };
  };
  active: boolean;
  createdAt: string;
}

export interface CalibrationSession {
  id: number;
  title: string;
  description: string;
  period: string;
  status: 'planning' | 'in_progress' | 'completed';
  participants: number[]; // manager IDs
  reviews: number[]; // review IDs to calibrate
  createdAt: string;
  completedAt?: string;
}

export const performanceService = {
  // Performance Reviews
  getReviews: async (params?: {
    employeeId?: number;
    reviewerId?: number;
    status?: string;
    period?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PerformanceReview[]; total: number; page: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/performance/reviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  getReviewById: async (id: number): Promise<PerformanceReview> => {
    return apiService.get(`/performance/reviews/${id}`);
  },

  createReview: async (data: Partial<PerformanceReview>): Promise<PerformanceReview> => {
    return apiService.post('/performance/reviews', data);
  },

  updateReview: async (id: number, data: Partial<PerformanceReview>): Promise<PerformanceReview> => {
    return apiService.put(`/performance/reviews/${id}`, data);
  },

  submitReview: async (id: number, data: { comments?: string }): Promise<PerformanceReview> => {
    return apiService.post(`/performance/reviews/${id}/submit`, data);
  },

  approveReview: async (id: number, data: { comments?: string }): Promise<PerformanceReview> => {
    return apiService.post(`/performance/reviews/${id}/approve`, data);
  },

  analyzeReview: async (id: number): Promise<{ message: string; aiSentimentScore: string; aiSummary: string }> => {
    return apiService.post(`/performance/reviews/${id}/analyze`, {});
  },

  // Performance Goals
  getGoals: async (employeeId?: number, status?: string): Promise<PerformanceGoal[]> => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId.toString());
    if (status) params.append('status', status);
    const url = `/performance/goals${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  createGoal: async (data: Partial<PerformanceGoal>): Promise<PerformanceGoal> => {
    return apiService.post('/performance/goals', data);
  },

  updateGoal: async (id: number, data: Partial<PerformanceGoal>): Promise<PerformanceGoal> => {
    return apiService.put(`/performance/goals/${id}`, data);
  },

  deleteGoal: async (id: number): Promise<void> => {
    return apiService.delete(`/performance/goals/${id}`);
  },

  updateGoalProgress: async (id: number, current: string, status: string): Promise<PerformanceGoal> => {
    return apiService.patch(`/performance/goals/${id}/progress`, { current, status });
  },

  // Competencies
  getCompetencies: async (): Promise<Competency[]> => {
    return apiService.get('/performance/competencies');
  },

  getCompetencyById: async (id: number): Promise<Competency> => {
    return apiService.get(`/performance/competencies/${id}`);
  },

  // Templates
  getTemplates: async (): Promise<PerformanceTemplate[]> => {
    return apiService.get('/performance/templates');
  },

  createTemplate: async (data: Partial<PerformanceTemplate>): Promise<PerformanceTemplate> => {
    return apiService.post('/performance/templates', data);
  },

  updateTemplate: async (id: number, data: Partial<PerformanceTemplate>): Promise<PerformanceTemplate> => {
    return apiService.put(`/performance/templates/${id}`, data);
  },

  // Calibration Sessions
  getCalibrationSessions: async (): Promise<CalibrationSession[]> => {
    return apiService.get('/performance/calibration');
  },

  createCalibrationSession: async (data: Partial<CalibrationSession>): Promise<CalibrationSession> => {
    return apiService.post('/performance/calibration', data);
  },

  updateCalibrationSession: async (id: number, data: Partial<CalibrationSession>): Promise<CalibrationSession> => {
    return apiService.put(`/performance/calibration/${id}`, data);
  },

  addReviewToCalibration: async (sessionId: number, reviewId: number): Promise<void> => {
    return apiService.post(`/performance/calibration/${sessionId}/reviews`, { reviewId });
  },

  // Analytics & Reporting
  getPerformanceAnalytics: async (params?: {
    departmentId?: number;
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/performance/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  getEmployeePerformance: async (employeeId: number): Promise<any> => {
    return apiService.get(`/performance/employees/${employeeId}/summary`);
  },

  // Dashboard Data
  getPerformanceDashboard: async (userId: number, userRole: string): Promise<any> => {
    return apiService.get(`/performance/dashboard?userId=${userId}&role=${userRole}`);
  }
};

export default performanceService;