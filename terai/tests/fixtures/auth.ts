// TEST FIXTURES — not used by any production code path.
//
// Builds a syntactically-valid (unsigned) JWT for exercising AuthGuard/RoleGuard's
// client-side decode/expiry logic in tests. This mirrors only the *shape* the real
// backend issues (see sservice_cvsreening/auth.go claims: userID, email, role, exp, iat) —
// it is never sent to a real server and signature verification is intentionally out of
// scope client-side (the backend is the real verifier).
function base64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.fake-signature-not-verified-client-side`;
}

// Real backend role strings (sservice_cvsreening/validators.go:184 — the only roles the
// registration endpoint accepts) plus 'finance', which FinanceOrAdmin() middleware checks
// for even though no registration path assigns it (presumably set via admin user management).
export const REAL_BACKEND_ROLES = ['admin', 'recruiter', 'hiring_manager', 'viewer', 'finance'] as const;

export function fakeTokenForRole(role: string, overrides: Record<string, unknown> = {}): string {
  return makeFakeJwt({
    sub: '1',
    email: `${role}@test.com`,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  });
}

export function expiredTokenForRole(role: string): string {
  return makeFakeJwt({
    sub: '1',
    email: `${role}@test.com`,
    role,
    iat: Math.floor(Date.now() / 1000) - 7200,
    exp: Math.floor(Date.now() / 1000) - 3600,
  });
}
