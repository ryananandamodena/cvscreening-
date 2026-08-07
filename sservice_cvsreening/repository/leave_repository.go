package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== LEAVE REPOSITORY ====================

// GetLeaveTypes retrieves all configured leave types
func GetLeaveTypes(ctx context.Context) ([]models.LeaveType, error) {
	if !IsDBConnected() {
		return []models.LeaveType{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, name, code, max_days, is_paid, is_carry_forward, carry_forward_max,
			requires_attachment, COALESCE(gender_specific, ''), COALESCE(description, ''),
			created_at, updated_at
		FROM leave_types
		ORDER BY id ASC
	`)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	types := []models.LeaveType{}
	for rows.Next() {
		var t models.LeaveType
		err := rows.Scan(
			&t.ID, &t.Name, &t.Code, &t.MaxDays, &t.IsPaid, &t.IsCarryForward, &t.CarryForwardMax,
			&t.RequiresAttachment, &t.GenderSpecific, &t.Description,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning leave type: %v", err)
			continue
		}
		types = append(types, t)
	}

	return types, nil
}

// GetEmployeeLeaveBalances gets current year balances for an employee via the computed view
func GetEmployeeLeaveBalances(ctx context.Context, employeeID int, year int) ([]models.LeaveBalance, error) {
	if !IsDBConnected() {
		return []models.LeaveBalance{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT lb.id, lb.employee_id, lb.leave_type_id, lb.year,
			lb.total_days, lb.used_days, lb.carried_forward, lb.remaining_days,
			lb.created_at, lb.updated_at,
			lt.name, lt.code
		FROM leave_balances_view lb
		JOIN leave_types lt ON lb.leave_type_id = lt.id
		WHERE lb.employee_id = $1 AND lb.year = $2
	`, employeeID, year)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	balances := []models.LeaveBalance{}
	for rows.Next() {
		var b models.LeaveBalance
		var remaining *int
		err := rows.Scan(
			&b.ID, &b.EmployeeID, &b.LeaveTypeID, &b.Year,
			&b.TotalDays, &b.UsedDays, &b.CarriedForward, &remaining,
			&b.CreatedAt, &b.UpdatedAt,
			&b.LeaveTypeName, &b.LeaveTypeCode,
		)
		if err != nil {
			log.Printf("Error scanning leave balance: %v", err)
			continue
		}
		b.RemainingDays = remaining
		balances = append(balances, b)
	}

	return balances, nil
}

// CreateLeaveRequest submits a new leave request
func CreateLeaveRequest(ctx context.Context, req *models.LeaveRequest) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	// Validasi Konflik Cuti (Leave Conflict)
	var conflictCount int
	err := GetDB().QueryRow(ctx, `
		SELECT COUNT(*)
		FROM leave_requests lr
		JOIN employees e ON lr.employee_id = e.id
		WHERE e.department_id = (SELECT department_id FROM employees WHERE id = $1)
		AND lr.employee_id != $1
		AND lr.status IN ('pending', 'approved')
		AND (
			(lr.start_date <= $2::date AND lr.end_date >= $2::date) OR
			(lr.start_date <= $3::date AND lr.end_date >= $3::date) OR
			(lr.start_date >= $2::date AND lr.end_date <= $3::date)
		)
	`, req.EmployeeID, req.StartDate, req.EndDate).Scan(&conflictCount)

	if err != nil {
		return 0, fmt.Errorf("failed to check leave conflicts: %v", err)
	}

	if conflictCount > 0 {
		return 0, fmt.Errorf("leave conflict: %d colleague(s) in your department are already on leave during this period", conflictCount)
	}

	var id int
	err = GetDB().QueryRow(ctx, `
		INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, attachment_path, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
		RETURNING id
	`, req.EmployeeID, req.LeaveTypeID, req.StartDate, req.EndDate, req.TotalDays, req.Reason, req.AttachmentPath).Scan(&id)

	return id, err
}

// UpdateLeaveRequestStatus approves or rejects a request
func UpdateLeaveRequestStatus(ctx context.Context, reqID int, status string, approverID int, rejectionReason string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	tx, err := GetDB().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// 1. Get the leave request details
	var empID, leaveTypeID, totalDays int
	var currentStatus string
	var startDate, endDate time.Time
	err = tx.QueryRow(ctx, `
		SELECT employee_id, leave_type_id, total_days, status, start_date, end_date
		FROM leave_requests
		WHERE id = $1 FOR UPDATE
	`, reqID).Scan(&empID, &leaveTypeID, &totalDays, &currentStatus, &startDate, &endDate)

	if err != nil {
		return err
	}

	if currentStatus != "pending" && currentStatus != "approved" {
		return fmt.Errorf("leave request cannot be updated from status: %s", currentStatus)
	}

	// 2. Determine year (simplified, assumes based on current time or req start_date)
	// Hardcoded to current year for simplicity in this example
	year := time.Now().Year()

	// 3. If approving, we must update the used_days balance
	if status == "approved" && currentStatus == "pending" {
		_, err = tx.Exec(ctx, `
			UPDATE leave_balances 
			SET used_days = used_days + $1, updated_at = CURRENT_TIMESTAMP
			WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4
		`, totalDays, empID, leaveTypeID, year)
		
		if err != nil {
			return err
		}
	} else if (status == "rejected" || status == "cancelled") && currentStatus == "approved" {
		// Reverting an approval
		_, err = tx.Exec(ctx, `
			UPDATE leave_balances
			SET used_days = GREATEST(0, used_days - $1), updated_at = CURRENT_TIMESTAMP
			WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4
		`, totalDays, empID, leaveTypeID, year)

		if err != nil {
			return err
		}
	}

	// 3b. Keep attendance status in sync with leave approval, so payroll's
	// attendance-based deduction (see repository.GeneratePayroll) doesn't
	// treat an approved leave day as an unexcused absence.
	if status == "approved" && currentStatus == "pending" {
		_, err = tx.Exec(ctx, `
			INSERT INTO attendances (employee_id, date, status)
			SELECT $1, gs::date, 'leave'
			FROM generate_series($2::date, $3::date, '1 day') AS gs
			ON CONFLICT (employee_id, date) DO UPDATE SET status = 'leave'
			WHERE attendances.status IS DISTINCT FROM 'present' AND attendances.status IS DISTINCT FROM 'late'
		`, empID, startDate, endDate)
		if err != nil {
			return err
		}
	} else if (status == "rejected" || status == "cancelled") && currentStatus == "approved" {
		// Only clear days we ourselves marked as 'leave' — never touch a day that
		// was independently recorded as present/late/absent by other means.
		_, err = tx.Exec(ctx, `
			UPDATE attendances SET status = NULL
			WHERE employee_id = $1 AND date BETWEEN $2 AND $3 AND status = 'leave'
		`, empID, startDate, endDate)
		if err != nil {
			return err
		}
	}

	// 4. Update the request itself
	_, err = tx.Exec(ctx, `
		UPDATE leave_requests SET 
			status = $1, 
			approved_by = $2, 
			approved_at = CURRENT_TIMESTAMP,
			rejection_reason = $3,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $4
	`, status, approverID, rejectionReason, reqID)

	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// GetLeaveHistory returns recent leave requests for an employee
func GetLeaveHistory(ctx context.Context, employeeID int) ([]models.LeaveRequest, error) {
	if !IsDBConnected() {
		return []models.LeaveRequest{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, 
			lr.total_days, lr.reason, COALESCE(lr.attachment_path, ''), lr.status, 
			lr.approved_by, lr.approved_at, COALESCE(lr.rejection_reason, ''), 
			lr.created_at, lr.updated_at,
			e.full_name, lt.name, lt.code, COALESCE(a.full_name, '')
		FROM leave_requests lr
		JOIN employees e ON lr.employee_id = e.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		LEFT JOIN employees a ON lr.approved_by = a.id
		WHERE lr.employee_id = $1
		ORDER BY lr.created_at DESC
		LIMIT 50
	`, employeeID)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.LeaveRequest{}
	for rows.Next() {
		var r models.LeaveRequest
		var approvedBy *int
		var approvedAt *time.Time
		
		err := rows.Scan(
			&r.ID, &r.EmployeeID, &r.LeaveTypeID, &r.StartDate, &r.EndDate,
			&r.TotalDays, &r.Reason, &r.AttachmentPath, &r.Status,
			&approvedBy, &approvedAt, &r.RejectionReason,
			&r.CreatedAt, &r.UpdatedAt,
			&r.EmployeeName, &r.LeaveTypeName, &r.LeaveTypeCode, &r.ApproverName,
		)
		if err != nil {
			log.Printf("Error scanning leave request: %v", err)
			continue
		}
		
		r.ApprovedBy = approvedBy
		r.ApprovedAt = approvedAt
		requests = append(requests, r)
	}

	return requests, nil
}

// GetAllLeaveRequests returns all leave requests with optional status filter (for admin/manager)
func GetAllLeaveRequests(ctx context.Context, status string) ([]models.LeaveRequest, error) {
	if !IsDBConnected() {
		return []models.LeaveRequest{}, nil
	}

	query := `
		SELECT lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, 
			lr.total_days, lr.reason, COALESCE(lr.attachment_path, ''), lr.status, 
			lr.approved_by, lr.approved_at, COALESCE(lr.rejection_reason, ''), 
			lr.created_at, lr.updated_at,
			e.full_name, lt.name, lt.code, COALESCE(a.full_name, '')
		FROM leave_requests lr
		JOIN employees e ON lr.employee_id = e.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		LEFT JOIN employees a ON lr.approved_by = a.id
	`
	
	var rows interface{ Close() }
	var err error
	
	if status != "" {
		query += " WHERE lr.status = $1 ORDER BY lr.created_at DESC LIMIT 100"
		rows, err = GetDB().Query(ctx, query, status)
	} else {
		query += " ORDER BY lr.created_at DESC LIMIT 100"
		rows, err = GetDB().Query(ctx, query)
	}
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.LeaveRequest{}
	for rows.(interface{ Next() bool }).Next() {
		var r models.LeaveRequest
		var approvedBy *int
		var approvedAt *time.Time
		
		err := rows.(interface {
			Scan(dest ...interface{}) error
		}).Scan(
			&r.ID, &r.EmployeeID, &r.LeaveTypeID, &r.StartDate, &r.EndDate,
			&r.TotalDays, &r.Reason, &r.AttachmentPath, &r.Status,
			&approvedBy, &approvedAt, &r.RejectionReason,
			&r.CreatedAt, &r.UpdatedAt,
			&r.EmployeeName, &r.LeaveTypeName, &r.LeaveTypeCode, &r.ApproverName,
		)
		if err != nil {
			log.Printf("Error scanning leave request: %v", err)
			continue
		}
		
		r.ApprovedBy = approvedBy
		r.ApprovedAt = approvedAt
		requests = append(requests, r)
	}

	return requests, nil
}

// GetLeaveRequestByID retrieves a single leave request by ID
func GetLeaveRequestByID(ctx context.Context, requestID int) (*models.LeaveRequest, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var r models.LeaveRequest
	var approvedBy *int
	var approvedAt *time.Time
	
	err := GetDB().QueryRow(ctx, `
		SELECT lr.id, lr.employee_id, lr.leave_type_id, lr.start_date, lr.end_date, 
			lr.total_days, lr.reason, COALESCE(lr.attachment_path, ''), lr.status, 
			lr.approved_by, lr.approved_at, COALESCE(lr.rejection_reason, ''), 
			lr.created_at, lr.updated_at,
			e.full_name, lt.name, lt.code, COALESCE(a.full_name, '')
		FROM leave_requests lr
		JOIN employees e ON lr.employee_id = e.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		LEFT JOIN employees a ON lr.approved_by = a.id
		WHERE lr.id = $1
	`, requestID).Scan(
		&r.ID, &r.EmployeeID, &r.LeaveTypeID, &r.StartDate, &r.EndDate,
		&r.TotalDays, &r.Reason, &r.AttachmentPath, &r.Status,
		&approvedBy, &approvedAt, &r.RejectionReason,
		&r.CreatedAt, &r.UpdatedAt,
		&r.EmployeeName, &r.LeaveTypeName, &r.LeaveTypeCode, &r.ApproverName,
	)
	
	if err != nil {
		return nil, err
	}
	
	r.ApprovedBy = approvedBy
	r.ApprovedAt = approvedAt
	
	return &r, nil
}

// GetHolidays retrieves holidays for a specific year
func GetHolidays(ctx context.Context, year int) ([]models.Holiday, error) {
	if !IsDBConnected() {
		return []models.Holiday{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, name, date, COALESCE(type, ''), year, created_at, updated_at
		FROM holidays
		WHERE year = $1
		ORDER BY date ASC
	`, year)
	
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	holidays := []models.Holiday{}
	for rows.Next() {
		var h models.Holiday
		err := rows.Scan(
			&h.ID, &h.Name, &h.Date, &h.Type, &h.Year, &h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning holiday: %v", err)
			continue
		}
		holidays = append(holidays, h)
	}

	return holidays, nil
}

// InitializeLeaveBalances creates leave balance records for a new employee
func InitializeLeaveBalances(ctx context.Context, employeeID int, year int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	// Get all leave types and create balances
	_, err := GetDB().Exec(ctx, `
		INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days, carried_forward)
		SELECT $1, id, $2, max_days, 0, 0
		FROM leave_types
		ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING
	`, employeeID, year)

	return err
}
