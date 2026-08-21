package repository

import (
	"context"
	"fmt"
	"time"
)

// TeamAttendanceRow represents one employee's attendance status for a given date,
// including employees who haven't clocked in at all (absent) via a LEFT JOIN.
type TeamAttendanceRow struct {
	EmployeeID     int     `json:"employeeId"`
	EmployeeName   string  `json:"employeeName"`
	Department     string  `json:"department"`
	Position       string  `json:"position"`
	Status         string  `json:"status"` // present, late, absent, not_clocked_in
	ClockIn        *string `json:"clockIn,omitempty"`
	ClockOut       *string `json:"clockOut,omitempty"`
	ClockInLocation string `json:"clockInLocation,omitempty"`
}

// GetTeamAttendance returns every active employee's attendance status for the given date.
// Previously unbounded (no LIMIT) — cost scaled linearly with total active headcount. This is a
// dashboard view of "today's team", not a paginated list, so a hard cap preserves the existing
// "one row per employee" response shape while still bounding worst-case query/response size.
func GetTeamAttendance(ctx context.Context, date time.Time) ([]TeamAttendanceRow, error) {
	rows_ := []TeamAttendanceRow{}
	if !IsDBConnected() {
		return rows_, nil
	}

	const maxRows = 1000
	rows, err := GetDB().Query(ctx, fmt.Sprintf(`
		SELECT e.id, e.full_name, COALESCE(d.name, 'Unassigned'), COALESCE(p.name, ''),
			CASE
				WHEN a.status IS NOT NULL THEN a.status
				WHEN EXISTS (
					SELECT 1 FROM leave_requests lr
					WHERE lr.employee_id = e.id AND lr.status = 'approved' AND $1::date BETWEEN lr.start_date AND lr.end_date
				) THEN 'leave'
				WHEN EXISTS (SELECT 1 FROM holidays h WHERE h.date = $1::date) THEN 'holiday'
				ELSE 'absent'
			END,
			a.clock_in::text, a.clock_out::text, COALESCE(a.clock_in_location::text, '')
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN positions p ON e.position_id = p.id
		LEFT JOIN attendances a ON a.employee_id = e.id AND a.date = $1
		WHERE e.employment_status = 'active'
		ORDER BY d.name, e.full_name
		LIMIT %d
	`, maxRows), date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r TeamAttendanceRow
		if err := rows.Scan(&r.EmployeeID, &r.EmployeeName, &r.Department, &r.Position,
			&r.Status, &r.ClockIn, &r.ClockOut, &r.ClockInLocation); err == nil {
			rows_ = append(rows_, r)
		}
	}

	return rows_, nil
}
