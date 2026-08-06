import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContractInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add common contract API headers
    const authReq = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    return next.handle(authReq);
  }
}

// Optional: Configure HTTP interceptors for contract API
// Add to app.module.ts providers:
// {
//   provide: HTTP_INTERCEPTORS,
//   useClass: ContractInterceptor,
//   multi: true
// }

// Contract API configuration
export const CONTRACT_API_CONFIG = {
  baseUrl: 'api/contracts',
  timeout: 30000,
  retryAttempts: 3,
  endpoints: {
    contracts: '/contracts',
    contractsById: '/contracts/:id',
    phase2: '/contracts/:id/phase2',
    phase2Approval: '/contracts/:id/phase2/approve',
    export: '/contracts/:id/export/:format',
    search: '/contracts/search',
    reports: '/contracts/reports',
    statistics: '/contracts/statistics',
    analytics: {
      suppliers: '/analytics/suppliers',
      financial: '/analytics/financial'
    }
  }
};