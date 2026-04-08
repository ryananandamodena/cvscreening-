package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/ryantriananda/sservice_cvsreening/models"
)

// Assessment represents a test definition
type Assessment struct {
	ID                     int       `json:"id"`
	Title                  string    `json:"title"`
	Description            string    `json:"description"`
	AssessmentType         string    `json:"assessmentType"`
	DurationMinutes        int       `json:"durationMinutes"`
	PassingScore           int       `json:"passingScore"`
	MaxAttempts            int       `json:"maxAttempts"`
	ShuffleQuestions       bool      `json:"shuffleQuestions"`
	ShowResultsImmediately bool      `json:"showResultsImmediately"`
	Status                 string    `json:"status"`
	JobID                  *int      `json:"jobId,omitempty"`
	CreatedBy              *int      `json:"createdBy,omitempty"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

// AssessmentQuestion represents a question in an assessment
type AssessmentQuestion struct {
	ID            int             `json:"id"`
	AssessmentID  int             `json:"assessmentId"`
	QuestionText  string          `json:"questionText"`
	QuestionType  string          `json:"questionType"`
	Options       json.RawMessage `json:"options,omitempty"`
	CorrectAnswer json.RawMessage `json:"correctAnswer,omitempty"`
	Points        int             `json:"points"`
	Difficulty    string          `json:"difficulty"`
	Category      string          `json:"category,omitempty"`
	Explanation   string          `json:"explanation,omitempty"`
	OrderNum      int             `json:"orderNum"`
	ImageURL      string          `json:"imageUrl,omitempty"`
	CodeTemplate  string          `json:"codeTemplate,omitempty"`
	CreatedAt     time.Time       `json:"createdAt"`
}

// AssessmentAttempt represents a candidate's test session
type AssessmentAttempt struct {
	ID               int             `json:"id"`
	AssessmentID     int             `json:"assessmentId"`
	CandidateID      int             `json:"candidateId"`
	JobID            *int            `json:"jobId,omitempty"`
	ApplicationID    *int            `json:"applicationId,omitempty"`
	Status           string          `json:"status"`
	StartedAt        *time.Time      `json:"startedAt,omitempty"`
	SubmittedAt      *time.Time      `json:"submittedAt,omitempty"`
	TimeSpentSeconds int             `json:"timeSpentSeconds,omitempty"`
	TotalScore       float64         `json:"totalScore,omitempty"`
	Passed           *bool           `json:"passed,omitempty"`
	ProctoringData   json.RawMessage `json:"proctoringData,omitempty"`
	IPAddress        string          `json:"ipAddress,omitempty"`
	UserAgent        string          `json:"userAgent,omitempty"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

// AssessmentAnswer represents an answer to a question
type AssessmentAnswer struct {
	ID               int             `json:"id"`
	AttemptID        int             `json:"attemptId"`
	QuestionID       int             `json:"questionId"`
	Answer           json.RawMessage `json:"answer,omitempty"`
	IsCorrect        *bool           `json:"isCorrect,omitempty"`
	PointsEarned     float64         `json:"pointsEarned"`
	TimeSpentSeconds int             `json:"timeSpentSeconds,omitempty"`
	AIEvaluation     json.RawMessage `json:"aiEvaluation,omitempty"`
	GradedAt         *time.Time      `json:"gradedAt,omitempty"`
	GradedBy         *int            `json:"gradedBy,omitempty"`
	CreatedAt        time.Time       `json:"createdAt"`
}

// AssessmentAttemptResult is a rich result struct for the results page
type AssessmentAttemptResult struct {
	ID              int                    `json:"id"`
	AssessmentID    int                    `json:"assessmentId"`
	AssessmentTitle string                 `json:"assessmentTitle"`
	AssessmentType  string                 `json:"assessmentType"`
	CandidateName   string                 `json:"candidateName"`
	CandidateEmail  string                 `json:"candidateEmail"`
	StartTime       *time.Time             `json:"startTime"`
	SubmittedAt     *time.Time             `json:"submittedAt"`
	TotalScore      float64                `json:"totalScore"`
	MaxScore        float64                `json:"maxScore"`
	Percentage      float64                `json:"percentage"`
	Passed          bool                   `json:"passed"`
	PassingScore    int                    `json:"passingScore"`
	TimeSpent       int                    `json:"timeSpent"`
	ProctoringData  map[string]interface{} `json:"proctoringData"`
	Answers         []AttemptAnswerResult  `json:"answers"`
}

// AttemptAnswerResult is a rich answer result with question info
type AttemptAnswerResult struct {
	ID            int             `json:"id"`
	QuestionID    int             `json:"questionId"`
	QuestionText  string          `json:"questionText"`
	QuestionType  string          `json:"questionType"`
	UserAnswer    json.RawMessage `json:"userAnswer"`
	CorrectAnswer json.RawMessage `json:"correctAnswer"`
	IsCorrect     *bool           `json:"isCorrect"`
	Points        int             `json:"points"`
	EarnedPoints  float64         `json:"earnedPoints"`
	AIEvaluation  json.RawMessage `json:"aiEvaluation"`
}

// CreateAssessment creates a new assessment
func CreateAssessment(ctx context.Context, a *models.Assessment) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO assessments (title, description, assessment_type, duration_minutes, passing_score, 
			max_attempts, shuffle_questions, show_results_immediately, status, job_id, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id
	`, a.Title, a.Description, a.AssessmentType, a.DurationMinutes, a.PassingScore,
		a.MaxAttempts, a.ShuffleQuestions, a.ShowResultsImmediately, a.Status, a.JobID, a.CreatedBy).Scan(&id)

	return id, err
}

// GetAssessments retrieves all assessments
func GetAssessments(ctx context.Context, status string) ([]models.Assessment, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	query := `SELECT id, title, description, assessment_type, duration_minutes, passing_score, 
		max_attempts, shuffle_questions, show_results_immediately, status, job_id, created_by, created_at, updated_at
		FROM assessments`

	if status != "" {
		query += " WHERE status = $1"
	}
	query += " ORDER BY created_at DESC"

	var rows pgx.Rows
	var err error
	if status != "" {
		rows, err = GetDB().Query(ctx, query, status)
	} else {
		rows, err = GetDB().Query(ctx, query)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var assessments []models.Assessment
	for rows.Next() {
		var a models.Assessment
		err := rows.Scan(&a.ID, &a.Title, &a.Description, &a.AssessmentType, &a.DurationMinutes,
			&a.PassingScore, &a.MaxAttempts, &a.ShuffleQuestions, &a.ShowResultsImmediately,
			&a.Status, &a.JobID, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			log.Printf("Error scanning assessment: %v", err)
			continue
		}
		assessments = append(assessments, a)
	}
	return assessments, nil
}

// GetAssessmentByID retrieves a single assessment
func GetAssessmentByID(ctx context.Context, id int) (*models.Assessment, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var a models.Assessment
	err := GetDB().QueryRow(ctx, `
		SELECT id, title, description, assessment_type, duration_minutes, passing_score, 
			max_attempts, shuffle_questions, show_results_immediately, status, job_id, created_by, created_at, updated_at
		FROM assessments WHERE id = $1
	`, id).Scan(&a.ID, &a.Title, &a.Description, &a.AssessmentType, &a.DurationMinutes,
		&a.PassingScore, &a.MaxAttempts, &a.ShuffleQuestions, &a.ShowResultsImmediately,
		&a.Status, &a.JobID, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt)

	if err != nil {
		return nil, err
	}
	return &a, nil
}

// UpdateAssessment updates an existing assessment
func UpdateAssessment(ctx context.Context, a *models.Assessment) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE assessments 
		SET title=$1, description=$2, assessment_type=$3, duration_minutes=$4, passing_score=$5, 
			max_attempts=$6, shuffle_questions=$7, show_results_immediately=$8, status=$9, updated_at=CURRENT_TIMESTAMP
		WHERE id=$10
	`, a.Title, a.Description, a.AssessmentType, a.DurationMinutes, a.PassingScore,
		a.MaxAttempts, a.ShuffleQuestions, a.ShowResultsImmediately, a.Status, a.ID)

	return err
}

// DeleteAssessment deletes an assessment
func DeleteAssessment(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, _ = GetDB().Exec(ctx, "DELETE FROM assessment_questions WHERE assessment_id=$1", id)
	_, err := GetDB().Exec(ctx, "DELETE FROM assessments WHERE id=$1", id)
	return err
}

// CreateAssessmentQuestion creates a new question
func CreateAssessmentQuestion(ctx context.Context, q *models.AssessmentQuestion) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO assessment_questions (assessment_id, question_text, question_type, options, correct_answer, 
			points, difficulty, category, explanation, order_num, image_url, code_template)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id
	`, q.AssessmentID, q.QuestionText, q.QuestionType, q.Options, q.CorrectAnswer,
		q.Points, q.Difficulty, q.Category, q.Explanation, q.OrderNum, q.ImageURL, q.CodeTemplate).Scan(&id)

	return id, err
}

// GetAssessmentQuestions retrieves all questions for an assessment
func GetAssessmentQuestions(ctx context.Context, assessmentID int) ([]models.AssessmentQuestion, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, assessment_id, question_text, question_type, options, correct_answer, 
			points, difficulty, category, explanation, order_num, image_url, code_template, created_at
		FROM assessment_questions 
		WHERE assessment_id = $1 
		ORDER BY order_num ASC
	`, assessmentID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []models.AssessmentQuestion
	for rows.Next() {
		var q models.AssessmentQuestion
		var options, correctAnswer []byte
		err := rows.Scan(&q.ID, &q.AssessmentID, &q.QuestionText, &q.QuestionType, &options, &correctAnswer,
			&q.Points, &q.Difficulty, &q.Category, &q.Explanation, &q.OrderNum, &q.ImageURL, &q.CodeTemplate, &q.CreatedAt)
		if err != nil {
			log.Printf("Error scanning question: %v", err)
			continue
		}
		if options != nil {
			q.Options = options
		}
		if correctAnswer != nil {
			q.CorrectAnswer = correctAnswer
		}
		questions = append(questions, q)
	}
	return questions, nil
}

// UpdateAssessmentQuestion updates an existing question
func UpdateAssessmentQuestion(ctx context.Context, q *models.AssessmentQuestion) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE assessment_questions 
		SET question_text=$1, question_type=$2, options=$3, correct_answer=$4, 
			points=$5, difficulty=$6, category=$7, explanation=$8, order_num=$9, 
			image_url=$10, code_template=$11
		WHERE id=$12
	`, q.QuestionText, q.QuestionType, q.Options, q.CorrectAnswer,
		q.Points, q.Difficulty, q.Category, q.Explanation, q.OrderNum,
		q.ImageURL, q.CodeTemplate, q.ID)

	return err
}

// DeleteAssessmentQuestion deletes a question
func DeleteAssessmentQuestion(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, "DELETE FROM assessment_questions WHERE id=$1", id)
	return err
}

// CreateAssessmentAttempt creates a new attempt
func CreateAssessmentAttempt(ctx context.Context, a *models.AssessmentAttempt) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO assessment_attempts (assessment_id, candidate_id, job_id, application_id, status, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, a.AssessmentID, a.CandidateID, a.JobID, a.ApplicationID, a.Status, a.IPAddress, a.UserAgent).Scan(&id)

	return id, err
}

// StartAssessmentAttempt starts an attempt
func StartAssessmentAttempt(ctx context.Context, attemptID int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE assessment_attempts 
		SET status = 'in_progress', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, attemptID)

	return err
}

// SubmitAssessmentAttempt submits an attempt
func SubmitAssessmentAttempt(ctx context.Context, attemptID int, totalScore float64, passed bool) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE assessment_attempts 
		SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, total_score = $2, passed = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, attemptID, totalScore, passed)

	return err
}

// GetAssessmentAttemptByID retrieves an attempt
func GetAssessmentAttemptByID(ctx context.Context, id int) (*models.AssessmentAttempt, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var a models.AssessmentAttempt
	var proctoringData []byte
	err := GetDB().QueryRow(ctx, `
		SELECT id, assessment_id, candidate_id, job_id, application_id, status, started_at, submitted_at,
			COALESCE(time_spent_seconds, 0), COALESCE(total_score, 0), passed, proctoring_data, 
			ip_address, user_agent, created_at, updated_at
		FROM assessment_attempts WHERE id = $1
	`, id).Scan(&a.ID, &a.AssessmentID, &a.CandidateID, &a.JobID, &a.ApplicationID, &a.Status, &a.StartedAt, &a.SubmittedAt,
		&a.TimeSpentSeconds, &a.TotalScore, &a.Passed, &proctoringData, &a.IPAddress, &a.UserAgent, &a.CreatedAt, &a.UpdatedAt)

	if err != nil {
		return nil, err
	}
	if proctoringData != nil {
		a.ProctoringData = proctoringData
	}
	return &a, nil
}

// GetCandidateAttempts retrieves all attempts for a candidate
func GetCandidateAttempts(ctx context.Context, candidateID int) ([]models.AssessmentAttempt, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, assessment_id, candidate_id, job_id, application_id, status, started_at, submitted_at,
			COALESCE(time_spent_seconds, 0), COALESCE(total_score, 0), passed, ip_address, user_agent, created_at, updated_at
		FROM assessment_attempts 
		WHERE candidate_id = $1 
		ORDER BY created_at DESC
	`, candidateID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attempts []models.AssessmentAttempt
	for rows.Next() {
		var a models.AssessmentAttempt
		err := rows.Scan(&a.ID, &a.AssessmentID, &a.CandidateID, &a.JobID, &a.ApplicationID, &a.Status,
			&a.StartedAt, &a.SubmittedAt, &a.TimeSpentSeconds, &a.TotalScore, &a.Passed,
			&a.IPAddress, &a.UserAgent, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			log.Printf("Error scanning attempt: %v", err)
			continue
		}
		attempts = append(attempts, a)
	}
	return attempts, nil
}

// SaveAssessmentAnswer saves an answer
func SaveAssessmentAnswer(ctx context.Context, a *models.AssessmentAnswer) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		INSERT INTO assessment_answers (attempt_id, question_id, answer, is_correct, points_earned, time_spent_seconds)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (attempt_id, question_id) DO UPDATE SET
			answer = EXCLUDED.answer,
			is_correct = EXCLUDED.is_correct,
			points_earned = EXCLUDED.points_earned,
			time_spent_seconds = EXCLUDED.time_spent_seconds
	`, a.AttemptID, a.QuestionID, a.Answer, a.IsCorrect, a.PointsEarned, a.TimeSpentSeconds)

	return err
}

// GetAssessmentAnswers retrieves all answers for an attempt
func GetAssessmentAnswers(ctx context.Context, attemptID int) ([]models.AssessmentAnswer, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, attempt_id, question_id, answer, is_correct, points_earned, time_spent_seconds, ai_evaluation, created_at
		FROM assessment_answers WHERE attempt_id = $1
	`, attemptID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []models.AssessmentAnswer
	for rows.Next() {
		var a models.AssessmentAnswer
		var answer, aiEval []byte
		err := rows.Scan(&a.ID, &a.AttemptID, &a.QuestionID, &answer, &a.IsCorrect, &a.PointsEarned,
			&a.TimeSpentSeconds, &aiEval, &a.CreatedAt)
		if err != nil {
			log.Printf("Error scanning answer: %v", err)
			continue
		}
		if answer != nil {
			a.Answer = answer
		}
		if aiEval != nil {
			a.AIEvaluation = aiEval
		}
		answers = append(answers, a)
	}
	return answers, nil
}

// GetAssessmentAttemptResult retrieves a full result for an attempt
func GetAssessmentAttemptResult(ctx context.Context, attemptID int) (*AssessmentAttemptResult, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var result AssessmentAttemptResult

	// Fetch attempt + assessment + candidate info
	err := GetDB().QueryRow(ctx, `
		SELECT 
			aa.id, aa.assessment_id, a.title, a.assessment_type,
			COALESCE(c.full_name, ''), COALESCE(c.email, ''),
			aa.started_at, aa.submitted_at,
			COALESCE(aa.total_score, 0), COALESCE(a.passing_score, 70),
			aa.passed, COALESCE(aa.time_spent_seconds, 0),
			COALESCE(aa.proctoring_data, '{}')
		FROM assessment_attempts aa
		LEFT JOIN assessments a ON aa.assessment_id = a.id
		LEFT JOIN candidates c ON aa.candidate_id = c.id
		WHERE aa.id = $1
	`, attemptID).Scan(
		&result.ID, &result.AssessmentID, &result.AssessmentTitle, &result.AssessmentType,
		&result.CandidateName, &result.CandidateEmail,
		&result.StartTime, &result.SubmittedAt,
		&result.TotalScore, &result.PassingScore,
		&result.Passed, &result.TimeSpent,
		new(json.RawMessage),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch attempt: %w", err)
	}
	result.TimeSpent = result.TimeSpent / 60 // convert seconds to minutes
	result.AssessmentType = result.AssessmentType

	// Initialize proctoring
	result.ProctoringData = map[string]interface{}{"tabSwitches": 0, "focusLosses": 0}

	// Fetch answers with question info
	rows, err := GetDB().Query(ctx, `
		SELECT 
			ans.id, ans.question_id, 
			COALESCE(q.question_text, ''), COALESCE(q.question_type, 'text'),
			ans.answer, q.correct_answer,
			ans.is_correct, COALESCE(q.points, 1), COALESCE(ans.points_earned, 0),
			ans.ai_evaluation
		FROM assessment_answers ans
		LEFT JOIN assessment_questions q ON ans.question_id = q.id
		WHERE ans.attempt_id = $1
		ORDER BY COALESCE(q.order_num, q.id)
	`, attemptID)
	if err != nil {
		log.Printf("Error fetching answers: %v", err)
		result.Answers = []AttemptAnswerResult{}
		return &result, nil
	}
	defer rows.Close()

	var totalMaxScore float64
	for rows.Next() {
		var a AttemptAnswerResult
		var isCorrectVal *bool
		err := rows.Scan(
			&a.ID, &a.QuestionID, &a.QuestionText, &a.QuestionType,
			&a.UserAnswer, &a.CorrectAnswer,
			&isCorrectVal, &a.Points, &a.EarnedPoints,
			&a.AIEvaluation,
		)
		if err != nil {
			log.Printf("Error scanning answer result: %v", err)
			continue
		}
		a.IsCorrect = isCorrectVal
		result.Answers = append(result.Answers, a)
		totalMaxScore += float64(a.Points)
	}

	if result.Answers == nil {
		result.Answers = []AttemptAnswerResult{}
	}

	result.MaxScore = totalMaxScore
	if totalMaxScore > 0 {
		result.Percentage = (result.TotalScore / totalMaxScore) * 100
	}

	return &result, nil
}
