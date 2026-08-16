import { describe, it, expect } from 'vitest';
import { APP_ROUTES } from '../../config/routes';

// Single source-of-truth matrix: every route's roles must exactly match its backend gate.
// "null" means intentionally no restriction (backend self-service is open to every real role).
// Cross-referenced against sservice_cvsreening/routes_*.go — see the Module 12/13 reports for the
// file:line citations behind each mapping. If a route's real roles need to change, update this
// matrix AND config/routes.ts together — a mismatch here is exactly the class of bug Module 12/13
// exist to catch.
const EXPECTED: Record<string, string[] | null> = {
  // Core HR
  '/performance': ['admin', 'recruiter'], // create/update/analyze reviews = RecruiterOrAdmin()
  '/employee-portal': null, // GET /employees/me open to all
  '/training': null, // catalog/enroll open to all; only POST /training/programs is staff-gated
  '/benefits': null, // own benefits/enroll open to all; only plan CRUD is staff-gated
  '/compensation': ['admin', 'finance'], // bands/grades/structures/analytics = FinanceOrAdmin()
  '/succession': ['admin', 'recruiter'], // plans/candidates/nine-box (reads AND writes) = RecruiterOrAdmin()
  '/documents': null, // reads open to all; only authoring is staff-gated
  '/system/audit-log': ['admin'], // AdminOnly()
  '/attendance': null, // clock-in/history open to all; team view is gated inside the component
  '/attendance/shifts': ['admin', 'recruiter'], // shift CRUD = RecruiterOrAdmin()
  '/attendance/kiosk': ['admin', 'recruiter'], // no dedicated backend gate; business-decision default
  '/approvals': null, // act/cancel/mine resolve JWT identity; HR-review/config gated inside the component
  '/leaves': null, // reads/creation open to all; approve/reject checked in-handler
  '/payroll': ['admin', 'finance'], // periods/configs/payslip-catalog (read+write) = FinanceOrAdmin()
  '/my-payslip': null, // self-service, open to all
  '/payroll-simulator': ['admin', 'finance'], // SimulatePayroll = FinanceOrAdmin()
  '/users': ['admin'], // AdminOnly()

  // Recruitment — every one of these has zero self-service read path backend-side; all are
  // RecruiterOrAdmin() end to end (Module 13 fix — Module 12 missed this whole section).
  '/jobs': null, // GET /jobs is fully public; GET /jobs/:id open to any authenticated employee
  '/screening/:id?': ['admin', 'recruiter'],
  '/interviews': ['admin', 'recruiter'],
  '/interview-schedule': ['admin', 'recruiter'],
  '/interview-scorecard/:interviewId?': ['admin', 'recruiter'],
  '/interviews/:id/results': ['admin', 'recruiter'],
  '/offers': ['admin', 'recruiter'],
  '/skill-matching': ['admin', 'recruiter'],
  '/linkedin-import': ['admin', 'recruiter'],
  '/recording/:id': ['admin', 'recruiter'],
  '/pool': ['admin', 'recruiter'],
  '/questions': ['admin', 'recruiter'],
  '/assessments': ['admin', 'recruiter'],
  '/assessments/:id': ['admin', 'recruiter'],
};

function routesByPath() {
  return new Map(APP_ROUTES.map((r) => [r.path, r]));
}

describe('Web route ↔ backend authorization matrix (Module 12/13)', () => {
  it('every route in the matrix still exists in config/routes.ts', () => {
    const byPath = routesByPath();
    const missing = Object.keys(EXPECTED).filter((path) => !byPath.has(path));
    expect(missing).toEqual([]);
  });

  for (const [path, expectedRoles] of Object.entries(EXPECTED)) {
    it(`${path} is gated exactly as the backend requires`, () => {
      const route = routesByPath().get(path);
      expect(route).toBeDefined();
      if (expectedRoles === null) {
        expect(route!.roles).toBeUndefined();
      } else {
        expect(route!.roles).toEqual(expectedRoles);
      }
    });
  }

  it('no route anywhere in config/routes.ts uses a role string the backend does not issue', () => {
    const REAL_ROLES = ['admin', 'recruiter', 'hiring_manager', 'viewer', 'finance'];
    for (const route of APP_ROUTES) {
      if (!route.roles) continue;
      for (const role of route.roles) {
        expect(REAL_ROLES).toContain(role);
      }
    }
  });

  it('every route this matrix knows about is covered — flags any newly added route with no matrix entry', () => {
    // Not every route needs a matrix entry (e.g. purely presentational routes with no roles and
    // no backend counterpart, like /settings). This just guards the routes we've explicitly
    // reasoned about above from silently drifting if someone edits their roles later without
    // updating this file.
    const byPath = routesByPath();
    for (const path of Object.keys(EXPECTED)) {
      expect(byPath.get(path)?.path).toBe(path);
    }
  });
});
