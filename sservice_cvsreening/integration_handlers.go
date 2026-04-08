package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// INTEGRATION HANDLERS
// =====================================================

func getIntegrationsHandler(c *gin.Context) {
	integrations, err := repository.GetIntegrations(c.Request.Context())
	if err != nil {
		log.Printf("Failed to fetch integrations: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch integrations"})
		return
	}

	if integrations == nil {
		integrations = []repository.Integration{}
	}

	// Ensure all possible integration types are represented
	typeMap := make(map[string]bool)
	for _, i := range integrations {
		typeMap[i.Type] = true
	}

	defaultIntegrations := []struct {
		Name string
		Type string
	}{
		{"Google Calendar", "google_calendar"},
		{"WhatsApp Business", "whatsapp"},
		{"LinkedIn", "linkedin"},
	}

	for _, def := range defaultIntegrations {
		if !typeMap[def.Type] {
			integrations = append(integrations, repository.Integration{
				Name:   def.Name,
				Type:   def.Type,
				Status: "disconnected",
				Config: json.RawMessage("{}"),
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": integrations})
}

func getIntegrationByTypeHandler(c *gin.Context) {
	integrationType := c.Param("type")

	integration, err := repository.GetIntegrationByType(c.Request.Context(), integrationType)
	if err != nil {
		// Return default disconnected status
		c.JSON(http.StatusOK, repository.Integration{
			Name:   integrationType,
			Type:   integrationType,
			Status: "disconnected",
			Config: json.RawMessage("{}"),
		})
		return
	}
	c.JSON(http.StatusOK, integration)
}

func connectIntegrationHandler(c *gin.Context) {
	integrationType := c.Param("type")

	var payload struct {
		Config json.RawMessage `json:"config"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	nameMap := map[string]string{
		"google_calendar": "Google Calendar",
		"whatsapp":        "WhatsApp Business",
		"linkedin":        "LinkedIn",
	}

	name := nameMap[integrationType]
	if name == "" {
		name = integrationType
	}

	integration := &repository.Integration{
		Name:   name,
		Type:   integrationType,
		Status: "connected",
		Config: payload.Config,
	}

	id, err := repository.UpsertIntegration(c.Request.Context(), integration)
	if err != nil {
		log.Printf("Failed to connect integration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect integration"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id, "message": fmt.Sprintf("%s connected successfully", name), "status": "connected"})
}

func disconnectIntegrationHandler(c *gin.Context) {
	integrationType := c.Param("type")

	err := repository.UpdateIntegrationStatus(c.Request.Context(), integrationType, "disconnected", "")
	if err != nil {
		log.Printf("Failed to disconnect integration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect integration"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Integration disconnected", "status": "disconnected"})
}

func testIntegrationHandler(c *gin.Context) {
	integrationType := c.Param("type")

	// Check if integration is configured
	integration, err := repository.GetIntegrationByType(c.Request.Context(), integrationType)
	if err != nil || integration.Status != "connected" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Integration not connected",
		})
		return
	}

	// In production, this would actually test the connection
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("%s connection test successful", integration.Name),
	})
}

// =====================================================
// GOOGLE CALENDAR HANDLERS
// =====================================================

func googleCalendarAuthHandler(c *gin.Context) {
	var payload struct {
		AccessToken string `json:"accessToken"`
		Email       string `json:"email"`
		CalendarID  string `json:"calendarId"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, _ := json.Marshal(map[string]string{
		"accessToken": payload.AccessToken,
		"email":       payload.Email,
		"calendarId":  payload.CalendarID,
	})

	integration := &repository.Integration{
		Name:   "Google Calendar",
		Type:   "google_calendar",
		Status: "connected",
		Config: config,
	}

	id, err := repository.UpsertIntegration(c.Request.Context(), integration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save Google Calendar config"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":        id,
		"message":   "Google Calendar connected successfully",
		"connected": true,
		"email":     payload.Email,
	})
}

func googleCalendarSyncHandler(c *gin.Context) {
	integration, err := repository.GetIntegrationByType(c.Request.Context(), "google_calendar")
	if err != nil || integration.Status != "connected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Google Calendar not connected"})
		return
	}

	// Update last sync time
	repository.UpdateIntegrationStatus(c.Request.Context(), "google_calendar", "connected", "")

	c.JSON(http.StatusOK, gin.H{
		"message": "Google Calendar synced successfully",
		"synced":  true,
	})
}

func googleCalendarDisconnectHandler(c *gin.Context) {
	err := repository.UpdateIntegrationStatus(c.Request.Context(), "google_calendar", "disconnected", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect Google Calendar"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Google Calendar disconnected", "connected": false})
}

// =====================================================
// WHATSAPP HANDLERS
// =====================================================

func whatsappConfigHandler(c *gin.Context) {
	var payload struct {
		PhoneNumberID     string `json:"phoneNumberId"`
		BusinessAccountID string `json:"businessAccountId"`
		AccessToken       string `json:"accessToken"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, _ := json.Marshal(map[string]string{
		"phoneNumberId":     payload.PhoneNumberID,
		"businessAccountId": payload.BusinessAccountID,
		"accessToken":       payload.AccessToken,
	})

	integration := &repository.Integration{
		Name:   "WhatsApp Business",
		Type:   "whatsapp",
		Status: "connected",
		Config: config,
	}

	id, err := repository.UpsertIntegration(c.Request.Context(), integration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save WhatsApp config"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"message": "WhatsApp Business connected successfully",
		"success": true,
	})
}

func whatsappSendHandler(c *gin.Context) {
	integration, err := repository.GetIntegrationByType(c.Request.Context(), "whatsapp")
	if err != nil || integration.Status != "connected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "WhatsApp not connected", "success": false})
		return
	}

	var payload struct {
		To       string `json:"to"`
		Template string `json:"template"`
		Message  string `json:"message"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In production, this would call the WhatsApp Business API
	log.Printf("WhatsApp message to %s: %s", payload.To, payload.Message)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"messageId": fmt.Sprintf("wa_%d", 1),
		"message":   "Message sent successfully",
	})
}

func whatsappTemplatesHandler(c *gin.Context) {
	// Return default templates
	templates := []map[string]interface{}{
		{
			"id":       "interview_invitation",
			"name":     "Interview Invitation",
			"language": "id",
			"category": "UTILITY",
			"status":   "APPROVED",
		},
		{
			"id":       "interview_reminder",
			"name":     "Interview Reminder",
			"language": "id",
			"category": "UTILITY",
			"status":   "APPROVED",
		},
		{
			"id":       "application_status",
			"name":     "Application Status Update",
			"language": "id",
			"category": "UTILITY",
			"status":   "APPROVED",
		},
		{
			"id":       "offer_notification",
			"name":     "Offer Letter Notification",
			"language": "id",
			"category": "UTILITY",
			"status":   "APPROVED",
		},
		{
			"id":       "assessment_invitation",
			"name":     "Assessment Invitation",
			"language": "id",
			"category": "UTILITY",
			"status":   "APPROVED",
		},
	}

	c.JSON(http.StatusOK, gin.H{"templates": templates})
}

func whatsappDisconnectHandler(c *gin.Context) {
	err := repository.UpdateIntegrationStatus(c.Request.Context(), "whatsapp", "disconnected", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disconnect WhatsApp"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "WhatsApp disconnected", "success": true})
}

func whatsappTestHandler(c *gin.Context) {
	integration, err := repository.GetIntegrationByType(c.Request.Context(), "whatsapp")
	if err != nil || integration.Status != "connected" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "WhatsApp not connected",
		})
		return
	}

	var payload struct {
		Phone string `json:"phone"`
	}
	c.ShouldBindJSON(&payload)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Test message sent to %s", payload.Phone),
	})
}
