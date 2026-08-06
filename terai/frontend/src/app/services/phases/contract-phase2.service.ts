import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Contract, Phase2ContractData, Phase2Status } from '../contract.service';

@Injectable({
  providedIn: 'root'
})
export class ContractPhase2Service {
  private readonly API_URL = 'api/contracts';

  constructor(private http: HttpClient) {}

  initiatePhase2(contractId: string, phase2Data: Phase2ContractData): Observable<{ success: boolean; data?: Contract; errors?: string[] }> {
    return this.http.post<{ success: boolean; data?: Contract; errors?: string[] }>(
      `${this.API_URL}/${contractId}/phase2`,
      { phase2Data }
    ).pipe(
      catchError(this.handleError)
    );
  }

  updatePhase2Data(contractId: string, phase2Updates: Partial<Phase2ContractData>): Observable<{ success: boolean; data?: Contract; errors?: string[] }> {
    return this.http.patch<{ success: boolean; data?: Contract; errors?: string[] }>(
      `${this.API_URL}/${contractId}/phase2`,
      phase2Updates
    ).pipe(
      catchError(this.handleError)
    );
  }

  submitForApproval(contractId: string): Observable<{ success: boolean; data?: Contract; errors?: string[] }> {
    return this.http.post<{ success: boolean; data?: Contract; errors?: string[] }>(
      `${this.API_URL}/${contractId}/phase2/approve`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  getPhase2Status(contract: Contract): Observable<Phase2Status> {
    if (!contract.phase2Data) {
      return of({
        isCompliant: false,
        requirementsMet: [],
        missingRequirements: ['Phase 2 data not configured'],
        nextSteps: ['Configure Phase 2 contract data']
      });
    }

    const requirements = this.checkPhase2Requirements(contract.phase2Data);
    
    return of({
      isCompliant: requirements.missing.length === 0,
      requirementsMet: requirements.met,
      missingRequirements: requirements.missing,
      nextSteps: this.getNextSteps(contract.phase2Data, requirements.missing.length === 0)
    });
  }

  private checkPhase2Requirements(data: Phase2ContractData) {
    const met: string[] = [];
    const missing: string[] = [];

    if (data.isPublicProcurement) met.push('Public procurement flag set');
    else missing.push('Public procurement flag');

    if (data.tenderType) met.push(`Tender type: ${data.tenderType}`);
    else missing.push('Tender type');

    if (data.regulatoryCompliance) met.push('Regulatory compliance confirmed');
    else missing.push('Regulatory compliance');

    if (data.electronicSubmission) met.push('Electronic submission enabled');
    else missing.push('Electronic submission');

    if (data.deadline && data.deadline > new Date()) met.push('Deadline configured');
    else missing.push('Future deadline');

    if (data.tenderDocuments && data.tenderDocuments.length > 0) {
      met.push(`Tender documents (${data.tenderDocuments.length})`);
    } else {
      missing.push('Tender documents');
    }

    if (data.evaluationCriteria) {
      const totalWeight = (data.evaluationCriteria.priceWeight || 0) + 
                         (data.evaluationCriteria.qualityWeight || 0) + 
                         (data.evaluationCriteria.deliveryTimeWeight || 0);
      if (totalWeight === 100) {
        met.push('Evaluation criteria properly weighted');
      } else {
        missing.push('Proper evaluation criteria weighting');
      }
    } else {
      missing.push('Evaluation criteria');
    }

    if (data.scoringSystem) {
      const { scoringSystem } = data;
      if (scoringSystem.minScore < scoringSystem.maxScore &&
          scoringSystem.passingScore >= scoringSystem.minScore &&
          scoringSystem.passingScore <= scoringSystem.maxScore) {
        met.push('Valid scoring system');
      } else {
        missing.push('Valid scoring system');
      }
    } else {
      missing.push('Scoring system');
    }

    return { met, missing };
  }

  private getNextSteps(data: Phase2ContractData, isCompliant: boolean): string[] {
    const steps: string[] = [];
    
    if (isCompliant) {
      steps.push('Publish tender announcement');
      steps.push('Open tender for applications');
      steps.push('Evaluate submitted bids');
      steps.push('Award contract to selected supplier');
      steps.push('Complete contract signing');
    } else {
      if (data.missingRequirements?.includes('Tender type')) {
        steps.push('Configure tender type (open/restricted/negotiated)');
      }
      if (data.missingRequirements?.includes('Future deadline')) {
        steps.push('Set future tender deadline');
      }
      if (data.missingRequirements?.includes('Evaluation criteria')) {
        steps.push('Define evaluation criteria with proper weight distribution');
      }
      if (data.missingRequirements?.includes('Valid scoring system')) {
        steps.push('Configure scoring system with valid min/max/passing scores');
      }
    }

    return steps;
  }

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