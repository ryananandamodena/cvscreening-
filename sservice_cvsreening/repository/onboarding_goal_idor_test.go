package repository

import (
	"context"
	"testing"
)

// These new lookup helpers (Module 13 IDOR fix — GetOnboardingSessionByID, GetGoalByID) must
// fail safe rather than panic when the DB isn't connected, since the test binary never
// initializes a real connection (db stays nil, IsDBConnected() == false). This is the same
// no-DB-mocking-required branch already exercised by this file's other tests.
func TestGetOnboardingSessionByID_NoDBConnection(t *testing.T) {
	if IsDBConnected() {
		t.Skip("a real DB is connected in this environment; the no-connection branch isn't reachable")
	}

	session, err := GetOnboardingSessionByID(context.Background(), 1)
	if err != nil {
		t.Errorf("expected no error when DB isn't connected, got %v", err)
	}
	if session != nil {
		t.Errorf("expected a nil session when DB isn't connected, got %+v", session)
	}
}

func TestGetGoalByID_NoDBConnection(t *testing.T) {
	if IsDBConnected() {
		t.Skip("a real DB is connected in this environment; the no-connection branch isn't reachable")
	}

	goal, err := GetGoalByID(context.Background(), 1)
	if err == nil {
		t.Error("expected an error when DB isn't connected (matches CreateGoal/UpdateGoal/DeleteGoal's existing fail-safe convention), got nil")
	}
	if goal != nil {
		t.Errorf("expected a nil goal when DB isn't connected, got %+v", goal)
	}
}
