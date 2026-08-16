package main

import "testing"

// isHRRole (attendance corrections) and isHRRoleForApprovals (approval-flow config) previously
// only matched "admin"/"hr"/"hr_admin"/"hr_manager" — none of which "recruiter" is — even
// though the routes they gate are RecruiterOrAdmin() at the router level. A recruiter who
// legitimately passed the route middleware was rejected inside the handler anyway. This test
// locks in the Module 14 fix: both functions now match the real backend role model exactly.
func TestIsHRRole_MatchesRealBackendRoles(t *testing.T) {
	cases := []struct {
		role string
		want bool
	}{
		{"admin", true},
		{"recruiter", true},
		{"hiring_manager", false},
		{"viewer", false},
		{"finance", false},
		{"hr", false},
		{"hr_admin", false},
		{"hr_manager", false},
		{"manager", false},
		{"employee", false},
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			if got := isHRRole(c.role); got != c.want {
				t.Errorf("isHRRole(%q) = %v, want %v", c.role, got, c.want)
			}
		})
	}
}

// shouldEnforceFaceVerification: mobile is the one declared, honest exemption from mandatory
// face-matching (it has no on-device face-matching capability at all) — everything else,
// including an empty/unrecognized clientType, must still enforce it (fail closed on the
// spoofable string, not open).
func TestShouldEnforceFaceVerification(t *testing.T) {
	cases := []struct {
		clientType string
		want       bool
	}{
		{"", true},
		{"web", true},
		{"mobile", false},
		{"Mobile", false},
		{" MOBILE ", false},
		{"desktop", true},
		{"mobile-app", true}, // not an exact match — fails closed, doesn't loosely match
	}
	for _, c := range cases {
		t.Run(c.clientType, func(t *testing.T) {
			if got := shouldEnforceFaceVerification(c.clientType); got != c.want {
				t.Errorf("shouldEnforceFaceVerification(%q) = %v, want %v", c.clientType, got, c.want)
			}
		})
	}
}

func TestIsHRRoleForApprovals_MatchesRealBackendRoles(t *testing.T) {
	cases := []struct {
		role string
		want bool
	}{
		{"admin", true},
		{"recruiter", true},
		{"ADMIN", true},   // case-insensitive
		{"Recruiter", true},
		{"hiring_manager", false},
		{"viewer", false},
		{"finance", false},
		{"hr", false},
		{"hr_admin", false},
		{"hr_manager", false},
		{"manager", false},
		{"employee", false},
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			if got := isHRRoleForApprovals(c.role); got != c.want {
				t.Errorf("isHRRoleForApprovals(%q) = %v, want %v", c.role, got, c.want)
			}
		})
	}
}
