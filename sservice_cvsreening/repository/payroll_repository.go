package repository

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== PAYROLL REPOSITORY ====================

// GetPayrollPeriods retrieves all payroll periods
func GetPayrollPeriods(ctx context.Context) ([]models.PayrollPeriod, error) {
	if !IsDBConnected() {
		return []models.PayrollPeriod{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, name, start_date, end_date, payment_date, status, total_disbursement, created_at, updated_at
		FROM payroll_periods
		ORDER BY start_date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	periods := []models.PayrollPeriod{}
	for rows.Next() {
		var p models.PayrollPeriod
		err := rows.Scan(
			&p.ID, &p.Name, &p.StartDate, &p.EndDate, &p.PaymentDate,
			&p.Status, &p.TotalDisbursement, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning payroll period: %v", err)
			continue
		}
		periods = append(periods, p)
	}

	return periods, nil
}

// CreatePayrollPeriod creates a new payroll period
func CreatePayrollPeriod(ctx context.Context, p *models.PayrollPeriod) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO payroll_periods (name, start_date, end_date, status)
		VALUES ($1, $2, $3, 'draft')
		RETURNING id
	`, p.Name, p.StartDate, p.EndDate).Scan(&id)

	return id, err
}

// GetSalaryConfigurations retrieves salary configs for all employees
func GetSalaryConfigurations(ctx context.Context) ([]models.SalaryConfiguration, error) {
	if !IsDBConnected() {
		return []models.SalaryConfiguration{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT s.id, s.employee_id, s.base_salary, s.transport_allowance, s.meal_allowance,
			s.position_allowance, s.bpjs_kesehatan_type, s.bpjs_ketenagakerjaan_type,
			s.updated_at, e.full_name, COALESCE(sg.level, 0), COALESCE(sg.name, 'Unassigned'),
			COALESCE((SELECT AVG(overall_rating) FROM performance_reviews
				WHERE employee_id = s.employee_id AND status = 'completed'), 0)
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		LEFT JOIN positions p ON e.position_id = p.id
		LEFT JOIN salary_grades sg ON sg.level = p.level
		WHERE e.employment_status = 'active'
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	configs := []models.SalaryConfiguration{}
	for rows.Next() {
		var sc models.SalaryConfiguration
		err := rows.Scan(
			&sc.ID, &sc.EmployeeID, &sc.BaseSalary, &sc.TransportAllowance, &sc.MealAllowance,
			&sc.PositionAllowance, &sc.BpjsKesehatanType, &sc.BpjsKetenagakerjaanType,
			&sc.UpdatedAt, &sc.EmployeeName, &sc.GradeLevel, &sc.GradeName, &sc.LatestPerformanceRating,
		)
		if err != nil {
			continue
		}
		configs = append(configs, sc)
	}

	return configs, nil
}

// UpdateSalaryConfiguration updates or inserts salary config
func UpdateSalaryConfiguration(ctx context.Context, sc *models.SalaryConfiguration) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		INSERT INTO salary_configurations (employee_id, base_salary, transport_allowance, meal_allowance, position_allowance)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (employee_id) DO UPDATE SET
			base_salary = EXCLUDED.base_salary,
			transport_allowance = EXCLUDED.transport_allowance,
			meal_allowance = EXCLUDED.meal_allowance,
			position_allowance = EXCLUDED.position_allowance,
			updated_at = CURRENT_TIMESTAMP
	`, sc.EmployeeID, sc.BaseSalary, sc.TransportAllowance, sc.MealAllowance, sc.PositionAllowance)

	return err
}

// GeneratePayroll for a specific period — integrates with attendance & leave data
func GeneratePayroll(ctx context.Context, periodID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	// 1. Get the period dates
	var startDate, endDate string
	err := GetDB().QueryRow(ctx, `
		SELECT start_date::text, end_date::text FROM payroll_periods WHERE id = $1
	`, periodID).Scan(&startDate, &endDate)
	if err != nil {
		return fmt.Errorf("period not found: %v", err)
	}

	// 2. Count working days in the period (excluding weekends, simplified)
	var totalWorkingDays int
	err = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM generate_series($1::date, $2::date, '1 day'::interval) AS d
		WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
	`, startDate, endDate).Scan(&totalWorkingDays)
	if err != nil || totalWorkingDays == 0 {
		totalWorkingDays = 22 // fallback: standard working days
	}

	// 3. Get all active employees with salary config
	rows, err := GetDB().Query(ctx, `
		SELECT e.id, s.base_salary, s.transport_allowance, s.meal_allowance, s.position_allowance,
			COALESCE(e.tax_status, ''), COALESCE(s.bpjs_kesehatan_type, 'company_standard'), 
			COALESCE(s.bpjs_ketenagakerjaan_type, 'company_standard')
		FROM employees e
		JOIN salary_configurations s ON e.id = s.employee_id
		WHERE e.employment_status = 'active'
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type EmpSalary struct {
		ID                        int
		Base, Transport, Meal, Position float64
		TaxStatus                 string
		BpjsKesehatanType         string
		BpjsKetenagakerjaanType   string
	}
	var empSalaries []EmpSalary
	for rows.Next() {
		var es EmpSalary
		if err := rows.Scan(&es.ID, &es.Base, &es.Transport, &es.Meal, &es.Position,
			&es.TaxStatus, &es.BpjsKesehatanType, &es.BpjsKetenagakerjaanType); err == nil {
			empSalaries = append(empSalaries, es)
		}
	}
	rows.Close()

	// Load dynamic tax/BPJS config once for the whole run (Finance-editable, no hardcoded rates)
	bpjsCfg, err := GetBPJSRateConfig(ctx)
	if err != nil {
		return fmt.Errorf("failed to load BPJS rate config: %v", err)
	}
	terBracketsByCategory := map[string][]models.PPh21TERBracket{}
	for _, cat := range []string{"A", "B", "C"} {
		brackets, err := GetTERBracketsForCategory(ctx, cat)
		if err != nil {
			return fmt.Errorf("failed to load PPh21 TER brackets for category %s: %v", cat, err)
		}
		terBracketsByCategory[cat] = brackets
	}

	return WithTransaction(ctx, func(ctx context.Context, tx pgx.Tx) error {
		// Update period status
		_, err := tx.Exec(ctx, "UPDATE payroll_periods SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = $1", periodID)
		if err != nil {
			return err
		}

		for _, es := range empSalaries {
			// 4. Get attendance stats for this employee in the period
			var attendanceDays int
			var absentDays int
			var lateDays int
			var overtimeHours float64

			_ = GetDB().QueryRow(ctx, `
				SELECT 
					COUNT(*) FILTER (WHERE status IN ('present', 'late')) as attendance_days,
					COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
					COUNT(*) FILTER (WHERE status = 'late') as late_days,
					COALESCE(SUM(overtime_hours), 0) as overtime_hours
				FROM attendances
				WHERE employee_id = $1 AND date BETWEEN $2::date AND $3::date
			`, es.ID, startDate, endDate).Scan(&attendanceDays, &absentDays, &lateDays, &overtimeHours)

			// 5. Calculate attendance deduction (absent days proportionally deduct salary)
			dailyRate := es.Base / float64(totalWorkingDays)
			attendanceDeduction := float64(absentDays) * dailyRate

			// 6. Calculate overtime addition (1.5x hourly rate for overtime hours)
			hourlyRate := es.Base / float64(totalWorkingDays) / 8
			overtimeAddition := overtimeHours * hourlyRate * 1.5

			// 7. Calculate BPJS & Tax
			totalAllowance := es.Transport + es.Meal + es.Position
			grossSalary := es.Base + totalAllowance - attendanceDeduction + overtimeAddition

			bpjsKesehatan := CalculateBPJSKesehatanEmployeeDynamic(es.Base, es.BpjsKesehatanType, bpjsCfg)
			bpjsJHT, bpjsJP := CalculateBPJSKetenagakerjaanEmployeeDynamic(es.Base, es.BpjsKetenagakerjaanType, bpjsCfg)
			terCategory := TerCategoryForTaxStatus(es.TaxStatus)
			pph21 := CalculatePPh21MonthlyDynamic(grossSalary-bpjsKesehatan-bpjsJHT-bpjsJP, es.TaxStatus, terBracketsByCategory[terCategory])

			// 7b. Other recurring deductions (loan installments, cooperative dues, penalties, ...)
			otherDeductions, err := GetActiveDeductionsForPayroll(ctx, es.ID)
			if err != nil {
				log.Printf("Failed to load other deductions for employee %d: %v", es.ID, err)
				otherDeductions = nil
			}
			var otherDeductionTotal float64
			otherDeductionAmounts := make([]float64, len(otherDeductions))
			for i, d := range otherDeductions {
				var amt float64
				if d.CalculationType == "percentage_of_base" {
					amt = es.Base * *d.Rate
				} else {
					amt = *d.Amount
				}
				if d.RemainingBalance != nil && amt > *d.RemainingBalance {
					amt = *d.RemainingBalance
				}
				otherDeductionAmounts[i] = amt
				otherDeductionTotal += amt
			}

			totalDeduction := bpjsKesehatan + bpjsJHT + bpjsJP + pph21 + attendanceDeduction + otherDeductionTotal
			netSalary := grossSalary - bpjsKesehatan - bpjsJHT - bpjsJP - pph21 - otherDeductionTotal

			var payslipID int
			err = tx.QueryRow(ctx, `
				INSERT INTO payslips (period_id, employee_id, basic_salary, total_allowance, total_deduction, net_salary, status,
					attendance_days, absent_days, late_days, overtime_hours, attendance_deduction, overtime_addition)
				VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, $10, $11, $12)
				ON CONFLICT (period_id, employee_id) DO UPDATE SET
					basic_salary = EXCLUDED.basic_salary,
					total_allowance = EXCLUDED.total_allowance,
					total_deduction = EXCLUDED.total_deduction,
					net_salary = EXCLUDED.net_salary,
					attendance_days = EXCLUDED.attendance_days,
					absent_days = EXCLUDED.absent_days,
					late_days = EXCLUDED.late_days,
					overtime_hours = EXCLUDED.overtime_hours,
					attendance_deduction = EXCLUDED.attendance_deduction,
					overtime_addition = EXCLUDED.overtime_addition
				RETURNING id
			`, periodID, es.ID, es.Base, totalAllowance, totalDeduction, netSalary,
				attendanceDays, absentDays, lateDays, overtimeHours, attendanceDeduction, overtimeAddition).Scan(&payslipID)

			if err != nil {
				log.Printf("Failed to upsert payslip for employee %d: %v", es.ID, err)
				continue
			}

			// 8. Clear and re-insert salary components
			_, _ = tx.Exec(ctx, "DELETE FROM salary_components WHERE payslip_id = $1", payslipID)

			components := []struct{ name string; amt float64; ctype string }{
				{"Base Salary", es.Base, "allowance"},
				{"Transport Allowance", es.Transport, "allowance"},
				{"Meal Allowance", es.Meal, "allowance"},
				{"Position Allowance", es.Position, "allowance"},
				{"Overtime Addition", overtimeAddition, "allowance"},
				{"Attendance Deduction", attendanceDeduction, "deduction"},
				{"BPJS Kesehatan (Karyawan)", bpjsKesehatan, "deduction"},
				{"BPJS JHT (Karyawan)", bpjsJHT, "deduction"},
				{"BPJS JP (Karyawan)", bpjsJP, "deduction"},
				{"PPh21", pph21, "deduction"},
			}

			for _, comp := range components {
				if comp.amt > 0 {
					_, _ = tx.Exec(ctx, `
						INSERT INTO salary_components (payslip_id, name, type, amount)
						VALUES ($1, $2, $3, $4)
					`, payslipID, comp.name, comp.ctype, comp.amt)
				}
			}

			// 8b. Insert other-deduction components and decrement any installment balances
			for i, d := range otherDeductions {
				amt := otherDeductionAmounts[i]
				if amt <= 0 {
					continue
				}
				_, _ = tx.Exec(ctx, `
					INSERT INTO salary_components (payslip_id, name, type, amount)
					VALUES ($1, $2, 'deduction', $3)
				`, payslipID, d.DeductionName, amt)

				if d.RemainingBalance != nil {
					if _, err := tx.Exec(ctx, `
						UPDATE employee_deductions SET
							remaining_balance = GREATEST(remaining_balance - $1, 0),
							is_active = CASE WHEN remaining_balance - $1 <= 0 THEN false ELSE is_active END,
							updated_at = CURRENT_TIMESTAMP
						WHERE id = $2
					`, amt, d.ID); err != nil {
						log.Printf("Failed to decrement deduction balance %d for employee %d: %v", d.ID, es.ID, err)
					}
				}
			}
		}

		// 9. Update total disbursement
		_, err = tx.Exec(ctx, `
			UPDATE payroll_periods SET 
				total_disbursement = (SELECT COALESCE(SUM(net_salary), 0) FROM payslips WHERE period_id = $1),
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $1
		`, periodID)

		return err
	})
}




// GetPayslipsByPeriod retrieves all payslips for a period
func GetPayslipsByPeriod(ctx context.Context, periodID int) ([]models.Payslip, error) {
	if !IsDBConnected() {
		return []models.Payslip{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT p.id, p.period_id, p.employee_id, p.basic_salary, p.total_allowance, 
			p.total_deduction, p.net_salary, p.status, p.paid_at, p.created_at,
			e.full_name, e.employee_id
		FROM payslips p
		JOIN employees e ON p.employee_id = e.id
		WHERE p.period_id = $1
	`, periodID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	payslips := []models.Payslip{}
	for rows.Next() {
		var p models.Payslip
		err := rows.Scan(
			&p.ID, &p.PeriodID, &p.EmployeeID, &p.BasicSalary, &p.TotalAllowance,
			&p.TotalDeduction, &p.NetSalary, &p.Status, &p.PaidAt, &p.CreatedAt,
			&p.EmployeeName, &p.EmployeeID_Str,
		)
		if err != nil {
			continue
		}
		payslips = append(payslips, p)
	}
	return payslips, nil
}

// GetPayslipsForEmployee retrieves an employee's own payslips across all periods (self-service)
func GetPayslipsForEmployee(ctx context.Context, employeeID int) ([]models.Payslip, error) {
	if !IsDBConnected() {
		return []models.Payslip{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT p.id, p.period_id, p.employee_id, p.basic_salary, p.total_allowance,
			p.total_deduction, p.net_salary, p.status, p.paid_at, p.created_at,
			e.full_name, e.employee_id, pp.name
		FROM payslips p
		JOIN employees e ON p.employee_id = e.id
		JOIN payroll_periods pp ON p.period_id = pp.id
		WHERE p.employee_id = $1 AND p.status IN ('released', 'paid')
		ORDER BY pp.start_date DESC
	`, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	payslips := []models.Payslip{}
	for rows.Next() {
		var p models.Payslip
		var periodName string
		err := rows.Scan(
			&p.ID, &p.PeriodID, &p.EmployeeID, &p.BasicSalary, &p.TotalAllowance,
			&p.TotalDeduction, &p.NetSalary, &p.Status, &p.PaidAt, &p.CreatedAt,
			&p.EmployeeName, &p.EmployeeID_Str, &periodName,
		)
		if err != nil {
			continue
		}
		p.DepartmentName = periodName // reused field to carry the period label for the self-service view
		payslips = append(payslips, p)
	}
	return payslips, nil
}

// GetPayslipComponents retrieves the allowance/deduction breakdown for one payslip
func GetPayslipComponents(ctx context.Context, payslipID int) ([]models.SalaryComponent, error) {
	if !IsDBConnected() {
		return []models.SalaryComponent{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, payslip_id, name, type, amount, COALESCE(description, '')
		FROM salary_components
		WHERE payslip_id = $1
		ORDER BY type, name
	`, payslipID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	components := []models.SalaryComponent{}
	for rows.Next() {
		var comp models.SalaryComponent
		if err := rows.Scan(&comp.ID, &comp.PayslipID, &comp.Name, &comp.Type, &comp.Amount, &comp.Description); err == nil {
			components = append(components, comp)
		}
	}
	return components, nil
}

// GetPayslipOwnerEmployeeID resolves which employee a payslip belongs to (for self-service auth checks)
func GetPayslipOwnerEmployeeID(ctx context.Context, payslipID int) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var employeeID int
	err := GetDB().QueryRow(ctx, `SELECT employee_id FROM payslips WHERE id = $1`, payslipID).Scan(&employeeID)
	return employeeID, err
}

// GetTeamPayslipsForManager retrieves the most recent released payslip per direct report of a manager
func GetTeamPayslipsForManager(ctx context.Context, managerEmployeeID int) ([]models.Payslip, error) {
	if !IsDBConnected() {
		return []models.Payslip{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT DISTINCT ON (p.employee_id) p.id, p.period_id, p.employee_id, p.basic_salary, p.total_allowance,
			p.total_deduction, p.net_salary, p.status, p.paid_at, p.created_at,
			e.full_name, e.employee_id, pp.name
		FROM payslips p
		JOIN employees e ON p.employee_id = e.id
		JOIN payroll_periods pp ON p.period_id = pp.id
		WHERE e.manager_id = $1 AND p.status IN ('released', 'paid')
		ORDER BY p.employee_id, pp.start_date DESC
	`, managerEmployeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	payslips := []models.Payslip{}
	for rows.Next() {
		var p models.Payslip
		var periodName string
		err := rows.Scan(
			&p.ID, &p.PeriodID, &p.EmployeeID, &p.BasicSalary, &p.TotalAllowance,
			&p.TotalDeduction, &p.NetSalary, &p.Status, &p.PaidAt, &p.CreatedAt,
			&p.EmployeeName, &p.EmployeeID_Str, &periodName,
		)
		if err != nil {
			continue
		}
		p.DepartmentName = periodName
		payslips = append(payslips, p)
	}
	return payslips, nil
}

// UpdatePayrollPeriodStatus updates the status of a payroll period (e.g. close, cancel)
func UpdatePayrollPeriodStatus(ctx context.Context, periodID int, status string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	return WithTransaction(ctx, func(ctx context.Context, tx pgx.Tx) error {
		// Update payroll_periods status
		_, err := tx.Exec(ctx, `
			UPDATE payroll_periods
			SET status = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
		`, status, periodID)
		if err != nil {
			return err
		}

		// Maker-Checker: cascade status to payslips
		// If period is 'approved' or 'released', mark payslips as 'released'
		// If period is 'paid', mark payslips as 'paid'
		var payslipStatus string
		if status == "approved" || status == "released" {
			payslipStatus = "released"
		} else if status == "paid" || status == "completed" {
			payslipStatus = "paid"
		}

		if payslipStatus != "" {
			_, err = tx.Exec(ctx, `
				UPDATE payslips
				SET status = $1
				WHERE period_id = $2
			`, payslipStatus, periodID)
			if err != nil {
				return err
			}
		}

		return nil
	})
}

