package repository

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

// =====================================================
// INTERVIEW SCORECARD REPOSITORY
// =====================================================

// ScorecardCriteria represents a single evaluation criteria
type ScorecardCriteria struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Rating  int    `json:"rating"`
	Weight  int    `json:"weight"`
	Comment string `json:"comment"`
}

// InterviewScorecard represents a scorecard record
type InterviewScorecard struct {
	ID             int                 `json:"id"`
	InterviewID    int                 `json:"interviewId"`
	EvaluatorID    *int                `json:"evaluatorId"`
	EvaluatorName  string              `json:"evaluatorName"`
	OverallScore   float64             `json:"overallScore"`
	Recommendation string              `json:"recommendation"`
	Criteria       []ScorecardCriteria `json:"criteria"`
	Strengths      []string            `json:"strengths"`
	Weaknesses     []string            `json:"weaknesses"`
	Notes          string              `json:"notes"`
	Status         string              `json:"status"`
	SubmittedAt    *time.Time          `json:"submittedAt"`
	CreatedAt      time.Time           `json:"createdAt"`
	UpdatedAt      time.Time           `json:"updatedAt"`
}

func CreateScorecard(ctx context.Context, sc *InterviewScorecard) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	criteriaJSON, _ := json.Marshal(sc.Criteria)
	strengthsJSON, _ := json.Marshal(sc.Strengths)
	weaknessesJSON, _ := json.Marshal(sc.Weaknesses)

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO interview_scorecards (interview_id, evaluator_id, evaluator_name, overall_score, recommendation, criteria, strengths, weaknesses, notes, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, sc.InterviewID, sc.EvaluatorID, sc.EvaluatorName, sc.OverallScore, sc.Recommendation,
		criteriaJSON, strengthsJSON, weaknessesJSON, sc.Notes, sc.Status).Scan(&id)

	if err != nil {
		log.Printf("Failed to create scorecard: %v", err)
		return 0, err
	}
	return id, nil
}

func GetScorecardByInterviewID(ctx context.Context, interviewID int) (*InterviewScorecard, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var sc InterviewScorecard
	var criteriaJSON, strengthsJSON, weaknessesJSON []byte

	err := GetDB().QueryRow(ctx, `
		SELECT id, interview_id, evaluator_id, COALESCE(evaluator_name, ''), overall_score, 
		       COALESCE(recommendation, 'undecided'), criteria, strengths, weaknesses, 
		       COALESCE(notes, ''), COALESCE(status, 'draft'), submitted_at, created_at, updated_at
		FROM interview_scorecards
		WHERE interview_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`, interviewID).Scan(
		&sc.ID, &sc.InterviewID, &sc.EvaluatorID, &sc.EvaluatorName, &sc.OverallScore,
		&sc.Recommendation, &criteriaJSON, &strengthsJSON, &weaknessesJSON,
		&sc.Notes, &sc.Status, &sc.SubmittedAt, &sc.CreatedAt, &sc.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if criteriaJSON != nil {
		json.Unmarshal(criteriaJSON, &sc.Criteria)
	}
	if strengthsJSON != nil {
		json.Unmarshal(strengthsJSON, &sc.Strengths)
	}
	if weaknessesJSON != nil {
		json.Unmarshal(weaknessesJSON, &sc.Weaknesses)
	}

	return &sc, nil
}

func UpdateScorecard(ctx context.Context, sc *InterviewScorecard) error {
	if !IsDBConnected() {
		return nil
	}

	criteriaJSON, _ := json.Marshal(sc.Criteria)
	strengthsJSON, _ := json.Marshal(sc.Strengths)
	weaknessesJSON, _ := json.Marshal(sc.Weaknesses)

	_, err := GetDB().Exec(ctx, `
		UPDATE interview_scorecards
		SET overall_score = $1, recommendation = $2, criteria = $3, strengths = $4, 
		    weaknesses = $5, notes = $6, status = $7, 
		    submitted_at = CASE WHEN $7 = 'submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $8
	`, sc.OverallScore, sc.Recommendation, criteriaJSON, strengthsJSON,
		weaknessesJSON, sc.Notes, sc.Status, sc.ID)

	if err != nil {
		log.Printf("Failed to update scorecard: %v", err)
		return err
	}
	return nil
}

func GetScorecardsByInterviewID(ctx context.Context, interviewID int) ([]InterviewScorecard, error) {
	if !IsDBConnected() {
		return []InterviewScorecard{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, interview_id, evaluator_id, COALESCE(evaluator_name, ''), overall_score, 
		       COALESCE(recommendation, 'undecided'), criteria, strengths, weaknesses,
		       COALESCE(notes, ''), COALESCE(status, 'draft'), submitted_at, created_at, updated_at
		FROM interview_scorecards
		WHERE interview_id = $1
		ORDER BY created_at DESC
	`, interviewID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scorecards []InterviewScorecard
	for rows.Next() {
		var sc InterviewScorecard
		var criteriaJSON, strengthsJSON, weaknessesJSON []byte
		err := rows.Scan(
			&sc.ID, &sc.InterviewID, &sc.EvaluatorID, &sc.EvaluatorName, &sc.OverallScore,
			&sc.Recommendation, &criteriaJSON, &strengthsJSON, &weaknessesJSON,
			&sc.Notes, &sc.Status, &sc.SubmittedAt, &sc.CreatedAt, &sc.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning scorecard: %v", err)
			continue
		}
		if criteriaJSON != nil {
			json.Unmarshal(criteriaJSON, &sc.Criteria)
		}
		if strengthsJSON != nil {
			json.Unmarshal(strengthsJSON, &sc.Strengths)
		}
		if weaknessesJSON != nil {
			json.Unmarshal(weaknessesJSON, &sc.Weaknesses)
		}
		scorecards = append(scorecards, sc)
	}

	return scorecards, nil
}

func DeleteScorecard(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, "DELETE FROM interview_scorecards WHERE id = $1", id)
	if err != nil {
		log.Printf("Failed to delete scorecard: %v", err)
		return err
	}
	return nil
}
