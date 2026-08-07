package models

import "time"

// InsuranceContinuation represents a self-paid extension of insurance coverage
// after an employee's termination/resignation. Indonesian-context equivalent of
// the US "COBRA" concept — see schema_insurance_continuation.sql for rationale.
type InsuranceContinuation struct {
	ID                   int        `json:"id"`
	EmployeeID           int        `json:"employeeId"`
	OriginalEnrollmentID *int       `json:"originalEnrollmentId,omitempty"`
	TerminationDate      time.Time  `json:"terminationDate"`
	ContinuationEndDate  time.Time  `json:"continuationEndDate"`
	MonthlyPremium       float64    `json:"monthlyPremium"`
	Status               string     `json:"status"` // active, expired, cancelled
	LastPaymentDate      *time.Time `json:"lastPaymentDate,omitempty"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
}

// InsuranceContinuationPayment records a single premium payment against a continuation.
type InsuranceContinuationPayment struct {
	ID             int       `json:"id"`
	ContinuationID int       `json:"continuationId"`
	PaymentDate    time.Time `json:"paymentDate"`
	Amount         float64   `json:"amount"`
	Status         string    `json:"status"` // paid, failed, refunded
	CreatedAt      time.Time `json:"createdAt"`
}
