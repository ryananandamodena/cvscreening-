package repository

import (
	"context"
	"fmt"
	"time"
)

// HRAnalytics represents the aggregated dashboard data
type HRAnalytics struct {
	TotalEmployees int     `json:"totalEmployees"`
	ActiveEmployees int     `json:"activeEmployees"`
	TurnoverRate    float64 `json:"turnoverRate"`
	AbsenteeismRate float64 `json:"absenteeismRate"`
}

// GetHRAnalytics calculates and retrieves basic HR metrics
func GetHRAnalytics(ctx context.Context) (*HRAnalytics, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var stats HRAnalytics

	// 1. Total and Active Employees
	err := GetDB().QueryRow(ctx, `
		SELECT 
			COUNT(*) as total_employees,
			COALESCE(SUM(CASE WHEN employment_status != 'terminated' AND deleted_at IS NULL THEN 1 ELSE 0 END), 0) as active_employees
		FROM employees
	`).Scan(&stats.TotalEmployees, &stats.ActiveEmployees)
	
	if err != nil {
		return nil, err
	}

	// 2. Turnover Rate (Terminated in the current year / Average Employees)
	currentYear := time.Now().Year()
	var terminatedThisYear int
	err = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees 
		WHERE employment_status = 'terminated' 
		AND EXTRACT(YEAR FROM updated_at) = $1
	`, currentYear).Scan(&terminatedThisYear)

	if err == nil && stats.TotalEmployees > 0 {
		stats.TurnoverRate = (float64(terminatedThisYear) / float64(stats.TotalEmployees)) * 100
	}

	// 3. Absenteeism Rate (Days absent / Total workable days in current month)
	// Simplified logic: Assume 22 working days per month.
	// Find total absences in current month for all active employees.
	var totalAbsences int
	currentMonth := int(time.Now().Month())
	err = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM leave_requests 
		WHERE status = 'approved' 
		AND leave_type_id IN (SELECT id FROM leave_types WHERE type = 'sick' OR type = 'unpaid')
		AND EXTRACT(MONTH FROM start_date) = $1
		AND EXTRACT(YEAR FROM start_date) = $2
	`, currentMonth, currentYear).Scan(&totalAbsences)

	if err == nil && stats.ActiveEmployees > 0 {
		totalWorkableDays := stats.ActiveEmployees * 22 // Approx 22 work days/month
		if totalWorkableDays > 0 {
			stats.AbsenteeismRate = (float64(totalAbsences) / float64(totalWorkableDays)) * 100
		}
	}

	return &stats, nil
}
