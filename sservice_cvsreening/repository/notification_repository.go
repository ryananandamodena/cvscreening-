package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

// ==================== NOTIFICATION REPOSITORY ====================

// GetNotificationTemplate fetches a template by its code
func GetNotificationTemplate(ctx context.Context, code string) (*models.NotificationTemplate, error) {
	if !IsDBConnected() {
		return nil, fmt.Errorf("database not connected")
	}

	var t models.NotificationTemplate
	var channels []byte
	err := GetDB().QueryRow(ctx, `
		SELECT id, code, title_template, body_template, channels, COALESCE(module, ''), is_active, created_at, updated_at
		FROM notification_templates
		WHERE code = $1 AND is_active = true
	`, code).Scan(
		&t.ID, &t.Code, &t.TitleTemplate, &t.BodyTemplate, &channels, &t.Module, &t.IsActive, &t.CreatedAt, &t.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}
	t.Channels = channels
	return &t, nil
}

// CreateNotification inserts a new notification into the database
func CreateNotification(ctx context.Context, notif *models.Notification) (int, error) {
	if !IsDBConnected() {
		return 0, fmt.Errorf("database not connected")
	}

	var metaData []byte
	if notif.Metadata != nil {
		metaData = notif.Metadata
	} else {
		metaData = []byte("{}")
	}

	var id int
	err := GetDB().QueryRow(ctx, `
		INSERT INTO notifications (template_id, recipient_id, recipient_email, title, body, channel, status, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, notif.TemplateID, notif.RecipientID, notif.RecipientEmail, notif.Title, notif.Body, notif.Channel, notif.Status, metaData).Scan(&id)

	return id, err
}

// GetUserNotifications fetches notifications for a specific user
func GetUserNotifications(ctx context.Context, userID int, unreadOnly bool, limit int) ([]models.Notification, error) {
	if !IsDBConnected() {
		return []models.Notification{}, nil
	}

	if limit <= 0 {
		limit = 50
	}

	whereClause := "recipient_id = $1"
	if unreadOnly {
		whereClause += " AND read_at IS NULL AND status != 'failed'"
	}

	query := fmt.Sprintf(`
		SELECT id, template_id, recipient_id, recipient_email, title, body, channel, status, read_at, sent_at, metadata, created_at, updated_at
		FROM notifications
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $2
	`, whereClause)

	rows, err := GetDB().Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifs []models.Notification
	for rows.Next() {
		var n models.Notification
		var meta []byte
		err := rows.Scan(
			&n.ID, &n.TemplateID, &n.RecipientID, &n.RecipientEmail, &n.Title, &n.Body, 
			&n.Channel, &n.Status, &n.ReadAt, &n.SentAt, &meta, &n.CreatedAt, &n.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning notification: %v", err)
			continue
		}
		
		if meta != nil && string(meta) != "" {
			n.Metadata = json.RawMessage(meta)
		}
		notifs = append(notifs, n)
	}

	return notifs, nil
}

// MarkNotificationAsRead updates the read status
func MarkNotificationAsRead(ctx context.Context, notificationID int, userID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE notifications SET 
			read_at = CURRENT_TIMESTAMP,
			status = CASE WHEN status = 'pending' THEN 'read' ELSE status END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND recipient_id = $2
	`, notificationID, userID)

	return err
}

// MarkAllNotificationsAsRead marks all user notifications as read
func MarkAllNotificationsAsRead(ctx context.Context, userID int) error {
	if !IsDBConnected() {
		return fmt.Errorf("database not connected")
	}

	_, err := GetDB().Exec(ctx, `
		UPDATE notifications SET 
			read_at = CURRENT_TIMESTAMP,
			status = CASE WHEN status = 'pending' THEN 'read' ELSE status END,
			updated_at = CURRENT_TIMESTAMP
		WHERE recipient_id = $1 AND read_at IS NULL
	`, userID)

	return err
}
