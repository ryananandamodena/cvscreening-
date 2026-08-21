package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== ATTENDANCE REPOSITORY ====================

// RecordClockIn records a new clock in for an employee
func RecordClockIn(ctx context.Context, att *models.Attendance) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var existingClockIn *time.Time
	err := GetDB().QueryRow(ctx, `
		SELECT clock_in FROM attendances WHERE employee_id = $1 AND date = $2
	`, att.EmployeeID, att.Date).Scan(&existingClockIn)
	if err != nil && err.Error() != "no rows in result set" {
		return 0, err
	}
	if existingClockIn != nil {
		return 0, fmt.Errorf("already clocked in today")
	}

	var id int
	err = GetDB().QueryRow(ctx, `
		INSERT INTO attendances (employee_id, date, clock_in, clock_in_location, clock_in_photo, status, late_minutes)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (employee_id, date) DO UPDATE SET
			clock_in = EXCLUDED.clock_in,
			clock_in_location = EXCLUDED.clock_in_location,
			clock_in_photo = EXCLUDED.clock_in_photo,
			status = EXCLUDED.status,
			late_minutes = EXCLUDED.late_minutes,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`, att.EmployeeID, att.Date, att.ClockIn, att.ClockInLocation, att.ClockInPhoto, att.Status, att.LateMinutes).Scan(&id)

	return id, err
}

// RecordClockOut updates an existing attendance record with clock out time
func RecordClockOut(ctx context.Context, att *models.Attendance) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	// Update existing record
	_, err := GetDB().Exec(ctx, `
		UPDATE attendances SET
			clock_out = $1,
			clock_out_location = $2,
			clock_out_photo = $3,
			notes = CASE WHEN $4 != '' THEN $4 ELSE notes END,
			early_leave_minutes = $5,
			overtime_hours = $6,
			updated_at = CURRENT_TIMESTAMP
		WHERE employee_id = $7 AND date = $8
	`, att.ClockOut, att.ClockOutLocation, att.ClockOutPhoto, att.Notes, att.EarlyLeaveMinutes, att.OvertimeHours, att.EmployeeID, att.Date)

	return err
}

// GetAttendanceHistory retrieves attendance history for an employee within a date range
func GetAttendanceHistory(ctx context.Context, employeeID int, startDate, endDate time.Time) ([]models.Attendance, error) {
	if !IsDBConnected() {
		return []models.Attendance{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT a.id, a.employee_id, a.date, a.clock_in, a.clock_out,
			COALESCE(a.clock_in_location, '{}'::jsonb), COALESCE(a.clock_out_location, '{}'::jsonb),
			COALESCE(a.clock_in_photo, ''), COALESCE(a.clock_out_photo, ''),
			a.status, a.overtime_hours, COALESCE(a.late_minutes, 0), COALESCE(a.early_leave_minutes, 0),
			COALESCE(a.break_minutes, 0),
			COALESCE(a.notes, ''), a.approved_overtime,
			a.created_at, a.updated_at,
			e.full_name
		FROM attendances a
		JOIN employees e ON a.employee_id = e.id
		WHERE a.employee_id = $1 AND a.date >= $2 AND a.date <= $3
		ORDER BY a.date DESC
	`, employeeID, startDate, endDate)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	records := []models.Attendance{}
	for rows.Next() {
		var a models.Attendance
		// We'll scan into vars first since some pointers might be null
		var clockIn, clockOut *time.Time
		err := rows.Scan(
			&a.ID, &a.EmployeeID, &a.Date, &clockIn, &clockOut,
			&a.ClockInLocation, &a.ClockOutLocation, &a.ClockInPhoto, &a.ClockOutPhoto,
			&a.Status, &a.OvertimeHours, &a.LateMinutes, &a.EarlyLeaveMinutes,
			&a.BreakMinutes,
			&a.Notes, &a.ApprovedOvertime,
			&a.CreatedAt, &a.UpdatedAt, &a.EmployeeName,
		)
		if err != nil {
			log.Printf("Error scanning attendance: %v", err)
			continue
		}
		a.ClockIn = clockIn
		a.ClockOut = clockOut
		records = append(records, a)
	}

	return records, nil
}

// GetTodayAttendance gets today's record for a specific employee
func GetTodayAttendance(ctx context.Context, employeeID int) (*models.Attendance, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	today := time.Now().Format("2006-01-02")
	var a models.Attendance
	var clockIn, clockOut *time.Time
	
	err := GetDB().QueryRow(ctx, `
		SELECT id, employee_id, date, clock_in, clock_out,
			COALESCE(clock_in_location, '{}'::jsonb), COALESCE(clock_out_location, '{}'::jsonb),
			COALESCE(clock_in_photo, ''), COALESCE(clock_out_photo, ''),
			status, overtime_hours, COALESCE(late_minutes, 0), COALESCE(early_leave_minutes, 0),
			COALESCE(break_minutes, 0),
			COALESCE(notes, ''), approved_overtime,
			created_at, updated_at
		FROM attendances
		WHERE employee_id = $1 AND date = $2
	`, employeeID, today).Scan(
		&a.ID, &a.EmployeeID, &a.Date, &clockIn, &clockOut,
		&a.ClockInLocation, &a.ClockOutLocation, &a.ClockInPhoto, &a.ClockOutPhoto,
		&a.Status, &a.OvertimeHours, &a.LateMinutes, &a.EarlyLeaveMinutes,
		&a.BreakMinutes,
		&a.Notes, &a.ApprovedOvertime,
		&a.CreatedAt, &a.UpdatedAt,
	)

	if err != nil {
		// If no rows, we return nil without error (meaning not clocked in yet)
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, err
	}

	a.ClockIn = clockIn
	a.ClockOut = clockOut
	return &a, nil
}

// ==================== SHIFT REPOSITORY ====================

// GetShifts retrieves all available shifts
func GetShifts(ctx context.Context) ([]models.Shift, error) {
	if !IsDBConnected() {
		return []models.Shift{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, name, start_time::text, end_time::text, 
			break_start::text, break_end::text, 
			is_night_shift, tolerance_minutes, created_at, updated_at
		FROM shifts
		ORDER BY start_time ASC
	`)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	shifts := []models.Shift{}
	for rows.Next() {
		var s models.Shift
		// Scan nullable times
		var breakStart, breakEnd *string
		err := rows.Scan(
			&s.ID, &s.Name, &s.StartTime, &s.EndTime,
			&breakStart, &breakEnd,
			&s.IsNightShift, &s.ToleranceMinutes, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning shift: %v", err)
			continue
		}
		if breakStart != nil { s.BreakStart = *breakStart }
		if breakEnd != nil { s.BreakEnd = *breakEnd }
		shifts = append(shifts, s)
	}

	return shifts, nil
}

// GetEmployeeShift retrieves the active shift for an employee on a specific date
func GetEmployeeShift(ctx context.Context, employeeID int, targetDate time.Time) (*models.Shift, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var s models.Shift
	var breakStart, breakEnd *string
	
	err := GetDB().QueryRow(ctx, `
		SELECT s.id, s.name, s.start_time::text, s.end_time::text, 
			s.break_start::text, s.break_end::text, 
			s.is_night_shift, s.tolerance_minutes
		FROM employee_shifts es
		JOIN shifts s ON es.shift_id = s.id
		WHERE es.employee_id = $1 
		  AND es.effective_date <= $2 
		  AND (es.end_date IS NULL OR es.end_date >= $2)
		ORDER BY es.effective_date DESC
		LIMIT 1
	`, employeeID, targetDate.Format("2006-01-02")).Scan(
		&s.ID, &s.Name, &s.StartTime, &s.EndTime,
		&breakStart, &breakEnd,
		&s.IsNightShift, &s.ToleranceMinutes,
	)

	if err != nil {
		return nil, err
	}
	
	if breakStart != nil { s.BreakStart = *breakStart }
	if breakEnd != nil { s.BreakEnd = *breakEnd }

	return &s, nil
}

// CreateShift creates a new shift definition
func CreateShift(ctx context.Context, s *models.Shift) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO shifts (name, start_time, end_time, break_start, break_end, is_night_shift, tolerance_minutes)
		VALUES ($1, $2::time, $3::time, 
			CASE WHEN $4 = '' THEN NULL ELSE $4::time END,
			CASE WHEN $5 = '' THEN NULL ELSE $5::time END,
			$6, $7)
		RETURNING id
	`, s.Name, s.StartTime, s.EndTime, s.BreakStart, s.BreakEnd, s.IsNightShift, s.ToleranceMinutes).Scan(&id)

	return id, err
}

// UpdateShift updates an existing shift
func UpdateShift(ctx context.Context, id int, s *models.Shift) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE shifts SET
			name = $1,
			start_time = $2::time,
			end_time = $3::time,
			break_start = CASE WHEN $4 = '' THEN NULL ELSE $4::time END,
			break_end = CASE WHEN $5 = '' THEN NULL ELSE $5::time END,
			is_night_shift = $6,
			tolerance_minutes = $7,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $8
	`, s.Name, s.StartTime, s.EndTime, s.BreakStart, s.BreakEnd, s.IsNightShift, s.ToleranceMinutes, id)

	return err
}

// DeleteShift deletes a shift by ID
func DeleteShift(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `DELETE FROM shifts WHERE id = $1`, id)
	return err
}

// AssignShiftToEmployee assigns a shift to an employee with an effective date
func AssignShiftToEmployee(ctx context.Context, es *models.EmployeeShift) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_shifts (employee_id, shift_id, effective_date, end_date)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, es.EmployeeID, es.ShiftID, es.EffectiveDate, es.EndDate).Scan(&id)

	return id, err
}

// GetEmployeeShiftAssignments retrieves shift assignments, paginated. Previously this ran an
// unfiltered, unpaginated 3-table join and returned every row ever inserted — cost grew linearly
// (unbounded) with total headcount x shift history. page/limit follow the same convention as
// GetEmployees (repository/employee_repository.go): 1-indexed page, LIMIT/OFFSET, capped limit.
func GetEmployeeShiftAssignments(ctx context.Context, page, limit int) ([]models.EmployeeShiftView, int64, error) {
	if !IsDBConnected() {
		return []models.EmployeeShiftView{}, 0, nil
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100 // hard cap regardless of what the caller asks for
	}
	offset := (page - 1) * limit

	var total int64
	err := GetDB().QueryRow(ctx, `SELECT COUNT(*) FROM employee_shifts`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := GetDB().Query(ctx, `
		SELECT es.id, es.employee_id, es.shift_id, es.effective_date, es.end_date,
			e.full_name AS employee_name, s.name AS shift_name,
			s.start_time::text, s.end_time::text
		FROM employee_shifts es
		JOIN employees e ON es.employee_id = e.id
		JOIN shifts s ON es.shift_id = s.id
		ORDER BY es.effective_date DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	assignments := []models.EmployeeShiftView{}
	for rows.Next() {
		var a models.EmployeeShiftView
		err := rows.Scan(
			&a.ID, &a.EmployeeID, &a.ShiftID, &a.EffectiveDate, &a.EndDate,
			&a.EmployeeName, &a.ShiftName,
			&a.ShiftStartTime, &a.ShiftEndTime,
		)
		if err != nil {
			log.Printf("Error scanning employee shift assignment: %v", err)
			continue
		}
		assignments = append(assignments, a)
	}

	return assignments, total, nil
}

// RemoveEmployeeShiftAssignment removes a shift assignment
func RemoveEmployeeShiftAssignment(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `DELETE FROM employee_shifts WHERE id = $1`, id)
	return err
}
