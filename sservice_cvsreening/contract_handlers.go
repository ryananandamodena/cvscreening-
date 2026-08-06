package main

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== CONTRACT HANDLERS ====================

func getEmployeeContractsHandler(c *gin.Context) {
	empID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}

	contracts, err := repository.GetContractsByEmployeeID(c.Request.Context(), empID)
	if err != nil {
		log.Printf("ERROR in getEmployeeContractsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch contracts", err.Error())
		return
	}

	c.JSON(http.StatusOK, contracts)
}

func createContractHandler(c *gin.Context) {
	empID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}

	var contract models.EmployeeContract
	if err := c.ShouldBindJSON(&contract); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	contract.EmployeeID = empID

	id, err := repository.CreateContract(c.Request.Context(), &contract)
	if err != nil {
		log.Printf("Failed to create contract: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create contract", err.Error())
		return
	}

	// Log audit trail
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     "create",
		Module:     "core_hr",
		EntityType: "contract",
		EntityID:   &id,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Contract created successfully"})
}

func getExpiringContractsHandler(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	contracts, err := repository.GetExpiringContracts(c.Request.Context(), days)
	if err != nil {
		log.Printf("ERROR in getExpiringContractsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch expiring contracts", err.Error())
		return
	}

	c.JSON(http.StatusOK, contracts)
}

// ==================== ONBOARDING HANDLERS ====================

func getOnboardingSessionsHandler(c *gin.Context) {
	status := c.Query("status")

	sessions, err := repository.GetOnboardingSessions(c.Request.Context(), status)
	if err != nil {
		log.Printf("ERROR in getOnboardingSessionsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch onboarding sessions", err.Error())
		return
	}

	c.JSON(http.StatusOK, sessions)
}

func createOnboardingSessionHandler(c *gin.Context) {
	var session models.OnboardingSession
	if err := c.ShouldBindJSON(&session); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	id, err := repository.CreateOnboardingSession(c.Request.Context(), &session)
	if err != nil {
		log.Printf("Failed to create onboarding session: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create onboarding session", err.Error())
		return
	}

	if session.TemplateID != nil {
		_, tasks, tplErr := repository.GetOnboardingTemplateByID(c.Request.Context(), *session.TemplateID)
		if tplErr != nil {
			log.Printf("WARN: onboarding session %d created but template %d could not be loaded: %v", id, *session.TemplateID, tplErr)
		} else if genErr := repository.GenerateTasksFromTemplate(c.Request.Context(), id, session.StartDate, tasks); genErr != nil {
			log.Printf("WARN: onboarding session %d created but tasks failed to generate: %v", id, genErr)
		}
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Onboarding session started successfully"})
}

func getOnboardingTasksHandler(c *gin.Context) {
	sessionID, err := strconv.Atoi(c.Param("sessionId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid session ID", nil)
		return
	}

	tasks, err := repository.GetOnboardingTasksBySessionID(c.Request.Context(), sessionID)
	if err != nil {
		log.Printf("ERROR in getOnboardingTasksHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch tasks", err.Error())
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func updateOnboardingTaskHandler(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("taskId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid task ID", nil)
		return
	}

	var req struct {
		Status    string `json:"status" binding:"required"`
		SessionID int    `json:"sessionId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	if err := repository.UpdateOnboardingTaskStatus(c.Request.Context(), taskID, req.Status); err != nil {
		log.Printf("Failed to update task status: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update task", err.Error())
		return
	}

	// Recalculate progress for the session
	repository.RecalculateOnboardingProgress(c.Request.Context(), req.SessionID)

	c.JSON(http.StatusOK, gin.H{"message": "Task status updated"})
}
