package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== SALARY GRADES (Staff .. C-Level) ====================

// GetPayGrades returns all salary grades ordered by org level
func GetPayGrades(ctx context.Context) ([]models.PayGrade, error) {
	if !IsDBConnected() {
		return []models.PayGrade{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, level, name, min_salary, max_salary, default_transport_allowance,
			default_meal_allowance, default_position_allowance, is_overtime_eligible,
			requires_approval_for_change, updated_at
		FROM salary_grades
		ORDER BY level
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	grades := []models.PayGrade{}
	for rows.Next() {
		var g models.PayGrade
		if err := rows.Scan(&g.ID, &g.Level, &g.Name, &g.MinSalary, &g.MaxSalary,
			&g.DefaultTransportAllowance, &g.DefaultMealAllowance, &g.DefaultPositionAllowance,
			&g.IsOvertimeEligible, &g.RequiresApprovalForChange, &g.UpdatedAt); err != nil {
			continue
		}
		grades = append(grades, g)
	}
	return grades, nil
}

// UpdatePayGrade upserts the pay band/policy for one organizational level
func UpdatePayGrade(ctx context.Context, g *models.PayGrade) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO salary_grades (level, name, min_salary, max_salary, default_transport_allowance,
			default_meal_allowance, default_position_allowance, is_overtime_eligible, requires_approval_for_change)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (level) DO UPDATE SET
			name = EXCLUDED.name,
			min_salary = EXCLUDED.min_salary,
			max_salary = EXCLUDED.max_salary,
			default_transport_allowance = EXCLUDED.default_transport_allowance,
			default_meal_allowance = EXCLUDED.default_meal_allowance,
			default_position_allowance = EXCLUDED.default_position_allowance,
			is_overtime_eligible = EXCLUDED.is_overtime_eligible,
			requires_approval_for_change = EXCLUDED.requires_approval_for_change,
			updated_at = CURRENT_TIMESTAMP
	`, g.Level, g.Name, g.MinSalary, g.MaxSalary, g.DefaultTransportAllowance,
		g.DefaultMealAllowance, g.DefaultPositionAllowance, g.IsOvertimeEligible, g.RequiresApprovalForChange)
	return err
}

// GetPayGradeForEmployee resolves an employee's grade via employees.position_id -> positions.level
func GetPayGradeForEmployee(ctx context.Context, employeeID int) (*models.PayGrade, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var g models.PayGrade
	err := GetDB().QueryRow(ctx, `
		SELECT sg.id, sg.level, sg.name, sg.min_salary, sg.max_salary, sg.default_transport_allowance,
			sg.default_meal_allowance, sg.default_position_allowance, sg.is_overtime_eligible,
			sg.requires_approval_for_change, sg.updated_at
		FROM employees e
		JOIN positions p ON e.position_id = p.id
		JOIN salary_grades sg ON sg.level = p.level
		WHERE e.id = $1
	`, employeeID).Scan(&g.ID, &g.Level, &g.Name, &g.MinSalary, &g.MaxSalary,
		&g.DefaultTransportAllowance, &g.DefaultMealAllowance, &g.DefaultPositionAllowance,
		&g.IsOvertimeEligible, &g.RequiresApprovalForChange, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// ==================== SALARY CHANGE REQUESTS (approval-gated, high grades) ====================

// CreateSalaryChangeRequest stages a salary change awaiting approval
func CreateSalaryChangeRequest(ctx context.Context, r *models.SalaryChangeRequest) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO salary_change_requests (employee_id, base_salary, transport_allowance, meal_allowance, position_allowance, requested_by, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'pending_approval')
		RETURNING id
	`, r.EmployeeID, r.BaseSalary, r.TransportAllowance, r.MealAllowance, r.PositionAllowance, r.RequestedBy).Scan(&id)
	return id, err
}

// GetSalaryChangeRequestByID retrieves one staged salary change
func GetSalaryChangeRequestByID(ctx context.Context, id int) (*models.SalaryChangeRequest, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var r models.SalaryChangeRequest
	err := GetDB().QueryRow(ctx, `
		SELECT r.id, r.employee_id, r.base_salary, r.transport_allowance, r.meal_allowance,
			r.position_allowance, r.requested_by, r.status, r.created_at, e.full_name
		FROM salary_change_requests r
		JOIN employees e ON r.employee_id = e.id
		WHERE r.id = $1
	`, id).Scan(&r.ID, &r.EmployeeID, &r.BaseSalary, &r.TransportAllowance, &r.MealAllowance,
		&r.PositionAllowance, &r.RequestedBy, &r.Status, &r.CreatedAt, &r.EmployeeName)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

// ApplySalaryChangeRequest applies an approved staged change to salary_configurations
func ApplySalaryChangeRequest(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	r, err := GetSalaryChangeRequestByID(ctx, id)
	if err != nil {
		return err
	}
	if err := UpdateSalaryConfiguration(ctx, &models.SalaryConfiguration{
		EmployeeID:        r.EmployeeID,
		BaseSalary:        r.BaseSalary,
		TransportAllowance: r.TransportAllowance,
		MealAllowance:      r.MealAllowance,
		PositionAllowance:  r.PositionAllowance,
	}); err != nil {
		return err
	}
	_, err = GetDB().Exec(ctx, `UPDATE salary_change_requests SET status = 'approved' WHERE id = $1`, id)
	return err
}
