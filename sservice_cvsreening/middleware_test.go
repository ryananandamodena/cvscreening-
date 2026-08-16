package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// runRoleMiddleware exercises a role-gating middleware in isolation, using gin's built-in
// test-context constructor (no DB, no real HTTP server) — the same "pure logic, no DB mocking"
// spirit as this repo's other unit tests, just for the gin-context-dependent RBAC helpers that
// Modules 7-10 relied on throughout. Returns the HTTP status the middleware produced; if it
// called c.Next() (i.e. allowed the request through), status is 200 because the fake next
// handler writes 200.
func runRoleMiddleware(t *testing.T, mw gin.HandlerFunc, role string) int {
	t.Helper()
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	_, engine := gin.CreateTestContext(w)

	// Seed "role" the same way AuthMiddleware does after decoding the JWT (auth.go:100) —
	// a preceding middleware in the real chain, not something RoleMiddleware itself reads
	// from anywhere but the context.
	engine.Use(func(c *gin.Context) {
		if role != "" {
			c.Set("role", role)
		}
		c.Next()
	})
	engine.GET("/test", mw, func(c *gin.Context) { c.Status(http.StatusOK) })

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	engine.ServeHTTP(w, req)

	return w.Code
}

func TestAdminOnly(t *testing.T) {
	cases := []struct {
		role string
		want int
	}{
		{"admin", http.StatusOK},
		{"recruiter", http.StatusForbidden},
		{"hiring_manager", http.StatusForbidden},
		{"viewer", http.StatusForbidden},
		{"finance", http.StatusForbidden},
		{"", http.StatusUnauthorized}, // no role in context at all (shouldn't happen post-auth, but fail closed)
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			got := runRoleMiddleware(t, AdminOnly(), c.role)
			if got != c.want {
				t.Errorf("AdminOnly() with role=%q: got %d, want %d", c.role, got, c.want)
			}
		})
	}
}

func TestFinanceOrAdmin(t *testing.T) {
	cases := []struct {
		role string
		want int
	}{
		{"admin", http.StatusOK},
		{"finance", http.StatusOK},
		{"recruiter", http.StatusForbidden},
		{"hiring_manager", http.StatusForbidden},
		{"viewer", http.StatusForbidden},
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			got := runRoleMiddleware(t, FinanceOrAdmin(), c.role)
			if got != c.want {
				t.Errorf("FinanceOrAdmin() with role=%q: got %d, want %d", c.role, got, c.want)
			}
		})
	}
}

func TestRecruiterOrAdmin(t *testing.T) {
	cases := []struct {
		role string
		want int
	}{
		{"admin", http.StatusOK},
		{"recruiter", http.StatusOK},
		{"finance", http.StatusForbidden},
		{"hiring_manager", http.StatusForbidden},
		{"viewer", http.StatusForbidden},
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			got := runRoleMiddleware(t, RecruiterOrAdmin(), c.role)
			if got != c.want {
				t.Errorf("RecruiterOrAdmin() with role=%q: got %d, want %d", c.role, got, c.want)
			}
		})
	}
}

func TestHiringManagerOrAdmin(t *testing.T) {
	cases := []struct {
		role string
		want int
	}{
		{"admin", http.StatusOK},
		{"hiring_manager", http.StatusOK},
		{"recruiter", http.StatusOK}, // per middleware.go:112, recruiter is explicitly included here too
		{"finance", http.StatusForbidden},
		{"viewer", http.StatusForbidden},
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			got := runRoleMiddleware(t, HiringManagerOrAdmin(), c.role)
			if got != c.want {
				t.Errorf("HiringManagerOrAdmin() with role=%q: got %d, want %d", c.role, got, c.want)
			}
		})
	}
}
