package repository

import (
	"context"
	"time"
)

// LocationExemption is a per-employee override that lets them clock in/out from outside the
// office geofencing radius — see schema_attendance_location_exemptions.sql for the "why".
type LocationExemption struct {
	EmployeeID int        `json:"employeeId"`
	Enabled    bool       `json:"enabled"`
	Reason     string     `json:"reason"`
	StartDate  *time.Time `json:"startDate,omitempty"`
	EndDate    *time.Time `json:"endDate,omitempty"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}

// IsRemoteExempt reports whether the given employee is currently exempt from the office
// geofencing check — enabled AND today falls within [start_date, end_date] (either bound may be
// open-ended/null). Fails closed: any error or "no DB" is treated as NOT exempt, so geofencing
// stays enforced rather than silently letting everyone through.
func IsRemoteExempt(ctx context.Context, employeeID int) (bool, error) {
	if !IsDBConnected() {
		return false, nil
	}
	var exempt bool
	err := GetDB().QueryRow(ctx, `
		SELECT enabled
			AND (start_date IS NULL OR start_date <= CURRENT_DATE)
			AND (end_date IS NULL OR end_date >= CURRENT_DATE)
		FROM attendance_location_exemptions
		WHERE employee_id = $1
	`, employeeID).Scan(&exempt)
	if err != nil {
		// Includes pgx.ErrNoRows (no exemption row = not exempt) — not a real failure.
		return false, nil
	}
	return exempt, nil
}

// GetLocationExemption returns the current exemption row for an employee, if any.
func GetLocationExemption(ctx context.Context, employeeID int) (*LocationExemption, error) {
	if !IsDBConnected() {
		return nil, nil
	}
	var e LocationExemption
	e.EmployeeID = employeeID
	err := GetDB().QueryRow(ctx, `
		SELECT enabled, reason, start_date, end_date, updated_at
		FROM attendance_location_exemptions WHERE employee_id = $1
	`, employeeID).Scan(&e.Enabled, &e.Reason, &e.StartDate, &e.EndDate, &e.UpdatedAt)
	if err != nil {
		return nil, nil
	}
	return &e, nil
}

// ListLocationExemptions returns every employee that currently has an exemption row (enabled or
// not), joined with their name/employeeId for display in the admin UI.
func ListLocationExemptions(ctx context.Context) ([]map[string]interface{}, error) {
	if !IsDBConnected() {
		return []map[string]interface{}{}, nil
	}
	rows, err := GetDB().Query(ctx, `
		SELECT e.employee_id, emp.full_name, emp.employee_id, e.enabled, e.reason, e.start_date, e.end_date, e.updated_at
		FROM attendance_location_exemptions e
		JOIN employees emp ON emp.id = e.employee_id
		ORDER BY emp.full_name
	`)
	if err != nil {
		return []map[string]interface{}{}, nil
	}
	defer rows.Close()

	results := []map[string]interface{}{}
	for rows.Next() {
		var employeeID int
		var fullName, employeeCode, reason string
		var enabled bool
		var startDate, endDate *time.Time
		var updatedAt time.Time
		if err := rows.Scan(&employeeID, &fullName, &employeeCode, &enabled, &reason, &startDate, &endDate, &updatedAt); err != nil {
			continue
		}
		results = append(results, map[string]interface{}{
			"employeeId":   employeeID,
			"fullName":     fullName,
			"employeeCode": employeeCode,
			"enabled":      enabled,
			"reason":       reason,
			"startDate":    startDate,
			"endDate":      endDate,
			"updatedAt":    updatedAt,
		})
	}
	return results, nil
}

// SetLocationExemption creates/updates/removes an employee's geofencing exemption. Passing
// enabled=false keeps the row (so the reason/dates are preserved/auditable) rather than deleting
// it — HR can flip it back on without re-entering details.
func SetLocationExemption(ctx context.Context, updatedBy int, e LocationExemption) error {
	if !IsDBConnected() {
		return nil
	}
	_, err := GetDB().Exec(ctx, `
		INSERT INTO attendance_location_exemptions (employee_id, enabled, reason, start_date, end_date, updated_by, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
		ON CONFLICT (employee_id) DO UPDATE SET
			enabled = EXCLUDED.enabled,
			reason = EXCLUDED.reason,
			start_date = EXCLUDED.start_date,
			end_date = EXCLUDED.end_date,
			updated_by = EXCLUDED.updated_by,
			updated_at = CURRENT_TIMESTAMP
	`, e.EmployeeID, e.Enabled, e.Reason, e.StartDate, e.EndDate, updatedBy)
	return err
}