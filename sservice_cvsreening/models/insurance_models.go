package models

import "time"

// InsurancePlan mirrors terai/services/benefits.service.ts InsurancePlan.
type InsurancePlan struct {
	ID               int       `json:"id"`
	Name             string    `json:"name"`
	Provider         string    `json:"provider"`
	Type             string    `json:"type"` // health, dental, life, disability
	CoverageAmount   float64   `json:"coverageAmount"`
	PremiumAmount    float64   `json:"premiumAmount"`
	PremiumFrequency string    `json:"premiumFrequency"` // monthly, quarterly, annually
	Description      string    `json:"description"`
	Terms            string    `json:"terms"`
	Active           bool      `json:"active"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// EmployeeDependent mirrors terai/services/benefits.service.ts Dependent.
type EmployeeDependent struct {
	ID                int        `json:"id"`
	EmployeeID        int        `json:"employeeId"`
	Name              string     `json:"name"`
	Relationship      string     `json:"relationship"` // spouse, child, parent, sibling, other
	DateOfBirth       *time.Time `json:"dateOfBirth,omitempty"`
	Gender            string     `json:"gender"`
	IsCovered         bool       `json:"isCovered"`
	CoverageStartDate *time.Time `json:"coverageStartDate,omitempty"`
	CoverageEndDate   *time.Time `json:"coverageEndDate,omitempty"`
}

// EmployeeInsuranceEnrollment mirrors the insurance-specific slice of
// terai/services/benefits.service.ts EmployeeBenefit.
type EmployeeInsuranceEnrollment struct {
	ID                 int        `json:"id"`
	EmployeeID         int        `json:"employeeId"`
	PlanID             int        `json:"planId"`
	EffectiveDate      time.Time  `json:"effectiveDate"`
	EndDate            *time.Time `json:"endDate,omitempty"`
	Status             string     `json:"status"` // active, pending, inactive, terminated
	TerminationReason  string     `json:"terminationReason,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
	PlanName     string `json:"planName,omitempty"`
	PlanType     string `json:"planType,omitempty"`
}
