package repository

import (
	"context"
	"fmt"
	"time"
)

// AttendanceBreak represents one break period within a day's attendance
type AttendanceBreak struct {
	ID           int        `json:"id"`
	AttendanceID int        `json:"attendanceId"`
	BreakStart   time.Time  `json:"breakStart"`
	BreakEnd     *time.Time `json:"breakEnd,omitempty"`
}

// StartBreak begins a break for the employee's attendance record today.
// Fails if the employee hasn't clocked in, already clocked out, or has an unfinished break.
func StartBreak(ctx context.Context, employeeID int) (*AttendanceBreak, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var attendanceID int
	var clockOut *time.Time
	err := GetDB().QueryRow(ctx, `
		SELECT id, clock_out FROM attendances WHERE employee_id = $1 AND date = CURRENT_DATE
	`, employeeID).Scan(&attendanceID, &clockOut)
	if err != nil {
		return nil, fmt.Errorf("belum clock in hari ini")
	}
	if clockOut != nil {
		return nil, fmt.Errorf("sudah clock out, tidak bisa memulai istirahat")
	}

	var openBreakID int
	err = GetDB().QueryRow(ctx, `
		SELECT id FROM attendance_breaks WHERE attendance_id = $1 AND break_end IS NULL
	`, attendanceID).Scan(&openBreakID)
	if err == nil {
		return nil, fmt.Errorf("sudah ada istirahat yang belum diakhiri")
	}

	var b AttendanceBreak
	b.AttendanceID = attendanceID
	err = GetDB().QueryRow(ctx, `
		INSERT INTO attendance_breaks (attendance_id, break_start)
		VALUES ($1, CURRENT_TIMESTAMP)
		RETURNING id, break_start
	`, attendanceID).Scan(&b.ID, &b.BreakStart)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// EndBreak closes the employee's currently open break and adds its duration to the daily total.
func EndBreak(ctx context.Context, employeeID int) (*AttendanceBreak, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var attendanceID int
	err := GetDB().QueryRow(ctx, `
		SELECT id FROM attendances WHERE employee_id = $1 AND date = CURRENT_DATE
	`, employeeID).Scan(&attendanceID)
	if err != nil {
		return nil, fmt.Errorf("belum clock in hari ini")
	}

	var b AttendanceBreak
	b.AttendanceID = attendanceID
	err = GetDB().QueryRow(ctx, `
		UPDATE attendance_breaks
		SET break_end = CURRENT_TIMESTAMP
		WHERE attendance_id = $1 AND break_end IS NULL
		RETURNING id, break_start, break_end
	`, attendanceID).Scan(&b.ID, &b.BreakStart, &b.BreakEnd)
	if err != nil {
		return nil, fmt.Errorf("tidak ada istirahat yang sedang berlangsung")
	}

	durationMinutes := int(b.BreakEnd.Sub(b.BreakStart).Minutes())
	_, err = GetDB().Exec(ctx, `
		UPDATE attendances SET break_minutes = break_minutes + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, durationMinutes, attendanceID)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

// GetTodayBreaks lists all break periods for the employee's attendance today
func GetTodayBreaks(ctx context.Context, employeeID int) ([]AttendanceBreak, error) {
	breaks := []AttendanceBreak{}
	if !IsDBConnected() {
		return breaks, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT ab.id, ab.attendance_id, ab.break_start, ab.break_end
		FROM attendance_breaks ab
		JOIN attendances a ON ab.attendance_id = a.id
		WHERE a.employee_id = $1 AND a.date = CURRENT_DATE
		ORDER BY ab.break_start
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var b AttendanceBreak
		if err := rows.Scan(&b.ID, &b.AttendanceID, &b.BreakStart, &b.BreakEnd); err == nil {
			breaks = append(breaks, b)
		}
	}
	return breaks, nil
}
