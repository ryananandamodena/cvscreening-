package repository

import (
	"context"
	"fmt"
)

// OvertimeRequest is a raw overtime request record (status lives in the linked approval_requests row)
type OvertimeRequest struct {
	ID            int     `json:"id"`
	EmployeeID    int     `json:"employeeId"`
	EmployeeName  string  `json:"employeeName,omitempty"`
	OvertimeDate  string  `json:"overtimeDate"`
	Hours         float64 `json:"hours"`
	Reason        string  `json:"reason"`
	CreatedAt     string  `json:"createdAt"`
	ApprovalStatus string `json:"approvalStatus,omitempty"`
}

// CreateOvertimeRequest inserts the raw overtime request record
func CreateOvertimeRequest(ctx context.Context, employeeID int, overtimeDate string, hours float64, reason string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO overtime_requests (employee_id, overtime_date, hours, reason)
		VALUES ($1, $2::date, $3, $4)
		RETURNING id
	`, employeeID, overtimeDate, hours, reason).Scan(&id)
	return id, err
}

// GetOvertimeRequestByID retrieves a single overtime request
func GetOvertimeRequestByID(ctx context.Context, id int) (*OvertimeRequest, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var o OvertimeRequest
	err := GetDB().QueryRow(ctx, `
		SELECT id, employee_id, overtime_date::text, hours, reason, created_at::text
		FROM overtime_requests WHERE id = $1
	`, id).Scan(&o.ID, &o.EmployeeID, &o.OvertimeDate, &o.Hours, &o.Reason, &o.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// AddApprovedOvertimeToAttendance credits approved overtime hours onto the employee's attendance
// record for that date, creating the record if none exists yet.
func AddApprovedOvertimeToAttendance(ctx context.Context, employeeID int, date string, hours float64) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO attendances (employee_id, date, status, overtime_hours, notes)
		VALUES ($1, $2::date, 'present', $3, 'Overtime approved via Master Approval Engine')
		ON CONFLICT (employee_id, date) DO UPDATE SET
			overtime_hours = attendances.overtime_hours + $3,
			updated_at = CURRENT_TIMESTAMP
	`, employeeID, date, hours)
	return err
}

// GetMyOvertimeRequests lists overtime requests submitted by this employee, joined with their approval status
func GetMyOvertimeRequests(ctx context.Context, employeeID int) ([]OvertimeRequest, error) {
	requests := []OvertimeRequest{}
	if !IsDBConnected() {
		return requests, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT o.id, o.employee_id, o.overtime_date::text, o.hours, o.reason, o.created_at::text,
			COALESCE(ar.status, 'pending')
		FROM overtime_requests o
		LEFT JOIN approval_requests ar ON ar.module_name = 'overtime_request' AND ar.reference_id = o.id
		WHERE o.employee_id = $1
		ORDER BY o.created_at DESC
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var o OvertimeRequest
		if err := rows.Scan(&o.ID, &o.EmployeeID, &o.OvertimeDate, &o.Hours, &o.Reason, &o.CreatedAt, &o.ApprovalStatus); err == nil {
			requests = append(requests, o)
		}
	}
	return requests, nil
}
