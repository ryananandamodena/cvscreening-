import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../layouts/Sidebar';
import { AuthProvider } from '../../guards/AuthGuard';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { fakeTokenForRole } from '../fixtures/auth';

function renderSidebar() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AuthProvider>
          <Sidebar collapsed={false} setCollapsed={() => {}} />
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  // Force English so assertions check the actual rendered label rather than the translation
  // key or an Indonesian string — LanguageContext defaults to 'id' otherwise.
  localStorage.setItem('app_language', 'en');
});

describe('Sidebar RBAC filtering (config/routes.ts is the source of truth, not invented here)', () => {
  it('admin sees admin-only items (Audit Log, roles: ["admin"])', () => {
    localStorage.setItem('access_token', fakeTokenForRole('admin'));
    renderSidebar();
    expect(screen.getByText(/nav\.auditLog|Audit Log/i)).toBeInTheDocument();
  });

  it('a plain viewer does NOT see the admin-only Audit Log item', () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    renderSidebar();
    expect(screen.queryByText(/nav\.auditLog|Audit Log/i)).not.toBeInTheDocument();
  });

  it('recruiter sees the unrestricted Recruitment section (Job Management — no roles key in config/routes.ts)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    renderSidebar();
    expect(screen.getByText(/nav\.jobs|Job Management/i)).toBeInTheDocument();
  });

  // --- Module 13 fix verification ---
  // The rest of the Recruitment section (Screening, Interviews, Interview Schedule, Offers,
  // Talent Pool, Question Bank, Assessments) was missed by Module 12 — it had no `roles` key at
  // all despite every one of those backend endpoints being RecruiterOrAdmin()-gated, with no
  // self-service read path. A viewer/hiring_manager/finance user could see (and click into) a
  // page that would then 403 on every data fetch.
  it('viewer does NOT see Interview Schedule, Offer Letters, Talent Pool, or Question Bank (all RecruiterOrAdmin-gated backend-side, Module 13 fix)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    renderSidebar();
    expect(screen.queryByText(/nav\.interviewSchedule|Interview Schedule/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nav\.offers|Offer Letters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nav\.pool|Talent Pool/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nav\.questions|Question Bank/i)).not.toBeInTheDocument();
  });

  it('recruiter DOES see Interview Schedule, Offer Letters, Talent Pool, and Question Bank (Module 13 fix)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    renderSidebar();
    expect(screen.getByText(/nav\.interviewSchedule|Interview Schedule/i)).toBeInTheDocument();
    expect(screen.getByText(/nav\.offers|Offer Letters/i)).toBeInTheDocument();
    expect(screen.getByText(/nav\.pool|Talent Pool/i)).toBeInTheDocument();
    expect(screen.getByText(/nav\.questions|Question Bank/i)).toBeInTheDocument();
  });

  // --- Module 12 fix verification (was: "BUG: ..." in Module 11) ---
  // config/routes.ts no longer gates Core HR routes with the non-existent 'hr'/'employee'
  // roles. Compensation/Payroll/Payroll Simulator are now FinanceOrAdmin()-aligned
  // (['admin','finance']); Performance/Succession/Shift Management are RecruiterOrAdmin()-aligned
  // (['admin','recruiter'], matching routes_hr.go / routes_benefits_succession.go); Training,
  // Benefits, Documents, Attendance, Approvals, Leaves, Employee Portal carry no roles
  // restriction since their backend reads/self-service actions are open to any authenticated
  // employee.
  it('FIXED: finance role now sees Compensation in the sidebar (route.roles: ["admin","finance"])', () => {
    localStorage.setItem('access_token', fakeTokenForRole('finance'));
    renderSidebar();
    expect(screen.getByText(/nav\.compensation|Compensation/i)).toBeInTheDocument();
  });

  it('FIXED: recruiter now sees Performance (route.roles: ["admin","recruiter"], matches RecruiterOrAdmin() on review authoring)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    renderSidebar();
    expect(screen.getByText(/nav\.performance|Performance/i)).toBeInTheDocument();
  });

  it('hiring_manager still does not see Performance — the backend gate on authoring reviews is RecruiterOrAdmin(), not hiring_manager', () => {
    localStorage.setItem('access_token', fakeTokenForRole('hiring_manager'));
    renderSidebar();
    expect(screen.queryByText(/nav\.performance|Performance/i)).not.toBeInTheDocument();
  });

  it('viewer now sees self-service Training/Benefits/Leaves/Attendance/Employee Portal (no roles restriction, matches open backend reads)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    renderSidebar();
    expect(screen.getByText(/nav\.training|Training/i)).toBeInTheDocument();
    expect(screen.getByText(/nav\.benefits|Benefits/i)).toBeInTheDocument();
    expect(screen.getByText(/nav\.leaves|Leave Management/i)).toBeInTheDocument();
    expect(screen.getByText(/nav\.employeePortal|Employee Portal/i)).toBeInTheDocument();
  });

  it('admin sees Compensation, Payroll, Benefits, Succession (superset access)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('admin'));
    renderSidebar();
    expect(screen.getByText(/nav\.compensation|Compensation/i)).toBeInTheDocument();
  });
});
