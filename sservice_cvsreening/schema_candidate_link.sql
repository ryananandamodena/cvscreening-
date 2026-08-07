-- Links the candidate-portal login identity (candidate_users) to the recruitment
-- pipeline identity (candidates) — the two were previously unconnected, so
-- assessment_attempts (keyed to candidate_users.id) had no reliable path back to
-- an employee's screening/interview history (keyed to candidates.id via
-- employees.candidate_id). Filled in once at registration time (see
-- candidatePortalRegisterHandler), not resolved by a heuristic query at read time.
ALTER TABLE candidate_users ADD COLUMN IF NOT EXISTS linked_candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_users_linked_candidate ON candidate_users(linked_candidate_id);
