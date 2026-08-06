import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Contract, Supplier } from '../contract.service';

@Injectable({
  providedIn: 'root'
})
export class ContractReportService {
  private readonly API_URL = 'api/contracts';

  constructor(private http: HttpClient) {}

  // Generate contract report
  generateReport(type: 'summary' | 'detailed' | 'financial', period: 'current' | 'monthly' | 'yearly' | 'custom', dateRange?: { from: Date; to: Date }): Observable<Blob> {
    const params: any = { type, period };
    if (dateRange) {
      params.from = dateRange.from.toISOString();
      params.to = dateRange.to.toISOString();
    }

    return this.http.get<Blob>(`${this.API_URL}/reports`, {
      params,
      responseType: 'blob' as 'blob'
    });
  }

  // Export contract data
  exportContractData(contractId: string, format: 'pdf' | 'csv' | 'json' | 'xml'): Observable<Blob> {
    return this.http.get<Blob>(`${this.API_URL}/${contractId}/export/${format}`, {
      responseType: 'blob' as 'blob'
    });
  }

  // Get supplier analytics
  getSupplierAnalytics(): Observable<{
    suppliers: Supplier[];
    totalContracts: number;
    totalValue: number;
    contractsBySupplier: { [supplierId: string]: number };
    averageContractValue: number;
  }> {
    return this.http.get<{
      suppliers: Supplier[];
      totalContracts: number;
      totalValue: number;
      contractsBySupplier: { [supplierId: string]: number };
      averageContractValue: number;
    }>(`${this.API_URL}/analytics/suppliers`).pipe(
      catchError(this.handleError)
    );
  }

  // Get financial summary
  getFinancialSummary(): Observable<{
    totalActiveContracts: number;
    totalValueActive: number;
    totalCompletedContracts: number;
    totalValueCompleted: number;
    budgetStatus: 'on_track' | 'over_budget' | 'under_budget';
    phaseDistribution: { [phase: string]: number };
  }> {
    return this.http.get<{
      totalActiveContracts: number;
      totalValueActive: number;
      totalCompletedContracts: number;
      totalValueCompleted: number;
      budgetStatus: 'on_track' | 'over_budget' | 'under_budget';
      phaseDistribution: { [phase: string]: number };
    }>(`${this.API_URL}/analytics/financial`).pipe(
      catchError(this.handleError)
    );
  }

  // Search functionality
  searchContracts(query: string, options?: {
    status?: string[];
    phase?: string;
    supplierName?: string;
    dateRange?: { from: Date; to: Date };
  }): Observable<Contract[]> {
    const params: any = { q: query };
    if (options) {
      if (options.status) params.status = options.status.join(',');
      if (options.phase) params.phase = options.phase;
      if (options.supplierName) params.supplier = options.supplierName;
      if (options.dateRange) {
        params.from = options.dateRange.from.toISOString();
        params.to = options.dateRange.to.toISOString();
      }
    }

    return this.http.get<Contract[]>(`${this.API_URL}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Get contract statistics
  getStatistics(): Observable<{
    totalContracts: number;
    byStatus: { [status: string]: number };
    byPhase: { [phase: string]: number };
    byCurrency: { [currency: string]: number };
    averageDuration: number;
    complianceRate: number;
  }> {
    return this.http.get<{
      totalContracts: number;
      byStatus: { [status: string]: number };
      byPhase: { [phase: string]: number };
      byCurrency: { [currency: string]: number };
      averageDuration: number;
      complianceRate: number;
    }>(`${this.API_URL}/statistics`).pipe(
      catchError(this.handleError)
    );
  }

  // Handle errors
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error: ${error.status || 500}`;
    }
    return of({} as any);
  }
}