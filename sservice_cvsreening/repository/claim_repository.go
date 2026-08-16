package repository

import (
	"context"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// CreateClaim inserts a new expense claim for an employee and returns its id.
func CreateClaim(ctx context.Context, c *models.Claim) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO claims (employee_id, claim_type, amount, description, receipt_url, status)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), 'pending')
		RETURNING id
	`, c.EmployeeID, c.ClaimType, c.Amount, c.Description, c.ReceiptURL).Scan(&id)
	return id, err
}

// GetClaimByID retrieves a single claim by id.
func GetClaimByID(ctx context.Context, id int) (*models.Claim, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var c models.Claim
	err := GetDB().QueryRow(ctx, `
		SELECT id, employee_id, claim_type, amount, COALESCE(description, ''), COALESCE(receipt_url, ''),
			status, created_at, updated_at
		FROM claims WHERE id = $1
	`, id).Scan(&c.ID, &c.EmployeeID, &c.ClaimType, &c.Amount, &c.Description, &c.ReceiptURL,
		&c.Status, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// UpdateClaimStatus is the module-specific finalization hook invoked by the approval engine
// (see finalizeApprovedRequest / actOnApprovalRequestHandler) when a claim's approval request
// reaches a final state — keeps claims.status in sync with approval_requests.status so
// GET /claims/my reflects the real outcome instead of staying "pending" forever.
func UpdateClaimStatus(ctx context.Context, claimID int, status string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `UPDATE claims SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, status, claimID)
	return err
}

// GetClaimsByEmployeeID lists an employee's own claims, most recent first.
func GetClaimsByEmployeeID(ctx context.Context, employeeID int) ([]models.Claim, error) {
	claims := []models.Claim{}
	if !IsDBConnected() {
		return claims, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, employee_id, claim_type, amount, COALESCE(description, ''), COALESCE(receipt_url, ''),
			status, created_at, updated_at
		FROM claims
		WHERE employee_id = $1
		ORDER BY created_at DESC
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Claim
		if err := rows.Scan(&c.ID, &c.EmployeeID, &c.ClaimType, &c.Amount, &c.Description, &c.ReceiptURL,
			&c.Status, &c.CreatedAt, &c.UpdatedAt); err == nil {
			claims = append(claims, c)
		}
	}
	return claims, nil
}
