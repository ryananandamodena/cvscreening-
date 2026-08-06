package repository

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var db *pgxpool.Pool

// InitDB initializes the PostgreSQL connection pool
func InitDB() error {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Println("WARNING: DATABASE_URL not set, database features disabled")
		return nil
	}

	var err error
	db, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		return err
	}

	// Test connection
	if err := db.Ping(context.Background()); err != nil {
		db.Close()
		db = nil
		return err
	}

	log.Printf("✅ Database connected successfully to: %s", databaseURL)
	return nil
}

// CloseDB closes the database connection pool
func CloseDB() {
	if db != nil {
		db.Close()
		log.Println("Database connection closed")
	}
}

// GetDB returns the database connection pool
func GetDB() *pgxpool.Pool {
	return db
}

// IsDBConnected checks if database is available
func IsDBConnected() bool {
	return db != nil
}

// RunMigrations executes the schema.sql file to create tables
func RunMigrations() error {
	if !IsDBConnected() {
		return nil
	}

	content, err := os.ReadFile("schema.sql")
	if err != nil {
		log.Printf("Warning: Could not read schema.sql: %v", err)
		return err
	}

	_, err = db.Exec(context.Background(), string(content))
	if err != nil {
		log.Printf("Migration failed: %v", err)
		return err
	}

	log.Println("✅ Database schema applied successfully")

	// Run core HR schema
	coreHrContent, err := os.ReadFile("schema_core_hr.sql")
	if err == nil {
		_, err = db.Exec(context.Background(), string(coreHrContent))
		if err != nil {
			log.Printf("Warning: Failed to execute schema_core_hr.sql: %v", err)
		} else {
			log.Println("✅ Core HR schema applied successfully")
		}
	} else {
		log.Printf("Warning: Could not read schema_core_hr.sql: %v", err)
	}

	// Run payroll schema
	payrollContent, err := os.ReadFile("schema_payroll.sql")
	if err == nil {
		_, err = db.Exec(context.Background(), string(payrollContent))
		if err != nil {
			log.Printf("Warning: Failed to execute schema_payroll.sql: %v", err)
		} else {
			log.Println("✅ Payroll schema applied successfully")
		}
	}

	// Run attendance & leave schema
	attendanceContent, err := os.ReadFile("schema_attendance_leave.sql")
	if err == nil {
		_, err = db.Exec(context.Background(), string(attendanceContent))
		if err != nil {
			log.Printf("Warning: Failed to execute schema_attendance_leave.sql: %v", err)
		} else {
			log.Println("✅ Attendance & Leave schema applied successfully")
		}
	} else {
		log.Printf("Warning: Could not read schema_attendance_leave.sql: %v", err)
	}

	// Run schema updates for existing tables
	if err := RunSchemaUpdates(); err != nil {
		log.Printf("Warning: Failed to run schema updates: %v", err)
	}

	return nil
}

// RunSchemaUpdates handles schema changes for existing tables
func RunSchemaUpdates() error {
	queries := []string{
		"ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
		"ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';",
		"ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'full-time';",
		"ALTER TABLE candidates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
		"ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new';",
		"CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);",
		"CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);",
		"ALTER TABLE interviews ADD COLUMN IF NOT EXISTS recording_path VARCHAR(500);",
	}

	for _, query := range queries {
		_, err := db.Exec(context.Background(), query)
		if err != nil {
			return fmt.Errorf("failed to execute query '%s': %w", query, err)
		}
	}

	log.Println("✅ Schema updates applied successfully")
	return nil
}

// RunSeed executes a specific SQL seed file
func RunSeed(filename string) error {
	if !IsDBConnected() {
		return nil
	}

	content, err := os.ReadFile(filename)
	if err != nil {
		log.Printf("Warning: Could not read seed file %s: %v", filename, err)
		return err
	}

	_, err = db.Exec(context.Background(), string(content))
	if err != nil {
		log.Printf("Seed failed for %s: %v", filename, err)
		return err
	}

	log.Printf("✅ Seed file %s executed successfully", filename)
	return nil
}

// ==================== TRANSACTION MANAGEMENT ====================

// TransactionFunc is a function that runs within a transaction
type TransactionFunc func(ctx context.Context, tx pgx.Tx) error

// WithTransaction executes a function within a database transaction
// Automatically commits on success or rolls back on error
func WithTransaction(ctx context.Context, fn TransactionFunc) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	// Begin transaction
	tx, err := db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	// Defer rollback in case of panic or error
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback(ctx)
			panic(p) // Re-throw panic after rollback
		}
	}()

	// Execute the transaction function
	err = fn(ctx, tx)
	if err != nil {
		// Rollback on error
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			log.Printf("Failed to rollback transaction: %v", rbErr)
		}
		return err
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ==================== SOFT DELETE FUNCTIONS ====================

// SoftDeleteJob marks a job as deleted without removing it from database
func SoftDeleteJob(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	return WithTransaction(ctx, func(ctx context.Context, tx pgx.Tx) error {
		// Soft delete the job
		_, err := tx.Exec(ctx, `
			UPDATE job_descriptions 
			SET deleted_at = CURRENT_TIMESTAMP, status = 'closed', updated_at = CURRENT_TIMESTAMP
			WHERE id = $1 AND deleted_at IS NULL
		`, id)
		if err != nil {
			return fmt.Errorf("failed to soft delete job: %w", err)
		}

		// Log the deletion
		_, err = tx.Exec(ctx, `
			INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
			VALUES (1, 'soft_delete', 'job', $1, '{"reason": "soft_delete"}')
		`, id)
		if err != nil {
			log.Printf("Warning: Failed to log job deletion: %v", err)
		}

		return nil
	})
}

// SoftDeleteCandidate marks a candidate as deleted
func SoftDeleteCandidate(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	return WithTransaction(ctx, func(ctx context.Context, tx pgx.Tx) error {
		_, err := tx.Exec(ctx, `
			UPDATE candidates 
			SET deleted_at = CURRENT_TIMESTAMP, status = 'deleted', updated_at = CURRENT_TIMESTAMP
			WHERE id = $1 AND deleted_at IS NULL
		`, id)
		if err != nil {
			return fmt.Errorf("failed to soft delete candidate: %w", err)
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
			VALUES (1, 'soft_delete', 'candidate', $1, '{"reason": "soft_delete"}')
		`, id)
		if err != nil {
			log.Printf("Warning: Failed to log candidate deletion: %v", err)
		}

		return nil
	})
}

// RestoreJob restores a soft-deleted job
func RestoreJob(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := db.Exec(ctx, `
		UPDATE job_descriptions 
		SET deleted_at = NULL, status = 'active', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NOT NULL
	`, id)

	return err
}

// RestoreCandidate restores a soft-deleted candidate
func RestoreCandidate(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := db.Exec(ctx, `
		UPDATE candidates 
		SET deleted_at = NULL, status = 'new', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NOT NULL
	`, id)

	return err
}

// ==================== BULK OPERATIONS ====================

// BulkUpdateScreeningStatus updates multiple screenings in a transaction
func BulkUpdateScreeningStatus(ctx context.Context, ids []int, status string, reviewer string) error {
	if !IsDBConnected() {
		return nil
	}

	return WithTransaction(ctx, func(ctx context.Context, tx pgx.Tx) error {
		for _, id := range ids {
			_, err := tx.Exec(ctx, `
				UPDATE screenings 
				SET status=$1, reviewed_by=$2, reviewed_at=CURRENT_TIMESTAMP 
				WHERE id=$3
			`, status, reviewer, id)

			if err != nil {
				return fmt.Errorf("failed to update screening %d: %w", id, err)
			}
		}

		log.Printf("Bulk updated %d screenings to status: %s", len(ids), status)
		return nil
	})
}
