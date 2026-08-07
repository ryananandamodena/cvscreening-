package models

import "time"

// LeadershipModule is one training module within a leadership program.
type LeadershipModule struct {
	ID            int      `json:"id"`
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	DurationHours int      `json:"duration"` // matches TS field name `duration` (hours)
	Instructor    string   `json:"instructor,omitempty"`
	Materials     []string `json:"materials"`
}

// LeadershipDevelopment mirrors terai/services/succession.service.ts LeadershipDevelopment.
// TargetAudience/Outcomes are stored as JSONB; Modules/Participants are normalized tables.
type LeadershipDevelopment struct {
	ID             int                `json:"id"`
	ProgramName    string             `json:"programName"`
	Description    string             `json:"description"`
	TargetAudience []string           `json:"targetAudience"`
	Duration       int                `json:"duration"` // weeks
	Modules        []LeadershipModule `json:"modules"`
	Participants   []int              `json:"participants"` // employee IDs
	Status         string             `json:"status"`        // planning, active, completed
	StartDate      time.Time          `json:"startDate"`
	EndDate        *time.Time         `json:"endDate,omitempty"`
	Budget         float64            `json:"budget"`
	Outcomes       []string           `json:"outcomes"`
	CreatedAt      time.Time          `json:"createdAt"`
	UpdatedAt      time.Time          `json:"updatedAt"`
}
