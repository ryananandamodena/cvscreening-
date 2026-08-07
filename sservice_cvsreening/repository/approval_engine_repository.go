package repository

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== APPROVAL FLOW CONFIGURATION ====================

// CreateApprovalFlow inserts a flow with its ordered levels
func CreateApprovalFlow(ctx context.Context, flow *models.ApprovalFlow) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var flowID int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO approval_flows (module_name, flow_name, department_id, employment_type, is_active, effective_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, flow.ModuleName, flow.FlowName, flow.DepartmentID, flow.EmploymentType, flow.IsActive, flow.EffectiveDate).Scan(&flowID)
	if err != nil {
		return 0, err
	}

	for _, lvl := range flow.Levels {
		_, err := GetDB().Exec(ctx, `
			INSERT INTO approval_flow_levels (flow_id, level_order, level_name, approver_type, approver_role, approver_employee_id)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, flowID, lvl.LevelOrder, lvl.LevelName, lvl.ApproverType, lvl.ApproverRole, lvl.ApproverEmployeeID)
		if err != nil {
			return flowID, fmt.Errorf("flow created but failed to insert level %d: %w", lvl.LevelOrder, err)
		}
	}
	return flowID, nil
}

// GetApprovalFlows lists flows, optionally filtered by module
func GetApprovalFlows(ctx context.Context, moduleName string) ([]models.ApprovalFlow, error) {
	flows := []models.ApprovalFlow{}
	if !IsDBConnected() {
		return flows, nil
	}

	query := `SELECT id, module_name, flow_name, department_id, COALESCE(employment_type, ''), is_active, effective_date, created_at, updated_at FROM approval_flows WHERE 1=1`
	args := []interface{}{}
	if moduleName != "" {
		query += " AND module_name = $1"
		args = append(args, moduleName)
	}
	query += " ORDER BY module_name, created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var f models.ApprovalFlow
		if err := rows.Scan(&f.ID, &f.ModuleName, &f.FlowName, &f.DepartmentID, &f.EmploymentType,
			&f.IsActive, &f.EffectiveDate, &f.CreatedAt, &f.UpdatedAt); err == nil {
			f.Levels, _ = GetApprovalFlowLevels(ctx, f.ID)
			flows = append(flows, f)
		}
	}
	return flows, nil
}

// GetApprovalFlowLevels returns the ordered levels for a flow
func GetApprovalFlowLevels(ctx context.Context, flowID int) ([]models.ApprovalFlowLevel, error) {
	levels := []models.ApprovalFlowLevel{}
	if !IsDBConnected() {
		return levels, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT afl.id, afl.flow_id, afl.level_order, afl.level_name, afl.approver_type,
			COALESCE(afl.approver_role, ''), afl.approver_employee_id, COALESCE(e.full_name, '')
		FROM approval_flow_levels afl
		LEFT JOIN employees e ON afl.approver_employee_id = e.id
		WHERE afl.flow_id = $1
		ORDER BY afl.level_order
	`, flowID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var l models.ApprovalFlowLevel
		if err := rows.Scan(&l.ID, &l.FlowID, &l.LevelOrder, &l.LevelName, &l.ApproverType,
			&l.ApproverRole, &l.ApproverEmployeeID, &l.ApproverEmployeeName); err == nil {
			levels = append(levels, l)
		}
	}
	return levels, nil
}

// GetActiveApprovalFlow returns the currently active flow for a module
func GetActiveApprovalFlow(ctx context.Context, moduleName string) (*models.ApprovalFlow, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var f models.ApprovalFlow
	err := GetDB().QueryRow(ctx, `
		SELECT id, module_name, flow_name, department_id, COALESCE(employment_type, ''), is_active, effective_date, created_at, updated_at
		FROM approval_flows
		WHERE module_name = $1 AND is_active = true AND effective_date <= CURRENT_DATE
		ORDER BY effective_date DESC LIMIT 1
	`, moduleName).Scan(&f.ID, &f.ModuleName, &f.FlowName, &f.DepartmentID, &f.EmploymentType,
		&f.IsActive, &f.EffectiveDate, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	f.Levels, err = GetApprovalFlowLevels(ctx, f.ID)
	if err != nil {
		return nil, err
	}
	if len(f.Levels) == 0 {
		return nil, fmt.Errorf("active flow for module %s has no levels configured", moduleName)
	}
	return &f, nil
}

// SetApprovalFlowActive toggles a flow's active status
func SetApprovalFlowActive(ctx context.Context, id int, active bool) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `UPDATE approval_flows SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, active, id)
	return err
}

// DeleteApprovalFlow removes a flow definition (and its levels, via cascade)
func DeleteApprovalFlow(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM approval_flows WHERE id = $1`, id)
	return err
}

// ==================== APPROVAL REQUESTS ====================

// SubmitApprovalRequest creates a new approval request at level 1 for the module's active flow.
// Any module (attendance correction, overtime, leave, etc.) calls this the same way.
func SubmitApprovalRequest(ctx context.Context, moduleName string, referenceID, requesterEmployeeID int, summary string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	flow, err := GetActiveApprovalFlow(ctx, moduleName)
	if err != nil {
		return 0, fmt.Errorf("no active approval flow configured for module %s: %w", moduleName, err)
	}

	var id int
	err = GetDB().QueryRow(ctx, `
		INSERT INTO approval_requests (module_name, reference_id, flow_id, requester_employee_id, current_level, status, summary)
		VALUES ($1, $2, $3, $4, 1, 'pending', $5)
		RETURNING id
	`, moduleName, referenceID, flow.ID, requesterEmployeeID, summary).Scan(&id)
	return id, err
}

// GetApprovalRequestByID retrieves a single request with its flow levels and history
func GetApprovalRequestByID(ctx context.Context, id int) (*models.ApprovalRequest, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var r models.ApprovalRequest
	err := GetDB().QueryRow(ctx, `
		SELECT ar.id, ar.module_name, ar.reference_id, ar.flow_id, ar.requester_employee_id, ar.current_level,
			ar.status, ar.summary, ar.override_approver_employee_id, ar.created_at, ar.updated_at, e.full_name
		FROM approval_requests ar
		JOIN employees e ON ar.requester_employee_id = e.id
		WHERE ar.id = $1
	`, id).Scan(&r.ID, &r.ModuleName, &r.ReferenceID, &r.FlowID, &r.RequesterEmployeeID, &r.CurrentLevel,
		&r.Status, &r.Summary, &r.OverrideApproverEmployeeID, &r.CreatedAt, &r.UpdatedAt, &r.RequesterEmployeeName)
	if err != nil {
		return nil, err
	}
	r.Levels, _ = GetApprovalFlowLevels(ctx, r.FlowID)
	r.History, _ = GetApprovalHistory(ctx, id)
	return &r, nil
}

// GetApprovalHistory returns the immutable action log for a request
func GetApprovalHistory(ctx context.Context, requestID int) ([]models.ApprovalHistoryEntry, error) {
	history := []models.ApprovalHistoryEntry{}
	if !IsDBConnected() {
		return history, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT h.id, h.request_id, h.level_order, h.actor_employee_id, e.full_name, h.action, h.comment, h.delegated_to_employee_id, h.created_at
		FROM approval_history h
		JOIN employees e ON h.actor_employee_id = e.id
		WHERE h.request_id = $1
		ORDER BY h.created_at
	`, requestID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var h models.ApprovalHistoryEntry
		if err := rows.Scan(&h.ID, &h.RequestID, &h.LevelOrder, &h.ActorEmployeeID, &h.ActorEmployeeName,
			&h.Action, &h.Comment, &h.DelegatedToEmployeeID, &h.CreatedAt); err == nil {
			history = append(history, h)
		}
	}
	return history, nil
}

// approverMatchClause is the shared WHERE fragment resolving "is $1 (employeeID) with role $2 authorized
// to act on the current level of this request", including active delegations.
const approverMatchClause = `
	(
		ar.override_approver_employee_id = $1
		OR (ar.override_approver_employee_id IS NULL AND afl.approver_type = 'specific_user' AND afl.approver_employee_id = $1)
		OR (ar.override_approver_employee_id IS NULL AND afl.approver_type = 'manager_of_requester' AND req_e.manager_id = $1)
		OR (ar.override_approver_employee_id IS NULL AND afl.approver_type = 'role' AND LOWER(afl.approver_role) = LOWER($2))
		OR EXISTS (
			SELECT 1 FROM approval_delegations d
			WHERE d.delegate_employee_id = $1 AND d.is_active = true
			AND CURRENT_DATE BETWEEN d.start_date AND d.end_date
			AND (d.module_name IS NULL OR d.module_name = ar.module_name)
			AND (
				(afl.approver_type = 'specific_user' AND afl.approver_employee_id = d.delegator_employee_id)
				OR (afl.approver_type = 'manager_of_requester' AND req_e.manager_id = d.delegator_employee_id)
			)
		)
	)
`

// GetPendingApprovalsForEmployee lists requests currently awaiting action from this employee/role
func GetPendingApprovalsForEmployee(ctx context.Context, employeeID int, role string) ([]models.ApprovalRequest, error) {
	requests := []models.ApprovalRequest{}
	if !IsDBConnected() {
		return requests, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT ar.id, ar.module_name, ar.reference_id, ar.flow_id, ar.requester_employee_id, ar.current_level,
			ar.status, ar.summary, ar.override_approver_employee_id, ar.created_at, ar.updated_at, req_e.full_name,
			afl.level_name
		FROM approval_requests ar
		JOIN employees req_e ON ar.requester_employee_id = req_e.id
		JOIN approval_flow_levels afl ON afl.flow_id = ar.flow_id AND afl.level_order = ar.current_level
		WHERE ar.status = 'pending' AND `+strings.TrimSpace(approverMatchClause)+`
		ORDER BY ar.created_at ASC
	`, employeeID, role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var r models.ApprovalRequest
		var levelName string
		if err := rows.Scan(&r.ID, &r.ModuleName, &r.ReferenceID, &r.FlowID, &r.RequesterEmployeeID, &r.CurrentLevel,
			&r.Status, &r.Summary, &r.OverrideApproverEmployeeID, &r.CreatedAt, &r.UpdatedAt, &r.RequesterEmployeeName, &levelName); err == nil {
			r.Levels = []models.ApprovalFlowLevel{{LevelOrder: r.CurrentLevel, LevelName: levelName}}
			requests = append(requests, r)
		}
	}
	return requests, nil
}

// GetMyApprovalRequests lists requests the given employee submitted
func GetMyApprovalRequests(ctx context.Context, requesterEmployeeID int, moduleName string) ([]models.ApprovalRequest, error) {
	requests := []models.ApprovalRequest{}
	if !IsDBConnected() {
		return requests, nil
	}
	query := `
		SELECT ar.id, ar.module_name, ar.reference_id, ar.flow_id, ar.requester_employee_id, ar.current_level,
			ar.status, ar.summary, ar.override_approver_employee_id, ar.created_at, ar.updated_at, e.full_name
		FROM approval_requests ar
		JOIN employees e ON ar.requester_employee_id = e.id
		WHERE ar.requester_employee_id = $1
	`
	args := []interface{}{requesterEmployeeID}
	if moduleName != "" {
		query += " AND ar.module_name = $2"
		args = append(args, moduleName)
	}
	query += " ORDER BY ar.created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var r models.ApprovalRequest
		if err := rows.Scan(&r.ID, &r.ModuleName, &r.ReferenceID, &r.FlowID, &r.RequesterEmployeeID, &r.CurrentLevel,
			&r.Status, &r.Summary, &r.OverrideApproverEmployeeID, &r.CreatedAt, &r.UpdatedAt, &r.RequesterEmployeeName); err == nil {
			requests = append(requests, r)
		}
	}
	return requests, nil
}

// IsAuthorizedApprover checks server-side whether the actor may act on the request's current level
func IsAuthorizedApprover(ctx context.Context, requestID, actorEmployeeID int, actorRole string) (bool, error) {
	if !IsDBConnected() {
		return false, fmt.Errorf("database not connected")
	}
	var authorized bool
	err := GetDB().QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM approval_requests ar
			JOIN employees req_e ON ar.requester_employee_id = req_e.id
			JOIN approval_flow_levels afl ON afl.flow_id = ar.flow_id AND afl.level_order = ar.current_level
			WHERE ar.id = $3 AND `+strings.TrimSpace(approverMatchClause)+`
		)
	`, actorEmployeeID, actorRole, requestID).Scan(&authorized)
	return authorized, err
}

// ActOnApprovalRequestResult tells the caller what happened, so it can trigger module-specific side effects
type ActOnApprovalRequestResult struct {
	FinalStatus string // "" if still pending further levels, else "approved"/"rejected"/"returned"
}

// ActOnApprovalRequest applies an approve/reject/return/delegate action and advances the workflow state machine
func ActOnApprovalRequest(ctx context.Context, requestID, actorEmployeeID int, action, comment string, delegateToEmployeeID *int) (*ActOnApprovalRequestResult, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var currentLevel, flowID, referenceID int
	var status, moduleName string
	err := GetDB().QueryRow(ctx, `SELECT current_level, flow_id, status, module_name, reference_id FROM approval_requests WHERE id = $1`, requestID).
		Scan(&currentLevel, &flowID, &status, &moduleName, &referenceID)
	if err != nil {
		return nil, fmt.Errorf("request not found")
	}
	if status != "pending" {
		return nil, fmt.Errorf("request is not pending (current status: %s)", status)
	}

	var maxLevel int
	if err := GetDB().QueryRow(ctx, `SELECT MAX(level_order) FROM approval_flow_levels WHERE flow_id = $1`, flowID).Scan(&maxLevel); err != nil {
		return nil, err
	}

	result := &ActOnApprovalRequestResult{}

	switch action {
	case "approve":
		if currentLevel >= maxLevel {
			_, err = GetDB().Exec(ctx, `UPDATE approval_requests SET status = 'approved', override_approver_employee_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, requestID)
			result.FinalStatus = "approved"
		} else {
			_, err = GetDB().Exec(ctx, `UPDATE approval_requests SET current_level = current_level + 1, override_approver_employee_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, requestID)
		}
	case "reject":
		_, err = GetDB().Exec(ctx, `UPDATE approval_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, requestID)
		result.FinalStatus = "rejected"
	case "return":
		_, err = GetDB().Exec(ctx, `UPDATE approval_requests SET status = 'returned', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, requestID)
		result.FinalStatus = "returned"
	case "delegate":
		if delegateToEmployeeID == nil {
			return nil, fmt.Errorf("delegateToEmployeeId is required for delegate action")
		}
		_, err = GetDB().Exec(ctx, `UPDATE approval_requests SET override_approver_employee_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, *delegateToEmployeeID, requestID)
	default:
		return nil, fmt.Errorf("unknown action: %s", action)
	}
	if err != nil {
		return nil, err
	}

	_, err = GetDB().Exec(ctx, `
		INSERT INTO approval_history (request_id, level_order, actor_employee_id, action, comment, delegated_to_employee_id)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, requestID, currentLevel, actorEmployeeID, action, comment, delegateToEmployeeID)
	if err != nil {
		return nil, err
	}

	// Module-specific side effects on final approval. Currently: overtime requests
	// write their approved hours back into attendances.overtime_hours, which is the
	// figure GeneratePayroll actually reads — without this, approved overtime never
	// reached payroll and had to be re-entered manually.
	if result.FinalStatus == "approved" && moduleName == "overtime_request" {
		if syncErr := syncApprovedOvertimeToAttendance(ctx, referenceID); syncErr != nil {
			log.Printf("Warning: approved overtime request %d (approval request %d) could not be synced to attendance: %v", referenceID, requestID, syncErr)
		}
	}

	return result, nil
}

// syncApprovedOvertimeToAttendance adds an approved overtime request's hours onto
// the matching attendances row (creating it if it doesn't exist yet), and marks it
// approved_overtime = true.
func syncApprovedOvertimeToAttendance(ctx context.Context, overtimeRequestID int) error {
	var employeeID int
	var overtimeDate time.Time
	var hours float64
	err := GetDB().QueryRow(ctx, `
		SELECT employee_id, overtime_date, hours FROM overtime_requests WHERE id = $1
	`, overtimeRequestID).Scan(&employeeID, &overtimeDate, &hours)
	if err != nil {
		return err
	}

	_, err = GetDB().Exec(ctx, `
		INSERT INTO attendances (employee_id, date, overtime_hours, approved_overtime, status)
		VALUES ($1, $2, $3, true, 'present')
		ON CONFLICT (employee_id, date) DO UPDATE SET
			overtime_hours = attendances.overtime_hours + EXCLUDED.overtime_hours,
			approved_overtime = true
	`, employeeID, overtimeDate, hours)
	return err
}

// CancelApprovalRequest lets the original requester withdraw their own pending request
func CancelApprovalRequest(ctx context.Context, requestID, requesterEmployeeID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	tag, err := GetDB().Exec(ctx, `
		UPDATE approval_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND requester_employee_id = $2 AND status = 'pending'
	`, requestID, requesterEmployeeID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("request not found or cannot be cancelled")
	}
	return nil
}

// ==================== DELEGATIONS ====================

// CreateApprovalDelegation registers a time-bound delegation of approval authority
func CreateApprovalDelegation(ctx context.Context, delegatorID, delegateID int, moduleName, startDate, endDate string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	var moduleArg interface{}
	if moduleName != "" {
		moduleArg = moduleName
	}
	err := GetDB().QueryRow(ctx, `
		INSERT INTO approval_delegations (delegator_employee_id, delegate_employee_id, module_name, start_date, end_date, is_active)
		VALUES ($1, $2, $3, $4::date, $5::date, true)
		RETURNING id
	`, delegatorID, delegateID, moduleArg, startDate, endDate).Scan(&id)
	return id, err
}

// GetMyDelegations lists delegations created by this employee
func GetMyDelegations(ctx context.Context, delegatorID int) ([]map[string]interface{}, error) {
	results := []map[string]interface{}{}
	if !IsDBConnected() {
		return results, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT d.id, d.delegate_employee_id, e.full_name, COALESCE(d.module_name, 'Semua Modul'), d.start_date::text, d.end_date::text, d.is_active
		FROM approval_delegations d
		JOIN employees e ON d.delegate_employee_id = e.id
		WHERE d.delegator_employee_id = $1
		ORDER BY d.start_date DESC
	`, delegatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id, delegateID int
		var delegateName, moduleName string
		var startDate, endDate string
		var isActive bool
		if err := rows.Scan(&id, &delegateID, &delegateName, &moduleName, &startDate, &endDate, &isActive); err == nil {
			results = append(results, map[string]interface{}{
				"id": id, "delegateEmployeeId": delegateID, "delegateName": delegateName,
				"moduleName": moduleName, "startDate": startDate, "endDate": endDate, "isActive": isActive,
			})
		}
	}
	return results, nil
}

// DeactivateApprovalDelegation revokes a delegation
func DeactivateApprovalDelegation(ctx context.Context, id, delegatorID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE approval_delegations SET is_active = false WHERE id = $1 AND delegator_employee_id = $2
	`, id, delegatorID)
	return err
}
