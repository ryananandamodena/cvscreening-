package repository

import (
	"context"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== DEPARTMENT REPOSITORY ====================

// CreateDepartment inserts a new department
func CreateDepartment(ctx context.Context, dept *models.Department) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO departments (name, code, parent_id, head_id, description, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, dept.Name, dept.Code, dept.ParentID, dept.HeadID, dept.Description, true).Scan(&id)

	return id, err
}

// UpdateDepartment updates an existing department
func UpdateDepartment(ctx context.Context, dept *models.Department) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE departments SET
			name=$1, code=$2, parent_id=$3, head_id=$4, description=$5, is_active=$6,
			updated_at=CURRENT_TIMESTAMP
		WHERE id=$7
	`, dept.Name, dept.Code, dept.ParentID, dept.HeadID, dept.Description, dept.IsActive, dept.ID)

	return err
}

// GetDepartmentByID retrieves a department by ID
func GetDepartmentByID(ctx context.Context, id int) (*models.Department, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var d models.Department
	err := GetDB().QueryRow(ctx, `
		SELECT d.id, d.name, COALESCE(d.code, ''), d.parent_id, d.head_id, 
			COALESCE(d.description, ''), d.is_active, d.created_at, d.updated_at,
			COALESCE(e.full_name, ''), COALESCE(p.name, ''),
			(SELECT COUNT(*) FROM employees WHERE department_id = d.id AND employment_status = 'active'),
			(SELECT COUNT(*) FROM departments WHERE parent_id = d.id)
		FROM departments d
		LEFT JOIN employees e ON d.head_id = e.id
		LEFT JOIN departments p ON d.parent_id = p.id
		WHERE d.id = $1
	`, id).Scan(
		&d.ID, &d.Name, &d.Code, &d.ParentID, &d.HeadID,
		&d.Description, &d.IsActive, &d.CreatedAt, &d.UpdatedAt,
		&d.HeadName, &d.ParentName, &d.EmployeeCount, &d.ChildDeptCount,
	)

	if err != nil {
		return nil, err
	}
	return &d, nil
}

// GetDepartments retrieves all departments
func GetDepartments(ctx context.Context) ([]models.Department, error) {
	if !IsDBConnected() {
		return []models.Department{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT d.id, d.name, COALESCE(d.code, ''), d.parent_id, d.head_id,
			COALESCE(d.description, ''), d.is_active, d.created_at, d.updated_at,
			COALESCE(e.full_name, ''), COALESCE(p.name, ''),
			(SELECT COUNT(*) FROM employees WHERE department_id = d.id AND employment_status = 'active'),
			(SELECT COUNT(*) FROM departments WHERE parent_id = d.id)
		FROM departments d
		LEFT JOIN employees e ON d.head_id = e.id
		LEFT JOIN departments p ON d.parent_id = p.id
		ORDER BY d.name ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []models.Department
	for rows.Next() {
		var d models.Department
		err := rows.Scan(
			&d.ID, &d.Name, &d.Code, &d.ParentID, &d.HeadID,
			&d.Description, &d.IsActive, &d.CreatedAt, &d.UpdatedAt,
			&d.HeadName, &d.ParentName, &d.EmployeeCount, &d.ChildDeptCount,
		)
		if err != nil {
			log.Printf("Error scanning department: %v", err)
			continue
		}
		departments = append(departments, d)
	}

	return departments, nil
}

// DeleteDepartment deletes a department (soft-delete by deactivating)
func DeleteDepartment(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE departments SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
	`, id)
	return err
}

// ==================== POSITION REPOSITORY ====================

// CreatePosition inserts a new position
func CreatePosition(ctx context.Context, pos *models.Position) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO positions (name, code, department_id, level, description, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, pos.Name, pos.Code, pos.DepartmentID, pos.Level, pos.Description, true).Scan(&id)

	return id, err
}

// UpdatePosition updates an existing position
func UpdatePosition(ctx context.Context, pos *models.Position) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE positions SET
			name=$1, code=$2, department_id=$3, level=$4, description=$5, is_active=$6,
			updated_at=CURRENT_TIMESTAMP
		WHERE id=$7
	`, pos.Name, pos.Code, pos.DepartmentID, pos.Level, pos.Description, pos.IsActive, pos.ID)

	return err
}

// GetPositionByID retrieves a position by ID
func GetPositionByID(ctx context.Context, id int) (*models.Position, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var p models.Position
	err := GetDB().QueryRow(ctx, `
		SELECT p.id, p.name, COALESCE(p.code, ''), p.department_id, p.level,
			COALESCE(p.description, ''), p.is_active, p.created_at, p.updated_at,
			COALESCE(d.name, ''),
			(SELECT COUNT(*) FROM employees WHERE position_id = p.id AND employment_status = 'active')
		FROM positions p
		LEFT JOIN departments d ON p.department_id = d.id
		WHERE p.id = $1
	`, id).Scan(
		&p.ID, &p.Name, &p.Code, &p.DepartmentID, &p.Level,
		&p.Description, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		&p.DepartmentName, &p.EmployeeCount,
	)

	if err != nil {
		return nil, err
	}
	return &p, nil
}

// GetPositions retrieves all positions with optional department filter
func GetPositions(ctx context.Context, departmentID int) ([]models.Position, error) {
	if !IsDBConnected() {
		return []models.Position{}, nil
	}

	query := `
		SELECT p.id, p.name, COALESCE(p.code, ''), p.department_id, p.level,
			COALESCE(p.description, ''), p.is_active, p.created_at, p.updated_at,
			COALESCE(d.name, ''),
			(SELECT COUNT(*) FROM employees WHERE position_id = p.id AND employment_status = 'active')
		FROM positions p
		LEFT JOIN departments d ON p.department_id = d.id
	`
	args := []interface{}{}

	if departmentID > 0 {
		query += " WHERE p.department_id = $1"
		args = append(args, departmentID)
	}
	query += " ORDER BY p.level ASC, p.name ASC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var positions []models.Position
	for rows.Next() {
		var p models.Position
		err := rows.Scan(
			&p.ID, &p.Name, &p.Code, &p.DepartmentID, &p.Level,
			&p.Description, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
			&p.DepartmentName, &p.EmployeeCount,
		)
		if err != nil {
			log.Printf("Error scanning position: %v", err)
			continue
		}
		positions = append(positions, p)
	}

	return positions, nil
}

// DeletePosition soft-deletes a position
func DeletePosition(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE positions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
	`, id)
	return err
}

// ==================== AUDIT TRAIL REPOSITORY ====================

// LogAuditTrail creates an audit trail entry
func LogAuditTrail(ctx context.Context, audit *models.AuditTrail) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		INSERT INTO audit_trail (user_id, user_email, action, module, entity_type, entity_id, old_value, new_value, ip_address, user_agent, severity)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, audit.UserID, audit.UserEmail, audit.Action, audit.Module, audit.EntityType, audit.EntityID,
		audit.OldValue, audit.NewValue, audit.IPAddress, audit.UserAgent, audit.Severity)

	return err
}

// GetAuditTrail retrieves audit trail entries with filters
func GetAuditTrail(ctx context.Context, filter models.AuditTrailFilter) ([]models.AuditTrail, int64, error) {
	if !IsDBConnected() {
		return []models.AuditTrail{}, 0, nil
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}
	offset := (filter.Page - 1) * filter.Limit

	where := "WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if filter.Module != "" {
		where += fmt.Sprintf(" AND module = $%d", argIdx)
		args = append(args, filter.Module)
		argIdx++
	}
	if filter.Action != "" {
		where += fmt.Sprintf(" AND action = $%d", argIdx)
		args = append(args, filter.Action)
		argIdx++
	}
	if filter.EntityType != "" {
		where += fmt.Sprintf(" AND entity_type = $%d", argIdx)
		args = append(args, filter.EntityType)
		argIdx++
	}
	if filter.Severity != "" {
		where += fmt.Sprintf(" AND severity = $%d", argIdx)
		args = append(args, filter.Severity)
		argIdx++
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_trail %s", where)
	GetDB().QueryRow(ctx, countQuery, args...).Scan(&total)

	args = append(args, filter.Limit, offset)
	query := fmt.Sprintf(`
		SELECT id, user_id, COALESCE(user_email, ''), action, module, entity_type, entity_id,
			old_value, new_value, COALESCE(ip_address, ''), COALESCE(user_agent, ''), 
			COALESCE(severity, 'info'), created_at
		FROM audit_trail
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argIdx, argIdx+1)

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var auditLogs []models.AuditTrail
	for rows.Next() {
		var a models.AuditTrail
		err := rows.Scan(
			&a.ID, &a.UserID, &a.UserEmail, &a.Action, &a.Module, &a.EntityType, &a.EntityID,
			&a.OldValue, &a.NewValue, &a.IPAddress, &a.UserAgent, &a.Severity, &a.CreatedAt,
		)
		if err != nil {
			log.Printf("Error scanning audit trail: %v", err)
			continue
		}
		auditLogs = append(auditLogs, a)
	}

	return auditLogs, total, nil
}

// ==================== CONTRACT REPOSITORY ====================

// CreateContract inserts a new employee contract
func CreateContract(ctx context.Context, c *models.EmployeeContract) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	status := c.Status
	if status == "" {
		status = "active"
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_contracts (employee_id, contract_type, contract_number, start_date, end_date, document_path, status, previous_contract_id, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, c.EmployeeID, c.ContractType, c.ContractNumber, c.StartDate, c.EndDate, c.DocumentPath, status, c.PreviousContractID, c.Notes).Scan(&id)

	return id, err
}

// SignContract updates a contract with the digital signature
func SignContract(ctx context.Context, id int, signatureURL string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE employee_contracts 
		SET signature_url = $1, signed_at = CURRENT_TIMESTAMP, status = 'signed', updated_at = CURRENT_TIMESTAMP
		WHERE id = $2
	`, signatureURL, id)
	return err
}

// GetContractsByEmployeeID retrieves contracts for an employee
func GetContractsByEmployeeID(ctx context.Context, employeeID int) ([]models.EmployeeContract, error) {
	if !IsDBConnected() {
		return []models.EmployeeContract{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT c.id, c.employee_id, c.contract_type, COALESCE(c.contract_number, ''),
			c.start_date, c.end_date, COALESCE(c.document_path, ''), c.status,
			c.renewal_count, c.previous_contract_id, COALESCE(c.notes, ''),
			c.created_at, c.updated_at,
			COALESCE(e.full_name, ''),
			CASE WHEN c.end_date IS NOT NULL THEN (c.end_date - CURRENT_DATE) ELSE NULL END
		FROM employee_contracts c
		LEFT JOIN employees e ON c.employee_id = e.id
		WHERE c.employee_id = $1
		ORDER BY c.start_date DESC
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contracts []models.EmployeeContract
	for rows.Next() {
		var c models.EmployeeContract
		err := rows.Scan(
			&c.ID, &c.EmployeeID, &c.ContractType, &c.ContractNumber,
			&c.StartDate, &c.EndDate, &c.DocumentPath, &c.Status,
			&c.RenewalCount, &c.PreviousContractID, &c.Notes,
			&c.CreatedAt, &c.UpdatedAt,
			&c.EmployeeName, &c.DaysToExpiry,
		)
		if err != nil {
			log.Printf("Error scanning contract: %v", err)
			continue
		}
		contracts = append(contracts, c)
	}

	return contracts, nil
}

// GetExpiringContracts retrieves contracts expiring within N days
func GetExpiringContracts(ctx context.Context, days int) ([]models.EmployeeContract, error) {
	if !IsDBConnected() {
		return []models.EmployeeContract{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT c.id, c.employee_id, c.contract_type, COALESCE(c.contract_number, ''),
			c.start_date, c.end_date, COALESCE(c.document_path, ''), c.status,
			c.renewal_count, c.previous_contract_id, COALESCE(c.notes, ''),
			c.created_at, c.updated_at,
			COALESCE(e.full_name, ''),
			(c.end_date - CURRENT_DATE)
		FROM employee_contracts c
		LEFT JOIN employees e ON c.employee_id = e.id
		WHERE c.status = 'active' 
			AND c.end_date IS NOT NULL
			AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
		ORDER BY c.end_date ASC
	`, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var contracts []models.EmployeeContract
	for rows.Next() {
		var c models.EmployeeContract
		err := rows.Scan(
			&c.ID, &c.EmployeeID, &c.ContractType, &c.ContractNumber,
			&c.StartDate, &c.EndDate, &c.DocumentPath, &c.Status,
			&c.RenewalCount, &c.PreviousContractID, &c.Notes,
			&c.CreatedAt, &c.UpdatedAt,
			&c.EmployeeName, &c.DaysToExpiry,
		)
		if err != nil {
			log.Printf("Error scanning expiring contract: %v", err)
			continue
		}
		contracts = append(contracts, c)
	}

	return contracts, nil
}

// ==================== ONBOARDING REPOSITORY ====================

// CreateOnboardingSession creates a new onboarding session for an employee
func CreateOnboardingSession(ctx context.Context, session *models.OnboardingSession) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO onboarding_sessions (employee_id, template_id, start_date, due_date, status, progress)
		VALUES ($1, $2, $3, $4, 'in_progress', 0)
		RETURNING id
	`, session.EmployeeID, session.TemplateID, session.StartDate, session.DueDate).Scan(&id)

	return id, err
}

// CreateOnboardingTask creates a task in an onboarding session
func CreateOnboardingTask(ctx context.Context, task *models.OnboardingTask) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO onboarding_tasks (session_id, title, description, category, assigned_to, assigned_role, due_date, status, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
		RETURNING id
	`, task.SessionID, task.Title, task.Description, task.Category, task.AssignedTo, task.AssignedRole, task.DueDate, task.SortOrder).Scan(&id)

	return id, err
}

// UpdateOnboardingTaskStatus updates a task's status
func UpdateOnboardingTaskStatus(ctx context.Context, taskID int, status string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	completedAt := "NULL"
	if status == "completed" {
		completedAt = "CURRENT_TIMESTAMP"
	}

	_, err := GetDB().Exec(ctx, fmt.Sprintf(`
		UPDATE onboarding_tasks SET status = $1, completed_at = %s, updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, completedAt), status, taskID)
	return err
}

// GetOnboardingSessions retrieves onboarding sessions with optional status filter
func GetOnboardingSessions(ctx context.Context, status string) ([]models.OnboardingSession, error) {
	if !IsDBConnected() {
		return []models.OnboardingSession{}, nil
	}

	query := `
		SELECT s.id, s.employee_id, s.template_id, s.start_date, s.due_date, s.status, s.progress,
			s.completed_at, s.created_at, s.updated_at,
			COALESCE(e.full_name, '')
		FROM onboarding_sessions s
		LEFT JOIN employees e ON s.employee_id = e.id
	`
	args := []interface{}{}
	if status != "" {
		query += " WHERE s.status = $1"
		args = append(args, status)
	}
	query += " ORDER BY s.created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.OnboardingSession
	for rows.Next() {
		var s models.OnboardingSession
		err := rows.Scan(
			&s.ID, &s.EmployeeID, &s.TemplateID, &s.StartDate, &s.DueDate, &s.Status, &s.Progress,
			&s.CompletedAt, &s.CreatedAt, &s.UpdatedAt,
			&s.EmployeeName,
		)
		if err != nil {
			log.Printf("Error scanning onboarding session: %v", err)
			continue
		}
		sessions = append(sessions, s)
	}

	return sessions, nil
}

// GetOnboardingTasksBySessionID retrieves tasks for a session
func GetOnboardingTasksBySessionID(ctx context.Context, sessionID int) ([]models.OnboardingTask, error) {
	if !IsDBConnected() {
		return []models.OnboardingTask{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT t.id, t.session_id, t.title, COALESCE(t.description, ''), COALESCE(t.category, ''),
			t.assigned_to, COALESCE(t.assigned_role, ''), t.due_date, t.status,
			t.completed_at, COALESCE(t.notes, ''), t.sort_order, t.created_at, t.updated_at,
			COALESCE(e.full_name, '')
		FROM onboarding_tasks t
		LEFT JOIN employees e ON t.assigned_to = e.id
		WHERE t.session_id = $1
		ORDER BY t.sort_order ASC, t.created_at ASC
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []models.OnboardingTask
	for rows.Next() {
		var t models.OnboardingTask
		err := rows.Scan(
			&t.ID, &t.SessionID, &t.Title, &t.Description, &t.Category,
			&t.AssignedTo, &t.AssignedRole, &t.DueDate, &t.Status,
			&t.CompletedAt, &t.Notes, &t.SortOrder, &t.CreatedAt, &t.UpdatedAt,
			&t.AssignedToName,
		)
		if err != nil {
			log.Printf("Error scanning onboarding task: %v", err)
			continue
		}
		tasks = append(tasks, t)
	}

	return tasks, nil
}

// RecalculateOnboardingProgress updates the progress percentage for a session
func RecalculateOnboardingProgress(ctx context.Context, sessionID int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE onboarding_sessions SET
			progress = (
				SELECT CASE WHEN COUNT(*) = 0 THEN 0
				ELSE ROUND(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
				END
				FROM onboarding_tasks WHERE session_id = $1
			),
			status = CASE
				WHEN (SELECT COUNT(*) FILTER (WHERE status != 'completed') FROM onboarding_tasks WHERE session_id = $1) = 0
					AND (SELECT COUNT(*) FROM onboarding_tasks WHERE session_id = $1) > 0
				THEN 'completed'
				ELSE status
			END,
			completed_at = CASE
				WHEN (SELECT COUNT(*) FILTER (WHERE status != 'completed') FROM onboarding_tasks WHERE session_id = $1) = 0
					AND (SELECT COUNT(*) FROM onboarding_tasks WHERE session_id = $1) > 0
				THEN CURRENT_TIMESTAMP
				ELSE completed_at
			END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, sessionID)
	return err
}
