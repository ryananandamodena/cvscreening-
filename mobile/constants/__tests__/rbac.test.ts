import {
  ROLE_PERMISSIONS,
  permissionsForRole,
  hasPermission,
  hasRole,
  canAccessTab,
} from '../rbac';

// Role matrix from the master spec (EMPLOYEE/MANAGER/HR/ADMIN) mapped onto the real backend
// role strings, since the backend has no EMPLOYEE/MANAGER/HR/ADMIN enum — see rbac.ts header.
//   EMPLOYEE-tier -> "viewer" / "recruiter"
//   MANAGER-tier  -> "hiring_manager"
//   HR-tier       -> "hr" / "hr_admin" / "hr_manager"
//   ADMIN-tier    -> "admin"
describe('permissionsForRole', () => {
  it('grants employee-tier (viewer) only self-service permissions, never approvals or HR data', () => {
    const perms = permissionsForRole('viewer');
    expect(hasPermission(perms, 'attendance.clock_in')).toBe(true);
    expect(hasPermission(perms, 'leave.create')).toBe(true);
    expect(hasPermission(perms, 'leave.approve')).toBe(false);
    expect(hasPermission(perms, 'employee.view')).toBe(false);
    expect(hasPermission(perms, 'employee.manage')).toBe(false);
  });

  it('grants recruiter self-service plus recruitment.view (matches the backend RecruiterOrAdmin gate on screenings/interviews/candidates), but no approvals or HR data', () => {
    const perms = permissionsForRole('recruiter');
    const viewerPerms = permissionsForRole('viewer');
    expect(hasPermission(perms, 'recruitment.view')).toBe(true);
    expect(hasPermission(viewerPerms, 'recruitment.view')).toBe(false);
    expect(hasPermission(perms, 'leave.approve')).toBe(false);
    expect(hasPermission(perms, 'employee.manage')).toBe(false);
    // Otherwise identical to viewer's self-service set.
    expect(perms.filter((p) => p !== 'recruitment.view')).toEqual(viewerPerms);
  });

  it('grants manager-tier (hiring_manager) approvals on top of self-service, but no HR/employee data access', () => {
    const perms = permissionsForRole('hiring_manager');
    expect(hasPermission(perms, 'leave.approve')).toBe(true);
    expect(hasPermission(perms, 'overtime.approve')).toBe(true);
    expect(hasPermission(perms, 'reimbursement.approve')).toBe(true);
    expect(hasPermission(perms, 'employee.manage')).toBe(false);
  });

  it('grants hr-tier (hr) employee/report access but not approvals', () => {
    const perms = permissionsForRole('hr');
    expect(hasPermission(perms, 'employee.view')).toBe(true);
    expect(hasPermission(perms, 'employee.manage')).toBe(true);
    expect(hasPermission(perms, 'report.view')).toBe(true);
    expect(hasPermission(perms, 'leave.approve')).toBe(false);
  });

  it('grants hr_admin and hr_manager both HR data access and approvals', () => {
    for (const role of ['hr_admin', 'hr_manager'] as const) {
      const perms = permissionsForRole(role);
      expect(hasPermission(perms, 'employee.manage')).toBe(true);
      expect(hasPermission(perms, 'leave.approve')).toBe(true);
    }
  });

  it('grants admin-tier every defined permission', () => {
    const perms = permissionsForRole('admin');
    const allPermissions = Array.from(new Set(Object.values(ROLE_PERMISSIONS).flat()));
    for (const permission of allPermissions) {
      expect(hasPermission(perms, permission)).toBe(true);
    }
  });

  it('falls back to least-privilege (viewer) permissions for an unknown/missing role', () => {
    expect(permissionsForRole('some_future_role')).toEqual(permissionsForRole('viewer'));
    expect(permissionsForRole(null)).toEqual(permissionsForRole('viewer'));
    expect(permissionsForRole(undefined)).toEqual(permissionsForRole('viewer'));
    // Guards against a typo'd role string silently being treated as a real one.
    expect(permissionsForRole('ADMINN')).toEqual(permissionsForRole('viewer'));
  });
});

describe('hasRole', () => {
  it('matches only roles in the allowed list', () => {
    expect(hasRole('admin', ['admin'])).toBe(true);
    expect(hasRole('viewer', ['admin'])).toBe(false);
    expect(hasRole(null, ['admin'])).toBe(false);
  });
});

describe('canAccessTab', () => {
  it('lets an employee (viewer) reach self-service tabs but not the employees/org-structure tabs', () => {
    const perms = permissionsForRole('viewer');
    expect(canAccessTab(perms, 'clock')).toBe(true);
    expect(canAccessTab(perms, 'leave-request')).toBe(true);
    expect(canAccessTab(perms, 'employees')).toBe(false);
    expect(canAccessTab(perms, 'org-structure')).toBe(false);
  });

  it('lets hr reach the employees/org-structure tabs', () => {
    const perms = permissionsForRole('hr');
    expect(canAccessTab(perms, 'employees')).toBe(true);
    expect(canAccessTab(perms, 'org-structure')).toBe(true);
  });

  it('treats tabs with no configured permission as accessible to everyone', () => {
    const perms = permissionsForRole('viewer');
    expect(canAccessTab(perms, 'index')).toBe(true);
    expect(canAccessTab(perms, 'profile')).toBe(true);
  });

  // recruitment.view matches the backend's RecruiterOrAdmin() gate on /screenings,
  // /interviews, /candidates (registerRecruitmentAdminRoutes, Module 10) — only admin/recruiter
  // pass that gate server-side, so these tabs must be hidden for everyone else.
  it('admin and recruiter can access screenings/interviews; viewer and hiring_manager cannot', () => {
    expect(canAccessTab(permissionsForRole('admin'), 'screenings')).toBe(true);
    expect(canAccessTab(permissionsForRole('admin'), 'interviews')).toBe(true);
    expect(canAccessTab(permissionsForRole('recruiter'), 'screenings')).toBe(true);
    expect(canAccessTab(permissionsForRole('recruiter'), 'interviews')).toBe(true);

    expect(canAccessTab(permissionsForRole('viewer'), 'screenings')).toBe(false);
    expect(canAccessTab(permissionsForRole('viewer'), 'interviews')).toBe(false);
    expect(canAccessTab(permissionsForRole('hiring_manager'), 'screenings')).toBe(false);
    expect(canAccessTab(permissionsForRole('hiring_manager'), 'interviews')).toBe(false);
  });

  it('jobs tab stays self-service (backend allows GET /jobs/:id for any authenticated employee)', () => {
    expect(canAccessTab(permissionsForRole('viewer'), 'jobs')).toBe(true);
    expect(canAccessTab(permissionsForRole('recruiter'), 'jobs')).toBe(true);
  });

  // training matches the backend: GET /training/programs, /training/my-trainings, and the
  // enroll endpoint sit under `protected` with no extra role gate (routes_hr.go) — every
  // authenticated employee can browse and self-enroll.
  it('training tab is accessible to every role, including viewer', () => {
    expect(canAccessTab(permissionsForRole('viewer'), 'training')).toBe(true);
    expect(canAccessTab(permissionsForRole('admin'), 'training')).toBe(true);
    expect(canAccessTab(permissionsForRole('hr'), 'training')).toBe(true);
  });

  // performance matches the backend: GET/POST /performance/goals and GET /performance/reviews
  // sit under `protected` with no extra role gate (routes_hr.go) — every authenticated
  // employee can view/manage their own goals and reviews.
  it('performance tab is accessible to every role, including viewer', () => {
    expect(canAccessTab(permissionsForRole('viewer'), 'performance')).toBe(true);
    expect(canAccessTab(permissionsForRole('admin'), 'performance')).toBe(true);
    expect(canAccessTab(permissionsForRole('hr'), 'performance')).toBe(true);
  });

  // benefits matches the backend: self-service /benefits/* GET routes sit under `protected`
  // with no extra role gate (routes_benefits_succession.go) — every authenticated employee
  // can view their own benefits/insurance/dependents/flexible/retirement data.
  it('benefits tab is accessible to every role, including viewer', () => {
    expect(canAccessTab(permissionsForRole('viewer'), 'benefits')).toBe(true);
    expect(canAccessTab(permissionsForRole('admin'), 'benefits')).toBe(true);
    expect(canAccessTab(permissionsForRole('hr'), 'benefits')).toBe(true);
  });

  // career matches the backend: GET /succession/career-paths(+/:id) and GET/POST
  // /succession/leadership-programs(+/:id/enroll) sit under `protected` with no extra role
  // gate — every authenticated employee can view their own career path and self-enroll in
  // leadership programs. Succession plans/candidates/nine-box stay hrOrAdmin-only and are
  // never surfaced in mobile.
  it('career tab is accessible to every role, including viewer', () => {
    expect(canAccessTab(permissionsForRole('viewer'), 'career')).toBe(true);
    expect(canAccessTab(permissionsForRole('admin'), 'career')).toBe(true);
    expect(canAccessTab(permissionsForRole('hr'), 'career')).toBe(true);
  });
});
