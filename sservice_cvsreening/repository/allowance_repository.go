package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// GetAllowances retrieves active allowances.
func GetAllowances(ctx context.Context) ([]models.Allowance, error) {
	if !IsDBConnected() {
		return []models.Allowance{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, name, description, category, amount, frequency, taxable,
			is_active, eligibility_criteria, created_at, updated_at
		FROM allowances WHERE is_active = true ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.Allowance{}
	for rows.Next() {
		var a models.Allowance
		if err := rows.Scan(&a.ID, &a.Name, &a.Description, &a.Category, &a.Amount,
			&a.Frequency, &a.Taxable, &a.Active, &a.EligibilityCriteria,
			&a.CreatedAt, &a.UpdatedAt); err == nil {
			list = append(list, a)
		}
	}
	return list, nil
}

// CreateAllowance inserts a new allowance and returns its id.
func CreateAllowance(ctx context.Context, a *models.Allowance) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO allowances (name, description, category, amount, frequency, taxable,
			is_active, eligibility_criteria)
		VALUES ($1, $2, COALESCE($3, 'other'), $4, COALESCE($5, 'monthly'), $6, COALESCE($7, true), $8)
		RETURNING id
	`, a.Name, a.Description, a.Category, a.Amount, a.Frequency, a.Taxable,
		a.Active, a.EligibilityCriteria).Scan(&id)
	return id, err
}

// UpdateAllowance updates an existing allowance by id.
func UpdateAllowance(ctx context.Context, a *models.Allowance) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE allowances SET
			name = $1, description = $2, category = $3, amount = $4, frequency = $5,
			taxable = $6, is_active = $7, eligibility_criteria = $8, updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
	`, a.Name, a.Description, a.Category, a.Amount, a.Frequency, a.Taxable,
		a.Active, a.EligibilityCriteria, a.ID)
	return err
}

// DeleteAllowance soft-deletes an allowance by marking it inactive.
func DeleteAllowance(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE allowances SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
	`, id)
	return err
}

// AssignAllowanceToEmployee assigns (or reactivates) an allowance for an employee.
func AssignAllowanceToEmployee(ctx context.Context, employeeID, allowanceID int, amount float64, effectiveDate string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_allowances (employee_id, allowance_id, amount, effective_date, status)
		VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), 'active')
		ON CONFLICT (employee_id, allowance_id) DO UPDATE SET
			amount = EXCLUDED.amount, effective_date = EXCLUDED.effective_date, status = 'active', end_date = NULL
		RETURNING id
	`, employeeID, allowanceID, amount, nullIfEmptyStr(effectiveDate)).Scan(&id)
	return id, err
}
