package repository

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ScreeningRecord represents a database record
type ScreeningRecord struct {
	ID             int       `json:"id"`
	CandidateID    int       `json:"candidateId"`
	JobID          int       `json:"jobId"`
	JobDescription string    `json:"jobDescription"`
	CVContent      string    `json:"cvContent"`
	Score          int       `json:"score"`
	MatchedSkills  []string  `json:"matchedSkills"`
	MissingSkills  []string  `json:"missingSkills"`
	Reasoning      string    `json:"reasoning"`
	BiasCorrection string    `json:"biasCorrection"`
	Confidence     float64   `json:"confidence"`
	Status         string    `json:"status"`
	CandidateName  string    `json:"candidateName"`
	Email          string    `json:"email"`
	CreatedAt      time.Time `json:"createdAt"`
}

// SaveScreeningResult saves a screening result to the database
func SaveScreeningResult(ctx context.Context, candidateID, jobID int, jd, cv string, result *models.ScreeningResult) (*ScreeningRecord, error) {
	if !IsDBConnected() {
		log.Println("Database not connected, skipping save")
		return nil, nil
	}

	matchedSkillsJSON, _ := json.Marshal(result.MatchedSkills)
	missingSkillsJSON, _ := json.Marshal(result.MissingSkills)

	var record ScreeningRecord
	var err error

	// Create nullable IDs for SQL
	var candID *int
	if candidateID != 0 {
		candID = &candidateID
	}
	var jID *int
	if jobID != 0 {
		jID = &jobID
	}

	err = GetDB().QueryRow(ctx, `
		INSERT INTO screenings (candidate_id, job_id, job_description, cv_content, score, matched_skills, missing_skills, reasoning, bias_correction, confidence)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at
	`, candID, jID, jd, cv, result.Score, matchedSkillsJSON, missingSkillsJSON, result.Reasoning, result.BiasCorrection, result.Confidence).Scan(&record.ID, &record.CreatedAt)

	if err != nil {
		log.Printf("Failed to save screening result: %v", err)
		return nil, err
	}

	record.JobID = jobID

	record.JobDescription = jd
	record.CVContent = cv
	record.Score = result.Score
	record.MatchedSkills = result.MatchedSkills
	record.MissingSkills = result.MissingSkills
	record.Reasoning = result.Reasoning
	record.BiasCorrection = result.BiasCorrection
	record.Confidence = result.Confidence

	log.Printf("✅ Screening result saved with ID: %d", record.ID)
	return &record, nil
}

// GetScreenings retrieves screening results with pagination
func GetScreenings(ctx context.Context, page, limit int) ([]ScreeningRecord, int64, error) {
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
	err := GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM screenings").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := GetDB().Query(ctx, `
		SELECT s.id, COALESCE(s.candidate_id, 0), COALESCE(s.job_id, 0), COALESCE(s.job_description, ''), COALESCE(s.cv_content, ''), COALESCE(s.score, 0), 
		       COALESCE(s.matched_skills, '[]'::jsonb), COALESCE(s.missing_skills, '[]'::jsonb), 
		       COALESCE(s.reasoning, ''), COALESCE(s.bias_correction, ''), 
		       COALESCE(s.confidence, 0.0), COALESCE(s.status, 'pending'), s.created_at, 
		       COALESCE(c.full_name, ''), COALESCE(c.email, '')
		FROM screenings s
		LEFT JOIN candidates c ON s.candidate_id = c.id
		ORDER BY s.created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var records []ScreeningRecord
	for rows.Next() {
		var r ScreeningRecord
		var matchedJSON, missingJSON []byte
		err := rows.Scan(&r.ID, &r.CandidateID, &r.JobID, &r.JobDescription, &r.CVContent, &r.Score, &matchedJSON, &missingJSON, &r.Reasoning, &r.BiasCorrection, &r.Confidence, &r.Status, &r.CreatedAt, &r.CandidateName, &r.Email)
		if err != nil {
			return nil, 0, err
		}
		if len(matchedJSON) > 0 {
			json.Unmarshal(matchedJSON, &r.MatchedSkills)
		}
		if len(missingJSON) > 0 {
			json.Unmarshal(missingJSON, &r.MissingSkills)
		}
		records = append(records, r)
	}

	return records, total, nil
}

// GetScreeningByID retrieves a specific screening by ID
func GetScreeningByID(ctx context.Context, id int) (*ScreeningRecord, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var r ScreeningRecord
	var matchedJSON, missingJSON []byte
	err := GetDB().QueryRow(ctx, `
		SELECT s.id, s.candidate_id, s.job_id, s.job_description, s.cv_content, s.score, s.matched_skills, s.missing_skills, s.reasoning, s.bias_correction, s.confidence, COALESCE(s.status, 'pending'), s.created_at, COALESCE(c.full_name, ''), COALESCE(c.email, '')
		FROM screenings s
		LEFT JOIN candidates c ON s.candidate_id = c.id
		WHERE s.id = $1
	`, id).Scan(&r.ID, &r.CandidateID, &r.JobID, &r.JobDescription, &r.CVContent, &r.Score, &matchedJSON, &missingJSON, &r.Reasoning, &r.BiasCorrection, &r.Confidence, &r.Status, &r.CreatedAt, &r.CandidateName, &r.Email)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(matchedJSON, &r.MatchedSkills)
	json.Unmarshal(missingJSON, &r.MissingSkills)

	return &r, nil
}

// UpdateScreeningStatus updates the status of a screening (e.g., passed, failed)
func UpdateScreeningStatus(ctx context.Context, id int, status, reviewer string) error {
	if !IsDBConnected() {
		return nil
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE screenings 
		SET status=$1, reviewed_by=$2, reviewed_at=CURRENT_TIMESTAMP 
		WHERE id=$3
	`, status, reviewer, id)
	return err
}

// GetLeaderboardByJob retrieves a ranked list of screenings for a specific job ID
func GetLeaderboardByJob(ctx context.Context, jobID, limit int) ([]ScreeningRecord, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	if limit < 1 {
		limit = 50 // Default max leaderboard size
	}

	rows, err := GetDB().Query(ctx, `
		SELECT s.id, COALESCE(s.candidate_id, 0), COALESCE(s.job_id, 0), COALESCE(s.job_description, ''), COALESCE(s.cv_content, ''), COALESCE(s.score, 0), 
		       COALESCE(s.matched_skills, '[]'::jsonb), COALESCE(s.missing_skills, '[]'::jsonb), 
		       COALESCE(s.reasoning, ''), COALESCE(s.bias_correction, ''), 
		       COALESCE(s.confidence, 0.0), COALESCE(s.status, 'pending'), s.created_at, 
		       COALESCE(c.full_name, ''), COALESCE(c.email, '')
		FROM screenings s
		LEFT JOIN candidates c ON s.candidate_id = c.id
		WHERE s.job_id = $1
		ORDER BY s.score DESC, s.created_at DESC
		LIMIT $2
	`, jobID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []ScreeningRecord
	for rows.Next() {
		var r ScreeningRecord
		var matchedJSON, missingJSON []byte
		err := rows.Scan(&r.ID, &r.CandidateID, &r.JobID, &r.JobDescription, &r.CVContent, &r.Score, &matchedJSON, &missingJSON, &r.Reasoning, &r.BiasCorrection, &r.Confidence, &r.Status, &r.CreatedAt, &r.CandidateName, &r.Email)
		if err != nil {
			return nil, err
		}
		if len(matchedJSON) > 0 {
			json.Unmarshal(matchedJSON, &r.MatchedSkills)
		}
		if len(missingJSON) > 0 {
			json.Unmarshal(missingJSON, &r.MissingSkills)
		}
		records = append(records, r)
	}

	return records, nil
}
