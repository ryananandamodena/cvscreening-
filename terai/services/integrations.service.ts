import { apiService } from './api.service';

// ASPIRATIONAL FILE — confirmed during round-3 cross-module research: ~97% of the
// methods below (providers, connections, sync jobs, webhooks, SAP/Oracle/Workday
// connectors, health, bulk ops) call endpoint paths that do not exist anywhere in
// sservice_cvsreening/main.go. Only the generic /integrations/:type/{connect,
// disconnect,test,auth,sync,config,send,templates} group is real. Do not wire any
// new UI to these methods without building the corresponding backend first —
// EnterpriseIntegrations.tsx already hit this and now shows a warning banner.

export interface IntegrationProvider {
  id: string;
  name: string;
  type: 'hr' | 'payroll' | 'erp' | 'crm' | 'ats' | 'lms' | 'communication';
  category: string;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  apiDocsUrl?: string;
  supportedFeatures: string[];
  pricingTier: 'free' | 'freemium' | 'paid' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnection {
  id: string;
  providerId: string;
  providerName: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'weekly' | 'realtime';
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    username?: string;
    password?: string;
    baseUrl?: string;
    tenantId?: string;
  };
  configuration: Record<string, any>;
  errorMessage?: string;
  dataMappings: DataMapping[];
  enabledFeatures: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DataMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformation?: string;
  isRequired: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  validationRules?: Record<string, any>;
}

export interface SyncJob {
  id: string;
  integrationId: string;
  jobType: 'full_sync' | 'incremental_sync' | 'field_sync' | 'validation_sync';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errorDetails?: any;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationWebhook {
  id: string;
  integrationId: string;
  eventType: string;
  webhookUrl: string;
  secret: string;
  isActive: boolean;
  retryCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SAPIntegration {
  connection: IntegrationConnection;
  modules: {
    hr: boolean;
    payroll: boolean;
    finance: boolean;
    procurement: boolean;
  };
  dataFlows: {
    employeeSync: boolean;
    payrollSync: boolean;
    costCenterSync: boolean;
    vendorSync: boolean;
  };
  sapClient: string;
  sapLanguage: string;
  sapSystemId: string;
}

export interface OracleIntegration {
  connection: IntegrationConnection;
  modules: {
    hcm: boolean;
    financials: boolean;
    procurement: boolean;
    projects: boolean;
  };
  dataFlows: {
    employeeSync: boolean;
    compensationSync: boolean;
    budgetSync: boolean;
  };
  oracleInstance: string;
  oracleSchema: string;
}

export interface WorkdayIntegration {
  connection: IntegrationConnection;
  modules: {
    hcm: boolean;
    payroll: boolean;
    recruiting: boolean;
    learning: boolean;
  };
  dataFlows: {
    employeeSync: boolean;
    performanceSync: boolean;
    trainingSync: boolean;
  };
  workdayTenant: string;
  workdayUsername: string;
}

export interface APIIntegration {
  connection: IntegrationConnection;
  endpoints: {
    employees: string;
    payroll: string;
    benefits: string;
    performance: string;
  };
  authentication: {
    type: 'bearer' | 'basic' | 'oauth2' | 'api_key';
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export const integrationsService = {
  // Integration Providers
  getProviders: async (filters?: {
    type?: string;
    category?: string;
    pricingTier?: string;
  }): Promise<IntegrationProvider[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const url = `/integrations/providers${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  getProviderById: async (id: string): Promise<IntegrationProvider> => {
    return apiService.get(`/integrations/providers/${id}`);
  },

  // Integration Connections
  getConnections: async (): Promise<IntegrationConnection[]> => {
    return apiService.get('/integrations/connections');
  },

  getConnectionById: async (id: string): Promise<IntegrationConnection> => {
    return apiService.get(`/integrations/connections/${id}`);
  },

  createConnection: async (data: {
    providerId: string;
    credentials: Record<string, any>;
    configuration: Record<string, any>;
    syncFrequency: string;
  }): Promise<IntegrationConnection> => {
    return apiService.post('/integrations/connections', data);
  },

  updateConnection: async (id: string, data: Partial<IntegrationConnection>): Promise<IntegrationConnection> => {
    return apiService.put(`/integrations/connections/${id}`, data);
  },

  testConnection: async (id: string): Promise<{ success: boolean; message: string; details?: any }> => {
    return apiService.post(`/integrations/connections/${id}/test`, {});
  },

  disconnectIntegration: async (id: string): Promise<void> => {
    return apiService.post(`/integrations/connections/${id}/disconnect`, {});
  },

  // Data Mappings
  getDataMappings: async (connectionId: string): Promise<DataMapping[]> => {
    return apiService.get(`/integrations/connections/${connectionId}/mappings`);
  },

  updateDataMapping: async (connectionId: string, mappingId: string, data: Partial<DataMapping>): Promise<DataMapping> => {
    return apiService.put(`/integrations/connections/${connectionId}/mappings/${mappingId}`, data);
  },

  createDataMapping: async (connectionId: string, data: Partial<DataMapping>): Promise<DataMapping> => {
    return apiService.post(`/integrations/connections/${connectionId}/mappings`, data);
  },

  // Sync Jobs
  getSyncJobs: async (connectionId?: string, limit?: number): Promise<SyncJob[]> => {
    const params = new URLSearchParams();
    if (connectionId) params.append('connectionId', connectionId);
    if (limit) params.append('limit', limit.toString());
    const url = `/integrations/sync-jobs${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  getSyncJobById: async (id: string): Promise<SyncJob> => {
    return apiService.get(`/integrations/sync-jobs/${id}`);
  },

  triggerSync: async (connectionId: string, jobType: SyncJob['jobType'], options?: {
    fullSync?: boolean;
    dateRange?: { start: string; end: string };
    specificFields?: string[];
  }): Promise<SyncJob> => {
    return apiService.post(`/integrations/connections/${connectionId}/sync`, {
      jobType,
      ...options
    });
  },

  cancelSyncJob: async (jobId: string): Promise<void> => {
    return apiService.post(`/integrations/sync-jobs/${jobId}/cancel`, {});
  },

  // Webhooks
  getWebhooks: async (connectionId?: string): Promise<IntegrationWebhook[]> => {
    const url = connectionId ? `/integrations/webhooks?connectionId=${connectionId}` : '/integrations/webhooks';
    return apiService.get(url);
  },

  createWebhook: async (data: Partial<IntegrationWebhook>): Promise<IntegrationWebhook> => {
    return apiService.post('/integrations/webhooks', data);
  },

  updateWebhook: async (id: string, data: Partial<IntegrationWebhook>): Promise<IntegrationWebhook> => {
    return apiService.put(`/integrations/webhooks/${id}`, data);
  },

  deleteWebhook: async (id: string): Promise<void> => {
    return apiService.delete(`/integrations/webhooks/${id}`);
  },

  // SAP Integration
  setupSAPIntegration: async (data: {
    sapClient: string;
    sapLanguage: string;
    sapSystemId: string;
    credentials: {
      username: string;
      password: string;
      baseUrl: string;
    };
    modules: SAPIntegration['modules'];
    dataFlows: SAPIntegration['dataFlows'];
  }): Promise<SAPIntegration> => {
    return apiService.post('/integrations/sap/setup', data);
  },

  syncSAPData: async (integrationId: string, dataType: 'employees' | 'payroll' | 'cost_centers'): Promise<SyncJob> => {
    return apiService.post(`/integrations/sap/${integrationId}/sync`, { dataType });
  },

  getSAPModules: async (integrationId: string): Promise<SAPIntegration['modules']> => {
    return apiService.get(`/integrations/sap/${integrationId}/modules`);
  },

  // Oracle Integration
  setupOracleIntegration: async (data: {
    oracleInstance: string;
    oracleSchema: string;
    credentials: {
      username: string;
      password: string;
      baseUrl: string;
    };
    modules: OracleIntegration['modules'];
    dataFlows: OracleIntegration['dataFlows'];
  }): Promise<OracleIntegration> => {
    return apiService.post('/integrations/oracle/setup', data);
  },

  syncOracleData: async (integrationId: string, dataType: 'hcm' | 'financials' | 'projects'): Promise<SyncJob> => {
    return apiService.post(`/integrations/oracle/${integrationId}/sync`, { dataType });
  },

  // Workday Integration
  setupWorkdayIntegration: async (data: {
    workdayTenant: string;
    workdayUsername: string;
    credentials: {
      username: string;
      password: string;
      baseUrl: string;
    };
    modules: WorkdayIntegration['modules'];
    dataFlows: WorkdayIntegration['dataFlows'];
  }): Promise<WorkdayIntegration> => {
    return apiService.post('/integrations/workday/setup', data);
  },

  syncWorkdayData: async (integrationId: string, dataType: 'hcm' | 'recruiting' | 'learning'): Promise<SyncJob> => {
    return apiService.post(`/integrations/workday/${integrationId}/sync`, { dataType });
  },

  // Generic API Integration
  setupAPIIntegration: async (data: APIIntegration): Promise<APIIntegration> => {
    return apiService.post('/integrations/api/setup', data);
  },

  testAPIEndpoint: async (integrationId: string, endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<any> => {
    return apiService.post(`/integrations/api/${integrationId}/test`, { endpoint, method });
  },

  // Monitoring & Analytics
  getIntegrationHealth: async (): Promise<Array<{
    integrationId: string;
    providerName: string;
    status: 'healthy' | 'warning' | 'error';
    lastSyncAt: string;
    nextSyncAt: string;
    errorCount: number;
    successRate: number;
  }>> => {
    return apiService.get('/integrations/health');
  },

  getIntegrationMetrics: async (integrationId?: string, dateRange?: { start: string; end: string }): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    dataVolume: number;
    errorRate: number;
    trends: Array<{
      date: string;
      syncs: number;
      errors: number;
      dataProcessed: number;
    }>;
  }> => {
    const params = new URLSearchParams();
    if (integrationId) params.append('integrationId', integrationId);
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }
    const url = `/integrations/metrics${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  // Error Handling & Troubleshooting
  getIntegrationErrors: async (integrationId?: string, limit?: number): Promise<Array<{
    id: string;
    integrationId: string;
    errorType: string;
    errorMessage: string;
    occurredAt: string;
    resolvedAt?: string;
    resolution?: string;
    affectedRecords: number;
  }>> => {
    const params = new URLSearchParams();
    if (integrationId) params.append('integrationId', integrationId);
    if (limit) params.append('limit', limit.toString());
    const url = `/integrations/errors${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  resolveIntegrationError: async (errorId: string, resolution: string): Promise<void> => {
    return apiService.post(`/integrations/errors/${errorId}/resolve`, { resolution });
  },

  // Bulk Operations
  bulkSyncIntegrations: async (integrationIds: string[], jobType: SyncJob['jobType']): Promise<SyncJob[]> => {
    return apiService.post('/integrations/bulk-sync', { integrationIds, jobType });
  },

  bulkTestConnections: async (integrationIds: string[]): Promise<Array<{
    integrationId: string;
    success: boolean;
    message: string;
    responseTime: number;
  }>> => {
    return apiService.post('/integrations/bulk-test', { integrationIds });
  },

  // Configuration Templates
  getConfigurationTemplates: async (providerType: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    providerType: string;
    configuration: Record<string, any>;
    dataMappings: DataMapping[];
  }>> => {
    return apiService.get(`/integrations/templates/${providerType}`);
  },

  applyConfigurationTemplate: async (integrationId: string, templateId: string): Promise<void> => {
    return apiService.post(`/integrations/${integrationId}/apply-template/${templateId}`, {});
  }
};

export default integrationsService;