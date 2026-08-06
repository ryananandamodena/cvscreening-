package repository

import (
	"context"
	"fmt"
	"time"
)

// ==================== WORKFORCE ANALYTICS ====================

type DiversityMetrics struct {
	GenderDistribution map[string]int `json:"genderDistribution"`
	AgeDistribution     map[string]int `json:"ageDistribution"`
}

type WorkforceMetrics struct {
	TotalEmployees         int               `json:"totalEmployees"`
	ActiveEmployees        int               `json:"activeEmployees"`
	InactiveEmployees      int               `json:"inactiveEmployees"`
	NewHiresThisMonth      int               `json:"newHiresThisMonth"`
	TerminationsThisMonth  int               `json:"terminationsThisMonth"`
	TurnoverRate           float64           `json:"turnoverRate"`
	AverageTenure          float64           `json:"averageTenure"`
	HeadcountByDepartment  map[string]int    `json:"headcountByDepartment"`
	HeadcountByLocation    map[string]int    `json:"headcountByLocation"`
	DiversityMetrics       DiversityMetrics  `json:"diversityMetrics"`
}

// GetWorkforceMetrics computes real workforce metrics from the employees table.
// startDate/endDate (optional, RFC3339 date "YYYY-MM-DD") scope new-hire/termination counts;
// when empty, the current calendar month is used.
func GetWorkforceMetrics(ctx context.Context, startDate, endDate string) (*WorkforceMetrics, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	m := &WorkforceMetrics{
		HeadcountByDepartment: map[string]int{},
		HeadcountByLocation:   map[string]int{},
		DiversityMetrics: DiversityMetrics{
			GenderDistribution: map[string]int{},
			AgeDistribution:    map[string]int{},
		},
	}

	now := time.Now()
	if startDate == "" {
		startDate = now.AddDate(0, 0, 1-now.Day()).Format("2006-01-02")
	}
	if endDate == "" {
		endDate = now.Format("2006-01-02")
	}

	// Total / active / inactive
	err := GetDB().QueryRow(ctx, `
		SELECT
			COUNT(*),
			COALESCE(SUM(CASE WHEN employment_status = 'active' THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN employment_status != 'active' THEN 1 ELSE 0 END), 0)
		FROM employees
	`).Scan(&m.TotalEmployees, &m.ActiveEmployees, &m.InactiveEmployees)
	if err != nil {
		return nil, fmt.Errorf("failed to count employees: %w", err)
	}

	// New hires / terminations within the requested window
	err = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees WHERE join_date BETWEEN $1 AND $2
	`, startDate, endDate).Scan(&m.NewHiresThisMonth)
	if err != nil {
		return nil, fmt.Errorf("failed to count new hires: %w", err)
	}

	err = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees
		WHERE employment_status IN ('resigned', 'terminated', 'retired')
		AND resignation_date BETWEEN $1 AND $2
	`, startDate, endDate).Scan(&m.TerminationsThisMonth)
	if err != nil {
		m.TerminationsThisMonth = 0
	}

	// Turnover rate: terminations this year / average headcount this year
	currentYear := now.Year()
	var terminatedThisYear int
	_ = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees
		WHERE employment_status IN ('resigned', 'terminated', 'retired')
		AND EXTRACT(YEAR FROM updated_at) = $1
	`, currentYear).Scan(&terminatedThisYear)
	if m.TotalEmployees > 0 {
		m.TurnoverRate = round2(float64(terminatedThisYear) / float64(m.TotalEmployees) * 100)
	}

	// Average tenure (years) for active employees
	_ = GetDB().QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, join_date))), 0)
		FROM employees WHERE employment_status = 'active'
	`).Scan(&m.AverageTenure)
	m.AverageTenure = round2(m.AverageTenure)

	// Headcount by department
	rows, err := GetDB().Query(ctx, `
		SELECT COALESCE(d.name, 'Unassigned'), COUNT(*)
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE e.employment_status = 'active'
		GROUP BY d.name
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var name string
			var count int
			if err := rows.Scan(&name, &count); err == nil {
				m.HeadcountByDepartment[name] = count
			}
		}
	}

	// Headcount by location (city is the closest column available in the current schema)
	rows2, err := GetDB().Query(ctx, `
		SELECT COALESCE(city, 'Unspecified'), COUNT(*)
		FROM employees WHERE employment_status = 'active'
		GROUP BY city
	`)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var loc string
			var count int
			if err := rows2.Scan(&loc, &count); err == nil {
				m.HeadcountByLocation[loc] = count
			}
		}
	}

	// Gender distribution
	rows3, err := GetDB().Query(ctx, `
		SELECT COALESCE(gender, 'unspecified'), COUNT(*)
		FROM employees WHERE employment_status = 'active'
		GROUP BY gender
	`)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var g string
			var count int
			if err := rows3.Scan(&g, &count); err == nil {
				m.DiversityMetrics.GenderDistribution[g] = count
			}
		}
	}

	// Age distribution buckets
	rows4, err := GetDB().Query(ctx, `
		SELECT
			CASE
				WHEN AGE(CURRENT_DATE, birth_date) < INTERVAL '30 years' THEN '20-29'
				WHEN AGE(CURRENT_DATE, birth_date) < INTERVAL '40 years' THEN '30-39'
				WHEN AGE(CURRENT_DATE, birth_date) < INTERVAL '50 years' THEN '40-49'
				ELSE '50+'
			END AS bucket,
			COUNT(*)
		FROM employees
		WHERE employment_status = 'active' AND birth_date IS NOT NULL
		GROUP BY bucket
	`)
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var bucket string
			var count int
			if err := rows4.Scan(&bucket, &count); err == nil {
				m.DiversityMetrics.AgeDistribution[bucket] = count
			}
		}
	}

	return m, nil
}

// ==================== PERFORMANCE ANALYTICS ====================

type TopPerformer struct {
	EmployeeID   int     `json:"employeeId"`
	EmployeeName string  `json:"employeeName"`
	Rating       float64 `json:"rating"`
	Department   string  `json:"department"`
}

type PerformanceTrendPoint struct {
	Month          string  `json:"month"`
	AverageRating  float64 `json:"averageRating"`
	HighPerformers int     `json:"highPerformers"`
	LowPerformers  int     `json:"lowPerformers"`
}

type PerformanceByDepartment struct {
	Department    string  `json:"department"`
	AverageRating float64 `json:"averageRating"`
	EmployeeCount int     `json:"employeeCount"`
}

type PerformanceAnalyticsData struct {
	AveragePerformanceRating float64                    `json:"averagePerformanceRating"`
	PerformanceDistribution  map[string]int              `json:"performanceDistribution"`
	TopPerformers            []TopPerformer               `json:"topPerformers"`
	PerformanceTrends        []PerformanceTrendPoint      `json:"performanceTrends"`
	PerformanceByDepartment  []PerformanceByDepartment    `json:"performanceByDepartment"`
}

// GetPerformanceAnalyticsData computes real performance metrics from performance_reviews.
// Returns zero-value structures (not an error) when no reviews exist yet, so the UI can
// render an empty state instead of failing.
func GetPerformanceAnalyticsData(ctx context.Context) (*PerformanceAnalyticsData, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	data := &PerformanceAnalyticsData{
		PerformanceDistribution: map[string]int{},
		TopPerformers:           []TopPerformer{},
		PerformanceTrends:       []PerformanceTrendPoint{},
		PerformanceByDepartment: []PerformanceByDepartment{},
	}

	_ = GetDB().QueryRow(ctx, `
		SELECT COALESCE(AVG(overall_rating), 0) FROM performance_reviews WHERE status = 'completed'
	`).Scan(&data.AveragePerformanceRating)
	data.AveragePerformanceRating = round2(data.AveragePerformanceRating)

	// Rating buckets 1-5
	rows, err := GetDB().Query(ctx, `
		SELECT ROUND(overall_rating)::int AS bucket, COUNT(*)
		FROM performance_reviews
		WHERE status = 'completed' AND overall_rating > 0
		GROUP BY bucket
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var bucket, count int
			if err := rows.Scan(&bucket, &count); err == nil {
				data.PerformanceDistribution[fmt.Sprintf("%d", bucket)] = count
			}
		}
	}

	// Top 5 performers
	rows2, err := GetDB().Query(ctx, `
		SELECT e.id, e.full_name, pr.overall_rating, COALESCE(d.name, 'Unassigned')
		FROM performance_reviews pr
		JOIN employees e ON e.id = pr.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE pr.status = 'completed'
		ORDER BY pr.overall_rating DESC, pr.updated_at DESC
		LIMIT 5
	`)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var tp TopPerformer
			if err := rows2.Scan(&tp.EmployeeID, &tp.EmployeeName, &tp.Rating, &tp.Department); err == nil {
				data.TopPerformers = append(data.TopPerformers, tp)
			}
		}
	}

	// Trend over the last 6 review periods (by review_period label, chronological by created_at)
	rows3, err := GetDB().Query(ctx, `
		SELECT
			review_period,
			COALESCE(AVG(overall_rating), 0),
			COALESCE(SUM(CASE WHEN overall_rating >= 4 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN overall_rating <= 2 AND overall_rating > 0 THEN 1 ELSE 0 END), 0)
		FROM performance_reviews
		WHERE status = 'completed'
		GROUP BY review_period
		ORDER BY MIN(created_at) DESC
		LIMIT 6
	`)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var p PerformanceTrendPoint
			if err := rows3.Scan(&p.Month, &p.AverageRating, &p.HighPerformers, &p.LowPerformers); err == nil {
				p.AverageRating = round2(p.AverageRating)
				data.PerformanceTrends = append(data.PerformanceTrends, p)
			}
		}
	}

	// By department
	rows4, err := GetDB().Query(ctx, `
		SELECT COALESCE(d.name, 'Unassigned'), COALESCE(AVG(pr.overall_rating), 0), COUNT(DISTINCT e.id)
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		LEFT JOIN performance_reviews pr ON pr.employee_id = e.id AND pr.status = 'completed'
		WHERE e.employment_status = 'active'
		GROUP BY d.name
	`)
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var pd PerformanceByDepartment
			if err := rows4.Scan(&pd.Department, &pd.AverageRating, &pd.EmployeeCount); err == nil {
				pd.AverageRating = round2(pd.AverageRating)
				data.PerformanceByDepartment = append(data.PerformanceByDepartment, pd)
			}
		}
	}

	return data, nil
}

// ==================== PREDICTIVE ANALYTICS (heuristic, not ML) ====================
//
// NOTE: these are rule-based estimates derived from real data (recent turnover rate,
// headcount vs. approved positions), NOT a trained machine-learning model. They are
// meant to be directionally useful, not a precise forecast. Label them as such in the UI.

type RiskFactor struct {
	Factor           string  `json:"factor"`
	Impact           float64 `json:"impact"`
	AffectedEmployees int    `json:"affectedEmployees"`
}

type DepartmentHiringNeed struct {
	Department        string `json:"department"`
	RequiredHeadcount int    `json:"requiredHeadcount"`
	CurrentHeadcount  int    `json:"currentHeadcount"`
	Urgency           string `json:"urgency"`
}

type PredictiveAnalyticsData struct {
	TurnoverPrediction struct {
		RiskCategories struct {
			High   int `json:"high"`
			Medium int `json:"medium"`
			Low    int `json:"low"`
		} `json:"riskCategories"`
		PredictedTurnoverRate float64      `json:"predictedTurnoverRate"`
		KeyRiskFactors        []RiskFactor `json:"keyRiskFactors"`
	} `json:"turnoverPrediction"`
	HiringNeeds struct {
		DepartmentsNeedingHire []DepartmentHiringNeed `json:"departmentsNeedingHire"`
	} `json:"hiringNeeds"`
	IsHeuristic bool `json:"isHeuristic"`
}

// GetPredictiveAnalyticsData derives a lightweight, rule-based forecast from real
// employee/position data — see the package-level note above on its limitations.
func GetPredictiveAnalyticsData(ctx context.Context) (*PredictiveAnalyticsData, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	data := &PredictiveAnalyticsData{IsHeuristic: true}
	data.TurnoverPrediction.KeyRiskFactors = []RiskFactor{}
	data.HiringNeeds.DepartmentsNeedingHire = []DepartmentHiringNeed{}

	// Risk buckets: employees flagged "high risk" are a heuristic proxy —
	// those with a low latest performance rating combined with long tenure
	// without a raise/promotion signal are not modeled here (no comp-history
	// table wired up yet), so we conservatively bucket by latest rating only.
	err := GetDB().QueryRow(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN latest_rating > 0 AND latest_rating <= 2 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN latest_rating BETWEEN 2.01 AND 3.5 THEN 1 ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN latest_rating > 3.5 OR latest_rating IS NULL THEN 1 ELSE 0 END), 0)
		FROM (
			SELECT e.id,
				(SELECT pr.overall_rating FROM performance_reviews pr
				 WHERE pr.employee_id = e.id AND pr.status = 'completed'
				 ORDER BY pr.created_at DESC LIMIT 1) AS latest_rating
			FROM employees e WHERE e.employment_status = 'active'
		) t
	`).Scan(&data.TurnoverPrediction.RiskCategories.High,
		&data.TurnoverPrediction.RiskCategories.Medium,
		&data.TurnoverPrediction.RiskCategories.Low)
	if err != nil {
		return nil, fmt.Errorf("failed to compute turnover risk buckets: %w", err)
	}

	// Predicted turnover rate: simple trailing-12-month rate, used as the forward estimate
	var terminated12mo, totalActive int
	_ = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM employees
		WHERE employment_status IN ('resigned', 'terminated', 'retired')
		AND updated_at >= NOW() - INTERVAL '12 months'
	`).Scan(&terminated12mo)
	_ = GetDB().QueryRow(ctx, `SELECT COUNT(*) FROM employees WHERE employment_status = 'active'`).Scan(&totalActive)
	if totalActive > 0 {
		data.TurnoverPrediction.PredictedTurnoverRate = round2(float64(terminated12mo) / float64(totalActive) * 100)
	}

	if data.TurnoverPrediction.RiskCategories.High > 0 {
		data.TurnoverPrediction.KeyRiskFactors = append(data.TurnoverPrediction.KeyRiskFactors, RiskFactor{
			Factor:            "Rating performa rendah (<=2) pada review terakhir",
			Impact:            0.6,
			AffectedEmployees: data.TurnoverPrediction.RiskCategories.High,
		})
	}

	// Hiring needs: departments where active headcount is below the number of
	// active (non-vacant) approved positions defined for that department.
	rows, err := GetDB().Query(ctx, `
		SELECT d.name,
			COUNT(DISTINCT p.id) AS approved_positions,
			COUNT(DISTINCT e.id) AS current_headcount
		FROM departments d
		LEFT JOIN positions p ON p.department_id = d.id AND p.is_active = true
		LEFT JOIN employees e ON e.department_id = d.id AND e.employment_status = 'active'
		GROUP BY d.name
		HAVING COUNT(DISTINCT p.id) > COUNT(DISTINCT e.id)
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var dep string
			var approved, current int
			if err := rows.Scan(&dep, &approved, &current); err == nil {
				gap := approved - current
				urgency := "low"
				if gap >= 5 {
					urgency = "high"
				} else if gap >= 2 {
					urgency = "medium"
				}
				data.HiringNeeds.DepartmentsNeedingHire = append(data.HiringNeeds.DepartmentsNeedingHire, DepartmentHiringNeed{
					Department:        dep,
					RequiredHeadcount: gap,
					CurrentHeadcount:  current,
					Urgency:           urgency,
				})
			}
		}
	}

	return data, nil
}

// ==================== REALTIME METRICS ====================

type RealtimeMetrics struct {
	EmployeesClockedInToday int       `json:"employeesClockedInToday"`
	PendingApprovals        int       `json:"pendingApprovals"`
	PendingLeaveRequests    int       `json:"pendingLeaveRequests"`
	LastUpdate              time.Time `json:"lastUpdate"`
}

// GetRealtimeMetrics returns a live snapshot — real numbers as of "now", not a
// streaming feed. Cheap enough to poll on a short interval from the frontend.
func GetRealtimeMetrics(ctx context.Context) (*RealtimeMetrics, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	m := &RealtimeMetrics{LastUpdate: time.Now()}

	_ = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM attendances WHERE date = CURRENT_DATE AND clock_in IS NOT NULL
	`).Scan(&m.EmployeesClockedInToday)

	_ = GetDB().QueryRow(ctx, `
		SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'
	`).Scan(&m.PendingLeaveRequests)
	m.PendingApprovals = m.PendingLeaveRequests

	return m, nil
}

func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}
