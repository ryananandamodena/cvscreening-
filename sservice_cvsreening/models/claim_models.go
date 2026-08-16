package models

import "time"

// Claim represents an employee's self-service expense reimbursement claim (medical,
// transport, meal, communication, other) — see schema_claims.sql.
type Claim struct {
	ID          int       `json:"id"`
	EmployeeID  int       `json:"employeeId"`
	ClaimType   string    `json:"claimType"` // medical, transport, meal, communication, other
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	ReceiptURL  string    `json:"receiptUrl,omitempty"`
	Status      string    `json:"status"` // pending, approved, rejected, cancelled
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
}
