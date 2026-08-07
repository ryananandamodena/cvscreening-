package models

import "time"

// FlexibleBenefit mirrors terai/services/benefits.service.ts FlexibleBenefit.
type FlexibleBenefit struct {
	ID                    int        `json:"id"`
	Name                  string     `json:"name"`
	Description           string     `json:"description"`
	Category              string     `json:"category"` // health, wellness, learning, commuter, other
	MaxAmount             float64    `json:"maxAmount"`
	TaxAdvantaged         bool       `json:"taxAdvantaged"`
	Provider              string     `json:"provider"`
	Terms                 string     `json:"terms"`
	Active                bool       `json:"active"`
	EnrollmentPeriodStart *time.Time `json:"enrollmentPeriodStart,omitempty"`
	EnrollmentPeriodEnd   *time.Time `json:"enrollmentPeriodEnd,omitempty"`
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`
}

// RetirementPlan mirrors terai/services/benefits.service.ts RetirementPlan.
type RetirementPlan struct {
	ID                   int       `json:"id"`
	Name                 string    `json:"name"`
	Provider             string    `json:"provider"`
	PlanType             string    `json:"planType"` // defined_benefit, defined_contribution, hybrid
	EmployeeContribution float64   `json:"employeeContribution"`
	EmployerContribution float64   `json:"employerContribution"`
	VestingSchedule      string    `json:"vestingSchedule"`
	RetirementAge        int       `json:"retirementAge"`
	Description          string    `json:"description"`
	Terms                string    `json:"terms"`
	Active               bool      `json:"active"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}
