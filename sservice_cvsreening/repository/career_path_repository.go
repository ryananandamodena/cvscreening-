package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// GetCareerPaths lists career paths. employeeID <= 0 returns all (admin view).
func GetCareerPaths(ctx context.Context, employeeID int) ([]models.CareerPath, error) {
	if !IsDBConnected() {
		return []models.CareerPath{}, nil
	}
	// performance_score mirrors the same AVG(overall_rating) subquery used by
	// GetSuccessionCandidates, so career paths and succession planning agree on
	// how an employee's performance is represented instead of drifting apart.
	query := `
		SELECT cp.id, cp.employee_id, cp.current_position, cp.mentor_id,
			cp.target_positions, cp.timeline, cp.created_at, cp.updated_at,
			e.full_name, COALESCE(m.full_name, ''),
			COALESCE((SELECT AVG(overall_rating) FROM performance_reviews
				WHERE employee_id = cp.employee_id AND status = 'completed'), 0)
		FROM career_paths cp
		JOIN employees e ON cp.employee_id = e.id
		LEFT JOIN employees m ON cp.mentor_id = m.id
	`
	args := []interface{}{}
	if employeeID > 0 {
		query += " WHERE cp.employee_id = $1"
		args = append(args, employeeID)
	}
	query += " ORDER BY cp.created_at DESC"

	rows, err := GetDB().Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	paths := []models.CareerPath{}
	for rows.Next() {
		var p models.CareerPath
		var targetsRaw, timelineRaw []byte
		if err := rows.Scan(&p.ID, &p.EmployeeID, &p.CurrentPosition, &p.MentorID,
			&targetsRaw, &timelineRaw, &p.CreatedAt, &p.UpdatedAt,
			&p.EmployeeName, &p.MentorName, &p.PerformanceScore); err != nil {
			continue
		}
		_ = json.Unmarshal(targetsRaw, &p.TargetPositions)
		_ = json.Unmarshal(timelineRaw, &p.Timeline)
		p.Milestones, _ = GetCareerPathMilestones(ctx, p.ID)
		paths = append(paths, p)
	}
	return paths, nil
}

// GetCareerPathByID retrieves a single career path with its milestones.
func GetCareerPathByID(ctx context.Context, id int) (*models.CareerPath, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var p models.CareerPath
	var targetsRaw, timelineRaw []byte
	err := GetDB().QueryRow(ctx, `
		SELECT cp.id, cp.employee_id, cp.current_position, cp.mentor_id,
			cp.target_positions, cp.timeline, cp.created_at, cp.updated_at,
			e.full_name, COALESCE(m.full_name, ''),
			COALESCE((SELECT AVG(overall_rating) FROM performance_reviews
				WHERE employee_id = cp.employee_id AND status = 'completed'), 0)
		FROM career_paths cp
		JOIN employees e ON cp.employee_id = e.id
		LEFT JOIN employees m ON cp.mentor_id = m.id
		WHERE cp.id = $1
	`, id).Scan(&p.ID, &p.EmployeeID, &p.CurrentPosition, &p.MentorID,
		&targetsRaw, &timelineRaw, &p.CreatedAt, &p.UpdatedAt, &p.EmployeeName, &p.MentorName, &p.PerformanceScore)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(targetsRaw, &p.TargetPositions)
	_ = json.Unmarshal(timelineRaw, &p.Timeline)
	p.Milestones, _ = GetCareerPathMilestones(ctx, p.ID)
	return &p, nil
}

// CreateCareerPath inserts a new career path and returns its id.
func CreateCareerPath(ctx context.Context, p *models.CareerPath) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	targets, _ := json.Marshal(p.TargetPositions)
	timeline, _ := json.Marshal(p.Timeline)
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO career_paths (employee_id, current_position, mentor_id, target_positions, timeline)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, p.EmployeeID, p.CurrentPosition, p.MentorID, targets, timeline).Scan(&id)
	return id, err
}

// UpdateCareerPath updates an existing career path by id.
func UpdateCareerPath(ctx context.Context, p *models.CareerPath) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	targets, _ := json.Marshal(p.TargetPositions)
	timeline, _ := json.Marshal(p.Timeline)
	_, err := GetDB().Exec(ctx, `
		UPDATE career_paths SET
			current_position = $1, mentor_id = $2, target_positions = $3, timeline = $4,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
	`, p.CurrentPosition, p.MentorID, targets, timeline, p.ID)
	return err
}

// GetCareerPathMilestones retrieves milestones for a career path.
func GetCareerPathMilestones(ctx context.Context, pathID int) ([]models.CareerPathMilestone, error) {
	if !IsDBConnected() {
		return []models.CareerPathMilestone{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, path_id, title, completed, due_date, status
		FROM career_path_milestones WHERE path_id = $1 ORDER BY due_date NULLS LAST, id
	`, pathID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	milestones := []models.CareerPathMilestone{}
	for rows.Next() {
		var m models.CareerPathMilestone
		if err := rows.Scan(&m.ID, &m.PathID, &m.Title, &m.Completed, &m.DueDate, &m.Status); err == nil {
			milestones = append(milestones, m)
		}
	}
	return milestones, nil
}

// UpdateCareerMilestone updates a milestone's status/completion.
func UpdateCareerMilestone(ctx context.Context, milestoneID int, status string, completedDate string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	completed := status == "completed"
	_, err := GetDB().Exec(ctx, `
		UPDATE career_path_milestones SET status = $1, completed = $2 WHERE id = $3
	`, status, completed, milestoneID)
	return err
}
