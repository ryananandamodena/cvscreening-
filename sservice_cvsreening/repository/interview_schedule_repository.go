package repository

import (
	"context"
	"fmt"
	"time"
)

// InterviewSchedule represents a scheduled interview entry
type InterviewSchedule struct {
	ID              int       `json:"id"`
	CandidateID     int       `json:"candidateId"`
	JobID           int       `json:"jobId"`
	InterviewID     *int      `json:"interviewId,omitempty"`
	RecruiterID     *int      `json:"recruiterId,omitempty"`
	CandidateName   string    `json:"candidateName"`
	JobTitle        string    `json:"jobTitle"`
	RecruiterName   string    `json:"recruiterName"`
	ScheduledAt     time.Time `json:"scheduledAt"`
	DurationMinutes int       `json:"durationMinutes"`
	InterviewType   string    `json:"interviewType"`
	Status          string    `json:"status"`
	Location        string    `json:"location"`
	MeetingURL      string    `json:"meetingUrl"`
	Notes           string    `json:"notes"`
	CancelReason    string    `json:"cancelReason,omitempty"`
	ReminderSent    bool      `json:"reminderSent"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// CreateInterviewSchedule creates a new interview schedule
func CreateInterviewSchedule(ctx context.Context, s *InterviewSchedule) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO interview_schedules (candidate_id, job_id, interview_id, recruiter_id, candidate_name, job_title, recruiter_name, scheduled_at, duration_minutes, interview_type, status, location, meeting_url, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled', $11, $12, $13)
		RETURNING id
	`, s.CandidateID, s.JobID, s.InterviewID, s.RecruiterID, s.CandidateName, s.JobTitle, s.RecruiterName, s.ScheduledAt, s.DurationMinutes, s.InterviewType, s.Location, s.MeetingURL, s.Notes).Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}

// GetInterviewSchedules retrieves interview schedules with optional filters
func GetInterviewSchedules(ctx context.Context, status, interviewType string) ([]InterviewSchedule, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	query := `
		SELECT id, COALESCE(candidate_id, 0), COALESCE(job_id, 0), interview_id, recruiter_id,
			COALESCE(candidate_name, ''), COALESCE(job_title, ''), COALESCE(recruiter_name, ''),
			scheduled_at, COALESCE(duration_minutes, 60), COALESCE(interview_type, 'video'),
			COALESCE(status, 'scheduled'), COALESCE(location, ''), COALESCE(meeting_url, ''),
			COALESCE(notes, ''), COALESCE(cancel_reason, ''), COALESCE(reminder_sent, false),
			created_at, updated_at
		FROM interview_schedules WHERE 1=1`

	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	if interviewType != "" {
		query += fmt.Sprintf(" AND interview_type = $%d", argIdx)
		args = append(args, interviewType)
		argIdx++
	}

	query += " ORDER BY scheduled_at ASC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []InterviewSchedule
	for rows.Next() {
		var s InterviewSchedule
		var interviewID, recruiterID *int
		err := rows.Scan(&s.ID, &s.CandidateID, &s.JobID, &interviewID, &recruiterID,
			&s.CandidateName, &s.JobTitle, &s.RecruiterName,
			&s.ScheduledAt, &s.DurationMinutes, &s.InterviewType,
			&s.Status, &s.Location, &s.MeetingURL,
			&s.Notes, &s.CancelReason, &s.ReminderSent,
			&s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		s.InterviewID = interviewID
		s.RecruiterID = recruiterID
		schedules = append(schedules, s)
	}
	return schedules, nil
}

// GetInterviewScheduleByID retrieves a single schedule
func GetInterviewScheduleByID(ctx context.Context, id int) (*InterviewSchedule, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var s InterviewSchedule
	var interviewID, recruiterID *int
	err := GetDB().QueryRow(ctx, `
		SELECT id, COALESCE(candidate_id, 0), COALESCE(job_id, 0), interview_id, recruiter_id,
			COALESCE(candidate_name, ''), COALESCE(job_title, ''), COALESCE(recruiter_name, ''),
			scheduled_at, COALESCE(duration_minutes, 60), COALESCE(interview_type, 'video'),
			COALESCE(status, 'scheduled'), COALESCE(location, ''), COALESCE(meeting_url, ''),
			COALESCE(notes, ''), COALESCE(cancel_reason, ''), COALESCE(reminder_sent, false),
			created_at, updated_at
		FROM interview_schedules WHERE id = $1
	`, id).Scan(&s.ID, &s.CandidateID, &s.JobID, &interviewID, &recruiterID,
		&s.CandidateName, &s.JobTitle, &s.RecruiterName,
		&s.ScheduledAt, &s.DurationMinutes, &s.InterviewType,
		&s.Status, &s.Location, &s.MeetingURL,
		&s.Notes, &s.CancelReason, &s.ReminderSent,
		&s.CreatedAt, &s.UpdatedAt)

	if err != nil {
		return nil, err
	}
	s.InterviewID = interviewID
	s.RecruiterID = recruiterID
	return &s, nil
}

// UpdateInterviewSchedule updates a schedule
func UpdateInterviewSchedule(ctx context.Context, s *InterviewSchedule) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE interview_schedules SET
			scheduled_at = $2, duration_minutes = $3, interview_type = $4,
			location = $5, meeting_url = $6, notes = $7, status = $8,
			updated_at = NOW()
		WHERE id = $1
	`, s.ID, s.ScheduledAt, s.DurationMinutes, s.InterviewType, s.Location, s.MeetingURL, s.Notes, s.Status)

	return err
}

// CancelInterviewSchedule cancels a schedule with reason
func CancelInterviewSchedule(ctx context.Context, id int, reason string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE interview_schedules SET status = 'cancelled', cancel_reason = $2, updated_at = NOW()
		WHERE id = $1
	`, id, reason)

	return err
}
