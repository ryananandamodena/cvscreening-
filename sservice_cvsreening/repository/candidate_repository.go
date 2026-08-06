package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateOrUpdateCandidate updates existing candidate or creates a new one
func CreateOrUpdateCandidate(ctx context.Context, name, email, phone, cvText string, expYears int, skills, edu []string, company, position string) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	skillsJSON, _ := json.Marshal(skills)
	eduJSON, _ := json.Marshal(edu)

	var id int
	// Check if candidate exists by email
	err := GetDB().QueryRow(ctx, "SELECT id FROM candidates WHERE email = $1", email).Scan(&id)
	if err == nil {
		// Update existing
		_, err := GetDB().Exec(ctx, `
			UPDATE candidates 
			SET full_name = $1, phone = $2, cv_content = $3, experience_years = $4, skills=$5, education=$6, current_company=$7, current_position=$8, updated_at = CURRENT_TIMESTAMP
			WHERE id = $9
		`, name, phone, cvText, expYears, skillsJSON, eduJSON, company, position, id)
		if err != nil {
			log.Printf("Failed to update candidate: %v", err)
			return id, nil // Return ID anyway
		}
		log.Printf("Updated candidate ID: %d", id)
		return id, nil
	}

	// Create new
	err = GetDB().QueryRow(ctx, `
		INSERT INTO candidates (full_name, email, phone, cv_content, experience_years, skills, education, current_company, current_position, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new')
		RETURNING id
	`, name, email, phone, cvText, expYears, skillsJSON, eduJSON, company, position).Scan(&id)

	if err != nil {
		log.Printf("Failed to create candidate: %v", err)
		return 0, err
	}
	log.Printf("Created new candidate ID: %d", id)
	return id, nil
}

// GetCandidates retrieves list of candidates with pagination
func GetCandidates(ctx context.Context, page, limit int) ([]models.Candidate, int64, error) {
	if !IsDBConnected() {
		return nil, 0, nil
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
	err := GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, COALESCE(full_name, ''), COALESCE(email, ''), COALESCE(phone, ''), COALESCE(experience_years, 0), 
		       COALESCE(status, 'new'), COALESCE(skills, '[]'::jsonb), COALESCE(education, '[]'::jsonb), 
		       COALESCE(current_company, ''), COALESCE(current_position, ''), created_at 
		FROM candidates 
		WHERE deleted_at IS NULL
		ORDER BY created_at DESC 
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var candidates []models.Candidate
	for rows.Next() {
		var c models.Candidate
		var skillsJSON, eduJSON []byte
		err := rows.Scan(&c.ID, &c.FullName, &c.Email, &c.Phone, &c.ExperienceYears, &c.Status, &skillsJSON, &eduJSON, &c.CurrentCompany, &c.CurrentPosition, &c.CreatedAt)
		if err != nil {
			log.Printf("Error scanning candidate: %v", err)
			continue
		}
		if len(skillsJSON) > 0 {
			json.Unmarshal(skillsJSON, &c.Skills)
		}
		if len(eduJSON) > 0 {
			json.Unmarshal(eduJSON, &c.Education)
		}
		candidates = append(candidates, c)
	}
	return candidates, total, nil
}

// GetCandidateByID retrieves a single candidate
func GetCandidateByID(ctx context.Context, id int) (*models.Candidate, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var c models.Candidate
	err := GetDB().QueryRow(ctx, `
		SELECT id, full_name, email, phone, cv_content, experience_years, status, created_at 
		FROM candidates 
		WHERE id = $1
	`, id).Scan(&c.ID, &c.FullName, &c.Email, &c.Phone, &c.CVContent, &c.ExperienceYears, &c.Status, &c.CreatedAt)

	if err != nil {
		return nil, err
	}
	return &c, nil
}

// SearchCandidates searches for candidates based on structured filters
func SearchCandidates(ctx context.Context, filters *models.SearchFilters) ([]models.Candidate, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	query := `SELECT id, full_name, email, phone, cv_content, experience_years, status, skills, education, current_company, current_position, created_at 
			  FROM candidates 
			  WHERE deleted_at IS NULL`
	var args []interface{}
	argCount := 1

	// Filter by Role (search in current_position or cv_content)
	if filters.Role != "" {
		query += fmt.Sprintf(" AND (current_position ILIKE $%d OR cv_content ILIKE $%d)", argCount, argCount)
		args = append(args, "%"+filters.Role+"%")
		argCount++
	}

	// Filter by Experience
	if filters.ExperienceYears > 0 {
		query += fmt.Sprintf(" AND experience_years >= $%d", argCount)
		args = append(args, filters.ExperienceYears)
		argCount++
	}

	// Filter by Location (search in cv_content as loose match)
	if filters.Location != "" {
		query += fmt.Sprintf(" AND cv_content ILIKE $%d", argCount)
		args = append(args, "%"+filters.Location+"%")
		argCount++
	}

	// Filter by Education (search in education JSON or cv_content)
	if filters.Education != "" {
		query += fmt.Sprintf(" AND (education::text ILIKE $%d OR cv_content ILIKE $%d)", argCount, argCount)
		args = append(args, "%"+filters.Education+"%")
		argCount++
	}

	// Filter by Skills
	if len(filters.Skills) > 0 {
		skillsJSON, err := json.Marshal(filters.Skills)
		if err == nil {
			query += fmt.Sprintf(" AND skills @> $%d", argCount)
			args = append(args, skillsJSON)
			argCount++
		}
	}

	// Order by relevance (newest first)
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		log.Printf("Search query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var candidates []models.Candidate
	for rows.Next() {
		var c models.Candidate
		var skillsBytes, eduBytes []byte

		if err := rows.Scan(&c.ID, &c.FullName, &c.Email, &c.Phone, &c.CVContent, &c.ExperienceYears, &c.Status, &skillsBytes, &eduBytes, &c.CurrentCompany, &c.CurrentPosition, &c.CreatedAt); err != nil {
			log.Printf("Row scan error: %v", err)
			continue
		}

		// Unmarshal JSONB
		json.Unmarshal(skillsBytes, &c.Skills)
		json.Unmarshal(eduBytes, &c.Education)

		candidates = append(candidates, c)
	}

	return candidates, nil
}

// UpdateCandidateStatus updates the status of a candidate
func UpdateCandidateStatus(ctx context.Context, id int, status string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE candidates 
		SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND deleted_at IS NULL
	`, status, id)

	return err
}
