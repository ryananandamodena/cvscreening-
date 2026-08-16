// Centralized RBAC configuration.
//
// IMPORTANT: the backend has no fine-grained permission system and no EMPLOYEE/MANAGER/HR/ADMIN
// role enum — `models.User.Role` is a free-form string, and the only real values in use are:
// "admin", "recruiter", "hiring_manager", "viewer", "hr", "hr_admin", "hr_manager", "finance"
// (see sservice_cvsreening/validators.go, middleware.go, approval_engine_handlers.go). Role
// always comes from the backend (login/refresh response), never invented client-side.
//
// Permissions below are a client-side UI-gating construct only, computed from that role — the
// backend does not expose a permissions array. This is explicitly NOT the authorization source
// of truth: every sensitive backend endpoint (clock-in, approvals, payroll, employee data)
// enforces its own access rules server-side regardless of what the mobile app renders. Hiding a
// tab or blocking a route here is defense-in-depth / UX, not security.
export type UserRole =
  | 'admin'
  | 'hr'
  | 'hr_admin'
  | 'hr_manager'
  | 'finance'
  | 'hiring_manager'
  | 'recruiter'
  | 'viewer';

export type Permission =
  | 'attendance.view'
  | 'attendance.clock_in'
  | 'attendance.clock_out'
  | 'leave.view'
  | 'leave.create'
  | 'leave.approve'
  | 'overtime.view'
  | 'overtime.create'
  | 'overtime.approve'
  | 'reimbursement.create'
  | 'reimbursement.approve'
  | 'payroll.view'
  | 'employee.view'
  | 'employee.manage'
  | 'report.view'
  | 'recruitment.view'
  | 'attendance.manage_office_location';

const SELF_SERVICE_PERMISSIONS: Permission[] = [
  'attendance.view',
  'attendance.clock_in',
  'attendance.clock_out',
  'leave.view',
  'leave.create',
  'overtime.view',
  'overtime.create',
  'reimbursement.create',
  'payroll.view',
];

const APPROVAL_PERMISSIONS: Permission[] = [
  'leave.approve',
  'overtime.approve',
  'reimbursement.approve',
];

const HR_PERMISSIONS: Permission[] = [
  'employee.view',
  'employee.manage',
  'report.view',
];

// Matches the backend's HROrAdmin() route gate on PUT /attendance/office-location — only
// "admin"/"hr"/"hr_admin"/"hr_manager" can update the geofencing location server-side.
const OFFICE_LOCATION_PERMISSIONS: Permission[] = ['attendance.manage_office_location'];

// Matches the backend's RecruiterOrAdmin() route gate on /screenings, /interviews,
// /candidates, /interviews/:id/scorecard, etc. (registerRecruitmentAdminRoutes) — only
// "admin"/"recruiter" pass that gate server-side, so mobile hides the same screens for
// everyone else rather than showing a menu item that 403s on tap.
const RECRUITMENT_PERMISSIONS: Permission[] = ['recruitment.view'];

// Every real backend role maps to a permission set. Unknown/未-mapped roles fall through to the
// self-service default (least privilege) rather than throwing or granting access implicitly.
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [...SELF_SERVICE_PERMISSIONS, ...APPROVAL_PERMISSIONS, ...HR_PERMISSIONS, ...RECRUITMENT_PERMISSIONS, ...OFFICE_LOCATION_PERMISSIONS],
  hr: [...SELF_SERVICE_PERMISSIONS, ...HR_PERMISSIONS, ...OFFICE_LOCATION_PERMISSIONS],
  hr_admin: [...SELF_SERVICE_PERMISSIONS, ...APPROVAL_PERMISSIONS, ...HR_PERMISSIONS, ...OFFICE_LOCATION_PERMISSIONS],
  hr_manager: [...SELF_SERVICE_PERMISSIONS, ...APPROVAL_PERMISSIONS, ...HR_PERMISSIONS, ...OFFICE_LOCATION_PERMISSIONS],
  finance: [...SELF_SERVICE_PERMISSIONS, 'reimbursement.approve', 'report.view'],
  // hiring_manager is the closest real analog to a people-manager in this backend's role set.
  hiring_manager: [...SELF_SERVICE_PERMISSIONS, ...APPROVAL_PERMISSIONS],
  recruiter: [...SELF_SERVICE_PERMISSIONS, ...RECRUITMENT_PERMISSIONS],
  // "viewer" is the default role new registrations get — treated as a plain employee.
  viewer: [...SELF_SERVICE_PERMISSIONS],
};

const DEFAULT_PERMISSIONS = ROLE_PERMISSIONS.viewer;

export function permissionsForRole(role: string | null | undefined): Permission[] {
  if (role && role in ROLE_PERMISSIONS) {
    return ROLE_PERMISSIONS[role as UserRole];
  }
  return DEFAULT_PERMISSIONS;
}

export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  return permissions.includes(permission);
}

export function hasRole(role: string | null | undefined, roles: UserRole[]): boolean {
  return !!role && roles.includes(role as UserRole);
}

// Tab -> permission required to see/enter it. `null` means every authenticated user can access
// it (e.g. Home, Profile). Used for both hiding tab bar items and guarding the route itself.
export const TAB_PERMISSIONS: Record<string, Permission | null> = {
  index: null,
  menu: null,
  clock: 'attendance.clock_in',
  'my-work': null,
  profile: null,
  attendance: 'attendance.view',
  employees: 'employee.view',
  'org-structure': 'employee.view',
  'leave-request': 'leave.create',
  'overtime-request': 'overtime.create',
  'absence-request': 'leave.create',
  'swap-shift': 'attendance.view',
  payslip: 'payroll.view',
  'claim-form': 'reimbursement.create',
  'loan-request': 'reimbursement.create',
  onboarding: null,
  'employee-survey': null,
  // Matches the backend: GET /training/programs, /training/my-trainings, and the enroll
  // endpoint all sit under `protected` with no extra role gate — every authenticated
  // employee can browse and self-enroll.
  training: null,
  // Matches the backend: GET/POST /performance/goals and GET /performance/reviews sit
  // under `protected` with no extra role gate — every authenticated employee can view
  // and manage their own goals/reviews (server-side authorizeEmployeeTarget scopes it).
  performance: null,
  // Matches the backend: all self-service /benefits/* GET routes (employee, insurance-*,
  // dependents/:employeeId, flexible, retirement) sit under `protected` with no extra role
  // gate — every authenticated employee can view their own benefits (server-side
  // authorizeEmployeeTarget scopes the employeeId-bearing ones).
  benefits: null,
  // Matches the backend: GET /succession/career-paths(+/:id) and GET/POST
  // /succession/leadership-programs(+/:id/enroll) sit under `protected` with no extra role
  // gate — every authenticated employee can view their own career path and self-enroll in
  // leadership programs. Succession plans/candidates/nine-box are hrOrAdmin-only on the
  // backend and are deliberately NOT surfaced anywhere in mobile (sensitive HR data).
  career: null,
  // Job postings (list + detail) are self-service (mobile's internal job board), unlike CV
  // screening/interview scheduling which are recruiter/HR-only on the backend.
  jobs: null,
  screenings: 'recruitment.view',
  interviews: 'recruitment.view',
  // Matches the backend's HROrAdmin() gate on PUT /attendance/office-location.
  'office-location': 'attendance.manage_office_location',
  'remote-exemptions': 'attendance.manage_office_location',
};

export function canAccessTab(permissions: Permission[], tabName: string): boolean {
  const required = TAB_PERMISSIONS[tabName];
  if (required === null || required === undefined) return true;
  return hasPermission(permissions, required);
}
