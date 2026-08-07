package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// GetLeadershipPrograms lists all leadership programs with their participant count.
func GetLeadershipPrograms(ctx context.Context) ([]models.LeadershipDevelopment, error) {
	if !IsDBConnected() {
		return []models.LeadershipDevelopment{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, program_name, description, target_audience, duration_weeks, status,
			start_date, end_date, budget, outcomes, created_at, updated_at
		FROM leadership_programs ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	programs := []models.LeadershipDevelopment{}
	for rows.Next() {
		var p models.LeadershipDevelopment
		var audienceRaw, outcomesRaw []byte
		if err := rows.Scan(&p.ID, &p.ProgramName, &p.Description, &audienceRaw, &p.Duration,
			&p.Status, &p.StartDate, &p.EndDate, &p.Budget, &outcomesRaw,
			&p.CreatedAt, &p.UpdatedAt); err != nil {
			continue
		}
		_ = json.Unmarshal(audienceRaw, &p.TargetAudience)
		_ = json.Unmarshal(outcomesRaw, &p.Outcomes)
		p.Participants, _ = getLeadershipProgramParticipantIDs(ctx, p.ID)
		p.Modules, _ = GetLeadershipModules(ctx, p.ID)
		programs = append(programs, p)
	}
	return programs, nil
}

func getLeadershipProgramParticipantIDs(ctx context.Context, programID int) ([]int, error) {
	if !IsDBConnected() {
		return []int{}, nil
	}
	rows, err := GetDB().Query(ctx, `SELECT employee_id FROM leadership_program_participants WHERE program_id = $1`, programID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := []int{}
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err == nil {
			ids = append(ids, id)
		}
	}
	return ids, nil
}

// CreateLeadershipProgram inserts a new leadership program and returns its id.
func CreateLeadershipProgram(ctx context.Context, p *models.LeadershipDevelopment) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	audience, _ := json.Marshal(p.TargetAudience)
	outcomes, _ := json.Marshal(p.Outcomes)
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO leadership_programs (program_name, description, target_audience, duration_weeks,
			status, start_date, end_date, budget, outcomes)
		VALUES ($1, $2, $3, COALESCE($4, 4), COALESCE($5, 'planning'), $6, $7, $8, $9)
		RETURNING id
	`, p.ProgramName, p.Description, audience, p.Duration, p.Status, p.StartDate, p.EndDate, p.Budget, outcomes).Scan(&id)
	return id, err
}

// UpdateLeadershipProgram updates an existing leadership program by id.
func UpdateLeadershipProgram(ctx context.Context, p *models.LeadershipDevelopment) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	audience, _ := json.Marshal(p.TargetAudience)
	outcomes, _ := json.Marshal(p.Outcomes)
	_, err := GetDB().Exec(ctx, `
		UPDATE leadership_programs SET
			program_name = $1, description = $2, target_audience = $3, duration_weeks = $4,
			status = $5, start_date = $6, end_date = $7, budget = $8, outcomes = $9,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $10
	`, p.ProgramName, p.Description, audience, p.Duration, p.Status, p.StartDate, p.EndDate,
		p.Budget, outcomes, p.ID)
	return err
}

// EnrollInLeadershipProgram enrolls an employee into a program.
func EnrollInLeadershipProgram(ctx context.Context, programID, employeeID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO leadership_program_participants (program_id, employee_id, status)
		VALUES ($1, $2, 'enrolled')
		ON CONFLICT (program_id, employee_id) DO NOTHING
	`, programID, employeeID)
	return err
}

// GetLeadershipModules retrieves the training modules of a leadership program, in order.
func GetLeadershipModules(ctx context.Context, programID int) ([]models.LeadershipModule, error) {
	if !IsDBConnected() {
		return []models.LeadershipModule{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, title, description, duration_hours, instructor, materials
		FROM leadership_program_modules WHERE program_id = $1 ORDER BY order_index, id
	`, programID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	modules := []models.LeadershipModule{}
	for rows.Next() {
		var m models.LeadershipModule
		var materialsRaw []byte
		if err := rows.Scan(&m.ID, &m.Title, &m.Description, &m.DurationHours, &m.Instructor, &materialsRaw); err == nil {
			_ = json.Unmarshal(materialsRaw, &m.Materials)
			modules = append(modules, m)
		}
	}
	return modules, nil
}

// AddLeadershipModule appends a new module to a program and returns its id.
func AddLeadershipModule(ctx context.Context, programID int, m *models.LeadershipModule, orderIndex int) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	materials, _ := json.Marshal(m.Materials)
	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO leadership_program_modules (program_id, title, description, duration_hours, instructor, materials, order_index)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, programID, m.Title, m.Description, m.DurationHours, m.Instructor, materials, orderIndex).Scan(&id)
	return id, err
}

// UpdateLeadershipModule updates an existing module by id (scoped to programID for safety).
func UpdateLeadershipModule(ctx context.Context, programID, moduleID int, m *models.LeadershipModule) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	materials, _ := json.Marshal(m.Materials)
	_, err := GetDB().Exec(ctx, `
		UPDATE leadership_program_modules SET
			title = $1, description = $2, duration_hours = $3, instructor = $4, materials = $5
		WHERE id = $6 AND program_id = $7
	`, m.Title, m.Description, m.DurationHours, m.Instructor, materials, moduleID, programID)
	return err
}

// DeleteLeadershipModule removes a module (scoped to programID for safety).
func DeleteLeadershipModule(ctx context.Context, programID, moduleID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM leadership_program_modules WHERE id = $1 AND program_id = $2`, moduleID, programID)
	return err
}

// CompleteLeadershipProgram marks a participant's enrollment complete with outcomes.
func CompleteLeadershipProgram(ctx context.Context, programID, employeeID int, outcomes []string) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	outcomesJSON, _ := json.Marshal(outcomes)
	_, err := GetDB().Exec(ctx, `
		UPDATE leadership_program_participants SET status = 'completed', outcomes = $1
		WHERE program_id = $2 AND employee_id = $3
	`, outcomesJSON, programID, employeeID)
	return err
}
