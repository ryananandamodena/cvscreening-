package repository

import (
	"context"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== PERFORMANCE REPOSITORY ====================

// AnalyzePerformanceReview updates the AI sentiment score and summary
func AnalyzePerformanceReview(ctx context.Context, id int, score, summary string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE performance_reviews 
		SET ai_sentiment_score = $1, ai_summary = $2
		WHERE id = $3
	`, score, summary, id)
	return err
}

// GetPerformanceReviews retrieves performance reviews with optional filtering
func GetPerformanceReviews(ctx context.Context, filter models.PerformanceReviewFilter) ([]models.PerformanceReview, int, error) {
	if !IsDBConnected() {
		return []models.PerformanceReview{}, 0, nil
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	baseQuery := `
		FROM performance_reviews pr
		LEFT JOIN employees e ON pr.employee_id = e.id
		LEFT JOIN employees rev ON pr.reviewer_id = rev.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if filter.EmployeeID > 0 {
		baseQuery += fmt.Sprintf(" AND pr.employee_id = $%d", argIdx)
		args = append(args, filter.EmployeeID)
		argIdx++
	}
	if filter.Status != "" {
		baseQuery += fmt.Sprintf(" AND pr.status = $%d", argIdx)
		args = append(args, filter.Status)
		argIdx++
	}
	if filter.Period != "" {
		baseQuery += fmt.Sprintf(" AND pr.review_period = $%d", argIdx)
		args = append(args, filter.Period)
		argIdx++
	}

	var total int
	if err := GetDB().QueryRow(ctx, "SELECT COUNT(*) "+baseQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	selectQuery := fmt.Sprintf(`
		SELECT pr.id, pr.employee_id, pr.reviewer_id, pr.review_period, pr.review_type,
			pr.status, pr.overall_rating, pr.overall_rating_label, pr.quantitative_score,
			pr.qualitative_score, pr.achievements, pr.challenges, pr.development_plan,
			pr.manager_comments, pr.employee_comments, pr.due_date,
			pr.submitted_at, pr.approved_at, pr.created_at, pr.updated_at,
			COALESCE(e.full_name, '') as employee_name,
			COALESCE(rev.full_name, '') as reviewer_name
		%s
		ORDER BY pr.created_at DESC
		LIMIT $%d OFFSET $%d
	`, baseQuery, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := GetDB().Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	reviews := []models.PerformanceReview{}
	for rows.Next() {
		var r models.PerformanceReview
		err := rows.Scan(
			&r.ID, &r.EmployeeID, &r.ReviewerID, &r.ReviewPeriod, &r.ReviewType,
			&r.Status, &r.OverallRating, &r.OverallRatingLabel, &r.QuantitativeScore,
			&r.QualitativeScore, &r.Achievements, &r.Challenges, &r.DevelopmentPlan,
			&r.ManagerComments, &r.EmployeeComments, &r.DueDate,
			&r.SubmittedAt, &r.ApprovedAt, &r.CreatedAt, &r.UpdatedAt,
			&r.EmployeeName, &r.ReviewerName,
		)
		if err != nil {
			log.Printf("Error scanning performance review: %v", err)
			continue
		}
		reviews = append(reviews, r)
	}

	return reviews, total, nil
}

// GetPerformanceReviewByID retrieves a single review with its goals
func GetPerformanceReviewByID(ctx context.Context, id int) (*models.PerformanceReview, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var r models.PerformanceReview
	err := GetDB().QueryRow(ctx, `
		SELECT pr.id, pr.employee_id, pr.reviewer_id, pr.review_period, pr.review_type,
			pr.status, pr.overall_rating, pr.overall_rating_label, pr.quantitative_score,
			pr.qualitative_score, pr.achievements, pr.challenges, pr.development_plan,
			pr.manager_comments, pr.employee_comments, pr.due_date,
			pr.submitted_at, pr.approved_at, pr.created_at, pr.updated_at,
			COALESCE(e.full_name, '') as employee_name,
			COALESCE(rev.full_name, '') as reviewer_name
		FROM performance_reviews pr
		LEFT JOIN employees e ON pr.employee_id = e.id
		LEFT JOIN employees rev ON pr.reviewer_id = rev.id
		WHERE pr.id = $1
	`, id).Scan(
		&r.ID, &r.EmployeeID, &r.ReviewerID, &r.ReviewPeriod, &r.ReviewType,
		&r.Status, &r.OverallRating, &r.OverallRatingLabel, &r.QuantitativeScore,
		&r.QualitativeScore, &r.Achievements, &r.Challenges, &r.DevelopmentPlan,
		&r.ManagerComments, &r.EmployeeComments, &r.DueDate,
		&r.SubmittedAt, &r.ApprovedAt, &r.CreatedAt, &r.UpdatedAt,
		&r.EmployeeName, &r.ReviewerName,
	)
	if err != nil {
		return nil, err
	}

	// Load goals
	goals, err := GetGoalsByReviewID(ctx, r.ID)
	if err == nil {
		r.Goals = goals
	}

	return &r, nil
}

// CreatePerformanceReview creates a new performance review
func CreatePerformanceReview(ctx context.Context, r *models.PerformanceReview) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO performance_reviews 
			(employee_id, reviewer_id, review_period, review_type, status, due_date)
		VALUES ($1, $2, $3, $4, 'draft', $5)
		RETURNING id
	`, r.EmployeeID, r.ReviewerID, r.ReviewPeriod, r.ReviewType, r.DueDate).Scan(&id)

	return id, err
}

// UpdatePerformanceReview updates a review
func UpdatePerformanceReview(ctx context.Context, r *models.PerformanceReview) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE performance_reviews SET
			status = $1,
			overall_rating = $2,
			overall_rating_label = $3,
			quantitative_score = $4,
			qualitative_score = $5,
			achievements = $6,
			challenges = $7,
			development_plan = $8,
			manager_comments = $9,
			employee_comments = $10,
			submitted_at = $11,
			approved_at = $12,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $13
	`, r.Status, r.OverallRating, r.OverallRatingLabel, r.QuantitativeScore,
		r.QualitativeScore, r.Achievements, r.Challenges, r.DevelopmentPlan,
		r.ManagerComments, r.EmployeeComments, r.SubmittedAt, r.ApprovedAt, r.ID)

	return err
}

// ==================== GOAL REPOSITORY ====================

// GetGoalsByEmployeeID retrieves goals for an employee
func GetGoalsByEmployeeID(ctx context.Context, employeeID int, status string) ([]models.PerformanceGoal, error) {
	if !IsDBConnected() {
		return []models.PerformanceGoal{}, nil
	}

	query := `
		SELECT id, employee_id, review_id, title, description, category, weight,
			target, current_value, status, start_date, due_date, completed_at, created_at, updated_at
		FROM performance_goals
		WHERE employee_id = $1
	`
	args := []interface{}{employeeID}
	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY due_date ASC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	goals := []models.PerformanceGoal{}
	for rows.Next() {
		var g models.PerformanceGoal
		if err := rows.Scan(&g.ID, &g.EmployeeID, &g.ReviewID, &g.Title, &g.Description,
			&g.Category, &g.Weight, &g.Target, &g.Current, &g.Status,
			&g.StartDate, &g.DueDate, &g.CompletedAt, &g.CreatedAt, &g.UpdatedAt); err == nil {
			goals = append(goals, g)
		}
	}
	return goals, nil
}

// GetGoalsByReviewID retrieves goals for a specific review
func GetGoalsByReviewID(ctx context.Context, reviewID int) ([]models.PerformanceGoal, error) {
	if !IsDBConnected() {
		return []models.PerformanceGoal{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, employee_id, review_id, title, description, category, weight,
			target, current_value, status, start_date, due_date, completed_at, created_at, updated_at
		FROM performance_goals
		WHERE review_id = $1
		ORDER BY weight DESC
	`, reviewID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	goals := []models.PerformanceGoal{}
	for rows.Next() {
		var g models.PerformanceGoal
		if err := rows.Scan(&g.ID, &g.EmployeeID, &g.ReviewID, &g.Title, &g.Description,
			&g.Category, &g.Weight, &g.Target, &g.Current, &g.Status,
			&g.StartDate, &g.DueDate, &g.CompletedAt, &g.CreatedAt, &g.UpdatedAt); err == nil {
			goals = append(goals, g)
		}
	}
	return goals, nil
}

// GetGoalByID retrieves a single goal — used to verify ownership (self/manager/admin) before
// an update/delete is allowed to proceed (Module 13 IDOR fix).
func GetGoalByID(ctx context.Context, id int) (*models.PerformanceGoal, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var g models.PerformanceGoal
	err := GetDB().QueryRow(ctx, `
		SELECT id, employee_id, review_id, title, description, category, weight,
			target, current_value, status, start_date, due_date, completed_at, created_at, updated_at
		FROM performance_goals
		WHERE id = $1
	`, id).Scan(&g.ID, &g.EmployeeID, &g.ReviewID, &g.Title, &g.Description,
		&g.Category, &g.Weight, &g.Target, &g.Current, &g.Status,
		&g.StartDate, &g.DueDate, &g.CompletedAt, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

// CreateGoal creates a new performance goal
func CreateGoal(ctx context.Context, g *models.PerformanceGoal) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO performance_goals
			(employee_id, review_id, title, description, category, weight, target, current_value, status, start_date, due_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'not_started', $9, $10)
		RETURNING id
	`, g.EmployeeID, g.ReviewID, g.Title, g.Description, g.Category, g.Weight,
		g.Target, g.Current, g.StartDate, g.DueDate).Scan(&id)

	return id, err
}

// UpdateGoal updates a performance goal
func UpdateGoal(ctx context.Context, g *models.PerformanceGoal) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE performance_goals SET
			title = $1, description = $2, category = $3, weight = $4,
			target = $5, current_value = $6, status = $7, due_date = $8,
			completed_at = CASE WHEN $7 = 'completed' AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
	`, g.Title, g.Description, g.Category, g.Weight,
		g.Target, g.Current, g.Status, g.DueDate, g.ID)

	return err
}

// DeleteGoal removes a goal
func DeleteGoal(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, "DELETE FROM performance_goals WHERE id = $1", id)
	return err
}

// ==================== TRAINING REPOSITORY ====================

// GetTrainingPrograms retrieves all training programs
func GetTrainingPrograms(ctx context.Context, status string) ([]models.TrainingProgram, error) {
	if !IsDBConnected() {
		return []models.TrainingProgram{}, nil
	}

	query := `
		SELECT id, title, description, category, format, provider, duration_hours,
			max_slots, 
			(SELECT COUNT(*) FROM training_enrollments WHERE program_id = training_programs.id AND status = 'enrolled') as filled_slots,
			start_date, end_date, status, cost, created_at, updated_at
		FROM training_programs
		WHERE 1=1
	`
	args := []interface{}{}
	if status == "active" {
		query += " AND status IN ('planned', 'ongoing')"
	} else if status != "" {
		query += " AND status = $1"
		args = append(args, status)
	}
	query += " ORDER BY start_date DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	programs := []models.TrainingProgram{}
	for rows.Next() {
		var p models.TrainingProgram
		if err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.Category, &p.Format,
			&p.Provider, &p.Duration, &p.MaxSlots, &p.FilledSlots,
			&p.StartDate, &p.EndDate, &p.Status, &p.Cost, &p.CreatedAt, &p.UpdatedAt); err == nil {
			programs = append(programs, p)
		}
	}
	return programs, nil
}

// GetEnrollmentsByEmployee retrieves training enrollments for an employee
func GetEnrollmentsByEmployee(ctx context.Context, employeeID int) ([]models.TrainingEnrollment, error) {
	if !IsDBConnected() {
		return []models.TrainingEnrollment{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT te.id, te.program_id, te.employee_id, te.status, te.score, te.completed_at, te.created_at,
			e.full_name, tp.title
		FROM training_enrollments te
		JOIN employees e ON te.employee_id = e.id
		JOIN training_programs tp ON te.program_id = tp.id
		WHERE te.employee_id = $1
		ORDER BY te.created_at DESC
	`, employeeID)
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

// CreateTrainingProgram creates a new training program
func CreateTrainingProgram(ctx context.Context, p *models.TrainingProgram) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO training_programs (title, description, category, format, provider, duration_hours, max_slots, start_date, end_date, status, cost)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'planned', $10)
		RETURNING id
	`, p.Title, p.Description, p.Category, p.Format, p.Provider, p.Duration, p.MaxSlots,
		p.StartDate, p.EndDate, p.Cost).Scan(&id)

	return id, err
}

// EnrollEmployeeInTraining enrolls an employee in a training program
func EnrollEmployeeInTraining(ctx context.Context, programID, employeeID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO training_enrollments (program_id, employee_id, status)
		VALUES ($1, $2, 'enrolled')
		ON CONFLICT (program_id, employee_id) DO NOTHING
	`, programID, employeeID)
	return err
}

// ==================== BENEFITS REPOSITORY ====================

// GetBenefitPlans retrieves all benefit plans
func GetBenefitPlans(ctx context.Context) ([]models.BenefitPlan, error) {
	if !IsDBConnected() {
		return []models.BenefitPlan{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, name, category, provider, description, coverage_amount,
			employee_contribution, employer_contribution, is_active, created_at, updated_at
		FROM benefit_plans
		WHERE is_active = true
		ORDER BY category, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plans := []models.BenefitPlan{}
	for rows.Next() {
		var p models.BenefitPlan
		if err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Provider, &p.Description,
			&p.CoverageAmount, &p.EmployeeContribution, &p.EmployerContribution,
			&p.IsActive, &p.CreatedAt, &p.UpdatedAt); err == nil {
			plans = append(plans, p)
		}
	}
	return plans, nil
}

// GetEmployeeBenefits retrieves benefits for a specific employee
func GetEmployeeBenefits(ctx context.Context, employeeID int) ([]models.EmployeeBenefit, error) {
	if !IsDBConnected() {
		return []models.EmployeeBenefit{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT eb.id, eb.employee_id, eb.plan_id, eb.start_date, eb.end_date, eb.status, eb.created_at,
			e.full_name, bp.name, bp.category
		FROM employee_benefits eb
		JOIN employees e ON eb.employee_id = e.id
		JOIN benefit_plans bp ON eb.plan_id = bp.id
		WHERE eb.employee_id = $1
		ORDER BY eb.status DESC, bp.name
	`, employeeID)
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

// CreateBenefitPlan inserts a new benefit plan and returns its id.
func CreateBenefitPlan(ctx context.Context, p *models.BenefitPlan) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO benefit_plans (name, category, provider, description, coverage_amount,
			employee_contribution, employer_contribution, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, true))
		RETURNING id
	`, p.Name, p.Category, p.Provider, p.Description, p.CoverageAmount,
		p.EmployeeContribution, p.EmployerContribution, p.IsActive).Scan(&id)
	return id, err
}

// UpdateBenefitPlan updates an existing benefit plan by id.
func UpdateBenefitPlan(ctx context.Context, p *models.BenefitPlan) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE benefit_plans SET
			name = $1, category = $2, provider = $3, description = $4,
			coverage_amount = $5, employee_contribution = $6, employer_contribution = $7,
			is_active = $8, updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
	`, p.Name, p.Category, p.Provider, p.Description, p.CoverageAmount,
		p.EmployeeContribution, p.EmployerContribution, p.IsActive, p.ID)
	return err
}

// DeleteBenefitPlan soft-deletes a benefit plan by marking it inactive — existing
// enrollments (employee_benefits rows) are preserved for history, not cascaded away.
func DeleteBenefitPlan(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE benefit_plans SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
	`, id)
	return err
}

// EnrollEmployeeBenefit enrolls an employee into a benefit plan (or reactivates an
// existing inactive enrollment for the same plan).
func EnrollEmployeeBenefit(ctx context.Context, employeeID, planID int, startDate string) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO employee_benefits (employee_id, plan_id, start_date, status)
		VALUES ($1, $2, COALESCE($3, CURRENT_DATE), 'active')
		ON CONFLICT (employee_id, plan_id) DO UPDATE SET
			status = 'active', start_date = EXCLUDED.start_date, end_date = NULL
		RETURNING id
	`, employeeID, planID, nullIfEmpty(startDate)).Scan(&id)
	return id, err
}

// UnenrollEmployeeBenefit marks an employee's enrollment in a plan as inactive.
func UnenrollEmployeeBenefit(ctx context.Context, employeeID, planID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE employee_benefits SET status = 'inactive', end_date = CURRENT_DATE
		WHERE employee_id = $1 AND plan_id = $2
	`, employeeID, planID)
	return err
}

func nullIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// ==================== SUCCESSION REPOSITORY ====================

// GetSuccessionPlans retrieves all succession plans
func GetSuccessionPlans(ctx context.Context) ([]models.SuccessionPlan, error) {
	if !IsDBConnected() {
		return []models.SuccessionPlan{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT sp.id, sp.position_id, sp.incumbent_id, sp.priority, sp.notes,
			COALESCE(sp.risk_level, ''), COALESCE(sp.critical_position, false), sp.time_to_fill_months,
			sp.created_at, sp.updated_at,
			p.name as position_name, COALESCE(e.full_name, '') as incumbent_name
		FROM succession_plans sp
		JOIN positions p ON sp.position_id = p.id
		LEFT JOIN employees e ON sp.incumbent_id = e.id
		ORDER BY sp.priority DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plans := []models.SuccessionPlan{}
	for rows.Next() {
		var sp models.SuccessionPlan
		if err := rows.Scan(&sp.ID, &sp.PositionID, &sp.IncumbentID, &sp.Priority,
			&sp.Notes, &sp.RiskLevel, &sp.CriticalPosition, &sp.TimeToFillMonths, &sp.CreatedAt, &sp.UpdatedAt,
			&sp.PositionName, &sp.IncumbentName); err == nil {
			// Load candidates
			sp.Candidates, _ = GetSuccessionCandidates(ctx, sp.ID)
			plans = append(plans, sp)
		}
	}
	return plans, nil
}

// GetSuccessionCandidates retrieves candidates for a succession plan
func GetSuccessionCandidates(ctx context.Context, planID int) ([]models.SuccessionCandidate, error) {
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
		WHERE sc.plan_id = $1
		ORDER BY sc.readiness
	`, planID)
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

// CreateSuccessionPlan creates a new succession plan for a position and returns its id.
func CreateSuccessionPlan(ctx context.Context, sp *models.SuccessionPlan) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO succession_plans (position_id, incumbent_id, priority, notes, risk_level, critical_position, time_to_fill_months)
		VALUES ($1, $2, COALESCE($3, 'medium'), $4, NULLIF($5, ''), $6, $7)
		RETURNING id
	`, sp.PositionID, sp.IncumbentID, sp.Priority, sp.Notes, sp.RiskLevel, sp.CriticalPosition, sp.TimeToFillMonths).Scan(&id)
	return id, err
}

// UpdateSuccessionPlan updates an existing succession plan by id.
func UpdateSuccessionPlan(ctx context.Context, sp *models.SuccessionPlan) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE succession_plans SET
			position_id = $1, incumbent_id = $2, priority = $3, notes = $4,
			risk_level = NULLIF($5, ''), critical_position = $6, time_to_fill_months = $7,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $8
	`, sp.PositionID, sp.IncumbentID, sp.Priority, sp.Notes, sp.RiskLevel, sp.CriticalPosition, sp.TimeToFillMonths, sp.ID)
	return err
}

// DeleteSuccessionPlan removes a succession plan (and its candidates, via ON DELETE CASCADE).
func DeleteSuccessionPlan(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM succession_plans WHERE id = $1`, id)
	return err
}

// AddSuccessionCandidate adds a candidate to a succession plan and returns the new row's id.
func AddSuccessionCandidate(ctx context.Context, sc *models.SuccessionCandidate) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO succession_candidates (plan_id, employee_id, readiness, notes)
		VALUES ($1, $2, COALESCE($3, '2_5_years'), $4)
		ON CONFLICT (plan_id, employee_id) DO UPDATE SET readiness = EXCLUDED.readiness, notes = EXCLUDED.notes
		RETURNING id
	`, sc.PlanID, sc.EmployeeID, sc.Readiness, sc.Notes).Scan(&id)
	return id, err
}

// RemoveSuccessionCandidate removes a candidate from a succession plan.
func RemoveSuccessionCandidate(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM succession_candidates WHERE id = $1`, id)
	return err
}

// ==================== DOCUMENT REPOSITORY ====================

// GetCompanyDocuments retrieves documents with optional category filter
func GetCompanyDocuments(ctx context.Context, category string, isPublic *bool) ([]models.CompanyDocument, error) {
	if !IsDBConnected() {
		return []models.CompanyDocument{}, nil
	}

	query := `
		SELECT cd.id, cd.title, cd.category, cd.description, cd.file_path, cd.file_size,
			cd.mime_type, cd.version, cd.is_public, cd.uploaded_by, cd.effective_date,
			cd.expiry_date, cd.created_at, cd.updated_at,
			COALESCE(u.email, '') as uploader_name
		FROM company_documents cd
		LEFT JOIN users u ON cd.uploaded_by = u.id
		WHERE 1=1
	`
	args := []interface{}{}
	argIdx := 1

	if category != "" {
		query += fmt.Sprintf(" AND cd.category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if isPublic != nil {
		query += fmt.Sprintf(" AND cd.is_public = $%d", argIdx)
		args = append(args, *isPublic)
		argIdx++
	}
	query += " ORDER BY cd.created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	docs := []models.CompanyDocument{}
	for rows.Next() {
		var d models.CompanyDocument
		if err := rows.Scan(&d.ID, &d.Title, &d.Category, &d.Description, &d.FilePath,
			&d.FileSize, &d.MimeType, &d.Version, &d.IsPublic, &d.UploadedBy,
			&d.EffectiveDate, &d.ExpiryDate, &d.CreatedAt, &d.UpdatedAt,
			&d.UploaderName); err == nil {
			docs = append(docs, d)
		}
	}
	return docs, nil
}

// CreateCompanyDocument creates a new document record
func CreateCompanyDocument(ctx context.Context, d *models.CompanyDocument) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO company_documents (title, category, description, file_path, file_size, mime_type, version, is_public, uploaded_by, effective_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, d.Title, d.Category, d.Description, d.FilePath, d.FileSize, d.MimeType,
		d.Version, d.IsPublic, d.UploadedBy, d.EffectiveDate).Scan(&id)

	return id, err
}

// ==================== COMPENSATION REPOSITORY ====================

// GetCompensationBands retrieves compensation bands with optional position filter
func GetCompensationBands(ctx context.Context, positionID int) ([]models.CompensationBand, error) {
	if !IsDBConnected() {
		return []models.CompensationBand{}, nil
	}

	query := `
		SELECT cb.id, cb.position_id, cb.level, cb.min_salary, cb.max_salary, cb.currency, cb.year,
			cb.created_at, cb.updated_at, COALESCE(p.name, '') as position_name
		FROM compensation_bands cb
		LEFT JOIN positions p ON cb.position_id = p.id
		WHERE 1=1
	`
	args := []interface{}{}
	if positionID > 0 {
		query += " AND cb.position_id = $1"
		args = append(args, positionID)
	}
	query += " ORDER BY cb.position_id, cb.level"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bands := []models.CompensationBand{}
	for rows.Next() {
		var b models.CompensationBand
		if err := rows.Scan(&b.ID, &b.PositionID, &b.Level, &b.MinSalary, &b.MaxSalary,
			&b.Currency, &b.Year, &b.CreatedAt, &b.UpdatedAt, &b.PositionName); err == nil {
			bands = append(bands, b)
		}
	}
	return bands, nil
}

// UpsertCompensationBand creates or updates a compensation band
func UpsertCompensationBand(ctx context.Context, b *models.CompensationBand) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO compensation_bands (position_id, level, min_salary, max_salary, currency, year)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (position_id, level, year) DO UPDATE SET
			min_salary = EXCLUDED.min_salary,
			max_salary = EXCLUDED.max_salary,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`, b.PositionID, b.Level, b.MinSalary, b.MaxSalary, b.Currency, b.Year).Scan(&id)

	return id, err
}
