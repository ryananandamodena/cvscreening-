package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// Regression tests for the 5 IDOR / mock-data fixes made during the P0 audit:
//   1. getGoalsHandler        — employeeId query param was trusted with no ownership check.
//   2. getCareerPathByIDHandler — had NO authorization check at all.
//   3. recordInsuranceContinuationPaymentHandler — had no role gate at all (moved to hrOrAdmin).
//   4. updateOnboardingTaskHandler — verified sessionId ownership but never that taskId
//      actually belonged to that session.
//   5. getPerformanceAnalyticsHandler — avgRating was hardcoded to 4.1 regardless of data.
//
// Fix #3 is middleware-only and DB-free, so it runs unconditionally. Fixes #1, #2, #4, #5 all
// bottom out in authorizeEmployeeTarget -> repository.GetEmployeeIDByUserID, which returns
// (0, nil) whenever !IsDBConnected() (see repository/employee_repository.go) — so the actual
// ownership-check branches these fixes changed are only reachable with a live database. Those
// tests skip with a clear message if no DB is connected; run them with DATABASE_URL pointed at
// a real (ideally disposable/test) Postgres instance to exercise them for real.

// ---- Fix #3: role-gate only, no DB needed ----

func TestRecruiterOrAdminMiddleware_BlocksNonHRRoles(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Mirrors the route this guards after the fix: hrOrAdmin.POST(".../:id/payment",
	// recordInsuranceContinuationPaymentHandler) — previously this action had NO gate at all.
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("role", c.GetHeader("X-Test-Role"))
		c.Next()
	})
	router.POST("/benefits/insurance-continuation/:id/payment", RecruiterOrAdmin(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	cases := []struct {
		role       string
		wantStatus int
	}{
		{"admin", http.StatusOK},
		{"recruiter", http.StatusOK},
		{"viewer", http.StatusForbidden},
		{"hiring_manager", http.StatusForbidden},
		{"hr_admin", http.StatusForbidden}, // RecruiterOrAdmin only allows admin/recruiter, by design
	}
	for _, c := range cases {
		t.Run(c.role, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/benefits/insurance-continuation/1/payment", nil)
			req.Header.Set("X-Test-Role", c.role)
			router.ServeHTTP(w, req)
			if w.Code != c.wantStatus {
				t.Errorf("role=%q: got status %d, want %d (body: %s)", c.role, w.Code, c.wantStatus, w.Body.String())
			}
		})
	}
}

// ---- DB-gated integration tests for fixes #1, #2, #4, #5 ----

func skipIfNoDB(t *testing.T) {
	t.Helper()
	if !repository.IsDBConnected() {
		t.Skip("skipping: requires a live DATABASE_URL (Postgres) — the ownership-check branches " +
			"these fixes changed all bottom out in repository.GetEmployeeIDByUserID, which short-circuits " +
			"to a no-op without a real DB connection. Run with a real/test Postgres to exercise this.")
	}
}

// seedTwoUnrelatedEmployees creates two users + employees with no manager relationship between
// them, so neither is authorized to act on the other's data via authorizeEmployeeTarget's
// manager-of branch. Registers cleanup to remove both rows regardless of test outcome.
func seedTwoUnrelatedEmployees(t *testing.T, ctx context.Context) (userA, empA, userB, empB int) {
	t.Helper()

	mkUser := func(email string) int {
		id, err := repository.CreateUser(ctx, &models.User{
			Email: email, PasswordHash: "x", FullName: email, Role: "viewer", Department: "Test",
		})
		if err != nil {
			t.Fatalf("CreateUser(%s): %v", email, err)
		}
		return id
	}
	mkEmployee := func(nik, email string, userID int) int {
		uid := userID
		id, err := repository.CreateEmployee(ctx, &models.Employee{
			EmployeeID: nik, UserID: &uid, FullName: email, Email: email,
			EmploymentType: "permanent", EmploymentStatus: "active",
		})
		if err != nil {
			t.Fatalf("CreateEmployee(%s): %v", email, err)
		}
		return id
	}

	userA = mkUser("idor-test-a@example.com")
	userB = mkUser("idor-test-b@example.com")
	empA = mkEmployee("IDOR-TEST-A", "idor-test-a@example.com", userA)
	empB = mkEmployee("IDOR-TEST-B", "idor-test-b@example.com", userB)

	t.Cleanup(func() {
		repository.GetDB().Exec(ctx, `DELETE FROM employees WHERE id IN ($1, $2)`, empA, empB)
		repository.GetDB().Exec(ctx, `DELETE FROM users WHERE id IN ($1, $2)`, userA, userB)
	})
	return
}

// ctxAsUser builds a gin context authenticated as the given userID/role, matching what
// AuthMiddleware sets after a valid JWT (userID, email, role) — see auth.go.
func ctxAsUser(w *httptest.ResponseRecorder, method, path string, body []byte, userID int, role string) *gin.Context {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(w)
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	c.Request = req
	c.Set("userID", userID)
	c.Set("role", role)
	return c
}

func TestGetGoalsHandler_CannotReadAnotherEmployeesGoals(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()
	userA, _, _, empB := seedTwoUnrelatedEmployees(t, ctx)

	goalID, err := repository.CreateGoal(ctx, &models.PerformanceGoal{
		EmployeeID: empB, Title: "B's private goal", Category: "individual", Status: "not_started",
	})
	if err != nil {
		t.Fatalf("CreateGoal: %v", err)
	}
	t.Cleanup(func() { repository.DeleteGoal(ctx, goalID) })

	// Employee A (unrelated to B, not admin/recruiter) asks for B's goals by employeeId.
	w := httptest.NewRecorder()
	c := ctxAsUser(w, http.MethodGet, "/performance/goals", nil, userA, "viewer")
	c.Request.URL.RawQuery = "employeeId=" + strconv.Itoa(empB)

	getGoalsHandler(c)

	if w.Code == http.StatusOK {
		var goals []map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &goals); err == nil {
			for _, g := range goals {
				if title, _ := g["title"].(string); title == "B's private goal" {
					t.Fatalf("IDOR regression: employee A was able to read employee B's goal via ?employeeId=%d", empB)
				}
			}
		}
	}
	// A 403 (authorizeEmployeeTarget rejecting the cross-employee request) is the expected,
	// correct outcome; a 200 with an empty/own-only list is also acceptable.
}

func TestGetCareerPathByIDHandler_CannotReadAnotherEmployeesPath(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()
	userA, _, _, empB := seedTwoUnrelatedEmployees(t, ctx)

	pathID, err := repository.CreateCareerPath(ctx, &models.CareerPath{
		EmployeeID: empB, CurrentPosition: "B's Current Role", TargetPositions: []string{"B's Target Role"},
	})
	if err != nil {
		t.Fatalf("CreateCareerPath: %v", err)
	}

	w := httptest.NewRecorder()
	c := ctxAsUser(w, http.MethodGet, "/succession/career-paths/"+strconv.Itoa(pathID), nil, userA, "viewer")
	c.Params = gin.Params{{Key: "id", Value: strconv.Itoa(pathID)}}

	getCareerPathByIDHandler(c)

	if w.Code == http.StatusOK {
		t.Fatalf("IDOR regression: employee A (unrelated to B) was able to read B's career path %d — "+
			"expected 403/404, got 200: %s", pathID, w.Body.String())
	}
}

func TestUpdateOnboardingTaskHandler_CannotUpdateTaskFromAnotherSession(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()
	userA, empA, _, empB := seedTwoUnrelatedEmployees(t, ctx)

	sessionA, err := repository.CreateOnboardingSession(ctx, &models.OnboardingSession{EmployeeID: empA, Status: "in_progress"})
	if err != nil {
		t.Fatalf("CreateOnboardingSession(A): %v", err)
	}
	sessionB, err := repository.CreateOnboardingSession(ctx, &models.OnboardingSession{EmployeeID: empB, Status: "in_progress"})
	if err != nil {
		t.Fatalf("CreateOnboardingSession(B): %v", err)
	}
	taskB, err := repository.CreateOnboardingTask(ctx, &models.OnboardingTask{SessionID: sessionB, Title: "B's task", Status: "pending"})
	if err != nil {
		t.Fatalf("CreateOnboardingTask(B): %v", err)
	}

	// Employee A owns sessionA (passes authorizeOnboardingSession) but targets taskB, which
	// belongs to sessionB — the exact gap the fix closes.
	body := []byte(`{"status":"completed","sessionId":` + strconv.Itoa(sessionA) + `}`)
	w := httptest.NewRecorder()
	c := ctxAsUser(w, http.MethodPut, "/onboarding/tasks/"+strconv.Itoa(taskB), body, userA, "viewer")
	c.Params = gin.Params{{Key: "taskId", Value: strconv.Itoa(taskB)}}

	updateOnboardingTaskHandler(c)

	if w.Code == http.StatusOK {
		t.Fatalf("IDOR regression: employee A updated task %d belonging to employee B's session %d via their own session %d",
			taskB, sessionB, sessionA)
	}

	// No single-task getter exists in the repository package; check the row directly.
	var status string
	if err := repository.GetDB().QueryRow(ctx, `SELECT status FROM onboarding_tasks WHERE id = $1`, taskB).Scan(&status); err == nil {
		if status == "completed" {
			t.Fatalf("IDOR regression: task %d status was changed to completed despite the handler rejecting the request", taskB)
		}
	}
}

func TestGetPerformanceAnalyticsHandler_UsesRealAverageNotHardcoded(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()
	_, empA, _, empB := seedTwoUnrelatedEmployees(t, ctx)

	// Two completed reviews with a known, deliberately-not-4.1 average (3.0 and 5.0 -> avg 4.0).
	r1, err := repository.CreatePerformanceReview(ctx, &models.PerformanceReview{
		EmployeeID: empA, ReviewPeriod: "IDOR-TEST", ReviewType: "annual", Status: "completed", OverallRating: 3.0,
	})
	if err != nil {
		t.Fatalf("CreatePerformanceReview(A): %v", err)
	}
	r2, err := repository.CreatePerformanceReview(ctx, &models.PerformanceReview{
		EmployeeID: empB, ReviewPeriod: "IDOR-TEST", ReviewType: "annual", Status: "completed", OverallRating: 5.0,
	})
	if err != nil {
		t.Fatalf("CreatePerformanceReview(B): %v", err)
	}
	t.Cleanup(func() {
		repository.GetDB().Exec(ctx, `DELETE FROM performance_reviews WHERE id IN ($1, $2)`, r1, r2)
	})

	w := httptest.NewRecorder()
	c := ctxAsUser(w, http.MethodGet, "/performance/analytics", nil, 0, "admin")
	getPerformanceAnalyticsHandler(c)

	var resp struct {
		AvgRating float64 `json:"avgRating"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("could not parse response: %v (body: %s)", err, w.Body.String())
	}
	if resp.AvgRating == 4.1 {
		t.Fatalf("mock-data regression: avgRating is still the old hardcoded 4.1 (seeded data averages to a " +
			"value that would only equal 4.1 by coincidence — this strongly suggests the hardcoded fallback is back)")
	}
	// Note: asserting an exact 4.0 is fragile in a shared test DB with pre-existing review rows
	// from other tests/seed data — the meaningful regression check is "not the old hardcoded 4.1".
}
