package repository

import (
	"context"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== EMPLOYEE REPOSITORY ====================

// GetEmployeeIDByUserID resolves the employee record linked to a logged-in user account.
// Returns 0 if the user has no linked employee record.
func GetEmployeeIDByUserID(ctx context.Context, userID int) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}
	var employeeID int
	err := GetDB().QueryRow(ctx, `SELECT id FROM employees WHERE user_id = $1`, userID).Scan(&employeeID)
	if err != nil {
		return 0, nil
	}
	return employeeID, nil
}

// CreateEmployee inserts a new employee record
func CreateEmployee(ctx context.Context, emp *models.Employee) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employees (
			employee_id, user_id, candidate_id, full_name, email, phone,
			birth_date, birth_place, gender, marital_status, religion, blood_type,
			national_id, tax_id, tax_status, bpjs_kesehatan, bpjs_ketenagakerjaan,
			photo_url, address, city, province, postal_code,
			department_id, position_id, manager_id, employment_type, employment_status,
			join_date, end_date, probation_end_date,
			bank_name, bank_account, bank_account_name
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17,
			$18, $19, $20, $21, $22,
			$23, $24, $25, $26, $27,
			$28, $29, $30,
			$31, $32, $33
		) RETURNING id
	`,
		emp.EmployeeID, emp.UserID, emp.CandidateID, emp.FullName, emp.Email, emp.Phone,
		emp.BirthDate, emp.BirthPlace, emp.Gender, emp.MaritalStatus, emp.Religion, emp.BloodType,
		emp.NationalID, emp.TaxID, emp.TaxStatus, emp.BpjsKesehatan, emp.BpjsKetenagakerjaan,
		emp.PhotoURL, emp.Address, emp.City, emp.Province, emp.PostalCode,
		emp.DepartmentID, emp.PositionID, emp.ManagerID, emp.EmploymentType, emp.EmploymentStatus,
		emp.JoinDate, emp.EndDate, emp.ProbationEndDate,
		emp.BankName, emp.BankAccount, emp.BankAccountName,
	).Scan(&id)

	return id, err
}

// UpdateEmployee updates an existing employee
func UpdateEmployee(ctx context.Context, emp *models.Employee) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE employees SET
			full_name=$1, email=$2, phone=$3,
			birth_date=$4, birth_place=$5, gender=$6, marital_status=$7, religion=$8, blood_type=$9,
			national_id=$10, tax_id=$11, tax_status=$12, bpjs_kesehatan=$13, bpjs_ketenagakerjaan=$14,
			photo_url=$15, address=$16, city=$17, province=$18, postal_code=$19,
			department_id=$20, position_id=$21, manager_id=$22, employment_type=$23, employment_status=$24,
			join_date=$25, end_date=$26, probation_end_date=$27,
			bank_name=$28, bank_account=$29, bank_account_name=$30,
			updated_at=CURRENT_TIMESTAMP
		WHERE id=$31
	`,
		emp.FullName, emp.Email, emp.Phone,
		emp.BirthDate, emp.BirthPlace, emp.Gender, emp.MaritalStatus, emp.Religion, emp.BloodType,
		emp.NationalID, emp.TaxID, emp.TaxStatus, emp.BpjsKesehatan, emp.BpjsKetenagakerjaan,
		emp.PhotoURL, emp.Address, emp.City, emp.Province, emp.PostalCode,
		emp.DepartmentID, emp.PositionID, emp.ManagerID, emp.EmploymentType, emp.EmploymentStatus,
		emp.JoinDate, emp.EndDate, emp.ProbationEndDate,
		emp.BankName, emp.BankAccount, emp.BankAccountName,
		emp.ID,
	)

	return err
}

// UpdateEmployeePhotoURL updates only the photo_url column — used by the profile-photo
// upload/delete flow (Module 15) so a photo change never touches any other employee field
// (unlike the full UpdateEmployee, which is a whole-record overwrite).
func UpdateEmployeePhotoURL(ctx context.Context, employeeID int, photoURL string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `UPDATE employees SET photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, photoURL, employeeID)
	return err
}

// GetEmployeeByID retrieves an employee by ID with joined department/position names
func GetEmployeeByID(ctx context.Context, id int) (*models.Employee, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var e models.Employee
	err := GetDB().QueryRow(ctx, `
		SELECT e.id, e.employee_id, e.user_id, e.candidate_id, e.full_name, e.email, COALESCE(e.phone, ''),
			e.birth_date, COALESCE(e.birth_place, ''), COALESCE(e.gender, ''), COALESCE(e.marital_status, ''),
			COALESCE(e.religion, ''), COALESCE(e.blood_type, ''),
			COALESCE(e.national_id, ''), COALESCE(e.tax_id, ''), COALESCE(e.tax_status, ''),
			COALESCE(e.bpjs_kesehatan, ''), COALESCE(e.bpjs_ketenagakerjaan, ''),
			COALESCE(e.photo_url, ''), COALESCE(e.address, ''), COALESCE(e.city, ''),
			COALESCE(e.province, ''), COALESCE(e.postal_code, ''),
			e.department_id, e.position_id, e.manager_id, COALESCE(e.employment_type, ''), COALESCE(e.employment_status, ''),
			e.join_date, e.end_date, e.probation_end_date, e.resignation_date,
			COALESCE(e.bank_name, ''), COALESCE(e.bank_account, ''), COALESCE(e.bank_account_name, ''),
			e.created_at, e.updated_at,
			COALESCE(d.name, ''), COALESCE(p.name, ''), COALESCE(m.full_name, '')
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN positions p ON e.position_id = p.id
		LEFT JOIN employees m ON e.manager_id = m.id
		WHERE e.id = $1 AND e.deleted_at IS NULL
	`, id).Scan(
		&e.ID, &e.EmployeeID, &e.UserID, &e.CandidateID, &e.FullName, &e.Email, &e.Phone,
		&e.BirthDate, &e.BirthPlace, &e.Gender, &e.MaritalStatus, &e.Religion, &e.BloodType,
		&e.NationalID, &e.TaxID, &e.TaxStatus, &e.BpjsKesehatan, &e.BpjsKetenagakerjaan,
		&e.PhotoURL, &e.Address, &e.City, &e.Province, &e.PostalCode,
		&e.DepartmentID, &e.PositionID, &e.ManagerID, &e.EmploymentType, &e.EmploymentStatus,
		&e.JoinDate, &e.EndDate, &e.ProbationEndDate, &e.ResignationDate,
		&e.BankName, &e.BankAccount, &e.BankAccountName,
		&e.CreatedAt, &e.UpdatedAt,
		&e.DepartmentName, &e.PositionName, &e.ManagerName,
	)

	if err != nil {
		return nil, err
	}
	return &e, nil
}

// GetEmployees retrieves employees with filters and pagination
func GetEmployees(ctx context.Context, filter models.EmployeeFilter) ([]models.Employee, int64, error) {
	if !IsDBConnected() {
		return []models.Employee{}, 0, nil
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	// Build WHERE clause
	where := "WHERE e.deleted_at IS NULL"
	args := []interface{}{}
	argIdx := 1

	if filter.Search != "" {
		where += fmt.Sprintf(" AND (e.full_name ILIKE $%d OR e.email ILIKE $%d OR e.employee_id ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+filter.Search+"%")
		argIdx++
	}
	if filter.DepartmentID > 0 {
		where += fmt.Sprintf(" AND e.department_id = $%d", argIdx)
		args = append(args, filter.DepartmentID)
		argIdx++
	}
	if filter.PositionID > 0 {
		where += fmt.Sprintf(" AND e.position_id = $%d", argIdx)
		args = append(args, filter.PositionID)
		argIdx++
	}
	if filter.EmploymentType != "" {
		where += fmt.Sprintf(" AND e.employment_type = $%d", argIdx)
		args = append(args, filter.EmploymentType)
		argIdx++
	}
	if filter.EmploymentStatus != "" {
		where += fmt.Sprintf(" AND e.employment_status = $%d", argIdx)
		args = append(args, filter.EmploymentStatus)
		argIdx++
	}

	// Count
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM employees e %s", where)
	err := GetDB().QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Fetch
	args = append(args, filter.Limit, offset)
	query := fmt.Sprintf(`
		SELECT e.id, e.employee_id, e.full_name, e.email, COALESCE(e.phone, ''),
			COALESCE(e.gender, ''), e.department_id, e.position_id,
			COALESCE(e.employment_type, ''), COALESCE(e.employment_status, ''),
			e.join_date, COALESCE(e.photo_url, ''), e.created_at,
			COALESCE(d.name, ''), COALESCE(p.name, '')
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN positions p ON e.position_id = p.id
		%s
		ORDER BY e.created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argIdx, argIdx+1)

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var employees []models.Employee
	for rows.Next() {
		var e models.Employee
		err := rows.Scan(
			&e.ID, &e.EmployeeID, &e.FullName, &e.Email, &e.Phone,
			&e.Gender, &e.DepartmentID, &e.PositionID, &e.EmploymentType, &e.EmploymentStatus,
			&e.JoinDate, &e.PhotoURL, &e.CreatedAt,
			&e.DepartmentName, &e.PositionName,
		)
		if err != nil {
			log.Printf("Error scanning employee: %v", err)
			continue
		}
		employees = append(employees, e)
	}

	return employees, total, nil
}

// DeleteEmployee soft-deletes an employee by setting status to 'terminated'
func DeleteEmployee(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE employees SET employment_status = 'terminated', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id)
	return err
}

// GetEmployeeStats returns summary stats for dashboard
func GetEmployeeStats(ctx context.Context) (map[string]interface{}, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	stats := make(map[string]interface{})

	// Total active employees
	var totalActive int
	GetDB().QueryRow(ctx, "SELECT COUNT(*) FROM employees WHERE employment_status = 'active'").Scan(&totalActive)
	stats["totalActive"] = totalActive

	// By employment type
	rows, err := GetDB().Query(ctx, `
		SELECT employment_type, COUNT(*) FROM employees 
		WHERE employment_status = 'active' 
		GROUP BY employment_type
	`)
	if err == nil {
		defer rows.Close()
		byType := map[string]int{}
		for rows.Next() {
			var t string
			var c int
			rows.Scan(&t, &c)
			byType[t] = c
		}
		stats["byType"] = byType
	}

	// By department
	deptRows, err := GetDB().Query(ctx, `
		SELECT COALESCE(d.name, 'Unassigned'), COUNT(*) 
		FROM employees e 
		LEFT JOIN departments d ON e.department_id = d.id
		WHERE e.employment_status = 'active'
		GROUP BY d.name
		ORDER BY COUNT(*) DESC
		LIMIT 10
	`)
	if err == nil {
		defer deptRows.Close()
		byDept := map[string]int{}
		for deptRows.Next() {
			var d string
			var c int
			deptRows.Scan(&d, &c)
			byDept[d] = c
		}
		stats["byDepartment"] = byDept
	}

	// Contracts expiring soon (next 30 days)
	var expiringContracts int
	GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employee_contracts 
		WHERE status = 'active' AND end_date IS NOT NULL 
		AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
	`).Scan(&expiringContracts)
	stats["expiringContracts"] = expiringContracts

	// New hires this month
	var newHires int
	GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees 
		WHERE join_date >= DATE_TRUNC('month', CURRENT_DATE)
		AND employment_status = 'active'
	`).Scan(&newHires)
	stats["newHiresThisMonth"] = newHires

	return stats, nil
}

// GenerateEmployeeID creates a new employee ID like EMP-2026-0001
func GenerateEmployeeID(ctx context.Context) (string, error) {
	if !IsDBConnected() {
		return "", fmt.Errorf("database not connected")
	}

	var count int
	err := GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees 
		WHERE employee_id LIKE 'EMP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%'
	`).Scan(&count)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("EMP-%s-%04d", fmt.Sprintf("%d", 2026), count+1), nil
}
