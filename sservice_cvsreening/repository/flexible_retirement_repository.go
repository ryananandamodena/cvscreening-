package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== FLEXIBLE BENEFITS ====================

func GetFlexibleBenefits(ctx context.Context) ([]models.FlexibleBenefit, error) {
	if !IsDBConnected() {
		return []models.FlexibleBenefit{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, name, description, category, max_amount, tax_advantaged, provider, terms,
			is_active, enrollment_period_start, enrollment_period_end, created_at, updated_at
		FROM flexible_benefits WHERE is_active = true ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.FlexibleBenefit{}
	for rows.Next() {
		var f models.FlexibleBenefit
		if err := rows.Scan(&f.ID, &f.Name, &f.Description, &f.Category, &f.MaxAmount,
			&f.TaxAdvantaged, &f.Provider, &f.Terms, &f.Active,
			&f.EnrollmentPeriodStart, &f.EnrollmentPeriodEnd, &f.CreatedAt, &f.UpdatedAt); err == nil {
			list = append(list, f)
		}
	}
	return list, nil
}

func CreateFlexibleBenefit(ctx context.Context, f *models.FlexibleBenefit) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO flexible_benefits (name, description, category, max_amount, tax_advantaged,
			provider, terms, is_active, enrollment_period_start, enrollment_period_end)
		VALUES ($1, $2, COALESCE($3, 'other'), $4, $5, $6, $7, COALESCE($8, true), $9, $10)
		RETURNING id
	`, f.Name, f.Description, f.Category, f.MaxAmount, f.TaxAdvantaged, f.Provider, f.Terms,
		f.Active, f.EnrollmentPeriodStart, f.EnrollmentPeriodEnd).Scan(&id)
	return id, err
}

// UpdateFlexibleBenefit performs a partial update — only non-nil fields are changed,
// so callers (like the UI's "deactivate" action, which only sends {active:false})
// don't accidentally blank out the rest of the record.
type FlexibleBenefitPatch struct {
	Name                  *string    `json:"name"`
	Description           *string    `json:"description"`
	Category              *string    `json:"category"`
	MaxAmount             *float64   `json:"maxAmount"`
	TaxAdvantaged         *bool      `json:"taxAdvantaged"`
	Provider              *string    `json:"provider"`
	Terms                 *string    `json:"terms"`
	Active                *bool      `json:"active"`
	EnrollmentPeriodStart *time.Time `json:"enrollmentPeriodStart"`
	EnrollmentPeriodEnd   *time.Time `json:"enrollmentPeriodEnd"`
}

func UpdateFlexibleBenefit(ctx context.Context, id int, p *FlexibleBenefitPatch) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE flexible_benefits SET
			name = COALESCE($1, name), description = COALESCE($2, description),
			category = COALESCE($3, category), max_amount = COALESCE($4, max_amount),
			tax_advantaged = COALESCE($5, tax_advantaged), provider = COALESCE($6, provider),
			terms = COALESCE($7, terms), is_active = COALESCE($8, is_active),
			enrollment_period_start = COALESCE($9, enrollment_period_start),
			enrollment_period_end = COALESCE($10, enrollment_period_end),
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $11
	`, p.Name, p.Description, p.Category, p.MaxAmount, p.TaxAdvantaged, p.Provider, p.Terms,
		p.Active, p.EnrollmentPeriodStart, p.EnrollmentPeriodEnd, id)
	return err
}

func EnrollFlexibleBenefit(ctx context.Context, employeeID, benefitID int, amount float64) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_flexible_enrollments (employee_id, benefit_id, amount, status)
		VALUES ($1, $2, $3, 'active')
		ON CONFLICT (employee_id, benefit_id) DO UPDATE SET amount = EXCLUDED.amount, status = 'active'
		RETURNING id
	`, employeeID, benefitID, amount).Scan(&id)
	return id, err
}

// ==================== RETIREMENT PLANS ====================

func GetRetirementPlans(ctx context.Context) ([]models.RetirementPlan, error) {
	if !IsDBConnected() {
		return []models.RetirementPlan{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, name, provider, plan_type, employee_contribution, employer_contribution,
			vesting_schedule, retirement_age, description, terms, is_active, created_at, updated_at
		FROM retirement_plans WHERE is_active = true ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.RetirementPlan{}
	for rows.Next() {
		var r models.RetirementPlan
		if err := rows.Scan(&r.ID, &r.Name, &r.Provider, &r.PlanType, &r.EmployeeContribution,
			&r.EmployerContribution, &r.VestingSchedule, &r.RetirementAge, &r.Description,
			&r.Terms, &r.Active, &r.CreatedAt, &r.UpdatedAt); err == nil {
			list = append(list, r)
		}
	}
	return list, nil
}

func CreateRetirementPlan(ctx context.Context, r *models.RetirementPlan) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO retirement_plans (name, provider, plan_type, employee_contribution,
			employer_contribution, vesting_schedule, retirement_age, description, terms, is_active)
		VALUES ($1, $2, COALESCE($3, 'defined_contribution'), $4, $5, $6, COALESCE($7, 55), $8, $9, COALESCE($10, true))
		RETURNING id
	`, r.Name, r.Provider, r.PlanType, r.EmployeeContribution, r.EmployerContribution,
		r.VestingSchedule, r.RetirementAge, r.Description, r.Terms, r.Active).Scan(&id)
	return id, err
}

// RetirementPlanPatch supports partial updates — see FlexibleBenefitPatch for rationale.
type RetirementPlanPatch struct {
	Name                 *string  `json:"name"`
	Provider             *string  `json:"provider"`
	PlanType             *string  `json:"planType"`
	EmployeeContribution *float64 `json:"employeeContribution"`
	EmployerContribution *float64 `json:"employerContribution"`
	VestingSchedule      *string  `json:"vestingSchedule"`
	RetirementAge        *int     `json:"retirementAge"`
	Description          *string  `json:"description"`
	Terms                *string  `json:"terms"`
	Active               *bool    `json:"active"`
}

func UpdateRetirementPlan(ctx context.Context, id int, p *RetirementPlanPatch) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE retirement_plans SET
			name = COALESCE($1, name), provider = COALESCE($2, provider),
			plan_type = COALESCE($3, plan_type), employee_contribution = COALESCE($4, employee_contribution),
			employer_contribution = COALESCE($5, employer_contribution),
			vesting_schedule = COALESCE($6, vesting_schedule), retirement_age = COALESCE($7, retirement_age),
			description = COALESCE($8, description), terms = COALESCE($9, terms),
			is_active = COALESCE($10, is_active), updated_at = CURRENT_TIMESTAMP
		WHERE id = $11
	`, p.Name, p.Provider, p.PlanType, p.EmployeeContribution, p.EmployerContribution,
		p.VestingSchedule, p.RetirementAge, p.Description, p.Terms, p.Active, id)
	return err
}

func EnrollRetirementPlan(ctx context.Context, employeeID, planID int) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_retirement_enrollments (employee_id, plan_id, status)
		VALUES ($1, $2, 'active')
		ON CONFLICT (employee_id, plan_id) DO UPDATE SET status = 'active'
		RETURNING id
	`, employeeID, planID).Scan(&id)
	return id, err
}
