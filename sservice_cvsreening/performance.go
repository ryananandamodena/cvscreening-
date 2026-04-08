package main

import (
	"context"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ApplyDatabaseIndexes creates performance indexes on frequently queried columns
func ApplyDatabaseIndexes(ctx context.Context) error {
	if !repository.IsDBConnected() {
		log.Println("Database not connected, skipping index creation")
		return nil
	}

	log.Println("📊 Applying database indexes for performance optimization...")

	indexes := []string{
		// Candidates indexes
		"CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email)",
		"CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status)",
		"CREATE INDEX IF NOT EXISTS idx_candidates_deleted_at ON candidates(deleted_at)",
		"CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC)",

		// Jobs indexes
		"CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_descriptions(status)",
		"CREATE INDEX IF NOT EXISTS idx_jobs_department ON job_descriptions(department)",
		"CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON job_descriptions(deleted_at)",
		"CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON job_descriptions(created_at DESC)",

		// Screenings indexes
		"CREATE INDEX IF NOT EXISTS idx_screenings_job_id ON screenings(job_id)",
		"CREATE INDEX IF NOT EXISTS idx_screenings_candidate_id ON screenings(candidate_id)",
		"CREATE INDEX IF NOT EXISTS idx_screenings_status ON screenings(status)",
		"CREATE INDEX IF NOT EXISTS idx_screenings_score ON screenings(score)",
		"CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON screenings(created_at DESC)",

		// Interviews indexes
		"CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id)",
		"CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id)",
		"CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at)",
		"CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status)",
		"CREATE INDEX IF NOT EXISTS idx_interviews_deleted_at ON interviews(deleted_at)",
		"CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at DESC)",

		// Users indexes
		"CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
		"CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
		"CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)",

		// Interview questions indexes
		"CREATE INDEX IF NOT EXISTS idx_questions_job_id ON interview_questions(job_id)",

		// Activity logs indexes
		"CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_logs(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC)",
	}

	successCount := 0
	for _, indexSQL := range indexes {
		_, err := repository.GetDB().Exec(ctx, indexSQL)
		if err != nil {
			log.Printf("⚠️  Failed to create index: %v", err)
			continue
		}
		successCount++
	}

	log.Printf("✅ Successfully created %d/%d indexes", successCount, len(indexes))
	return nil
}

// AnalyzeIndexUsage returns statistics about index usage
func AnalyzeIndexUsage(ctx context.Context) error {
	if !repository.IsDBConnected() {
		return nil
	}

	query := `
		SELECT 
			schemaname,
			tablename,
			indexname,
			idx_scan as scans,
			idx_tup_read as tuples_read
		FROM pg_stat_user_indexes
		WHERE schemaname = 'public'
		ORDER BY idx_scan DESC
		LIMIT 20
	`

	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()

	log.Println("\n📈 Top 20 Index Usage Statistics:")
	log.Println("Schema | Table | Index | Scans | Tuples Read")
	log.Println("-------|-------|-------|-------|------------")

	for rows.Next() {
		var schema, table, index string
		var scans, tuples int64
		err := rows.Scan(&schema, &table, &index, &scans, &tuples)
		if err != nil {
			continue
		}
		log.Printf("%s | %s | %s | %d | %d", schema, table, index, scans, tuples)
	}

	return nil
}
