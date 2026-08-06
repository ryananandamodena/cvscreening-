package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== DEDUCTION TYPE CATALOG ====================

// GetDeductionTypes returns the reusable catalog of "other deduction" types
func GetDeductionTypes(ctx context.Context) ([]models.DeductionType, error) {
	if !IsDBConnected() {
		return []models.DeductionType{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, name, COALESCE(description, ''), calculation_type, default_amount, default_rate, is_active, updated_at
		FROM deduction_types
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	types := []models.DeductionType{}
	for rows.Next() {
		var t models.DeductionType
		if err := rows.Scan(&t.ID, &t.Name, &t.Description, &t.CalculationType, &t.DefaultAmount, &t.DefaultRate, &t.IsActive, &t.UpdatedAt); err == nil {
			types = append(types, t)
		}
	}
	return types, nil
}

// CreateDeductionType adds a new reusable deduction type to the catalog
func CreateDeductionType(ctx context.Context, t *models.DeductionType) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO deduction_types (name, description, calculation_type, default_amount, default_rate, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id
	`, t.Name, t.Description, t.CalculationType, t.DefaultAmount, t.DefaultRate).Scan(&id)
	return id, err
}

// UpdateDeductionType edits an existing catalog entry
func UpdateDeductionType(ctx context.Context, t *models.DeductionType) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE deduction_types SET
			name = $1, description = $2, calculation_type = $3,
			default_amount = $4, default_rate = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
		WHERE id = $7
	`, t.Name, t.Description, t.CalculationType, t.DefaultAmount, t.DefaultRate, t.IsActive, t.ID)
	return err
}

// DeleteDeductionType removes a catalog entry (fails if any employee_deductions reference it)
func DeleteDeductionType(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM deduction_types WHERE id = $1`, id)
	return err
}

// ==================== PER-EMPLOYEE RECURRING DEDUCTIONS ====================

// GetEmployeeDeductions lists an employee's active + inactive recurring deductions
func GetEmployeeDeductions(ctx context.Context, employeeID int) ([]models.EmployeeDeduction, error) {
	if !IsDBConnected() {
		return []models.EmployeeDeduction{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT ed.id, ed.employee_id, ed.deduction_type_id, ed.amount, ed.rate, ed.remaining_balance,
			COALESCE(ed.notes, ''), ed.is_active, dt.name, dt.calculation_type
		FROM employee_deductions ed
		JOIN deduction_types dt ON ed.deduction_type_id = dt.id
		WHERE ed.employee_id = $1
		ORDER BY ed.is_active DESC, ed.id DESC
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	deductions := []models.EmployeeDeduction{}
	for rows.Next() {
		var d models.EmployeeDeduction
		if err := rows.Scan(&d.ID, &d.EmployeeID, &d.DeductionTypeID, &d.Amount, &d.Rate, &d.RemainingBalance,
			&d.Notes, &d.IsActive, &d.DeductionName, &d.CalculationType); err == nil {
			deductions = append(deductions, d)
		}
	}
	return deductions, nil
}

// GetActiveDeductionsForPayroll returns every active recurring deduction for an employee,
// joined with its type's calculation rule — used by GeneratePayroll.
func GetActiveDeductionsForPayroll(ctx context.Context, employeeID int) ([]models.EmployeeDeduction, error) {
	if !IsDBConnected() {
		return []models.EmployeeDeduction{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT ed.id, ed.employee_id, ed.deduction_type_id, ed.amount, ed.rate, ed.remaining_balance,
			COALESCE(ed.notes, ''), ed.is_active, dt.name, dt.calculation_type, dt.default_amount, dt.default_rate
		FROM employee_deductions ed
		JOIN deduction_types dt ON ed.deduction_type_id = dt.id
		WHERE ed.employee_id = $1 AND ed.is_active = true AND dt.is_active = true
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	deductions := []models.EmployeeDeduction{}
	for rows.Next() {
		var d models.EmployeeDeduction
		var defaultAmount, defaultRate float64
		if err := rows.Scan(&d.ID, &d.EmployeeID, &d.DeductionTypeID, &d.Amount, &d.Rate, &d.RemainingBalance,
			&d.Notes, &d.IsActive, &d.DeductionName, &d.CalculationType, &defaultAmount, &defaultRate); err == nil {
			if d.Amount == nil {
				d.Amount = &defaultAmount
			}
			if d.Rate == nil {
				d.Rate = &defaultRate
			}
			deductions = append(deductions, d)
		}
	}
	return deductions, nil
}

// CreateEmployeeDeduction assigns a deduction type to an employee as a recurring deduction
func CreateEmployeeDeduction(ctx context.Context, d *models.EmployeeDeduction) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_deductions (employee_id, deduction_type_id, amount, rate, remaining_balance, notes, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, true)
		RETURNING id
	`, d.EmployeeID, d.DeductionTypeID, d.Amount, d.Rate, d.RemainingBalance, d.Notes).Scan(&id)
	return id, err
}

// SetEmployeeDeductionActive activates/deactivates a recurring deduction (e.g. to pause it)
func SetEmployeeDeductionActive(ctx context.Context, id int, active bool) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `UPDATE employee_deductions SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, active, id)
	return err
}

// DeleteEmployeeDeduction removes a recurring deduction assignment entirely
func DeleteEmployeeDeduction(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM employee_deductions WHERE id = $1`, id)
	return err
}
