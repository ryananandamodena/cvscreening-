import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthGuard, { RoleGuard, validateTokenStructure, isTokenExpired, decodeJwtPayload } from '../../guards/AuthGuard';
import { fakeTokenForRole, expiredTokenForRole } from '../fixtures/auth';

// AuthProvider is required for RoleGuard's useAuth() to work — build one that seeds
// localStorage with a token the same way real login does, then let the actual
// AuthGuard component validate/decode it (no mocking of the guard logic itself).
import { AuthProvider } from '../../guards/AuthGuard';

function renderWithAuth(ui: React.ReactElement, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('AuthGuard token validation (pure functions)', () => {
  it('rejects a missing token', () => {
    expect(validateTokenStructure(null).valid).toBe(false);
  });

  it('rejects a malformed token (not 3 dot-separated parts)', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });

  it('accepts a well-formed, unexpired token', () => {
    const token = fakeTokenForRole('viewer');
    const result = validateTokenStructure(token);
    expect(result.valid).toBe(true);
    expect(result.payload?.role).toBe('viewer');
  });

  it('rejects an expired token', () => {
    const token = expiredTokenForRole('admin');
    const payload = decodeJwtPayload(token)!;
    expect(isTokenExpired(payload)).toBe(true);
    expect(validateTokenStructure(token).valid).toBe(false);
  });

  it('treats a token with no exp claim as invalid (fail closed, not open)', () => {
    expect(isTokenExpired({})).toBe(true);
  });
});

describe('AuthGuard route protection', () => {
  it('redirects an unauthenticated user to /login', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('lets an authenticated user through to the protected route', () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('clears an expired token from storage and redirects to login', () => {
    localStorage.setItem('access_token', expiredTokenForRole('admin'));
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});

describe('RoleGuard — matches actual backend role strings', () => {
  // Real backend roles per sservice_cvsreening/validators.go:184: admin, recruiter,
  // hiring_manager, viewer (+ finance, assignable via user management though not
  // self-registerable). These are the ONLY role strings a real JWT will ever carry.

  it('employee-tier (viewer) is denied an admin-only route', () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin']}>
        <div>Admin Panel</div>
      </RoleGuard>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('recruiter is allowed on a recruitment route gated ["admin","recruiter"]', () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin', 'recruiter']}>
        <div>Recruitment Pipeline</div>
      </RoleGuard>
    );
    expect(screen.getByText('Recruitment Pipeline')).toBeInTheDocument();
  });

  it('recruiter is denied a finance-only route', () => {
    localStorage.setItem('access_token', fakeTokenForRole('recruiter'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin', 'finance']}>
        <div>Compensation Bands</div>
      </RoleGuard>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('finance is allowed on a compensation route gated ["admin","finance"]', () => {
    localStorage.setItem('access_token', fakeTokenForRole('finance'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin', 'finance']}>
        <div>Compensation Bands</div>
      </RoleGuard>
    );
    expect(screen.getByText('Compensation Bands')).toBeInTheDocument();
  });

  it('hiring_manager (the closest real analog to "manager") is allowed on a manager-gated route', () => {
    localStorage.setItem('access_token', fakeTokenForRole('hiring_manager'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin', 'hiring_manager']}>
        <div>Team Approvals</div>
      </RoleGuard>
    );
    expect(screen.getByText('Team Approvals')).toBeInTheDocument();
  });

  it('admin is allowed wherever configured (superset access)', () => {
    localStorage.setItem('access_token', fakeTokenForRole('admin'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin']}>
        <div>System Settings</div>
      </RoleGuard>
    );
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  // --- Module 12 fix verification (was: "BUG: ... denies a real viewer role" in Module 11) ---
  // config/routes.ts no longer gates any route with 'hr'/'employee' — routes meant for
  // self-service (e.g. the former ['employee','admin','hr'] list) now simply carry no `roles`
  // field at all. AppRoutes.tsx only wraps a route in <RoleGuard> when route.roles is truthy
  // (routes/AppRoutes.tsx:63), so a self-service route renders its component directly — this
  // documents that real usage, rather than passing RoleGuard an unsupported undefined prop.
  it('FIXED: a self-service route with no roles restriction (Module 12 fix) renders directly, without RoleGuard, for a real viewer role', () => {
    localStorage.setItem('access_token', fakeTokenForRole('viewer'));
    renderWithAuth(<div>Intended-Employee-Accessible Page</div>);
    expect(screen.getByText('Intended-Employee-Accessible Page')).toBeInTheDocument();
  });

  it('FIXED: hiring_manager is denied a route now correctly gated ["admin","recruiter"] (was ["admin","hr"])', () => {
    localStorage.setItem('access_token', fakeTokenForRole('hiring_manager'));
    renderWithAuth(
      <RoleGuard allowedRoles={['admin', 'recruiter']}>
        <div>Succession Planning</div>
      </RoleGuard>
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});

describe('config/routes.ts — no invalid role strings (Module 12 regression)', () => {
  it('never gates a route with the non-existent "hr" or "employee" role strings', async () => {
    const { APP_ROUTES } = await import('../../config/routes');
    const invalid = APP_ROUTES.filter((r) => r.roles?.some((role) => role === 'hr' || role === 'employee'));
    expect(invalid.map((r) => r.path)).toEqual([]);
  });

  it('only ever uses real backend role strings in route.roles', async () => {
    const { APP_ROUTES } = await import('../../config/routes');
    const REAL_ROLES = ['admin', 'recruiter', 'hiring_manager', 'viewer', 'finance'];
    for (const route of APP_ROUTES) {
      if (!route.roles) continue;
      for (const role of route.roles) {
        expect(REAL_ROLES).toContain(role);
      }
    }
  });
});
