package repository

import (
	"context"
	"fmt"
)

// CompanyPolicy represents a company policy document
type CompanyPolicy struct {
	ID                     int     `json:"id"`
	Title                  string  `json:"title"`
	Description            string  `json:"description"`
	Category               string  `json:"category"`
	Version                string  `json:"version"`
	EffectiveDate          string  `json:"effectiveDate"`
	ExpiryDate             *string `json:"expiryDate,omitempty"`
	Status                 string  `json:"status"`
	RequiresAcknowledgment bool    `json:"requiresAcknowledgment"`
	CreatedAt              string  `json:"createdAt"`
	UpdatedAt              string  `json:"updatedAt"`
}

// GetPolicies retrieves company policies with optional category/status filters
func GetPolicies(ctx context.Context, category, status string, limit int) ([]CompanyPolicy, int, error) {
	policies := []CompanyPolicy{}
	if !IsDBConnected() {
		return policies, 0, nil
	}
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, title, description, category, version,
			effective_date::text, expiry_date::text,
			status, requires_acknowledgment, created_at::text, updated_at::text
		FROM company_policies
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1
	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var p CompanyPolicy
		if err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.Category, &p.Version,
			&p.EffectiveDate, &p.ExpiryDate, &p.Status, &p.RequiresAcknowledgment,
			&p.CreatedAt, &p.UpdatedAt); err == nil {
			policies = append(policies, p)
		}
	}

	var total int
	_ = GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM company_policies").Scan(&total)

	return policies, total, nil
}

// CreatePolicy inserts a new company policy and returns its id.
func CreatePolicy(ctx context.Context, p *CompanyPolicy, content string, createdBy *int) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO company_policies (title, description, category, version, effective_date,
			expiry_date, status, content, requires_acknowledgment, created_by)
		VALUES ($1, $2, COALESCE($3, 'general'), COALESCE($4, '1.0'), COALESCE($5, CURRENT_DATE),
			$6, COALESCE($7, 'draft'), $8, $9, $10)
		RETURNING id
	`, p.Title, p.Description, p.Category, p.Version, p.EffectiveDate,
		p.ExpiryDate, p.Status, content, p.RequiresAcknowledgment, createdBy).Scan(&id)
	return id, err
}

// UpdatePolicy updates an existing company policy by id.
func UpdatePolicy(ctx context.Context, p *CompanyPolicy, content string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE company_policies SET
			title = $1, description = $2, category = $3, version = $4, effective_date = $5,
			expiry_date = $6, status = $7, content = COALESCE($8, content),
			requires_acknowledgment = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $10
	`, p.Title, p.Description, p.Category, p.Version, p.EffectiveDate,
		p.ExpiryDate, p.Status, nullIfEmptyStr(content), p.RequiresAcknowledgment, p.ID)
	return err
}

// DeletePolicy removes a company policy by id.
func DeletePolicy(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM company_policies WHERE id = $1`, id)
	return err
}

func nullIfEmptyStr(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// EmploymentContractSummary is a lightweight contract listing for the Documents dashboard
type EmploymentContractSummary struct {
	ID           int     `json:"id"`
	EmployeeID   int     `json:"employeeId"`
	EmployeeName string  `json:"employeeName"`
	ContractType string  `json:"contractType"`
	StartDate    string  `json:"startDate"`
	EndDate      *string `json:"endDate,omitempty"`
	Status       string  `json:"status"`
	Salary       float64 `json:"salary"`
	Position     string  `json:"position"`
	Department   string  `json:"department"`
	CreatedAt    string  `json:"createdAt"`
	UpdatedAt    string  `json:"updatedAt"`
}

// GetContractSummaries reuses the existing employee_contracts table for the Documents dashboard listing
func GetContractSummaries(ctx context.Context, status string, limit int) ([]EmploymentContractSummary, int, error) {
	contracts := []EmploymentContractSummary{}
	if !IsDBConnected() {
		return contracts, 0, nil
	}
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT c.id, c.employee_id, e.full_name, c.contract_type,
			c.start_date::text, c.end_date::text, c.status,
			COALESCE(s.base_salary, 0), COALESCE(p.name, ''), COALESCE(d.name, ''),
			c.created_at::text, c.updated_at::text
		FROM employee_contracts c
		JOIN employees e ON c.employee_id = e.id
		LEFT JOIN positions p ON e.position_id = p.id
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN salary_configurations s ON s.employee_id = e.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1
	if status != "" {
		query += fmt.Sprintf(" AND c.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	query += fmt.Sprintf(" ORDER BY c.start_date DESC LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var c EmploymentContractSummary
		if err := rows.Scan(&c.ID, &c.EmployeeID, &c.EmployeeName, &c.ContractType, &c.StartDate,
			&c.EndDate, &c.Status, &c.Salary, &c.Position, &c.Department,
			&c.CreatedAt, &c.UpdatedAt); err == nil {
			contracts = append(contracts, c)
		}
	}

	var total int
	_ = GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM employee_contracts").Scan(&total)

	return contracts, total, nil
}

// ComplianceRecord tracks policy acknowledgments and other compliance items
type ComplianceRecord struct {
	ID             int     `json:"id"`
	PolicyID       *int    `json:"policyId,omitempty"`
	EmployeeID     int     `json:"employeeId"`
	EmployeeName   string  `json:"employeeName"`
	ComplianceType string  `json:"complianceType"`
	Status         string  `json:"status"`
	DueDate        *string `json:"dueDate,omitempty"`
	CompletedDate  *string `json:"completedDate,omitempty"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt"`
}

// GetComplianceRecords retrieves compliance tracking records
func GetComplianceRecords(ctx context.Context, status string, limit int) ([]ComplianceRecord, int, error) {
	records := []ComplianceRecord{}
	if !IsDBConnected() {
		return records, 0, nil
	}
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT cr.id, cr.policy_id, cr.employee_id, e.full_name, cr.compliance_type, cr.status,
			cr.due_date::text, cr.completed_date::text, cr.created_at::text, cr.updated_at::text
		FROM compliance_records cr
		JOIN employees e ON cr.employee_id = e.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1
	if status != "" {
		query += fmt.Sprintf(" AND cr.status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	query += fmt.Sprintf(" ORDER BY cr.created_at DESC LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var r ComplianceRecord
		if err := rows.Scan(&r.ID, &r.PolicyID, &r.EmployeeID, &r.EmployeeName, &r.ComplianceType,
			&r.Status, &r.DueDate, &r.CompletedDate, &r.CreatedAt, &r.UpdatedAt); err == nil {
			records = append(records, r)
		}
	}

	var total int
	_ = GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM compliance_records").Scan(&total)

	return records, total, nil
}
