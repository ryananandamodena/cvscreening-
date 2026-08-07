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

// EmployeeCandidateHistory bundles a converted employee's pre-hire recruitment
// history — screenings and interviews are joined via employees.candidate_id ->
// candidates.id. Assessment attempts are intentionally NOT included: they're
// keyed to candidate_users.id (the separate candidate-portal login identity),
// which has no foreign key back to candidates.id, so joining them here would
// require an unreliable email-match heuristic.
type EmployeeCandidateHistory struct {
	CandidateID int                `json:"candidateId"`
	Screenings  []ScreeningSummary `json:"screenings"`
	Interviews  []InterviewSummary `json:"interviews"`
}
