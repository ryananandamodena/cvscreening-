import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuditLog, Contract, Criterion, TenderDocument } from '../contract.service';

@Injectable({
  providedIn: 'root'
})
export class Phase2ResultService {
  private readonly API_URL = 'api/contracts';

  constructor(private http: HttpClient) {}

  // Record tender opening results
  recordTenderOpening(
    contractId: string, 
    openingDetails: {
      openedAt: Date;
      openedBy: string;
      attendedParties: string[];
      initialPriceRange: { min: number; max: number };
    }
  ): Observable<{ success: boolean; auditLog?: AuditLog }> {
    return this.http.post<{ success: boolean; auditLog?: AuditLog }>(
      `${this.API_URL}/${contractId}/phase2/tender-opening`,
      openingDetails
    ).pipe(catchError(this.handleError));
  }

  // Submit tender documents
  submitTenderDocuments(
    contractId: string,
    documents: File[]
  ): Observable<{ success: boolean; documents: TenderDocument[] }> {
    const formData = new FormData();
    documents.forEach(doc => formData.append('documents', doc));

    return this.http.post<{ success: boolean; documents: TenderDocument[] }>(
      `${this.API_URL}/${contractId}/phase2/documents`,
      formData,
      {
        reportProgress: true,
        responseType: 'json' as 'json'
      }
    ).pipe(catchError(this.handleError));
  }

  // Update evaluation criteria
  updateEvaluationCriteria(
    contractId: string,
    criteria: Partial<Criterion[]>
  ): Observable<{ success: boolean; criteria?: Criterion[] }> {
    return this.http.patch<{ success: boolean; criteria?: Criterion[] }>(
      `${this.API_URL}/${contractId}/phase2/evaluation-criteria`,
      criteria
    ).pipe(catchError(this.handleError));
  }

  // Update scoring system
  updateScoringSystem(
    contractId: string,
    scoringSystem: Partial<{
      minScore: number;
      maxScore: number;
      passingScore: number;
      scoringMethod: 'points' | 'percentage' | 'ranking';
    }>
  ): Observable<{ success: boolean; scoringSystem?: any }> {
    return this.http.patch<{ success: boolean; scoringSystem?: any }>(
      `${this.API_URL}/${contractId}/phase2/scoring`,
      scoringSystem
    ).pipe(catchError(this.handleError));
  }

  // Record evaluation results
  recordEvaluation(
    contractId: string,
    evaluation: {
      scores: { [supplierId: string]: number };
      rankedSuppliers: string[];
      evaluationNotes: string;
      evaluator: string;
    }
  ): Observable<{ success: boolean; evaluationRecord?: any }> {
    return this.http.post<{ success: boolean; evaluationRecord?: any }>(
      `${this.API_URL}/${contractId}/phase2/evaluate`,
      evaluation
    ).pipe(catchError(this.handleError));
  }

  // Award contract
  awardContract(
    contractId: string,
    awardDetails: {
      supplierId: string;
      awardDate: Date;
      contractValue: number;
      justification: string;
      awardReason: string;
    }
  ): Observable<{ success: boolean; result?: any }> {
    return this.http.post<{ success: boolean; result?: any }>(
      `${this.API_URL}/${contractId}/phase2/award`,
      awardDetails
    ).pipe(catchError(this.handleError));
  }

  // Get audit trail
  getAuditTrail(contractId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.API_URL}/${contractId}/phase2/audit`).pipe(
      catchError(this.handleError)
    );
  }

  // Get tender statistics
  getTenderStatistics(contractId: string): Observable<{
    totalTenders: number;
    acceptedTenders: number;
    rejectedTenders: number;
    averageScore: number;
    timeline: any[];
  }> {
    return this.http.get<{
      totalTenders: number;
      acceptedTenders: number;
      rejectedTenders: number;
      averageScore: number;
      timeline: any[];
    }>(`${this.API_URL}/${contractId}/phase2/statistics`).pipe(
      catchError(this.handleError)
    );
  }

  // Close tender process
  closeTenderProcess(contractId: string): Observable<{ success: boolean; completedAt?: Date }> {
    return this.http.post<{ success: boolean; completedAt?: Date }>(
      `${this.API_URL}/${contractId}/phase2/close`,
      {}
    ).pipe(catchError(this.handleError));
  }

  // Handle errors
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status || 500}`;
    }
    return of({ success: false, errors: [errorMessage] });
  }
}