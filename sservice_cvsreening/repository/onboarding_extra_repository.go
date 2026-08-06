package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// OnboardingTemplateTask is one entry inside an OnboardingTemplate's `tasks` JSONB array
type OnboardingTemplateTask struct {
	Title        string `json:"title"`
	Description  string `json:"description"`
	Category     string `json:"category"`
	DueDays      int    `json:"dueDays"`      // days after the onboarding start date
	AssignedRole string `json:"assignedRole"` // hr, it, manager, employee, finance, facility
}

// CreateOnboardingTemplate inserts a new reusable onboarding template
func CreateOnboardingTemplate(ctx context.Context, name string, departmentID *int, tasks []OnboardingTemplateTask, createdBy int) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}
	tasksJSON, err := json.Marshal(tasks)
	if err != nil {
		return 0, err
	}
	var id int
	err = GetDB().QueryRow(ctx, `
		INSERT INTO onboarding_templates (name, department_id, tasks, is_active, created_by)
		VALUES ($1, $2, $3, true, $4)
		RETURNING id
	`, name, departmentID, tasksJSON, createdBy).Scan(&id)
	return id, err
}

// GetOnboardingTemplates lists all onboarding templates
func GetOnboardingTemplates(ctx context.Context) ([]models.OnboardingTemplate, error) {
	templates := []models.OnboardingTemplate{}
	if !IsDBConnected() {
		return templates, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT t.id, t.name, t.department_id, t.tasks, t.is_active, t.created_by, t.created_at, t.updated_at,
			COALESCE(d.name, '')
		FROM onboarding_templates t
		LEFT JOIN departments d ON t.department_id = d.id
		ORDER BY t.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var t models.OnboardingTemplate
		if err := rows.Scan(&t.ID, &t.Name, &t.DepartmentID, &t.Tasks, &t.IsActive, &t.CreatedBy,
			&t.CreatedAt, &t.UpdatedAt, &t.DepartmentName); err == nil {
			templates = append(templates, t)
		}
	}
	return templates, nil
}

// GetOnboardingTemplateByID retrieves a single template, including its parsed task list
func GetOnboardingTemplateByID(ctx context.Context, id int) (*models.OnboardingTemplate, []OnboardingTemplateTask, error) {
	if !IsDBConnected() {
		return nil, nil, fmt.Errorf("database not connected")
	}
	var t models.OnboardingTemplate
	err := GetDB().QueryRow(ctx, `
		SELECT id, name, department_id, tasks, is_active, created_by, created_at, updated_at
		FROM onboarding_templates WHERE id = $1
	`, id).Scan(&t.ID, &t.Name, &t.DepartmentID, &t.Tasks, &t.IsActive, &t.CreatedBy, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, nil, err
	}
	var tasks []OnboardingTemplateTask
	if err := json.Unmarshal(t.Tasks, &tasks); err != nil {
		tasks = []OnboardingTemplateTask{}
	}
	return &t, tasks, nil
}

// SetOnboardingTemplateActive toggles a template's active flag
func SetOnboardingTemplateActive(ctx context.Context, id int, active bool) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `UPDATE onboarding_templates SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, active, id)
	return err
}

// DeleteOnboardingTemplate removes a template
func DeleteOnboardingTemplate(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `DELETE FROM onboarding_templates WHERE id = $1`, id)
	return err
}

// GenerateTasksFromTemplate creates onboarding_tasks rows for a session based on its template's task list
func GenerateTasksFromTemplate(ctx context.Context, sessionID int, startDate time.Time, tasks []OnboardingTemplateTask) error {
	if !IsDBConnected() {
		return nil
	}
	for i, t := range tasks {
		dueDate := startDate.AddDate(0, 0, t.DueDays)
		_, err := GetDB().Exec(ctx, `
			INSERT INTO onboarding_tasks (session_id, title, description, category, assigned_role, due_date, status, sort_order)
			VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
		`, sessionID, t.Title, t.Description, t.Category, t.AssignedRole, dueDate, i)
		if err != nil {
			return fmt.Errorf("failed to generate task %q: %w", t.Title, err)
		}
	}
	return nil
}
