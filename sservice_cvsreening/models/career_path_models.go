package models

import "time"

// CareerPathTimelineItem is one stage of a career path's timeline.
type CareerPathTimelineItem struct {
	Position              string   `json:"position"`
	EstimatedTime         int      `json:"estimatedTime"` // months
	Requirements          []string `json:"requirements"`
	DevelopmentActivities []string `json:"developmentActivities"`
}

// CareerPathMilestone mirrors terai/services/succession.service.ts CareerPath.milestones[].
type CareerPathMilestone struct {
	ID        int        `json:"id"`
	PathID    int        `json:"pathId"`
	Title     string     `json:"title"`
	Completed bool       `json:"completed"`
	DueDate   *time.Time `json:"dueDate,omitempty"`
	Status    string     `json:"status"` // not_started, in_progress, completed, overdue
}

// CareerPath mirrors terai/services/succession.service.ts CareerPath.
// TargetPositions and Timeline are stored as JSONB — see schema_career_paths.sql.
type CareerPath struct {
	ID              int                      `json:"id"`
	EmployeeID      int                      `json:"employeeId"`
	CurrentPosition string                   `json:"currentPosition"`
	MentorID        *int                     `json:"mentorId,omitempty"`
	TargetPositions []string                 `json:"targetPositions"`
	Timeline        []CareerPathTimelineItem `json:"timeline"`
	Milestones      []CareerPathMilestone    `json:"milestones"`
	CreatedAt       time.Time                `json:"createdAt"`
	UpdatedAt       time.Time                `json:"updatedAt"`
	// Joined
	EmployeeName     string  `json:"employeeName,omitempty"`
	MentorName       string  `json:"mentorName,omitempty"`
	PerformanceScore float64 `json:"performanceScore,omitempty"`
}
