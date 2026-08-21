package repository

import (
	"context"
	"fmt"
	"time"
)

// MonthlyAttendanceRow summarizes one employee's attendance for a given month
type MonthlyAttendanceRow struct {
	EmployeeID         int     `json:"employeeId"`
	EmployeeName       string  `json:"employeeName"`
	Department         string  `json:"department"`
	WorkingDays        int     `json:"workingDays"`
	PresentDays        int     `json:"presentDays"`
	LateDays           int     `json:"lateDays"`
	LeaveDays          int     `json:"leaveDays"`
	AbsentDays         int     `json:"absentDays"`
	TotalLateMinutes   int     `json:"totalLateMinutes"`
	TotalOvertimeHours float64 `json:"totalOvertimeHours"`
}

// GetWorkingDaysInMonth counts weekdays in the month that are not registered holidays
func GetWorkingDaysInMonth(ctx context.Context, year, month int) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, -1)

	var count int
	err := GetDB().QueryRow(ctx, `
		SELECT COUNT(*)
		FROM generate_series($1::date, $2::date, interval '1 day') d
		WHERE EXTRACT(ISODOW FROM d) < 6
		AND d NOT IN (SELECT date FROM holidays WHERE date BETWEEN $1::date AND $2::date)
	`, start, end).Scan(&count)
	return count, err
}

// GetMonthlyAttendanceReport returns one row per active employee (or a single employee) summarizing
// the given month: present/late/leave/absent day counts, total late minutes, and total overtime hours.
func GetMonthlyAttendanceReport(ctx context.Context, year, month, employeeID int) ([]MonthlyAttendanceRow, error) {
	rows_ := []MonthlyAttendanceRow{}
	if !IsDBConnected() {
		return rows_, nil
	}

	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, -1)

	workingDays, err := GetWorkingDaysInMonth(ctx, year, month)
	if err != nil {
		return nil, err
	}

	query := `
		SELECT e.id, e.full_name, COALESCE(d.name, 'Unassigned'),
			COALESCE(att.present_days, 0), COALESCE(att.late_days, 0),
			COALESCE(att.total_late_minutes, 0), COALESCE(att.total_overtime_hours, 0),
			COALESCE(lv.leave_days, 0)
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN (
			SELECT employee_id,
				COUNT(*) FILTER (WHERE status IN ('present', 'late')) AS present_days,
				COUNT(*) FILTER (WHERE status = 'late') AS late_days,
				COALESCE(SUM(late_minutes), 0) AS total_late_minutes,
				COALESCE(SUM(overtime_hours), 0) AS total_overtime_hours
			FROM attendances
			WHERE date BETWEEN $1::date AND $2::date
			GROUP BY employee_id
		) att ON att.employee_id = e.id
		LEFT JOIN (
			SELECT employee_id,
				SUM(
					(LEAST(end_date, $2::date) - GREATEST(start_date, $1::date) + 1)
				) AS leave_days
			FROM leave_requests
			WHERE status = 'approved' AND start_date <= $2::date AND end_date >= $1::date
			GROUP BY employee_id
		) lv ON lv.employee_id = e.id
		WHERE e.employment_status = 'active'
	`
	args := []interface{}{start, end}
	if employeeID > 0 {
		query += " AND e.id = $3"
		args = append(args, employeeID)
	}
	query += " ORDER BY d.name, e.full_name"
	// Company-wide mode (employeeID == 0) previously had no upper bound at all — cost scaled
	// linearly with total active headcount. This is a report/export endpoint, not a paginated
	// list, so a hard cap (rather than page/limit) preserves the existing "one row per employee"
	// response shape while still bounding worst-case query/response size.
	const maxReportRows = 1000
	query += fmt.Sprintf(" LIMIT %d", maxReportRows)

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r MonthlyAttendanceRow
		if err := rows.Scan(&r.EmployeeID, &r.EmployeeName, &r.Department,
			&r.PresentDays, &r.LateDays, &r.TotalLateMinutes, &r.TotalOvertimeHours, &r.LeaveDays); err != nil {
			continue
		}
		r.WorkingDays = workingDays
		r.AbsentDays = workingDays - r.PresentDays - r.LeaveDays
		if r.AbsentDays < 0 {
			r.AbsentDays = 0
		}
		rows_ = append(rows_, r)
	}

	return rows_, nil
}

// GetDailyAttendanceReport returns per-day totals across all active employees for a month (for charting)
func GetDailyAttendanceReport(ctx context.Context, year, month int) ([]map[string]interface{}, error) {
	results := []map[string]interface{}{}
	if !IsDBConnected() {
		return results, nil
	}
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, -1)

	rows, err := GetDB().Query(ctx, `
		SELECT date::text,
			COUNT(*) FILTER (WHERE status = 'present') AS present,
			COUNT(*) FILTER (WHERE status = 'late') AS late
		FROM attendances
		WHERE date BETWEEN $1::date AND $2::date
		GROUP BY date
		ORDER BY date
	`, start, end)
	if err != nil {
		return nil, fmt.Errorf("failed to query daily report: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var date string
		var present, late int
		if err := rows.Scan(&date, &present, &late); err == nil {
			results = append(results, map[string]interface{}{"date": date, "present": present, "late": late})
		}
	}
	return results, nil
}
