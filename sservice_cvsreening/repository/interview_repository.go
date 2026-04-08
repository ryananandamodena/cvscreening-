package repository

import (
	"context"
	"log"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateInterview schedules a new interview
func CreateInterview(ctx context.Context, i *models.Interview) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO interviews (candidate_id, job_id, interview_type, scheduled_at, interviewer, status)
		VALUES ($1, $2, $3, $4, $5, 'scheduled')
		RETURNING id
	`, i.CandidateID, i.JobID, i.InterviewType, i.ScheduledAt, i.Interviewer).Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}

// GetInterviews retrieves interviews with candidate and job details
func GetInterviews(ctx context.Context) ([]models.Interview, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT i.id, i.candidate_id, i.job_id, COALESCE(c.full_name, 'Unknown'), COALESCE(j.title, 'Unknown'), 
		       i.interview_type, i.scheduled_at, i.interviewer, i.status, COALESCE(i.rating, 0), COALESCE(i.interviewer_notes, ''),
		       COALESCE(i.recording_path, ''), COALESCE(i.transcript, ''), i.created_at
		FROM interviews i
		LEFT JOIN candidates c ON i.candidate_id = c.id
		LEFT JOIN job_descriptions j ON i.job_id = j.id
		ORDER BY i.scheduled_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interviews []models.Interview
	for rows.Next() {
		var i models.Interview
		err := rows.Scan(&i.ID, &i.CandidateID, &i.JobID, &i.CandidateName, &i.JobTitle,
			&i.InterviewType, &i.ScheduledAt, &i.Interviewer, &i.Status, &i.Rating, &i.Notes,
			&i.RecordingPath, &i.Transcript, &i.CreatedAt)
		if err != nil {
			log.Printf("Error scanning interview: %v", err)
			continue
		}
		interviews = append(interviews, i)
	}
	return interviews, nil
}

// UpdateInterviewFeedback updates rating, notes and status
func UpdateInterviewFeedback(ctx context.Context, id int, rating int, notes string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE interviews 
		SET rating=$1, interviewer_notes=$2, status='completed', updated_at=CURRENT_TIMESTAMP
		WHERE id=$3
	`, rating, notes, id)

	return err
}

// FinalizeInterview saves the recording path and transcript, and marks as completed
func FinalizeInterview(ctx context.Context, id int, transcript, recordingPath string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE interviews 
		SET transcript=$1, recording_path=$2, status='completed', updated_at=CURRENT_TIMESTAMP
		WHERE id=$3
	`, transcript, recordingPath, id)

	return err
}

// CancelInterview marks an interview as cancelled
func CancelInterview(ctx context.Context, id int, reason string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE interviews 
		SET status='cancelled', interviewer_notes=$1, updated_at=CURRENT_TIMESTAMP
		WHERE id=$2
	`, reason, id)

	return err
}

// GetInterviewByID retrieves interview details
func GetInterviewByID(ctx context.Context, id int) (*models.InterviewDetail, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var i models.InterviewDetail
	var aiEval []byte
	var scheduledAt *time.Time

	err := GetDB().QueryRow(ctx, `
		SELECT 
			i.id, i.candidate_id, i.job_id, 
			c.full_name, j.title,
			i.interview_type, i.scheduled_at, i.status,
			COALESCE(i.transcript, ''), COALESCE(i.recording_path, ''), i.ai_evaluation, COALESCE(i.rating, 0), COALESCE(i.interviewer_notes, ''), i.created_at
		FROM interviews i
		LEFT JOIN candidates c ON i.candidate_id = c.id
		LEFT JOIN job_descriptions j ON i.job_id = j.id
		WHERE i.id = $1
	`, id).Scan(
		&i.ID, &i.CandidateID, &i.JobID,
		&i.CandidateName, &i.JobTitle,
		&i.InterviewType, &scheduledAt, &i.Status,
		&i.Transcript, &i.RecordingPath, &aiEval, &i.Rating, &i.Notes, &i.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	i.ScheduledAt = scheduledAt
	if aiEval != nil {
		i.AIEvaluation = string(aiEval)
	}

	return &i, nil
}

// SaveQuestionResponse saves or updates a question response
func SaveQuestionResponse(ctx context.Context, response *models.InterviewQuestionResponse) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	// Check if response already exists for this interview + question order
	var existingID int
	err := GetDB().QueryRow(ctx, `
		SELECT id FROM interview_question_responses 
		WHERE interview_id = $1 AND question_order = $2
	`, response.InterviewID, response.QuestionOrder).Scan(&existingID)

	if err == nil {
		// Update existing
		_, err := GetDB().Exec(ctx, `
			UPDATE interview_question_responses 
			SET question_text = $1, answer_text = $2, recording_path = $3, 
			    recording_duration_seconds = $4, sentiment_score = $5, ai_analysis = $6,
			    updated_at = CURRENT_TIMESTAMP
			WHERE id = $7
		`, response.QuestionText, response.AnswerText, response.RecordingPath,
			response.RecordingDurationSeconds, response.SentimentScore, response.AIAnalysis,
			existingID)
		if err != nil {
			return 0, err
		}
		return existingID, nil
	}

	// Insert new
	var newID int
	err = GetDB().QueryRow(ctx, `
		INSERT INTO interview_question_responses 
		(interview_id, question_id, question_text, question_order, answer_text, recording_path, 
		 recording_duration_seconds, sentiment_score, ai_analysis)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, response.InterviewID, response.QuestionID, response.QuestionText, response.QuestionOrder,
		response.AnswerText, response.RecordingPath, response.RecordingDurationSeconds,
		response.SentimentScore, response.AIAnalysis).Scan(&newID)

	if err != nil {
		return 0, err
	}
	return newID, nil
}

// GetQuestionResponses retrieves all responses for an interview
func GetQuestionResponses(ctx context.Context, interviewID int) ([]models.InterviewQuestionResponse, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, interview_id, question_id, question_text, question_order, 
		       COALESCE(answer_text, ''), COALESCE(recording_path, ''), 
		       COALESCE(recording_duration_seconds, 0), COALESCE(sentiment_score, 0), 
		       ai_analysis, created_at, updated_at
		FROM interview_question_responses 
		WHERE interview_id = $1 
		ORDER BY question_order ASC
	`, interviewID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var responses []models.InterviewQuestionResponse
	for rows.Next() {
		var r models.InterviewQuestionResponse
		var aiAnalysis []byte
		err := rows.Scan(&r.ID, &r.InterviewID, &r.QuestionID, &r.QuestionText, &r.QuestionOrder,
			&r.AnswerText, &r.RecordingPath, &r.RecordingDurationSeconds, &r.SentimentScore,
			&aiAnalysis, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			log.Printf("Error scanning question response: %v", err)
			continue
		}
		if aiAnalysis != nil {
			r.AIAnalysis = aiAnalysis
		}
		responses = append(responses, r)
	}
	return responses, nil
}

// GetQuestionResponseByOrder retrieves a specific response by interview and order
func GetQuestionResponseByOrder(ctx context.Context, interviewID, questionOrder int) (*models.InterviewQuestionResponse, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var r models.InterviewQuestionResponse
	var aiAnalysis []byte
	err := GetDB().QueryRow(ctx, `
		SELECT id, interview_id, question_id, question_text, question_order, 
		       COALESCE(answer_text, ''), COALESCE(recording_path, ''), 
		       COALESCE(recording_duration_seconds, 0), COALESCE(sentiment_score, 0), 
		       ai_analysis, created_at, updated_at
		FROM interview_question_responses 
		WHERE interview_id = $1 AND question_order = $2
	`, interviewID, questionOrder).Scan(&r.ID, &r.InterviewID, &r.QuestionID, &r.QuestionText, &r.QuestionOrder,
		&r.AnswerText, &r.RecordingPath, &r.RecordingDurationSeconds, &r.SentimentScore,
		&aiAnalysis, &r.CreatedAt, &r.UpdatedAt)

	if err != nil {
		return nil, err
	}
	if aiAnalysis != nil {
		r.AIAnalysis = aiAnalysis
	}
	return &r, nil
}

// DeleteQuestionResponse deletes a response (for retake)
func DeleteQuestionResponse(ctx context.Context, interviewID, questionOrder int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		DELETE FROM interview_question_responses 
		WHERE interview_id = $1 AND question_order = $2
	`, interviewID, questionOrder)

	return err
}

// GetInterviewProgress returns the current progress of an interview
func GetInterviewProgress(ctx context.Context, interviewID int) (int, int, error) {
	if !IsDBConnected() {
		return 0, 0, nil
	}

	var answeredCount int
	var totalQuestions int

	// Count answered questions
	err := GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM interview_question_responses 
		WHERE interview_id = $1 AND answer_text IS NOT NULL AND answer_text != ''
	`, interviewID).Scan(&answeredCount)
	if err != nil {
		return 0, 0, err
	}

	// Get total questions from the interview's job
	err = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM interview_questions iq
		INNER JOIN interviews i ON i.job_id = iq.job_id
		WHERE i.id = $1
	`, interviewID).Scan(&totalQuestions)
	if err != nil {
		// If no questions defined, return answered count
		return answeredCount, 0, nil
	}

	return answeredCount, totalQuestions, nil
}
