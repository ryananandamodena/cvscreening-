package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateSurvey inserts a new survey (status defaults to 'draft' unless provided).
func CreateSurvey(ctx context.Context, s *models.Survey) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	if s.Status == "" {
		s.Status = models.SurveyStatusDraft
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO surveys (title, description, status, start_date, end_date, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, s.Title, s.Description, s.Status, s.StartDate, s.EndDate, s.CreatedBy).Scan(&id)
	return id, err
}

// GetSurveys lists surveys. When employeeID > 0, each row also reports whether that employee
// has already submitted a response (HasResponded) — used by the mobile "available surveys" list.
func GetSurveys(ctx context.Context, employeeID int, statusFilter string) ([]models.Survey, error) {
	if !IsDBConnected() {
		return []models.Survey{}, nil
	}
	query := `
		SELECT s.id, s.title, s.description, s.status, s.start_date, s.end_date,
		       s.created_by, s.created_at, s.updated_at,
		       (SELECT COUNT(*) FROM survey_questions q WHERE q.survey_id = s.id) AS question_count,
		       EXISTS(
		           SELECT 1 FROM survey_responses r
		           WHERE r.survey_id = s.id AND r.employee_id = $1
		       ) AS has_responded
		FROM surveys s
	`
	args := []interface{}{employeeID}
	if statusFilter != "" {
		query += ` WHERE s.status = $2`
		args = append(args, statusFilter)
	}
	query += ` ORDER BY s.created_at DESC`

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var surveys []models.Survey
	for rows.Next() {
		var s models.Survey
		if err := rows.Scan(
			&s.ID, &s.Title, &s.Description, &s.Status, &s.StartDate, &s.EndDate,
			&s.CreatedBy, &s.CreatedAt, &s.UpdatedAt, &s.QuestionCount, &s.HasResponded,
		); err != nil {
			return nil, err
		}
		surveys = append(surveys, s)
	}
	if surveys == nil {
		surveys = []models.Survey{}
	}
	return surveys, nil
}

// GetSurveyByID returns a single survey, or (nil, nil) if it doesn't exist — callers should
// treat a nil survey as "not found" and respond 404, not as a server error.
func GetSurveyByID(ctx context.Context, id int) (*models.Survey, error) {
	if !IsDBConnected() {
		return nil, nil
	}
	var s models.Survey
	err := GetDB().QueryRow(ctx, `
		SELECT id, title, description, status, start_date, end_date, created_by, created_at, updated_at
		FROM surveys WHERE id = $1
	`, id).Scan(&s.ID, &s.Title, &s.Description, &s.Status, &s.StartDate, &s.EndDate, &s.CreatedBy, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, nil
	}
	return &s, nil
}

// CreateSurveyQuestion appends a question to a survey.
func CreateSurveyQuestion(ctx context.Context, q *models.SurveyQuestion) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	options := q.Options
	if len(options) == 0 {
		options = json.RawMessage(`[]`)
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO survey_questions (survey_id, question_text, question_type, options, required, order_index)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, q.SurveyID, q.QuestionText, q.QuestionType, options, q.Required, q.OrderIndex).Scan(&id)
	return id, err
}

// GetSurveyQuestions returns a survey's questions ordered for display.
func GetSurveyQuestions(ctx context.Context, surveyID int) ([]models.SurveyQuestion, error) {
	if !IsDBConnected() {
		return []models.SurveyQuestion{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, survey_id, question_text, question_type, options, required, order_index
		FROM survey_questions
		WHERE survey_id = $1
		ORDER BY order_index ASC, id ASC
	`, surveyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []models.SurveyQuestion
	for rows.Next() {
		var q models.SurveyQuestion
		if err := rows.Scan(&q.ID, &q.SurveyID, &q.QuestionText, &q.QuestionType, &q.Options, &q.Required, &q.OrderIndex); err != nil {
			return nil, err
		}
		questions = append(questions, q)
	}
	if questions == nil {
		questions = []models.SurveyQuestion{}
	}
	return questions, nil
}

// GetSurveyResponseByEmployee returns the employee's own response (with answers) for a survey,
// or (nil, nil) if they haven't submitted one yet.
func GetSurveyResponseByEmployee(ctx context.Context, surveyID, employeeID int) (*models.SurveyResponse, error) {
	if !IsDBConnected() {
		return nil, nil
	}
	var r models.SurveyResponse
	err := GetDB().QueryRow(ctx, `
		SELECT id, survey_id, employee_id, submitted_at
		FROM survey_responses
		WHERE survey_id = $1 AND employee_id = $2
	`, surveyID, employeeID).Scan(&r.ID, &r.SurveyID, &r.EmployeeID, &r.SubmittedAt)
	if err != nil {
		return nil, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, response_id, question_id, answer_value, answer_json
		FROM survey_answers
		WHERE response_id = $1
	`, r.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var answers []models.SurveyAnswer
	for rows.Next() {
		var a models.SurveyAnswer
		if err := rows.Scan(&a.ID, &a.ResponseID, &a.QuestionID, &a.Value, &a.ValueJSON); err != nil {
			return nil, err
		}
		answers = append(answers, a)
	}
	r.Answers = answers
	return &r, nil
}

// HasEmployeeResponded reports whether the employee already has a response for this survey —
// used to guard against duplicate submissions before opening a transaction.
func HasEmployeeResponded(ctx context.Context, surveyID, employeeID int) (bool, error) {
	if !IsDBConnected() {
		return false, nil
	}
	var exists bool
	err := GetDB().QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM survey_responses WHERE survey_id = $1 AND employee_id = $2)
	`, surveyID, employeeID).Scan(&exists)
	return exists, err
}

// SubmitSurveyResponse inserts the response header and all its answers atomically: either the
// whole submission is saved, or none of it is (a partial write would leave a response with no
// answers, or answers referencing a response that doesn't exist).
func SubmitSurveyResponse(ctx context.Context, surveyID, employeeID int, answers []models.SurveyAnswerInput) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	tx, err := GetDB().Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	var responseID int
	err = tx.QueryRow(ctx, `
		INSERT INTO survey_responses (survey_id, employee_id, submitted_at)
		VALUES ($1, $2, $3)
		RETURNING id
	`, surveyID, employeeID, time.Now()).Scan(&responseID)
	if err != nil {
		return 0, err
	}

	for _, a := range answers {
		var valueJSON interface{}
		if len(a.Values) > 0 {
			b, err := json.Marshal(a.Values)
			if err != nil {
				return 0, err
			}
			valueJSON = b
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO survey_answers (response_id, question_id, answer_value, answer_json)
			VALUES ($1, $2, $3, $4)
		`, responseID, a.QuestionID, a.Value, valueJSON); err != nil {
			return 0, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return responseID, nil
}
