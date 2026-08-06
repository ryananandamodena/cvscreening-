package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateAttendanceCorrection inserts a new correction request
func CreateAttendanceCorrection(ctx context.Context, c *models.AttendanceCorrection) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO attendance_corrections
			(employee_id, attendance_date, correction_type, requested_clock_in, requested_clock_out, reason, evidence_url, notes, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'submitted')
		RETURNING id
	`, c.EmployeeID, c.AttendanceDate, c.CorrectionType, c.RequestedClockIn, c.RequestedClockOut, c.Reason, c.EvidenceURL, c.Notes).Scan(&id)
	return id, err
}

// GetAttendanceCorrectionByID retrieves a single correction request
func GetAttendanceCorrectionByID(ctx context.Context, id int) (*models.AttendanceCorrection, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var c models.AttendanceCorrection
	err := GetDB().QueryRow(ctx, `
		SELECT ac.id, ac.employee_id, ac.attendance_date, ac.correction_type,
			ac.requested_clock_in::text, ac.requested_clock_out::text, ac.reason, COALESCE(ac.evidence_url, ''), COALESCE(ac.notes, ''),
			ac.status, ac.manager_id, COALESCE(ac.manager_comment, ''), ac.manager_decided_at,
			ac.hr_id, COALESCE(ac.hr_comment, ''), ac.hr_decided_at,
			ac.created_at, ac.updated_at, e.full_name
		FROM attendance_corrections ac
		JOIN employees e ON ac.employee_id = e.id
		WHERE ac.id = $1
	`, id).Scan(
		&c.ID, &c.EmployeeID, &c.AttendanceDate, &c.CorrectionType,
		&c.RequestedClockIn, &c.RequestedClockOut, &c.Reason, &c.EvidenceURL, &c.Notes,
		&c.Status, &c.ManagerID, &c.ManagerComment, &c.ManagerDecidedAt,
		&c.HRID, &c.HRComment, &c.HRDecidedAt,
		&c.CreatedAt, &c.UpdatedAt, &c.EmployeeName,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// CorrectionFilter narrows down the correction list query
type CorrectionFilter struct {
	EmployeeID int
	Status     string
	// PendingManagerFor restricts to corrections awaiting manager review for employees managed by this employee ID
	PendingManagerFor int
	// PendingHR restricts to corrections awaiting HR review (manager already approved)
	PendingHR bool
}

// GetAttendanceCorrections lists correction requests with optional filters
func GetAttendanceCorrections(ctx context.Context, filter CorrectionFilter) ([]models.AttendanceCorrection, error) {
	corrections := []models.AttendanceCorrection{}
	if !IsDBConnected() {
		return corrections, nil
	}

	query := `
		SELECT ac.id, ac.employee_id, ac.attendance_date, ac.correction_type,
			ac.requested_clock_in::text, ac.requested_clock_out::text, ac.reason, COALESCE(ac.evidence_url, ''), COALESCE(ac.notes, ''),
			ac.status, ac.manager_id, COALESCE(ac.manager_comment, ''), ac.manager_decided_at,
			ac.hr_id, COALESCE(ac.hr_comment, ''), ac.hr_decided_at,
			ac.created_at, ac.updated_at, e.full_name
		FROM attendance_corrections ac
		JOIN employees e ON ac.employee_id = e.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if filter.EmployeeID > 0 {
		query += fmt.Sprintf(" AND ac.employee_id = $%d", argIdx)
		args = append(args, filter.EmployeeID)
		argIdx++
	}
	if filter.Status != "" {
		query += fmt.Sprintf(" AND ac.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.PendingManagerFor > 0 {
		query += fmt.Sprintf(" AND ac.status = 'submitted' AND e.manager_id = $%d", argIdx)
		args = append(args, filter.PendingManagerFor)
		argIdx++
	}
	if filter.PendingHR {
		query += " AND ac.status = 'manager_approved'"
	}

	query += " ORDER BY ac.created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c models.AttendanceCorrection
		if err := rows.Scan(
			&c.ID, &c.EmployeeID, &c.AttendanceDate, &c.CorrectionType,
			&c.RequestedClockIn, &c.RequestedClockOut, &c.Reason, &c.EvidenceURL, &c.Notes,
			&c.Status, &c.ManagerID, &c.ManagerComment, &c.ManagerDecidedAt,
			&c.HRID, &c.HRComment, &c.HRDecidedAt,
			&c.CreatedAt, &c.UpdatedAt, &c.EmployeeName,
		); err == nil {
			corrections = append(corrections, c)
		}
	}
	return corrections, nil
}

// ManagerReviewCorrection records the manager's decision
func ManagerReviewCorrection(ctx context.Context, id, managerEmployeeID int, approve bool, comment string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	newStatus := "rejected_by_manager"
	if approve {
		newStatus = "manager_approved"
	}
	tag, err := GetDB().Exec(ctx, `
		UPDATE attendance_corrections
		SET status = $1, manager_id = $2, manager_comment = $3, manager_decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND status = 'submitted'
	`, newStatus, managerEmployeeID, comment, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("correction not found or not pending manager review")
	}
	return nil
}

// HRReviewCorrection records HR's final decision
func HRReviewCorrection(ctx context.Context, id, hrEmployeeID int, approve bool, comment string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	newStatus := "rejected_by_hr"
	if approve {
		newStatus = "hr_approved"
	}
	tag, err := GetDB().Exec(ctx, `
		UPDATE attendance_corrections
		SET status = $1, hr_id = $2, hr_comment = $3, hr_decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND status = 'manager_approved'
	`, newStatus, hrEmployeeID, comment, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("correction not found or not pending HR review")
	}
	return nil
}

// CancelCorrection lets an employee withdraw their own pending request
func CancelCorrection(ctx context.Context, id, employeeID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	tag, err := GetDB().Exec(ctx, `
		UPDATE attendance_corrections
		SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND employee_id = $2 AND status IN ('submitted', 'manager_approved')
	`, id, employeeID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("correction not found or cannot be cancelled")
	}
	return nil
}

// ApplyCorrectionToAttendance upserts the attendance record with the corrected times.
// Late/early/overtime recalculation is passed in already-computed (caller resolves shift logic).
func ApplyCorrectionToAttendance(ctx context.Context, employeeID int, date interface{}, clockIn, clockOut *string, status string, lateMinutes, earlyLeaveMinutes int, overtimeHours float64) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO attendances (employee_id, date, clock_in, clock_out, status, late_minutes, early_leave_minutes, overtime_hours, notes)
		VALUES ($1, $2,
			CASE WHEN $3::text IS NULL THEN NULL ELSE ($2::date + $3::time)::timestamp END,
			CASE WHEN $4::text IS NULL THEN NULL ELSE ($2::date + $4::time)::timestamp END,
			$5, $6, $7, $8, 'Updated via approved attendance correction')
		ON CONFLICT (employee_id, date) DO UPDATE SET
			clock_in = CASE WHEN $3::text IS NULL THEN attendances.clock_in ELSE ($2::date + $3::time)::timestamp END,
			clock_out = CASE WHEN $4::text IS NULL THEN attendances.clock_out ELSE ($2::date + $4::time)::timestamp END,
			status = $5,
			late_minutes = $6,
			early_leave_minutes = $7,
			overtime_hours = $8,
			notes = 'Updated via approved attendance correction',
			updated_at = CURRENT_TIMESTAMP
	`, employeeID, date, clockIn, clockOut, status, lateMinutes, earlyLeaveMinutes, overtimeHours)
	return err
}
