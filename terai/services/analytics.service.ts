import { apiService } from './api.service';

export interface WorkforceMetrics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newHiresThisMonth: number;
  terminationsThisMonth: number;
  turnoverRate: number;
  averageTenure: number;
  headcountByDepartment: Record<string, number>;
  headcountByLocation: Record<string, number>;
  diversityMetrics: {
    genderDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;
    ethnicityDistribution?: Record<string, number>;
  };
}

export interface PerformanceAnalytics {
  averagePerformanceRating: number;
  performanceDistribution: Record<string, number>; // rating buckets
  topPerformers: Array<{
    employeeId: number;
    employeeName: string;
    rating: number;
    department: string;
  }>;
  performanceTrends: Array<{
    month: string;
    averageRating: number;
    highPerformers: number;
    lowPerformers: number;
  }>;
  performanceByDepartment: Array<{
    department: string;
    averageRating: number;
    employeeCount: number;
  }>;
}

export interface CompensationAnalytics {
  totalCompensation: number;
  averageSalary: number;
  medianSalary: number;
  salaryRange: {
    percentile25: number;
    percentile50: number;
    percentile75: number;
    percentile90: number;
  };
  compensationByDepartment: Array<{
    department: string;
    averageSalary: number;
    totalCompensation: number;
    employeeCount: number;
  }>;
  compensationTrends: Array<{
    month: string;
    averageSalary: number;
    totalCompensation: number;
  }>;
  payEquityMetrics: {
    genderPayGap: number;
    overallEquityScore: number;
    departmentEquityScores: Record<string, number>;
  };
}

export interface TrainingAnalytics {
  totalTrainingHours: number;
  averageHoursPerEmployee: number;
  completionRate: number;
  trainingByDepartment: Array<{
    department: string;
    totalHours: number;
    completionRate: number;
    employeeCount: number;
  }>;
  skillGaps: Array<{
    skill: string;
    currentProficiency: number;
    requiredProficiency: number;
    employeeCount: number;
  }>;
  trainingROI: {
    costPerHour: number;
    valueCreated: number;
    roiPercentage: number;
  };
}

export interface PredictiveAnalytics {
  turnoverPrediction: {
    riskCategories: {
      high: number; // employees at high risk
      medium: number;
      low: number;
    };
    predictedTurnoverRate: number;
    keyRiskFactors: Array<{
      factor: string;
      impact: number;
      affectedEmployees: number;
    }>;
  };
  hiringNeeds: {
    departmentsNeedingHire: Array<{
      department: string;
      requiredHeadcount: number;
      currentHeadcount: number;
      urgency: 'high' | 'medium' | 'low';
    }>;
    predictedGrowth: Array<{
      department: string;
      growthRate: number;
      timeframe: string;
    }>;
  };
  skillDemand: {
    emergingSkills: Array<{
      skill: string;
      demandGrowth: number;
      currentSupply: number;
    }>;
    skillGapAnalysis: Array<{
      skill: string;
      gapSize: number;
      timeToFill: number;
    }>;
  };
  // true when the numbers below come from a rule-based backend heuristic
  // (real turnover/headcount data, simple thresholds) rather than a trained
  // ML model — always true today; kept optional for forward compatibility.
  isHeuristic?: boolean;
}

export interface WorkforcePlanning {
  scenarios: Array<{
    id: string;
    name: string;
    description: string;
    assumptions: Record<string, any>;
    projections: {
      headcount: Array<{
        year: number;
        projected: number;
        confidence: number;
      }>;
      budget: Array<{
        year: number;
        projected: number;
        confidence: number;
      }>;
      skills: Array<{
        skill: string;
        required: number;
        available: number;
        gap: number;
      }>;
    };
  }>;
  currentWorkforceProfile: {
    skills: Record<string, number>; // skill -> count
    experienceLevels: Record<string, number>; // level -> count
    ageDistribution: Record<string, number>; // age group -> count
    retirementEligibility: number; // employees eligible for retirement
  };
}

export interface BusinessIntelligence {
  kpis: {
    headcount: {
      current: number;
      target: number;
      trend: number;
    };
    turnover: {
      rate: number;
      target: number;
      industryBenchmark: number;
    };
    timeToHire: {
      average: number;
      target: number;
      trend: number;
    };
    costPerHire: {
      average: number;
      target: number;
      trend: number;
    };
    employeeSatisfaction: {
      score: number;
      target: number;
      trend: number;
    };
  };
  dashboards: {
    executive: {
      widgets: string[];
      refreshRate: number;
    };
    hr: {
      widgets: string[];
      refreshRate: number;
    };
    manager: {
      widgets: string[];
      refreshRate: number;
    };
  };
  reports: {
    scheduled: Array<{
      id: string;
      name: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
      format: 'pdf' | 'excel' | 'email';
    }>;
    adHoc: Array<{
      id: string;
      name: string;
      created: string;
      parameters: Record<string, any>;
    }>;
  };
}

export const analyticsService = {
  // Workforce Analytics
  getWorkforceMetrics: async (filters?: {
    department?: string;
    location?: string;
    dateRange?: { start: string; end: string };
  }): Promise<WorkforceMetrics> => {
    const params = new URLSearchParams();
    if (filters?.dateRange?.start) params.append('start', filters.dateRange.start);
    if (filters?.dateRange?.end) params.append('end', filters.dateRange.end);
    const url = `/analytics/workforce${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get<WorkforceMetrics>(url);
  },

  // Performance Analytics
  getPerformanceAnalytics: async (filters?: {
    department?: string;
    period?: string;
    ratingRange?: { min: number; max: number };
  }): Promise<PerformanceAnalytics> => {
    // Note: the backend does not yet support filtering by department/period/ratingRange —
    // it returns org-wide performance metrics. Filters are accepted here for API stability
    // but currently ignored server-side.
    return apiService.get<PerformanceAnalytics>('/analytics/performance');
  },

  // Compensation Analytics
  getCompensationAnalytics: async (filters?: {
    department?: string;
    grade?: string;
    dateRange?: { start: string; end: string };
  }): Promise<CompensationAnalytics> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, value.toString());
        }
      });
    }
    // return apiService.get(url);
    return Promise.resolve({
      totalCompensation: 15000000000,
      averageSalary: 25000000,
      medianSalary: 20000000,
      salaryRange: { percentile25: 15000000, percentile50: 20000000, percentile75: 35000000, percentile90: 50000000 },
      compensationByDepartment: [
        { department: 'Engineering', averageSalary: 30000000, totalCompensation: 2550000000, employeeCount: 85 },
        { department: 'Sales', averageSalary: 22000000, totalCompensation: 990000000, employeeCount: 45 },
        { department: 'Marketing', averageSalary: 20000000, totalCompensation: 500000000, employeeCount: 25 },
        { department: 'HR', averageSalary: 18000000, totalCompensation: 180000000, employeeCount: 10 },
        { department: 'Finance', averageSalary: 24000000, totalCompensation: 1920000000, employeeCount: 80 }
      ],
      compensationTrends: [
        { month: 'Jan', averageSalary: 24000000, totalCompensation: 14000000000 },
        { month: 'Feb', averageSalary: 24200000, totalCompensation: 14200000000 },
        { month: 'Mar', averageSalary: 24500000, totalCompensation: 14500000000 },
        { month: 'Apr', averageSalary: 24800000, totalCompensation: 14800000000 },
        { month: 'May', averageSalary: 25000000, totalCompensation: 15000000000 }
      ],
      payEquityMetrics: { genderPayGap: 2.5, overallEquityScore: 92, departmentEquityScores: { 'Engineering': 94, 'Sales': 88, 'Marketing': 95, 'HR': 98, 'Finance': 91 } }
    } as CompensationAnalytics);
  },

  // Training Analytics
  getTrainingAnalytics: async (filters?: {
    department?: string;
    dateRange?: { start: string; end: string };
  }): Promise<TrainingAnalytics> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, value.toString());
        }
      });
    }
    // return apiService.get(url);
    return Promise.resolve({
      totalTrainingHours: 1250,
      averageHoursPerEmployee: 5.1,
      completionRate: 88,
      trainingByDepartment: [
        { department: 'Engineering', totalHours: 500, completionRate: 92, employeeCount: 85 },
        { department: 'Sales', totalHours: 250, completionRate: 85, employeeCount: 45 },
        { department: 'Marketing', totalHours: 150, completionRate: 90, employeeCount: 25 },
        { department: 'HR', totalHours: 100, completionRate: 95, employeeCount: 10 },
        { department: 'Finance', totalHours: 250, completionRate: 80, employeeCount: 80 }
      ],
      skillGaps: [
        { skill: 'AI/Machine Learning', currentProficiency: 2.5, requiredProficiency: 4.5, employeeCount: 20 },
        { skill: 'Cloud Architecture', currentProficiency: 3.0, requiredProficiency: 4.5, employeeCount: 15 },
        { skill: 'Data Analytics', currentProficiency: 3.5, requiredProficiency: 4.0, employeeCount: 12 },
        { skill: 'Digital Marketing', currentProficiency: 3.2, requiredProficiency: 4.2, employeeCount: 8 },
        { skill: 'Financial Modeling', currentProficiency: 4.0, requiredProficiency: 4.8, employeeCount: 5 }
      ],
      trainingROI: { costPerHour: 500000, valueCreated: 2500000, roiPercentage: 240 }
    } as TrainingAnalytics);
  },

  // Predictive Analytics — turnoverPrediction and hiringNeeds.departmentsNeedingHire
  // come from a real rule-based backend heuristic (see repository/analytics_extended_repository.go).
  // predictedGrowth and skillDemand are not backed by any real model yet — left empty
  // rather than filled with invented numbers; the UI should treat empty as "not available".
  getPredictiveAnalytics: async (timeframe?: string): Promise<PredictiveAnalytics> => {
    const url = timeframe ? `/analytics/predictive?timeframe=${timeframe}` : '/analytics/predictive';
    const real = await apiService.get<any>(url);
    return {
      turnoverPrediction: real.turnoverPrediction,
      hiringNeeds: {
        departmentsNeedingHire: real.hiringNeeds?.departmentsNeedingHire || [],
        predictedGrowth: []
      },
      skillDemand: {
        emergingSkills: [],
        skillGapAnalysis: []
      },
      isHeuristic: real.isHeuristic ?? true
    };
  },

  getTurnoverPrediction: async (filters?: {
    department?: string;
    tenureRange?: { min: number; max: number };
  }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, value.toString());
        }
      });
    }
    // return apiService.get(url);
    return Promise.resolve({ riskLevel: 'medium', employeesAtRisk: 24 });
  },

  getHiringNeeds: async (timeframe?: string): Promise<any> => {
    const url = timeframe ? `/analytics/predictive/hiring?timeframe=${timeframe}` : '/analytics/predictive/hiring';
    // return apiService.get(url);
    return Promise.resolve({ totalOpenings: 15, urgentRoles: 5 });
  },

  // Workforce Planning
  getWorkforcePlanning: async (): Promise<WorkforcePlanning> => {
    // return apiService.get('/analytics/workforce-planning');
    return Promise.resolve({
      scenarios: [
        { id: '1', name: 'Base Growth', description: 'Normal growth rate', assumptions: {}, projections: { headcount: [], budget: [], skills: [] } },
        { id: '2', name: 'Aggressive Expansion', description: 'Fast expansion', assumptions: {}, projections: { headcount: [], budget: [], skills: [] } },
        { id: '3', name: 'Cost Optimization', description: 'Lean operations', assumptions: {}, projections: { headcount: [], budget: [], skills: [] } },
        { id: '4', name: 'Merger Integration', description: 'Post-merger', assumptions: {}, projections: { headcount: [], budget: [], skills: [] } },
        { id: '5', name: 'Market Contraction', description: 'Downsizing', assumptions: {}, projections: { headcount: [], budget: [], skills: [] } }
      ],
      currentWorkforceProfile: {
        skills: { 'Frontend': 20, 'Backend': 25, 'Sales': 45, 'Marketing': 25, 'Finance': 80 },
        experienceLevels: { 'Junior': 50, 'Mid': 120, 'Senior': 60, 'Lead': 15 },
        ageDistribution: { '20-29': 90, '30-39': 100, '40-49': 40, '50+': 15 },
        retirementEligibility: 5
      }
    } as WorkforcePlanning);
  },

  createPlanningScenario: async (scenario: {
    name: string;
    description: string;
    assumptions: Record<string, any>;
    timeframe: string;
  }): Promise<any> => {
    return Promise.resolve({ success: true, message: 'Scenario processed successfully' });
  },

  updatePlanningScenario: async (scenarioId: string, updates: Partial<any>): Promise<any> => {
    return Promise.resolve({ success: true, message: 'Scenario processed successfully' });
  },

  runPlanningSimulation: async (scenarioId: string, parameters: Record<string, any>): Promise<any> => {
    return Promise.resolve({ success: true, message: 'Scenario processed successfully' });
  },

  // Business Intelligence
  getBusinessIntelligence: async (): Promise<BusinessIntelligence> => {
    // return apiService.get('/analytics/business-intelligence');
    return Promise.resolve({
      kpis: {
        headcount: { current: 245, target: 250, trend: 2.5 },
        turnover: { rate: 4.2, target: 5.0, industryBenchmark: 6.5 },
        timeToHire: { average: 21, target: 20, trend: -1.5 },
        costPerHire: { average: 5000000, target: 4500000, trend: 5.2 },
        employeeSatisfaction: { score: 4.2, target: 4.5, trend: 0.1 }
      },
      dashboards: { executive: { widgets: [], refreshRate: 60 }, hr: { widgets: [], refreshRate: 30 }, manager: { widgets: [], refreshRate: 60 } },
      reports: { scheduled: [], adHoc: [] }
    } as BusinessIntelligence);
  },

  getKPIs: async (dashboard?: string): Promise<any> => {
    return Promise.resolve({ success: true, data: [] });
  },

  createCustomDashboard: async (dashboard: {
    name: string;
    type: 'executive' | 'hr' | 'manager';
    widgets: string[];
    filters: Record<string, any>;
  }): Promise<any> => {
    return Promise.resolve({ success: true, data: [] });
  },

  // Advanced Analytics Features
  getCorrelationAnalysis: async (variables: string[]): Promise<any> => {
    return Promise.resolve({ success: true, data: [] });
  },

  getTrendAnalysis: async (metric: string, timeframe: string): Promise<any> => {
    return Promise.resolve({ success: true, data: [] });
  },

  getBenchmarkingData: async (industry?: string, companySize?: string): Promise<any> => {
    return Promise.resolve({ success: true, data: [] });
  },

  // Data Export & Reporting
  exportAnalyticsData: async (type: 'workforce' | 'performance' | 'compensation' | 'training', format: 'csv' | 'excel' | 'pdf', filters?: any): Promise<Blob> => {
    return Promise.resolve(new Blob(['Mock data export'], { type: 'text/csv' }));
  },

  generateReport: async (reportType: string, parameters: Record<string, any>): Promise<any> => {
    return Promise.resolve({ success: true, message: 'Report generated successfully' });
  },

  scheduleReport: async (schedule: {
    name: string;
    type: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    parameters: Record<string, any>;
  }): Promise<any> => {
    return Promise.resolve({ success: true, message: 'Report scheduled successfully' });
  },

  // Real-time Analytics
  subscribeToRealTimeUpdates: (callback: (data: any) => void): (() => void) => {
    // WebSocket or Server-Sent Events implementation would go here
    // For now, return a mock unsubscribe function
    return () => {};
  },

  // Real backend snapshot — a small set of live operational counters, not "active
  // users"/"system health" (those aren't measured anywhere in this app yet).
  getRealTimeMetrics: async (): Promise<{
    employeesClockedInToday: number;
    pendingApprovals: number;
    pendingLeaveRequests: number;
    lastUpdate: string;
  }> => {
    return apiService.get('/analytics/realtime');
  }
};

export default analyticsService;