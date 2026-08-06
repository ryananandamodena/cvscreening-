package repository

import (
	"context"
	"time"
)

// IsEmployeeOnApprovedLeave checks whether the employee has an approved leave request covering the given date
func IsEmployeeOnApprovedLeave(ctx context.Context, employeeID int, date time.Time) (bool, error) {
	if !IsDBConnected() {
		return false, nil
	}
	var exists bool
	err := GetDB().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM leave_requests
			WHERE employee_id = $1 AND status = 'approved'
			AND $2::date BETWEEN start_date AND end_date
		)
	`, employeeID, date).Scan(&exists)
	return exists, err
}

// IsHoliday checks whether the given date is a registered company/national holiday
func IsHoliday(ctx context.Context, date time.Time) (bool, string, error) {
	if !IsDBConnected() {
		return false, "", nil
	}
	var name string
	err := GetDB().QueryRow(ctx, `SELECT name FROM holidays WHERE date = $1::date LIMIT 1`, date).Scan(&name)
	if err != nil {
		return false, "", nil
	}
	return true, name, nil
}
