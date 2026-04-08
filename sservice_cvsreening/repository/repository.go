package repository

// This file previously contained all repository functions (2,160 lines).
// All functions have been refactored into domain-specific files:
//
//   - candidate_repository.go    — Candidate CRUD, search
//   - screening_repository.go    — Screening results, status updates
//   - job_repository.go          — Job descriptions CRUD
//   - interview_repository.go    — Interview CRUD, question responses, progress
//   - user_repository.go         — User CRUD, auth
//   - question_repository.go     — Interview questions (question bank)
//   - assessment_repository.go   — Assessments, questions, attempts, answers
//   - interview_schedule_repository.go — Interview scheduling
//   - offer_letter_repository.go — Offer letter management
//   - analytics_settings_repository.go — Analytics stats, settings, activity logs
//   - database.go                — DB connection, migrations, transactions, soft deletes
