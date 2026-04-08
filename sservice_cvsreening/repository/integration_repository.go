package repository

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

// =====================================================
// INTEGRATION REPOSITORY
// =====================================================

// Integration represents an integration record
type Integration struct {
	ID           int             `json:"id"`
	Name         string          `json:"name"`
	Type         string          `json:"type"`
	Status       string          `json:"status"`
	Config       json.RawMessage `json:"config"`
	LastSyncAt   *time.Time      `json:"lastSyncAt"`
	ConnectedBy  *int            `json:"connectedBy"`
	ErrorMessage string          `json:"errorMessage"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

func GetIntegrations(ctx context.Context) ([]Integration, error) {
	if !IsDBConnected() {
		return []Integration{}, nil
	}

	rows, err := GetDB().Query(ctx, `
		SELECT id, name, type, COALESCE(status, 'disconnected'), COALESCE(config, '{}'),
		       last_sync_at, connected_by, COALESCE(error_message, ''), created_at, updated_at
		FROM integrations
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var integrations []Integration
	for rows.Next() {
		var i Integration
		err := rows.Scan(
			&i.ID, &i.Name, &i.Type, &i.Status, &i.Config,
			&i.LastSyncAt, &i.ConnectedBy, &i.ErrorMessage, &i.CreatedAt, &i.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning integration: %v", err)
			continue
		}
		integrations = append(integrations, i)
	}

	return integrations, nil
}

func GetIntegrationByType(ctx context.Context, integrationType string) (*Integration, error) {
	if !IsDBConnected() {
		return nil, nil
	}

	var i Integration
	err := GetDB().QueryRow(ctx, `
		SELECT id, name, type, COALESCE(status, 'disconnected'), COALESCE(config, '{}'),
		       last_sync_at, connected_by, COALESCE(error_message, ''), created_at, updated_at
		FROM integrations
		WHERE type = $1
	`, integrationType).Scan(
		&i.ID, &i.Name, &i.Type, &i.Status, &i.Config,
		&i.LastSyncAt, &i.ConnectedBy, &i.ErrorMessage, &i.CreatedAt, &i.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	return &i, nil
}

func UpsertIntegration(ctx context.Context, i *Integration) (int, error) {
	if !IsDBConnected() {
		return 0, nil
	}

	configJSON := i.Config
	if configJSON == nil {
		configJSON = json.RawMessage("{}")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO integrations (name, type, status, config, connected_by, error_message)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (name) DO UPDATE SET
			status = $3, config = $4, connected_by = $5, error_message = $6,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id
	`, i.Name, i.Type, i.Status, configJSON, i.ConnectedBy, i.ErrorMessage).Scan(&id)

	if err != nil {
		log.Printf("Failed to upsert integration: %v", err)
		return 0, err
	}
	return id, nil
}

func UpdateIntegrationStatus(ctx context.Context, integrationType, status, errorMsg string) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE integrations
		SET status = $1, error_message = $2, 
		    last_sync_at = CASE WHEN $1 = 'connected' THEN CURRENT_TIMESTAMP ELSE last_sync_at END,
		    updated_at = CURRENT_TIMESTAMP
		WHERE type = $3
	`, status, errorMsg, integrationType)

	if err != nil {
		log.Printf("Failed to update integration status: %v", err)
		return err
	}
	return nil
}

func DeleteIntegration(ctx context.Context, id int) error {
	if !IsDBConnected() {
		return nil
	}

	_, err := GetDB().Exec(ctx, "DELETE FROM integrations WHERE id = $1", id)
	if err != nil {
		log.Printf("Failed to delete integration: %v", err)
		return err
	}
	return nil
}
