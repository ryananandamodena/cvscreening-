package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== DYNAMIC BPJS RATE CONFIG ====================

// GetBPJSRateConfig reads the (singleton) editable BPJS employee-contribution rates/caps
func GetBPJSRateConfig(ctx context.Context) (*models.BPJSRateConfig, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}
	var cfg models.BPJSRateConfig
	err := GetDB().QueryRow(ctx, `
		SELECT kesehatan_rate_employee, kesehatan_salary_cap, jht_rate_employee, jp_rate_employee, jp_salary_cap, updated_at
		FROM bpjs_rate_config WHERE id = 1
	`).Scan(&cfg.KesehatanRateEmployee, &cfg.KesehatanSalaryCap, &cfg.JHTRateEmployee, &cfg.JPRateEmployee, &cfg.JPSalaryCap, &cfg.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &cfg, nil
}

// UpdateBPJSRateConfig updates the editable BPJS employee-contribution rates/caps
func UpdateBPJSRateConfig(ctx context.Context, cfg *models.BPJSRateConfig) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	_, err := GetDB().Exec(ctx, `
		UPDATE bpjs_rate_config SET
			kesehatan_rate_employee = $1,
			kesehatan_salary_cap = $2,
			jht_rate_employee = $3,
			jp_rate_employee = $4,
			jp_salary_cap = $5,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = 1
	`, cfg.KesehatanRateEmployee, cfg.KesehatanSalaryCap, cfg.JHTRateEmployee, cfg.JPRateEmployee, cfg.JPSalaryCap)
	return err
}

// ==================== DYNAMIC PPh21 TER BRACKETS ====================

// GetAllTERBrackets returns every bracket for every PTKP category, ordered for display/editing
func GetAllTERBrackets(ctx context.Context) ([]models.PPh21TERBracket, error) {
	if !IsDBConnected() {
		return []models.PPh21TERBracket{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, category, bracket_order, up_to, rate
		FROM pph21_ter_brackets
		ORDER BY category, bracket_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	brackets := []models.PPh21TERBracket{}
	for rows.Next() {
		var b models.PPh21TERBracket
		if err := rows.Scan(&b.ID, &b.Category, &b.BracketOrder, &b.UpTo, &b.Rate); err == nil {
			brackets = append(brackets, b)
		}
	}
	return brackets, nil
}

// GetTERBracketsForCategory returns the ordered bracket table for one PTKP category (A/B/C),
// used by GeneratePayroll to compute PPh21 without any hardcoded Go tables.
func GetTERBracketsForCategory(ctx context.Context, category string) ([]models.PPh21TERBracket, error) {
	if !IsDBConnected() {
		return []models.PPh21TERBracket{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT id, category, bracket_order, up_to, rate
		FROM pph21_ter_brackets
		WHERE category = $1
		ORDER BY bracket_order
	`, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	brackets := []models.PPh21TERBracket{}
	for rows.Next() {
		var b models.PPh21TERBracket
		if err := rows.Scan(&b.ID, &b.Category, &b.BracketOrder, &b.UpTo, &b.Rate); err == nil {
			brackets = append(brackets, b)
		}
	}
	return brackets, nil
}

// ReplaceTERBracketsForCategory atomically replaces all brackets for one PTKP category —
// lets Finance edit the whole table (add/remove/resize brackets) in one save.
func ReplaceTERBracketsForCategory(ctx context.Context, category string, brackets []models.PPh21TERBracket) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}
	if len(brackets) == 0 {
		return fmt.Errorf("at least one bracket is required")
	}
	return WithTransaction(ctx, func(ctx context.Context, tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `DELETE FROM pph21_ter_brackets WHERE category = $1`, category); err != nil {
			return err
		}
		for i, b := range brackets {
			if _, err := tx.Exec(ctx, `
				INSERT INTO pph21_ter_brackets (category, bracket_order, up_to, rate)
				VALUES ($1, $2, $3, $4)
			`, category, i+1, b.UpTo, b.Rate); err != nil {
				return err
			}
		}
		return nil
	})
}
