package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== INSURANCE PLANS ====================

// GetInsurancePlans retrieves active insurance plans, optionally filtered by type.
func GetInsurancePlans(ctx context.Context, planType string) ([]models.InsurancePlan, error) {
	if !IsDBConnected() {
		return []models.InsurancePlan{}, nil
	}

	query := `
		SELECT id, name, provider, type, coverage_amount, premium_amount, premium_frequency,
			description, terms, is_active, created_at, updated_at
		FROM insurance_plans
		WHERE is_active = true
	`
	args := []interface{}{}
	if planType != "" {
		query += " AND type = $1"
		args = append(args, planType)
	}
	query += " ORDER BY type, name"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plans := []models.InsurancePlan{}
	for rows.Next() {
		var p models.InsurancePlan
		if err := rows.Scan(&p.ID, &p.Name, &p.Provider, &p.Type, &p.CoverageAmount,
			&p.PremiumAmount, &p.PremiumFrequency, &p.Description, &p.Terms,
			&p.Active, &p.CreatedAt, &p.UpdatedAt); err == nil {
			plans = append(plans, p)
		}
	}
	return plans, nil
}

// CreateInsurancePlan inserts a new insurance plan and returns its id.
func CreateInsurancePlan(ctx context.Context, p *models.InsurancePlan) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO insurance_plans (name, provider, type, coverage_amount, premium_amount,
			premium_frequency, description, terms, is_active)
		VALUES ($1, $2, COALESCE($3, 'health'), $4, $5, COALESCE($6, 'monthly'), $7, $8, COALESCE($9, true))
		RETURNING id
	`, p.Name, p.Provider, p.Type, p.CoverageAmount, p.PremiumAmount,
		p.PremiumFrequency, p.Description, p.Terms, p.Active).Scan(&id)
	return id, err
}

// UpdateInsurancePlan updates an existing insurance plan by id.
func UpdateInsurancePlan(ctx context.Context, p *models.InsurancePlan) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE insurance_plans SET
			name = $1, provider = $2, type = $3, coverage_amount = $4, premium_amount = $5,
			premium_frequency = $6, description = $7, terms = $8, is_active = $9,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $10
	`, p.Name, p.Provider, p.Type, p.CoverageAmount, p.PremiumAmount,
		p.PremiumFrequency, p.Description, p.Terms, p.Active, p.ID)
	return err
}

// DeleteInsurancePlan soft-deletes an insurance plan by marking it inactive —
// existing enrollments are preserved for history.
func DeleteInsurancePlan(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE insurance_plans SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
	`, id)
	return err
}

// ==================== EMPLOYEE DEPENDENTS ====================

// GetEmployeeDependents retrieves all dependents for an employee.
func GetEmployeeDependents(ctx context.Context, employeeID int) ([]models.EmployeeDependent, error) {
	if !IsDBConnected() {
		return []models.EmployeeDependent{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, employee_id, name, relationship, date_of_birth, gender,
			is_covered, coverage_start_date, coverage_end_date
		FROM employee_dependents
		WHERE employee_id = $1
		ORDER BY name
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	deps := []models.EmployeeDependent{}
	for rows.Next() {
		var d models.EmployeeDependent
		if err := rows.Scan(&d.ID, &d.EmployeeID, &d.Name, &d.Relationship, &d.DateOfBirth,
			&d.Gender, &d.IsCovered, &d.CoverageStartDate, &d.CoverageEndDate); err == nil {
			deps = append(deps, d)
		}
	}
	return deps, nil
}

// AddDependent inserts a new dependent for an employee and returns its id.
func AddDependent(ctx context.Context, d *models.EmployeeDependent) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_dependents (employee_id, name, relationship, date_of_birth, gender,
			is_covered, coverage_start_date, coverage_end_date)
		VALUES ($1, $2, COALESCE($3, 'other'), $4, $5, $6, $7, $8)
		RETURNING id
	`, d.EmployeeID, d.Name, d.Relationship, d.DateOfBirth, d.Gender,
		d.IsCovered, d.CoverageStartDate, d.CoverageEndDate).Scan(&id)
	return id, err
}

// UpdateDependent updates an existing dependent by id (scoped to employeeID for safety).
func UpdateDependent(ctx context.Context, employeeID int, d *models.EmployeeDependent) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE employee_dependents SET
			name = $1, relationship = $2, date_of_birth = $3, gender = $4,
			is_covered = $5, coverage_start_date = $6, coverage_end_date = $7
		WHERE id = $8 AND employee_id = $9
	`, d.Name, d.Relationship, d.DateOfBirth, d.Gender, d.IsCovered,
		d.CoverageStartDate, d.CoverageEndDate, d.ID, employeeID)
	return err
}

// RemoveDependent deletes a dependent by id (scoped to employeeID for safety).
func RemoveDependent(ctx context.Context, employeeID, dependentID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		DELETE FROM employee_dependents WHERE id = $1 AND employee_id = $2
	`, dependentID, employeeID)
	return err
}

// ==================== EMPLOYEE INSURANCE ENROLLMENTS ====================

// EnrollEmployeeInsurance enrolls an employee into an insurance plan (or reactivates
// an existing enrollment for the same plan).
func EnrollEmployeeInsurance(ctx context.Context, employeeID, planID int, effectiveDate string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_insurance_enrollments (employee_id, plan_id, effective_date, status)
		VALUES ($1, $2, COALESCE($3, CURRENT_DATE), 'active')
		ON CONFLICT (employee_id, plan_id) DO UPDATE SET
			status = 'active', effective_date = EXCLUDED.effective_date, end_date = NULL,
			termination_reason = NULL, updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`, employeeID, planID, nullIfEmptyStr(effectiveDate)).Scan(&id)
	return id, err
}

// GetEmployeeInsuranceEnrollments retrieves insurance enrollments. employeeID <= 0
// returns enrollments across all employees (admin view).
func GetEmployeeInsuranceEnrollments(ctx context.Context, employeeID int) ([]models.EmployeeInsuranceEnrollment, error) {
	if !IsDBConnected() {
		return []models.EmployeeInsuranceEnrollment{}, nil
	}

	query := `
		SELECT e.id, e.employee_id, e.plan_id, e.effective_date, e.end_date, e.status,
			COALESCE(e.termination_reason, ''), e.created_at, e.updated_at,
			emp.full_name, p.name, p.type
		FROM employee_insurance_enrollments e
		JOIN employees emp ON e.employee_id = emp.id
		JOIN insurance_plans p ON e.plan_id = p.id
	`
	args := []interface{}{}
	if employeeID > 0 {
		query += " WHERE e.employee_id = $1"
		args = append(args, employeeID)
	}
	query += " ORDER BY e.status DESC, emp.full_name"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	enrollments := []models.EmployeeInsuranceEnrollment{}
	for rows.Next() {
		var en models.EmployeeInsuranceEnrollment
		if err := rows.Scan(&en.ID, &en.EmployeeID, &en.PlanID, &en.EffectiveDate, &en.EndDate,
			&en.Status, &en.TerminationReason, &en.CreatedAt, &en.UpdatedAt,
			&en.EmployeeName, &en.PlanName, &en.PlanType); err == nil {
			enrollments = append(enrollments, en)
		}
	}
	return enrollments, nil
}

// TerminateEmployeeInsurance marks an enrollment terminated as of endDate, with a reason.
func TerminateEmployeeInsurance(ctx context.Context, enrollmentID int, endDate, reason string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE employee_insurance_enrollments SET
			status = 'terminated', end_date = COALESCE($1, CURRENT_DATE), termination_reason = $2,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`, nullIfEmptyStr(endDate), reason, enrollmentID)
	return err
}
