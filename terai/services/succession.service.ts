import { apiService } from './api.service';

export interface SuccessionCandidate {
  id: number;
  employeeId: number;
  employeeName: string;
  position: string;
  department: string;
  readinessLevel: number; // 1-5 scale
  potentialRating: string; // A, B, C, D
  experience: number; // years
  performanceRating: number; // 1-5
  developmentNeeds: string[];
  mobility: 'internal' | 'external' | 'both';
  successionRoles: string[];
  lastAssessment: string;
  nextAssessment: string;
  mentor?: string;
  backupRoles: string[];
}

export interface SuccessionPlan {
  id: number;
  positionId: number;
  positionName: string;
  department: string;
  criticalPosition: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  currentIncumbent?: string;
  timeToFill: number; // months
  candidates: SuccessionCandidate[];
  developmentPlan: {
    trainingPrograms: string[];
    experienceRequirements: string[];
    timeline: string;
    budget: number;
  };
  status: 'active' | 'in_progress' | 'completed' | 'on_hold';
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NineBoxGrid {
  performance: number; // 1-3 scale
  potential: number; // 1-3 scale
  employees: Array<{
    id: number;
    name: string;
    position: string;
    performance: number;
    potential: number;
  }>;
}

export interface CareerPath {
  id: number;
  employeeId: number;
  employeeName: string;
  currentPosition: string;
  targetPositions: string[];
  timeline: {
    position: string;
    estimatedTime: number; // months
    requirements: string[];
    developmentActivities: string[];
  }[];
  milestones: {
    title: string;
    completed: boolean;
    dueDate: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  }[];
  mentorId?: number;
  mentorName?: string;
  // Average completed performance_reviews.overall_rating for this employee — same
  // subquery Succession candidates use, so the two modules agree on the number.
  performanceScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadershipDevelopment {
  id: number;
  programName: string;
  description: string;
  targetAudience: string[];
  duration: number; // weeks
  modules: {
    title: string;
    description: string;
    duration: number; // hours
    instructor?: string;
    materials: string[];
  }[];
  participants: number[];
  status: 'planning' | 'active' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number;
  outcomes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SuccessionAnalytics {
  totalPlans: number;
  criticalPositions: number;
  riskDistribution: Record<string, number>;
  readinessLevels: {
    high: number; // readiness 4-5
    medium: number; // readiness 2-3
    low: number; // readiness 1
  };
  averageTimeToFill: number;
  successionCoverage: number; // percentage
  developmentInvestment: number;
  topSuccessionGaps: Array<{
    position: string;
    risk: string;
    candidatesCount: number;
  }>;
}

export const successionService = {
  // Succession Plans
  getSuccessionPlans: async (departmentId?: number): Promise<SuccessionPlan[]> => {
    const url = departmentId ? `/succession/plans?departmentId=${departmentId}` : '/succession/plans';
    return apiService.get(url);
  },

  getSuccessionPlan: async (id: number): Promise<SuccessionPlan> => {
    return apiService.get(`/succession/plans/${id}`);
  },

  createSuccessionPlan: async (data: Partial<SuccessionPlan>): Promise<SuccessionPlan> => {
    return apiService.post('/succession/plans', data);
  },

  updateSuccessionPlan: async (id: number, data: Partial<SuccessionPlan>): Promise<SuccessionPlan> => {
    return apiService.put(`/succession/plans/${id}`, data);
  },

  deleteSuccessionPlan: async (id: number): Promise<void> => {
    return apiService.delete(`/succession/plans/${id}`);
  },

  // Succession Candidates
  getSuccessionCandidates: async (positionId?: number): Promise<SuccessionCandidate[]> => {
    const url = positionId ? `/succession/candidates?positionId=${positionId}` : '/succession/candidates';
    return apiService.get(url);
  },

  addSuccessionCandidate: async (planId: number, candidateData: Partial<SuccessionCandidate>): Promise<SuccessionCandidate> => {
    return apiService.post(`/succession/plans/${planId}/candidates`, candidateData);
  },

  // ASPIRATIONAL from here down (with a few real exceptions further below —
  // career-paths/leadership-programs are real, see those sections) — confirmed
  // during round-3 research: updateSuccessionCandidate, nine-box update,
  // talent-pool, development-plan/assessment, risks, export/reports all call
  // endpoints with no backend route. SuccessionDashboard.tsx does not call any of
  // these today, so they're dead code, not a live risk — don't wire new UI to
  // them without building the backend first.
  updateSuccessionCandidate: async (candidateId: number, data: Partial<SuccessionCandidate>): Promise<SuccessionCandidate> => {
    return apiService.put(`/succession/candidates/${candidateId}`, data);
  },

  removeSuccessionCandidate: async (planId: number, candidateId: number): Promise<void> => {
    return apiService.delete(`/succession/plans/${planId}/candidates/${candidateId}`);
  },

  // Nine Box Grid
  getNineBoxGrid: async (departmentId?: number): Promise<NineBoxGrid[][]> => {
    const url = departmentId ? `/succession/nine-box?departmentId=${departmentId}` : '/succession/nine-box';
    return apiService.get(url);
  },

  updateEmployeeNineBox: async (employeeId: number, performance: number, potential: number): Promise<void> => {
    return apiService.put(`/succession/nine-box/${employeeId}`, { performance, potential });
  },

  // Career Paths
  getCareerPaths: async (employeeId?: number): Promise<CareerPath[]> => {
    const url = employeeId ? `/succession/career-paths?employeeId=${employeeId}` : '/succession/career-paths';
    return apiService.get(url);
  },

  getCareerPath: async (id: number): Promise<CareerPath> => {
    return apiService.get(`/succession/career-paths/${id}`);
  },

  createCareerPath: async (data: Partial<CareerPath>): Promise<CareerPath> => {
    return apiService.post('/succession/career-paths', data);
  },

  updateCareerPath: async (id: number, data: Partial<CareerPath>): Promise<CareerPath> => {
    return apiService.put(`/succession/career-paths/${id}`, data);
  },

  updateCareerMilestone: async (pathId: number, milestoneId: number, data: {
    status: string;
    completedDate?: string;
  }): Promise<void> => {
    return apiService.put(`/succession/career-paths/${pathId}/milestones/${milestoneId}`, data);
  },

  // Leadership Development
  getLeadershipPrograms: async (): Promise<LeadershipDevelopment[]> => {
    return apiService.get('/succession/leadership-programs');
  },

  createLeadershipProgram: async (data: Partial<LeadershipDevelopment>): Promise<LeadershipDevelopment> => {
    return apiService.post('/succession/leadership-programs', data);
  },

  updateLeadershipProgram: async (id: number, data: Partial<LeadershipDevelopment>): Promise<LeadershipDevelopment> => {
    return apiService.put(`/succession/leadership-programs/${id}`, data);
  },

  enrollInLeadershipProgram: async (programId: number, employeeId: number): Promise<void> => {
    return apiService.post(`/succession/leadership-programs/${programId}/enroll`, { employeeId });
  },

  completeLeadershipProgram: async (programId: number, employeeId: number, outcomes: string[]): Promise<void> => {
    return apiService.post(`/succession/leadership-programs/${programId}/complete`, {
      employeeId,
      outcomes
    });
  },

  // Talent Pool Management
  getTalentPool: async (criteria?: {
    readinessLevel?: number;
    potentialRating?: string;
    skills?: string[];
    department?: string;
  }): Promise<SuccessionCandidate[]> => {
    const params = new URLSearchParams();
    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    const url = `/succession/talent-pool${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  addToTalentPool: async (employeeId: number, data: {
    readinessLevel: number;
    potentialRating: string;
    developmentNeeds: string[];
    successionRoles: string[];
  }): Promise<SuccessionCandidate> => {
    return apiService.post('/succession/talent-pool', { employeeId, ...data });
  },

  updateTalentPool: async (employeeId: number, data: Partial<SuccessionCandidate>): Promise<SuccessionCandidate> => {
    return apiService.put(`/succession/talent-pool/${employeeId}`, data);
  },

  // Assessment & Development Planning
  createDevelopmentPlan: async (candidateId: number, plan: {
    trainingPrograms: string[];
    experienceRequirements: string[];
    timeline: string;
    budget: number;
    mentorId?: number;
  }): Promise<any> => {
    return apiService.post(`/succession/candidates/${candidateId}/development-plan`, plan);
  },

  scheduleAssessment: async (candidateId: number, assessmentDate: string, assessorId: number): Promise<void> => {
    return apiService.post(`/succession/candidates/${candidateId}/assessment`, {
      assessmentDate,
      assessorId
    });
  },

  // Analytics & Reporting
  getSuccessionAnalytics: async (params?: {
    departmentId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<SuccessionAnalytics> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const url = `/succession/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiService.get(url);
  },

  // Risk Assessment
  getSuccessionRisks: async (): Promise<Array<{
    position: string;
    riskLevel: string;
    reasons: string[];
    mitigationPlan: string;
    timeline: string;
  }>> => {
    return apiService.get('/succession/risks');
  },

  updateRiskMitigation: async (positionId: number, mitigationPlan: string): Promise<void> => {
    return apiService.put(`/succession/risks/${positionId}`, { mitigationPlan });
  },

  // Export & Import
  exportSuccessionData: async (format: 'csv' | 'excel' | 'pdf', filters?: any): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    return apiService.get(`/succession/export?${params.toString()}`);
  },

  generateSuccessionReport: async (type: 'talent_review' | 'risk_assessment' | 'development_planning', params?: any): Promise<any> => {
    return apiService.post('/succession/reports', { type, ...params });
  }
};

export default successionService;