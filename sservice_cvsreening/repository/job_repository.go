package repository

import (
	"context"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateJob inserts a new job
func CreateJob(ctx context.Context, job *models.JobDescription) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO job_descriptions (title, department, description, requirements, location, employment_type, salary_min, salary_max, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, job.Title, job.Department, job.Description, job.Requirements, job.Location, job.EmploymentType, job.SalaryMin, job.SalaryMax, "active").Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}

// UpdateJob updates an existing job
func UpdateJob(ctx context.Context, job *models.JobDescription) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE job_descriptions 
		SET title=$1, department=$2, description=$3, requirements=$4, location=$5, employment_type=$6, salary_min=$7, salary_max=$8, updated_at=CURRENT_TIMESTAMP
		WHERE id=$9
	`, job.Title, job.Department, job.Description, job.Requirements, job.Location, job.EmploymentType, job.SalaryMin, job.SalaryMax, job.ID)

	return err
}

// DeleteJob soft-deletes a job (sets status to closed and deleted_at timestamp)
// Use SoftDeleteJob from database.go for proper transaction handling
func DeleteJob(ctx context.Context, id int) error {
	return SoftDeleteJob(ctx, id)
}

// GetJobByID retrieves a single job
func GetJobByID(ctx context.Context, id int) (*models.JobDescription, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var j models.JobDescription
	// Handle nullable fields for salaries
	var minSal, maxSal *float64

	err := GetDB().QueryRow(ctx, `
		SELECT id, title, department, description, requirements, location, employment_type, salary_min, salary_max, status, created_at
		FROM job_descriptions
		WHERE id = $1
	`, id).Scan(&j.ID, &j.Title, &j.Department, &j.Description, &j.Requirements, &j.Location, &j.EmploymentType, &minSal, &maxSal, &j.Status, &j.CreatedAt)

	if err != nil {
		return nil, err
	}

	if minSal != nil {
		j.SalaryMin = *minSal
	}
	if maxSal != nil {
		j.SalaryMax = *maxSal
	}

	return &j, nil
}

// GetJobs retrieves all job descriptions with pagination
func GetJobs(ctx context.Context, page, limit int) ([]models.JobDescription, int64, error) {
	if !IsDBConnected() {
		return []models.JobDescription{}, 0, nil
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Get total count
	var total int64
	err := GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM job_descriptions WHERE deleted_at IS NULL AND (status = 'active' OR status IS NULL)").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rowStr := `
		SELECT id, COALESCE(title, ''), COALESCE(department, ''), COALESCE(description, ''), COALESCE(requirements, ''), 
		       COALESCE(location, ''), COALESCE(employment_type, ''), COALESCE(salary_min, 0), COALESCE(salary_max, 0), 
		       COALESCE(status, 'active'), created_at
		FROM job_descriptions
		WHERE deleted_at IS NULL AND (status = 'active' OR status IS NULL)
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`
	rows, err := GetDB().Query(ctx, rowStr, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var jobs []models.JobDescription
	for rows.Next() {
		var j models.JobDescription
		var minSal, maxSal *float64
		err := rows.Scan(&j.ID, &j.Title, &j.Department, &j.Description, &j.Requirements, &j.Location, &j.EmploymentType, &minSal, &maxSal, &j.Status, &j.CreatedAt)
		if err != nil {
			log.Printf("Error scanning job: %v", err)
			continue
		}
		if minSal != nil {
			j.SalaryMin = *minSal
		}
		if maxSal != nil {
			j.SalaryMax = *maxSal
		}
		jobs = append(jobs, j)
	}

	return jobs, total, nil
}
