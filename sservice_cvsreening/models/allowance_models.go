package models

import "time"

// Allowance mirrors terai/services/benefits.service.ts Allowance.
type Allowance struct {
	ID                  int       `json:"id"`
	Name                string    `json:"name"`
	Description         string    `json:"description"`
	Category            string    `json:"category"` // transport, meal, housing, education, health, other
	Amount              float64   `json:"amount"`
	Frequency           string    `json:"frequency"` // monthly, quarterly, annually
	Taxable             bool      `json:"taxable"`
	Active              bool      `json:"active"`
	EligibilityCriteria string    `json:"eligibilityCriteria"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}

// EmployeeAllowance represents an allowance assigned to an employee.
type EmployeeAllowance struct {
	ID            int        `json:"id"`
	EmployeeID    int        `json:"employeeId"`
	AllowanceID   int        `json:"allowanceId"`
	Amount        float64    `json:"amount"`
	EffectiveDate time.Time  `json:"effectiveDate"`
	EndDate       *time.Time `json:"endDate,omitempty"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"createdAt"`
	// Joined
	EmployeeName  string `json:"employeeName,omitempty"`
	AllowanceName string `json:"allowanceName,omitempty"`
}
