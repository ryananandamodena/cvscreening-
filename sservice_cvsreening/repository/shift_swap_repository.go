package repository

import (
	"context"
	"fmt"
)

// ShiftSwapRequest is a raw shift swap request record (approval status lives in the linked
// approval_requests row, joined in below — same pattern as OvertimeRequest).
type ShiftSwapRequest struct {
	ID                 int    `json:"id"`
	RequesterEmployeeID int   `json:"requesterEmployeeId"`
	RequesterShiftID   *int   `json:"requesterShiftId,omitempty"`
	TargetEmployeeID   int    `json:"targetEmployeeId"`
	TargetEmployeeName string `json:"targetEmployeeName,omitempty"`
	SwapDate           string `json:"swapDate"`
	Reason             string `json:"reason"`
	Status             string `json:"status"`
	CreatedAt          string `json:"createdAt"`
	ApprovalStatus     string `json:"approvalStatus,omitempty"`
}

// CreateShiftSwapRequest inserts the raw shift swap request record.
func CreateShiftSwapRequest(ctx context.Context, requesterEmployeeID int, requesterShiftID *int, targetEmployeeID int, swapDate, reason string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO shift_swap_requests (requester_employee_id, requester_shift_id, target_employee_id, swap_date, reason)
		VALUES ($1, $2, $3, $4::date, $5)
		RETURNING id
	`, requesterEmployeeID, requesterShiftID, targetEmployeeID, swapDate, reason).Scan(&id)
	return id, err
}

// GetShiftSwapRequestByID retrieves a single shift swap request.
func GetShiftSwapRequestByID(ctx context.Context, id int) (*ShiftSwapRequest, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var s ShiftSwapRequest
	err := GetDB().QueryRow(ctx, `
		SELECT id, requester_employee_id, requester_shift_id, target_employee_id, swap_date::text, reason, status, created_at::text
		FROM shift_swap_requests WHERE id = $1
	`, id).Scan(&s.ID, &s.RequesterEmployeeID, &s.RequesterShiftID, &s.TargetEmployeeID, &s.SwapDate, &s.Reason, &s.Status, &s.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// UpdateShiftSwapStatus is the module-specific finalization hook the approval engine calls once
// a shift swap request is approved/rejected (see finalizeApprovedRequest in
// approval_engine_handlers.go). It only updates this module's own status — it deliberately does
// NOT touch shift_assignments; actually moving the shift between the two employees once approved
// is a follow-up (flagged, not silently assumed done).
func UpdateShiftSwapStatus(ctx context.Context, id int, status string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE shift_swap_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, status, id)
	return err
}

// GetMyShiftSwapRequests lists shift swap requests submitted by this employee, joined with
// their approval status and the target employee's name.
func GetMyShiftSwapRequests(ctx context.Context, employeeID int) ([]ShiftSwapRequest, error) {
	requests := []ShiftSwapRequest{}
	if !IsDBConnected() {
		return requests, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT s.id, s.requester_employee_id, s.requester_shift_id, s.target_employee_id,
			COALESCE(e.full_name, ''), s.swap_date::text, s.reason, s.status, s.created_at::text,
			COALESCE(ar.status, 'pending')
		FROM shift_swap_requests s
		JOIN employees e ON e.id = s.target_employee_id
		LEFT JOIN approval_requests ar ON ar.module_name = 'shift_swap_request' AND ar.reference_id = s.id
		WHERE s.requester_employee_id = $1
		ORDER BY s.created_at DESC
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var s ShiftSwapRequest
		if err := rows.Scan(&s.ID, &s.RequesterEmployeeID, &s.RequesterShiftID, &s.TargetEmployeeID,
			&s.TargetEmployeeName, &s.SwapDate, &s.Reason, &s.Status, &s.CreatedAt, &s.ApprovalStatus); err == nil {
			requests = append(requests, s)
		}
	}
	return requests, nil
}