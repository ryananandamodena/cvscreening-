package repository

import (
	"context"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== BENEFITS EXTRAS ====================

// GetAllEmployeeBenefits retrieves benefit enrollments for every employee
func GetAllEmployeeBenefits(ctx context.Context) ([]models.EmployeeBenefit, error) {
	if !IsDBConnected() {
		return []models.EmployeeBenefit{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT eb.id, eb.employee_id, eb.plan_id, eb.start_date, eb.end_date, eb.status, eb.created_at,
			e.full_name, bp.name, bp.category
		FROM employee_benefits eb
		JOIN employees e ON eb.employee_id = e.id
		JOIN benefit_plans bp ON eb.plan_id = bp.id
		ORDER BY eb.status DESC, e.full_name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	benefits := []models.EmployeeBenefit{}
	for rows.Next() {
		var b models.EmployeeBenefit
		if err := rows.Scan(&b.ID, &b.EmployeeID, &b.PlanID, &b.StartDate, &b.EndDate,
			&b.Status, &b.CreatedAt, &b.EmployeeName, &b.PlanName, &b.PlanCategory); err == nil {
			benefits = append(benefits, b)
		}
	}
	return benefits, nil
}

// BenefitsAnalytics summarizes benefit enrollment data
type BenefitsAnalytics struct {
	TotalActiveBenefits  int                      `json:"totalActiveBenefits"`
	TotalMonthlyCost     float64                  `json:"totalMonthlyCost"`
	TotalAnnualCost      float64                  `json:"totalAnnualCost"`
	BenefitsByType       map[string]int           `json:"benefitsByType"`
	BenefitsByDepartment []map[string]interface{} `json:"benefitsByDepartment"`
	TopBenefits          []map[string]interface{} `json:"topBenefits"`
}

// GetBenefitsAnalytics aggregates benefit enrollment data
func GetBenefitsAnalytics(ctx context.Context) (*BenefitsAnalytics, error) {
	result := &BenefitsAnalytics{
		BenefitsByType:       map[string]int{},
		BenefitsByDepartment: []map[string]interface{}{},
		TopBenefits:          []map[string]interface{}{},
	}
	if !IsDBConnected() {
		return result, nil
	}

	err := GetDB().QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(SUM(bp.employer_contribution), 0)
		FROM employee_benefits eb
		JOIN benefit_plans bp ON eb.plan_id = bp.id
		WHERE eb.status = 'active'
	`).Scan(&result.TotalActiveBenefits, &result.TotalMonthlyCost)
	if err != nil {
		return result, err
	}
	result.TotalAnnualCost = result.TotalMonthlyCost * 12

	typeRows, err := GetDB().Query(ctx, `
		SELECT bp.category, COUNT(*)
		FROM employee_benefits eb
		JOIN benefit_plans bp ON eb.plan_id = bp.id
		WHERE eb.status = 'active'
		GROUP BY bp.category
	`)
	if err == nil {
		defer typeRows.Close()
		for typeRows.Next() {
			var category string
			var count int
			if err := typeRows.Scan(&category, &count); err == nil {
				result.BenefitsByType[category] = count
			}
		}
	}

	deptRows, err := GetDB().Query(ctx, `
		SELECT COALESCE(d.name, 'Unassigned') as department, COUNT(*) as cnt, COALESCE(SUM(bp.employer_contribution), 0) as cost
		FROM employee_benefits eb
		JOIN employees e ON eb.employee_id = e.id
		JOIN benefit_plans bp ON eb.plan_id = bp.id
		LEFT JOIN departments d ON e.department_id = d.id
		WHERE eb.status = 'active'
		GROUP BY d.name
		ORDER BY cnt DESC
	`)
	if err == nil {
		defer deptRows.Close()
		for deptRows.Next() {
			var department string
			var count int
			var cost float64
			if err := deptRows.Scan(&department, &count, &cost); err == nil {
				result.BenefitsByDepartment = append(result.BenefitsByDepartment, map[string]interface{}{
					"department": department,
					"count":      count,
					"cost":       cost,
				})
			}
		}
	}

	topRows, err := GetDB().Query(ctx, `
		SELECT bp.name, COUNT(*) as cnt
		FROM employee_benefits eb
		JOIN benefit_plans bp ON eb.plan_id = bp.id
		WHERE eb.status = 'active'
		GROUP BY bp.name
		ORDER BY cnt DESC
		LIMIT 5
	`)
	if err == nil {
		defer topRows.Close()
		for topRows.Next() {
			var name string
			var count int
			if err := topRows.Scan(&name, &count); err == nil {
				percentage := 0.0
				if result.TotalActiveBenefits > 0 {
					percentage = float64(count) / float64(result.TotalActiveBenefits) * 100
				}
				result.TopBenefits = append(result.TopBenefits, map[string]interface{}{
					"name":       name,
					"count":      count,
					"percentage": percentage,
				})
			}
		}
	}

	return result, nil
}

// ==================== SUCCESSION EXTRAS ====================

// GetAllSuccessionCandidates retrieves succession candidates across every plan
func GetAllSuccessionCandidates(ctx context.Context) ([]models.SuccessionCandidate, error) {
	if !IsDBConnected() {
		return []models.SuccessionCandidate{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT sc.id, sc.plan_id, sc.employee_id, sc.readiness, sc.notes, sc.created_at,
			e.full_name,
			COALESCE(p.name, '') as position_name,
			COALESCE((SELECT AVG(overall_rating) FROM performance_reviews WHERE employee_id = e.id AND status = 'completed'), 0) as performance_score
		FROM succession_candidates sc
		JOIN employees e ON sc.employee_id = e.id
		LEFT JOIN positions p ON e.position_id = p.id
		ORDER BY sc.readiness
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	candidates := []models.SuccessionCandidate{}
	for rows.Next() {
		var sc models.SuccessionCandidate
		if err := rows.Scan(&sc.ID, &sc.PlanID, &sc.EmployeeID, &sc.Readiness,
			&sc.Notes, &sc.CreatedAt, &sc.EmployeeName, &sc.EmployeePosition, &sc.PerformanceScore); err == nil {
			candidates = append(candidates, sc)
		}
	}
	return candidates, nil
}

// NineBoxCell represents one cell of the 9-box succession grid
type NineBoxCell struct {
	Performance int                      `json:"performance"`
	Potential   int                      `json:"potential"`
	Employees   []map[string]interface{} `json:"employees"`
}

// GetNineBoxGrid buckets succession candidates into a 3x3 performance/potential grid
func GetNineBoxGrid(ctx context.Context) ([]NineBoxCell, error) {
	grid := make([]NineBoxCell, 0, 9)
	cellIndex := map[[2]int]int{}
	for perf := 1; perf <= 3; perf++ {
		for pot := 1; pot <= 3; pot++ {
			cellIndex[[2]int{perf, pot}] = len(grid)
			grid = append(grid, NineBoxCell{Performance: perf, Potential: pot, Employees: []map[string]interface{}{}})
		}
	}

	candidates, err := GetAllSuccessionCandidates(ctx)
	if err != nil {
		return grid, err
	}

	potentialFromReadiness := func(readiness string) int {
		switch readiness {
		case "ready_now":
			return 3
		case "1_2_years":
			return 2
		default:
			return 1
		}
	}
	performanceFromScore := func(score float64) int {
		switch {
		case score >= 3.5:
			return 3
		case score >= 2.5:
			return 2
		default:
			return 1
		}
	}

	for _, c := range candidates {
		perf := performanceFromScore(c.PerformanceScore)
		pot := potentialFromReadiness(c.Readiness)
		idx := cellIndex[[2]int{perf, pot}]
		grid[idx].Employees = append(grid[idx].Employees, map[string]interface{}{
			"id":          c.EmployeeID,
			"name":        c.EmployeeName,
			"position":    c.EmployeePosition,
			"performance": perf,
			"potential":   pot,
		})
	}

	return grid, nil
}

// ==================== COMPENSATION EXTRAS ====================

var compensationLevelRank = map[string]int{
	"junior": 1, "mid": 2, "senior": 3, "lead": 4, "manager": 5,
}

// SalaryGrade adapts compensation_bands into the shape the frontend's SalaryGrade type expects
type SalaryGrade struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Level     int     `json:"level"`
	MinSalary float64 `json:"minSalary"`
	MaxSalary float64 `json:"maxSalary"`
	Midpoint  float64 `json:"midpoint"`
	Currency  string  `json:"currency"`
	Active    bool    `json:"active"`
	CreatedAt string  `json:"createdAt"`
	UpdatedAt string  `json:"updatedAt"`
}

// GetSalaryGrades adapts compensation bands into salary grades for the Compensation dashboard
func GetSalaryGrades(ctx context.Context) ([]SalaryGrade, error) {
	grades := []SalaryGrade{}
	if !IsDBConnected() {
		return grades, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT cb.id, cb.level, cb.min_salary, cb.max_salary, cb.currency,
			cb.created_at::text, cb.updated_at::text, COALESCE(p.name, 'General')
		FROM compensation_bands cb
		LEFT JOIN positions p ON cb.position_id = p.id
		ORDER BY cb.position_id, cb.level
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var g SalaryGrade
		var level, positionName string
		if err := rows.Scan(&g.ID, &level, &g.MinSalary, &g.MaxSalary, &g.Currency,
			&g.CreatedAt, &g.UpdatedAt, &positionName); err != nil {
			continue
		}
		g.Name = positionName + " - " + level
		g.Level = compensationLevelRank[level]
		g.Midpoint = (g.MinSalary + g.MaxSalary) / 2
		g.Active = true
		grades = append(grades, g)
	}

	return grades, nil
}

// GetCompensationStructures returns per-employee compensation built from salary configurations
func GetCompensationStructures(ctx context.Context, employeeID int) ([]map[string]interface{}, error) {
	structures := []map[string]interface{}{}
	if !IsDBConnected() {
		return structures, nil
	}

	query := `
		SELECT e.id, e.full_name, COALESCE(p.id, 0), COALESCE(p.name, ''),
			s.base_salary, s.transport_allowance, s.meal_allowance, s.position_allowance
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		LEFT JOIN positions p ON e.position_id = p.id
		WHERE e.employment_status = 'active'
	`
	args := []interface{}{}
	if employeeID > 0 {
		query += " AND e.id = $1"
		args = append(args, employeeID)
	}
	query += " ORDER BY e.full_name"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var employeeIDVal, positionID int
		var employeeName, positionName string
		var baseSalary, transport, meal, position float64
		if err := rows.Scan(&employeeIDVal, &employeeName, &positionID, &positionName,
			&baseSalary, &transport, &meal, &position); err != nil {
			continue
		}
		total := baseSalary + transport + meal + position
		structures = append(structures, map[string]interface{}{
			"employeeId":         employeeIDVal,
			"employeeName":       employeeName,
			"positionId":         positionID,
			"positionName":       positionName,
			"baseSalary":         baseSalary,
			"currency":           "IDR",
			"status":             "active",
			"allowances": []map[string]interface{}{
				{"name": "Transport", "amount": transport, "frequency": "monthly", "taxable": false},
				{"name": "Meal", "amount": meal, "frequency": "monthly", "taxable": false},
				{"name": "Position", "amount": position, "frequency": "monthly", "taxable": true},
			},
			"totalCompensation": total,
		})
	}

	return structures, nil
}

// CompensationAnalytics summarizes salary distribution
type CompensationAnalytics struct {
	TotalEmployees     int                      `json:"totalEmployees"`
	AverageSalary      float64                  `json:"averageSalary"`
	MedianSalary       float64                  `json:"medianSalary"`
	SalaryRange        map[string]interface{}   `json:"salaryRange"`
	ByDepartment       []map[string]interface{} `json:"byDepartment"`
	ByGrade            []map[string]interface{} `json:"byGrade"`
	GenderPayGap       float64                  `json:"genderPayGap"`
	CompaRatio         float64                  `json:"compaRatio"`
	TurnoverCost       float64                  `json:"turnoverCost"`
	BudgetUtilization  float64                  `json:"budgetUtilization"`
}

// GetCompensationAnalytics aggregates salary data across active employees
func GetCompensationAnalytics(ctx context.Context) (*CompensationAnalytics, error) {
	result := &CompensationAnalytics{
		SalaryRange:  map[string]interface{}{"min": 0, "max": 0},
		ByDepartment: []map[string]interface{}{},
		ByGrade:      []map[string]interface{}{},
	}
	if !IsDBConnected() {
		return result, nil
	}

	var minSalary, maxSalary float64
	err := GetDB().QueryRow(ctx, `
		SELECT COUNT(*), COALESCE(AVG(s.base_salary), 0),
			COALESCE(MIN(s.base_salary), 0), COALESCE(MAX(s.base_salary), 0)
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		WHERE e.employment_status = 'active'
	`).Scan(&result.TotalEmployees, &result.AverageSalary, &minSalary, &maxSalary)
	if err != nil {
		return result, err
	}
	result.SalaryRange["min"] = minSalary
	result.SalaryRange["max"] = maxSalary

	err = GetDB().QueryRow(ctx, `
		SELECT COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.base_salary), 0)
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		WHERE e.employment_status = 'active'
	`).Scan(&result.MedianSalary)
	if err != nil {
		result.MedianSalary = result.AverageSalary
	}

	deptRows, err := GetDB().Query(ctx, `
		SELECT COALESCE(d.name, 'Unassigned') as department, COUNT(*) as cnt,
			COALESCE(AVG(s.base_salary), 0) as avg_salary, COALESCE(SUM(s.base_salary), 0) as total_salary
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		LEFT JOIN departments d ON e.department_id = d.id
		WHERE e.employment_status = 'active'
		GROUP BY d.name
		ORDER BY cnt DESC
	`)
	if err == nil {
		defer deptRows.Close()
		for deptRows.Next() {
			var department string
			var count int
			var avgSalary, totalSalary float64
			if err := deptRows.Scan(&department, &count, &avgSalary, &totalSalary); err == nil {
				result.ByDepartment = append(result.ByDepartment, map[string]interface{}{
					"department":        department,
					"employeeCount":     count,
					"averageSalary":     avgSalary,
					"totalCompensation": totalSalary,
				})
			}
		}
	}

	gradeRows, err := GetDB().Query(ctx, `
		SELECT cb.level, COUNT(DISTINCT e.id) as cnt, COALESCE(AVG(s.base_salary), 0) as avg_salary
		FROM compensation_bands cb
		JOIN employees e ON e.position_id = cb.position_id
		JOIN salary_configurations s ON s.employee_id = e.id
		WHERE e.employment_status = 'active'
		GROUP BY cb.level
		ORDER BY cnt DESC
	`)
	if err == nil {
		defer gradeRows.Close()
		for gradeRows.Next() {
			var level string
			var count int
			var avgSalary float64
			if err := gradeRows.Scan(&level, &count, &avgSalary); err == nil {
				utilization := 0.0
				if result.TotalEmployees > 0 {
					utilization = float64(count) / float64(result.TotalEmployees) * 100
				}
				result.ByGrade = append(result.ByGrade, map[string]interface{}{
					"grade":         level,
					"employeeCount": count,
					"averageSalary": avgSalary,
					"utilization":   utilization,
				})
			}
		}
	}

	// Gender pay gap: (male avg - female avg) / male avg, as a percentage
	var maleAvg, femaleAvg float64
	_ = GetDB().QueryRow(ctx, `
		SELECT COALESCE(AVG(s.base_salary) FILTER (WHERE e.gender = 'male'), 0),
			COALESCE(AVG(s.base_salary) FILTER (WHERE e.gender = 'female'), 0)
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		WHERE e.employment_status = 'active'
	`).Scan(&maleAvg, &femaleAvg)
	if maleAvg > 0 {
		result.GenderPayGap = (maleAvg - femaleAvg) / maleAvg * 100
	}

	// Compa-ratio: actual average salary vs the midpoint of each employee's compensation band
	var compaRatio float64
	err = GetDB().QueryRow(ctx, `
		SELECT COALESCE(AVG(s.base_salary / NULLIF((cb.min_salary + cb.max_salary) / 2.0, 0)), 0)
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		JOIN compensation_bands cb ON cb.position_id = e.position_id
		WHERE e.employment_status = 'active'
	`).Scan(&compaRatio)
	if err == nil && compaRatio > 0 {
		result.CompaRatio = compaRatio
	} else {
		result.CompaRatio = 1.0
	}

	// Budget utilization: actual total compensation vs the sum of each employee's band ceiling
	var actualTotal, ceilingTotal float64
	err = GetDB().QueryRow(ctx, `
		SELECT COALESCE(SUM(s.base_salary), 0), COALESCE(SUM(cb.max_salary), 0)
		FROM salary_configurations s
		JOIN employees e ON s.employee_id = e.id
		JOIN compensation_bands cb ON cb.position_id = e.position_id
		WHERE e.employment_status = 'active'
	`).Scan(&actualTotal, &ceilingTotal)
	if err == nil && ceilingTotal > 0 {
		result.BudgetUtilization = actualTotal / ceilingTotal * 100
	}

	return result, nil
}

// ==================== TRAINING EXTRAS ====================

// GetAllTrainingEnrollments retrieves training enrollments for every employee
func GetAllTrainingEnrollments(ctx context.Context) ([]models.TrainingEnrollment, error) {
	if !IsDBConnected() {
		return []models.TrainingEnrollment{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT te.id, te.program_id, te.employee_id, te.status, te.score, te.completed_at, te.created_at,
			e.full_name, tp.title
		FROM training_enrollments te
		JOIN employees e ON te.employee_id = e.id
		JOIN training_programs tp ON te.program_id = tp.id
		ORDER BY te.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	enrollments := []models.TrainingEnrollment{}
	for rows.Next() {
		var e models.TrainingEnrollment
		if err := rows.Scan(&e.ID, &e.ProgramID, &e.EmployeeID, &e.Status, &e.Score,
			&e.CompletedAt, &e.CreatedAt, &e.EmployeeName, &e.ProgramTitle); err == nil {
			enrollments = append(enrollments, e)
		}
	}
	return enrollments, nil
}
