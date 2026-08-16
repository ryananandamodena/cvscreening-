package models

import (
	"encoding/json"
	"time"
)

// Survey question types. Kept as plain string constants (matching this codebase's convention
// of VARCHAR "enum" columns) rather than a Go enum type, so they round-trip through JSON as-is.
const (
	SurveyQuestionTypeRating         = "rating"
	SurveyQuestionTypeSingleChoice   = "single_choice"
	SurveyQuestionTypeMultipleChoice = "multiple_choice"
	SurveyQuestionTypeText           = "text"
)

const (
	SurveyStatusDraft  = "draft"
	SurveyStatusActive = "active"
	SurveyStatusClosed = "closed"
)

type Survey struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	StartDate   *time.Time `json:"startDate,omitempty"`
	EndDate     *time.Time `json:"endDate,omitempty"`
	CreatedBy   *int       `json:"createdBy,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Joined
	QuestionCount int  `json:"questionCount,omitempty"`
	HasResponded  bool `json:"hasResponded,omitempty"`
}

type SurveyQuestionOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type SurveyQuestion struct {
	ID           int             `json:"id"`
	SurveyID     int             `json:"surveyId"`
	QuestionText string          `json:"questionText"`
	QuestionType string          `json:"questionType"`
	Options      json.RawMessage `json:"options"`
	Required     bool            `json:"required"`
	OrderIndex   int             `json:"orderIndex"`
}

type SurveyResponse struct {
	ID          int       `json:"id"`
	SurveyID    int       `json:"surveyId"`
	EmployeeID  int       `json:"employeeId"`
	SubmittedAt time.Time `json:"submittedAt"`

	// Joined
	Answers []SurveyAnswer `json:"answers,omitempty"`
}

type SurveyAnswer struct {
	ID         int             `json:"id"`
	ResponseID int             `json:"responseId"`
	QuestionID int             `json:"questionId"`
	Value      *string         `json:"value,omitempty"`
	ValueJSON  json.RawMessage `json:"valueJson,omitempty"`
}

// SurveyAnswerInput is what the client submits per question — never trust it as the final
// shape; the handler/repository revalidate question type, required-ness, and option validity
// against the stored question before persisting.
type SurveyAnswerInput struct {
	QuestionID int      `json:"questionId"`
	Value      *string  `json:"value,omitempty"`
	Values     []string `json:"values,omitempty"`
}

type SubmitSurveyResponseRequest struct {
	Answers []SurveyAnswerInput `json:"answers"`
}
