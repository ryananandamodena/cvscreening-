package main

import (
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// TestMain gives the DB-gated tests in idor_regression_test.go (and any future integration
// test) a real connection to run against, mirroring main()'s startup sequence — but scoped to
// only what those tests need, not the full seedFiles list (avoids re-seeding unrelated
// dev/demo data like psychotest questions or test users into whatever database DATABASE_URL
// points at). Safe to run repeatedly: RunMigrations/RunSeed here are the same idempotent
// CREATE TABLE IF NOT EXISTS / additive ALTER TABLE files used in production.
func TestMain(m *testing.M) {
	_ = godotenv.Load() // same as main(): ignore a missing .env, fall back to real env vars

	if err := repository.InitDB(); err != nil {
		// No DB available (e.g. CI without DATABASE_URL, or this sandbox) — tests that need a
		// real DB skip themselves via skipIfNoDB(); nothing further to set up here.
		os.Exit(m.Run())
	}
	defer repository.CloseDB()

	if repository.IsDBConnected() {
		if err := repository.RunMigrations(); err != nil {
			os.Exit(1)
		}
		// Only the migrations the tests in this package actually exercise — see
		// idor_regression_test.go (claim_request approval flow) and the Phase 1 report
		// (succession/candidate location) for what these add.
		for _, f := range []string{
			"schema_claims.sql",
			"schema_claim_approval.sql",
			"schema_succession_risk.sql",
			"schema_candidate_location.sql",
			"schema_overtime_approval.sql",
		} {
			_ = repository.RunSeed(f) // best-effort; a missing file shouldn't fail the whole run
		}
	}

	os.Exit(m.Run())
}
