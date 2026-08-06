import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ContractValidationService } from './validation/contract-validation.service';
import { ContractPhase2Service } from './phases/contract-phase2.service';

export interface Contract {
  id?: string;
  contractNumber: string;
  title: string;
  description: string;
  value: number;
  currency: 'PLN' | 'EUR' | 'USD';
  status: ContractStatus;
  startDate: Date;
  endDate?: Date;
  supplier: Supplier;
  phase?: ContractPhase;
  validationErrors?: string[];
  phase2Data?: Phase2ContractData;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  nip: string;
  address: string;
  bankAccount: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export type ContractStatus = 'draft' | 'pending_approval' | 'active' | 'completed' | 'cancelled' | 'terminated';

export type ContractPhase = 'phase1' | 'phase2' | 'phase3';

export interface Phase2ContractData {
  isPublicProcurement: boolean;
  tenderType: 'open' | 'restricted' | 'negotiated';
  estimatedDuration: number;
  fundingSource: string;
  specialConditions?: string[];
  regulatoryCompliance: boolean;
  electronicSubmission: boolean;
  deadline: Date;
  tenderDocuments: TenderDocument[];
  evaluationCriteria: EvaluationCriteria;
  scoringSystem: ScoringSystem;
  announcement?: AnnouncementDetails;
  result?: Phase2Result;
}

export interface TenderDocument {
  id: string;
  name: string;
  url: string;
  type: 'specification' | 'terms' | 'conditions' | 'other';
  uploadedAt: Date;
}

export interface EvaluationCriteria {
  priceWeight: number;
  qualityWeight: number;
  deliveryTimeWeight: number;
  additionalCriteria: Criterion[];
}

export interface Criterion {
  id: string;
  description: string;
  weight: number;
  score: number;
}

export interface ScoringSystem {
  minScore: number;
  maxScore: number;
  passingScore: number;
  scoringMethod: 'points' | 'percentage' | 'ranking';
}

export interface AnnouncementDetails {
  publishedDate: Date;
  publicationMedium: string;
  announcementId: string;
  language: 'pl' | 'en';
}

export interface Phase2Result {
  selectedSupplierId: string;
  awardDate: Date;
  contractValue: number;
  justification: string;
  objectionsPeriod: number;
  completionDate?: Date;
  auditTrail: AuditLog[];
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: string;
}

export interface ContractResponse {
  success: boolean;
  data?: Contract;
  errors?: string[];
  phase2Status?: Phase2Status;
}

export interface Phase2Status {
  isCompliant: boolean;
  requirementsMet: string[];
  missingRequirements: string[];
  nextSteps: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private readonly API_URL = 'api/contracts';
  private contractsSubject = new BehaviorSubject<Contract[]>([]);
  contracts$ = this.contractsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private validationService: ContractValidationService,
    private phase2Service: ContractPhase2Service
  ) {}

  // CREATE - Add new contract
  createContract(contractData: Partial<Contract>): Observable<ContractResponse> {
    return this.validationService.validateContract(contractData).pipe(
      tap(validatedData => {
        const contract: Contract = {
          ...validatedData,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return this.http.post<ContractResponse>(this.API_URL, contract);
      }),
      catchError(this.handleError)
    );
  }

  // READ - Get all contracts
  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.API_URL).pipe(
      tap(contracts => this.contractsSubject.next(contracts)),
      catchError(this.handleError)
    );
  }

  // READ - Get single contract
  getContract(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.API_URL}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // READ - Get contract status including Phase 2
  getContractWithPhase2(id: string): Observable<Contract & { phase2Status?: Phase2Status }> {
    return this.http.get<Contract>(`${this.API_URL}/${id}`).pipe(
      map(contract => {
        if (contract.phase === 'phase2' && contract.phase2Data) {
          return this.phase2Service.getPhase2Status(contract).pipe(
            map(phase2Status => ({
              ...contract,
              phase2Status
            }))
          );
        }
        return contract;
      }),
      catchError(this.handleError)
    );
  }

  // UPDATE - Modify existing contract
  updateContract(id: string, contractData: Partial<Contract>): Observable<ContractResponse> {
    return this.validationService.validateContract(contractData).pipe(
      tap(validatedData => {
        const updatedContract: Contract = {
          ...validatedData,
          updatedAt: new Date()
        };
        
        return this.http.put<ContractResponse>(`${this.API_URL}/${id}`, updatedContract);
      }),
      catchError(this.handleError)
    );
  }

  // UPDATE - Partial update (PATCH)
  patchContract(id: string, patchData: Partial<Contract>): Observable<Contract> {
    return this.http.patch<Contract>(`${this.API_URL}/${id}`, patchData).pipe(
      tap(updatedContract => {
        const contracts = this.contractsSubject.value.map(c => 
          c.id === id ? updatedContract : c
        );
        this.contractsSubject.next(contracts);
      }),
      catchError(this.handleError)
    );
  }

  // DELETE - Remove contract
  deleteContract(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        const contracts = this.contractsSubject.value.filter(c => c.id !== id);
        this.contractsSubject.next(contracts);
      }),
      catchError(this.handleError)
    );
  }

  // PHASE 2 SPECIFIC OPERATIONS

  // Initiate Phase 2 for contract
  initiatePhase2(contractId: string, phase2Data: Phase2ContractData): Observable<ContractResponse> {
    return this.phase2Service.initiatePhase2(contractId, phase2Data).pipe(
      tap(response => {
        if (response.success && response.data) {
          const contracts = this.contractsSubject.value.map(c =>
            c.id === contractId ? response.data! : c
          );
          this.contractsSubject.next(contracts);
        }
      }),
      catchError(this.handleError)
    );
  }

  // Update Phase 2 details
  updatePhase2Data(contractId: string, phase2Updates: Partial<Phase2ContractData>): Observable<ContractResponse> {
    return this.phase2Service.updatePhase2Data(contractId, phase2Updates).pipe(
      tap(response => {
        if (response.success && response.data) {
          const contracts = this.contractsSubject.value.map(c =>
            c.id === contractId ? response.data! : c
          );
          this.contractsSubject.next(contracts);
        }
      }),
      catchError(this.handleError)
    );
  }

  // Submit Phase 2 for approval
  submitPhase2ForApproval(contractId: string): Observable<ContractResponse> {
    return this.phase2Service.submitForApproval(contractId).pipe(
      tap(response => {
        if (response.success && response.data) {
          const contracts = this.contractsSubject.value.map(c =>
            c.id === contractId ? response.data! : c
          );
          this.contractsSubject.next(contracts);
        }
      }),
      catchError(this.handleError)
    );
  }

  // Validate contract before submission
  validateContract(contractData: Partial<Contract>): Observable<Partial<Contract>> {
    return this.validationService.validateContract(contractData);
  }

  // Get all validation errors
  getValidationErrors(contractData: Partial<Contract>): string[] {
    return this.validationService.getErrors(contractData);
  }

  // Search contracts by various criteria
  searchContracts(filters: {
    status?: ContractStatus;
    phase?: ContractPhase;
    supplierName?: string;
    contractNumber?: string;
    minValue?: number;
    maxValue?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.API_URL}/search`, {
      params: filters
    });
  }

  // Export contract data
  exportContract(id: string, format: 'pdf' | 'csv' | 'json'): Observable<Blob> {
    return this.http.get<Blob>(`${this.API_URL}/${id}/export`, {
      responseType: 'blob' as 'blob'
    });
  }

  // Bulk operations
  bulkCreateContracts(contractsData: Partial<Contract>[]): Observable<ContractResponse[]> {
    return this.http.post<ContractResponse[]>(`${this.API_URL}/bulk`, contractsData).pipe(
      catchError(this.handleError)
    );
  }

  // Helper error handler
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client-side error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server returned code: ${error.status}, error message: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  // Reset contract state
  resetContractState(): void {
    this.contractsSubject.next([]);
  }

  // Subscribe to contract changes
  onContractChanges(callback: (contracts: Contract[]) => void): void {
    this.contractsSubject.subscribe(callback);
  }
}