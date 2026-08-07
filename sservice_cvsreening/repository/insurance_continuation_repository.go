package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// InitiateInsuranceContinuation creates a continuation record for a terminated
// employee. continuationEndDate defaults to terminationDate + 6 months if empty.
func InitiateInsuranceContinuation(ctx context.Context, employeeID int, originalEnrollmentID *int, terminationDate string, monthlyPremium float64) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO insurance_continuations
			(employee_id, original_enrollment_id, termination_date, continuation_end_date, monthly_premium, status)
		VALUES ($1, $2, $3, ($3::date + INTERVAL '6 months'), $4, 'active')
		RETURNING id
	`, employeeID, originalEnrollmentID, terminationDate, monthlyPremium).Scan(&id)
	return id, err
}

// GetInsuranceContinuations lists continuations. employeeID <= 0 returns all (admin view).
func GetInsuranceContinuations(ctx context.Context, employeeID int) ([]models.InsuranceContinuation, error) {
	if !IsDBConnected() {
		return []models.InsuranceContinuation{}, nil
	}
	query := `
		SELECT ic.id, ic.employee_id, ic.original_enrollment_id, ic.termination_date,
			ic.continuation_end_date, ic.monthly_premium, ic.status, ic.last_payment_date,
			ic.created_at, ic.updated_at, e.full_name
		FROM insurance_continuations ic
		JOIN employees e ON ic.employee_id = e.id
	`
	args := []interface{}{}
	if employeeID > 0 {
		query += " WHERE ic.employee_id = $1"
		args = append(args, employeeID)
	}
	query += " ORDER BY ic.status, ic.termination_date DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.InsuranceContinuation{}
	for rows.Next() {
		var c models.InsuranceContinuation
		if err := rows.Scan(&c.ID, &c.EmployeeID, &c.OriginalEnrollmentID, &c.TerminationDate,
			&c.ContinuationEndDate, &c.MonthlyPremium, &c.Status, &c.LastPaymentDate,
			&c.CreatedAt, &c.UpdatedAt, &c.EmployeeName); err == nil {
			list = append(list, c)
		}
	}
	return list, nil
}

// RecordInsuranceContinuationPayment logs a premium payment and updates last_payment_date.
func RecordInsuranceContinuationPayment(ctx context.Context, continuationID int, amount float64, paymentDate string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO insurance_continuation_payments (continuation_id, amount, payment_date, status)
		VALUES ($1, $2, COALESCE($3, CURRENT_DATE), 'paid')
		RETURNING id
	`, continuationID, amount, nullIfEmptyStr(paymentDate)).Scan(&id)
	if err != nil {
		return 0, err
	}
	_, err = GetDB().Exec(ctx, `
		UPDATE insurance_continuations SET last_payment_date = COALESCE($1, CURRENT_DATE),
			updated_at = CURRENT_TIMESTAMP WHERE id = $2
	`, nullIfEmptyStr(paymentDate), continuationID)
	return id, err
}
