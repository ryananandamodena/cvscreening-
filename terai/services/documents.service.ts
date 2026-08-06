import { apiService } from './api.service';

export interface CompanyPolicy {
  id: number;
  title: string;
  description: string;
  category: string;
  version: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'draft' | 'active' | 'expired' | 'archived';
  content: string;
  attachments: DocumentAttachment[];
  requiresAcknowledgment: boolean;
  acknowledgmentDeadline?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAttachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface EmploymentContract {
  id: number;
  employeeId: number;
  employeeName: string;
  contractType: 'permanent' | 'contract' | 'internship' | 'consultant';
  templateId: number;
  templateName: string;
  startDate: string;
  endDate?: string;
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';
  salary: number;
  position: string;
  department: string;
  terms: ContractTerm[];
  signatures: DigitalSignature[];
  documents: DocumentAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractTerm {
  id: number;
  category: string;
  title: string;
  content: string;
  isCustom: boolean;
  order: number;
}

export interface DigitalSignature {
  id: number;
  signerId: number;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signatureType: 'electronic' | 'digital_certificate' | 'biometric';
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  signatureData: string;
  certificateId?: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  blockchainHash?: string;
}

export interface ComplianceRecord {
  id: number;
  policyId?: number;
  contractId?: number;
  employeeId: number;
  employeeName: string;
  complianceType: 'policy_acknowledgment' | 'contract_signature' | 'training_completion' | 'certification';
  status: 'pending' | 'completed' | 'overdue' | 'exempted';
  dueDate?: string;
  completedDate?: string;
  reminderSent: boolean;
  lastReminderDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  description: string;
  category: 'contract' | 'policy' | 'form' | 'letter';
  type: 'employment_contract' | 'nda' | 'policy' | 'offer_letter' | 'termination';
  content: string;
  placeholders: TemplatePlaceholder[];
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatePlaceholder {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface DocumentWorkflow {
  id: number;
  name: string;
  description: string;
  documentType: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  assignedRole: string;
  requiredAction: 'review' | 'approve' | 'sign' | 'acknowledge';
  order: number;
  deadlineDays: number;
  isRequired: boolean;
  canDelegate: boolean;
}

export const documentsService = {
  // Company Policies
  getPolicies: async (filters?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: CompanyPolicy[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const url = `/documents/policies${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  getPolicyById: async (id: number): Promise<CompanyPolicy> => {
    return apiService.get(`/documents/policies/${id}`);
  },

  createPolicy: async (data: Partial<CompanyPolicy>): Promise<CompanyPolicy> => {
    return apiService.post('/documents/policies', data);
  },

  updatePolicy: async (id: number, data: Partial<CompanyPolicy>): Promise<CompanyPolicy> => {
    return apiService.put(`/documents/policies/${id}`, data);
  },

  deletePolicy: async (id: number): Promise<void> => {
    return apiService.delete(`/documents/policies/${id}`);
  },

  publishPolicy: async (id: number): Promise<CompanyPolicy> => {
    return apiService.post(`/documents/policies/${id}/publish`, {});
  },

  // Document Templates
  getTemplates: async (category?: string): Promise<DocumentTemplate[]> => {
    const url = category ? `/documents/templates?category=${category}` : '/documents/templates';
    return apiService.get(url);
  },

  getTemplateById: async (id: number): Promise<DocumentTemplate> => {
    return apiService.get(`/documents/templates/${id}`);
  },

  createTemplate: async (data: Partial<DocumentTemplate>): Promise<DocumentTemplate> => {
    return apiService.post('/documents/templates', data);
  },

  updateTemplate: async (id: number, data: Partial<DocumentTemplate>): Promise<DocumentTemplate> => {
    return apiService.put(`/documents/templates/${id}`, data);
  },

  deleteTemplate: async (id: number): Promise<void> => {
    return apiService.delete(`/documents/templates/${id}`);
  },

  generateDocumentFromTemplate: async (templateId: number, data: Record<string, any>): Promise<any> => {
    return apiService.post(`/documents/templates/${templateId}/generate`, data);
  },

  // Employment Contracts
  getContracts: async (filters?: {
    employeeId?: number;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: EmploymentContract[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const url = `/documents/contracts${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  getContractById: async (id: number): Promise<EmploymentContract> => {
    return apiService.get(`/documents/contracts/${id}`);
  },

  createContract: async (data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    return apiService.post('/documents/contracts', data);
  },

  updateContract: async (id: number, data: Partial<EmploymentContract>): Promise<EmploymentContract> => {
    return apiService.put(`/documents/contracts/${id}`, data);
  },

  sendContractForSignature: async (id: number, signers: Array<{
    employeeId: number;
    role: string;
  }>): Promise<void> => {
    return apiService.post(`/documents/contracts/${id}/send-for-signature`, { signers });
  },

  // Digital Signatures
  createDigitalSignature: async (data: {
    documentId: number;
    documentType: 'contract' | 'policy';
    signatureData: string;
    signatureType: 'electronic' | 'digital_certificate' | 'biometric';
    certificateId?: string;
  }): Promise<DigitalSignature> => {
    return apiService.post('/documents/signatures', data);
  },

  verifySignature: async (signatureId: number): Promise<{
    isValid: boolean;
    verificationDetails: any;
  }> => {
    return apiService.get(`/documents/signatures/${signatureId}/verify`);
  },

  getDocumentSignatures: async (documentId: number, documentType: string): Promise<DigitalSignature[]> => {
    return apiService.get(`/documents/${documentType}/${documentId}/signatures`);
  },

  // Compliance Tracking
  getComplianceRecords: async (filters?: {
    employeeId?: number;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ComplianceRecord[]; total: number; page: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const url = `/documents/compliance${params.toString() ? `?${params.toString()}` : ''}`;
    return apiService.get(url);
  },

  acknowledgePolicy: async (policyId: number, employeeId: number): Promise<ComplianceRecord> => {
    return apiService.post('/documents/compliance/acknowledge', {
      policyId,
      employeeId,
      complianceType: 'policy_acknowledgment'
    });
  },

  updateComplianceStatus: async (id: number, status: string, notes?: string): Promise<ComplianceRecord> => {
    return apiService.put(`/documents/compliance/${id}`, { status, notes });
  },

  sendComplianceReminder: async (id: number): Promise<void> => {
    return apiService.post(`/documents/compliance/${id}/remind`, {});
  },

  // Document Workflows
  getWorkflows: async (): Promise<DocumentWorkflow[]> => {
    return apiService.get('/documents/workflows');
  },

  createWorkflow: async (data: Partial<DocumentWorkflow>): Promise<DocumentWorkflow> => {
    return apiService.post('/documents/workflows', data);
  },

  updateWorkflow: async (id: number, data: Partial<DocumentWorkflow>): Promise<DocumentWorkflow> => {
    return apiService.put(`/documents/workflows/${id}`, data);
  },

  executeWorkflowStep: async (workflowId: number, stepId: number, action: string, data?: any): Promise<void> => {
    return apiService.post(`/documents/workflows/${workflowId}/steps/${stepId}/execute`, {
      action,
      data
    });
  },

  // Document Management
  uploadDocument: async (file: File, metadata: {
    category: string;
    description?: string;
    tags?: string[];
    accessLevel: 'public' | 'internal' | 'confidential';
  }): Promise<DocumentAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    return apiService.postFormData('/documents/upload', formData);
  },

  downloadDocument: async (documentId: number): Promise<Blob> => {
    return apiService.get(`/documents/download/${documentId}`);
  },

  deleteDocument: async (documentId: number): Promise<void> => {
    return apiService.delete(`/documents/${documentId}`);
  },

  // Bulk Operations
  bulkAcknowledgePolicies: async (policyId: number, employeeIds: number[]): Promise<any> => {
    return apiService.post('/documents/compliance/bulk-acknowledge', {
      policyId,
      employeeIds
    });
  },

  bulkSendContracts: async (contractIds: number[], employeeIds: number[]): Promise<any> => {
    return apiService.post('/documents/contracts/bulk-send', {
      contractIds,
      employeeIds
    });
  },

  // Audit & Reporting
  getDocumentAuditTrail: async (documentId: number, documentType: string): Promise<any[]> => {
    return apiService.get(`/documents/audit/${documentType}/${documentId}`);
  },

  exportComplianceReport: async (format: 'pdf' | 'excel', filters?: any): Promise<Blob> => {
    const params = new URLSearchParams({ format });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    return apiService.get(`/documents/reports/compliance?${params.toString()}`);
  },

  // Search & Advanced Filtering
  searchDocuments: async (query: string, filters?: {
    category?: string;
    type?: string;
    dateRange?: { start: string; end: string };
    status?: string;
  }): Promise<any[]> => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          params.append(key, JSON.stringify(value));
        } else if (value) {
          params.append(key, value.toString());
        }
      });
    }
    return apiService.get(`/documents/search?${params.toString()}`);
  }
};

export default documentsService;