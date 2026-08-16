package main

import (
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
)

// authorizeOnboardingSession previously didn't exist at all — getOnboardingTasksHandler and
// updateOnboardingTaskHandler trusted a client-supplied sessionId with no check, letting any
// authenticated employee read/update another employee's onboarding tasks (Module 13 IDOR fix).
// This test locks in the role-bypass branch, which runs before any DB call and is therefore
// safe to unit test without DB mocking (the self/manager branch delegates to
// authorizeEmployeeTarget, already exercised indirectly via the live-verified matrix in earlier
// modules and requiring a real DB connection to test further here).
func TestAuthorizeOnboardingSession_StaffBypass(t *testing.T) {
	gin.SetMode(gin.TestMode)
	session := &models.OnboardingSession{ID: 1, EmployeeID: 999} // some other employee's session

	cases := []struct {
		role string
		want bool
	}{
		{"admin", true},
		{"recruiter", true},
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			w := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(w)
			ctx.Request = httptest.NewRequest("GET", "/test", nil)
			ctx.Set("role", c.role)

			got := authorizeOnboardingSession(ctx, session)
			if got != c.want {
				t.Errorf("authorizeOnboardingSession() with role=%q = %v, want %v", c.role, got, c.want)
			}
		})
	}
}
