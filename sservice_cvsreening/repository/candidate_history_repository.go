package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// GetEmployeeCandidateHistory surfaces a converted employee's pre-hire
// screening/interview history via employees.candidate_id, which is set on
// conversion (see convertCandidateHandler) but was never read back until now.
// Returns nil (not an error) if the employee wasn't converted from a candidate.
func GetEmployeeCandidateHistory(ctx context.Context, employeeID int) (*models.EmployeeCandidateHistory, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var candidateID *int
	if err := GetDB().QueryRow(ctx, `SELECT candidate_id FROM employees WHERE id = $1`, employeeID).Scan(&candidateID); err != nil {
		return nil, err
	}
	if candidateID == nil {
		return nil, nil
	}

	history := &models.EmployeeCandidateHistory{
		CandidateID: *candidateID,
		Screenings:  []models.ScreeningSummary{},
		Interviews:  []models.InterviewSummary{},
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, job_id, score, status, created_at
		FROM screenings WHERE candidate_id = $1 ORDER BY created_at DESC
	`, *candidateID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var s models.ScreeningSummary
			if err := rows.Scan(&s.ID, &s.JobID, &s.Score, &s.Status, &s.CreatedAt); err == nil {
				history.Screenings = append(history.Screenings, s)
			}
		}
	}

	rows2, err := GetDB().Query(ctx, `
		SELECT id, interview_type, scheduled_at, status, rating, COALESCE(interviewer_notes, '')
		FROM interviews WHERE candidate_id = $1 ORDER BY scheduled_at DESC NULLS LAST
	`, *candidateID)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var iv models.InterviewSummary
			if err := rows2.Scan(&iv.ID, &iv.InterviewType, &iv.ScheduledAt, &iv.Status, &iv.Rating, &iv.InterviewerNotes); err == nil {
				history.Interviews = append(history.Interviews, iv)
			}
		}
	}

	return history, nil
}
