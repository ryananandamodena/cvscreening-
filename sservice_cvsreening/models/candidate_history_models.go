package models

import "time"

// ScreeningSummary is a lightweight view of a candidate's CV screening result,
// surfaced on the converted employee's profile.
type ScreeningSummary struct {
	ID        int       `json:"id"`
	JobID     *int      `json:"jobId,omitempty"`
	Score     int       `json:"score"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// InterviewSummary is a lightweight view of a candidate's interview record.
type InterviewSummary struct {
	ID             int        `json:"id"`
	InterviewType  string     `json:"interviewType"`
	ScheduledAt    *time.Time `json:"scheduledAt,omitempty"`
	Status         string     `json:"status"`
	Rating         *int       `json:"rating,omitempty"`
	InterviewerNotes string   `json:"interviewerNotes,omitempty"`
}

// AssessmentAttemptSummary is a lightweight view of a candidate's assessment attempt.
type AssessmentAttemptSummary struct {
	ID           int        `json:"id"`
	AssessmentID int        `json:"assessmentId"`
	Status       string     `json:"status"`
	TotalScore   *float64   `json:"totalScore,omitempty"`
	Passed       *bool      `json:"passed,omitempty"`
	SubmittedAt  *time.Time `json:"submittedAt,omitempty"`
}

// EmployeeCandidateHistory bundles a converted employee's pre-hire recruitment
// history. Screenings/interviews are joined via employees.candidate_id ->
// candidates.id. Assessment attempts are joined via candidates.email ->
// candidate_users.linked_candidate_id (set once at candidate-portal registration —
// see candidatePortalRegisterHandler) -> assessment_attempts.candidate_id, since
// candidate_users is a separate identity space with no direct foreign key to
// candidates.id.
type EmployeeCandidateHistory struct {
	CandidateID int                        `json:"candidateId"`
	Screenings  []ScreeningSummary         `json:"screenings"`
	Interviews  []InterviewSummary         `json:"interviews"`
	Assessments []AssessmentAttemptSummary `json:"assessments"`
}
