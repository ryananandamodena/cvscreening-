package main

import (
	"context"
	"log"
	"strings"

	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// NotificationEngine represents the core notification service
type NotificationEngine struct {
	// Pointers to other services like email or whatsapp can be added here
}

// NotificationRequest defines the payload for sending an alert
type NotificationRequest struct {
	TemplateCode   string
	RecipientID    *int
	RecipientEmail string
	Variables      map[string]string
	Metadata       []byte
	Channel        string // override default channel if needed
}

// NewNotificationEngine initializes the engine
func NewNotificationEngine() *NotificationEngine {
	return &NotificationEngine{}
}

// Send dispatches a notification based on a template
func (ne *NotificationEngine) Send(ctx context.Context, req NotificationRequest) error {
	// 1. Fetch template
	template, err := repository.GetNotificationTemplate(ctx, req.TemplateCode)
	if err != nil {
		return err
	}

	// 2. Render variables
	title := template.TitleTemplate
	body := template.BodyTemplate

	for key, val := range req.Variables {
		placeholder := "{" + key + "}"
		title = strings.ReplaceAll(title, placeholder, val)
		body = strings.ReplaceAll(body, placeholder, val)
	}

	// Determine channel (use request override or default to in_app)
	channel := "in_app"
	if req.Channel != "" {
		channel = req.Channel
	}

	// 3. Create Notification record
	notif := models.Notification{
		TemplateID:     &template.ID,
		RecipientID:    req.RecipientID,
		RecipientEmail: req.RecipientEmail,
		Title:          title,
		Body:           body,
		Channel:        channel,
		Status:         "pending", // would be 'sent' if we immediately dispatch email
		Metadata:       req.Metadata,
	}

	_, err = repository.CreateNotification(ctx, &notif)
	if err != nil {
		log.Printf("Failed to insert notification: %v", err)
		return err
	}

	// 4. Dispatch simulated (for in_app it's just saved to DB, for email we would call EmailService)
	// if channel == "email" && req.RecipientEmail != "" {
	// 	go emailService.SendHTML(...)
	// }

	return nil
}
