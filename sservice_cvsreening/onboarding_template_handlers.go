package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// createOnboardingTemplateHandler lets HR define a reusable onboarding checklist
func createOnboardingTemplateHandler(c *gin.Context) {
	var req struct {
		Name         string                                   `json:"name" binding:"required"`
		DepartmentID *int                                     `json:"departmentId"`
		Tasks        []repository.OnboardingTemplateTask      `json:"tasks" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	createdBy := GetUserIDFromContext(c)
	id, err := repository.CreateOnboardingTemplate(c.Request.Context(), req.Name, req.DepartmentID, req.Tasks, createdBy)
	if err != nil {
		log.Printf("ERROR in createOnboardingTemplateHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat template onboarding", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Onboarding template created"})
}

// getOnboardingTemplatesHandler lists all onboarding templates
func getOnboardingTemplatesHandler(c *gin.Context) {
	templates, err := repository.GetOnboardingTemplates(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getOnboardingTemplatesHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil template onboarding", err.Error())
		return
	}
	c.JSON(http.StatusOK, templates)
}

// setOnboardingTemplateActiveHandler activates/deactivates a template
func setOnboardingTemplateActiveHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid template id", nil)
		return
	}
	var req struct {
		Active bool `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.SetOnboardingTemplateActive(c.Request.Context(), id, req.Active); err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memperbarui status template", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Template status updated"})
}

// deleteOnboardingTemplateHandler removes a template
func deleteOnboardingTemplateHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid template id", nil)
		return
	}
	if err := repository.DeleteOnboardingTemplate(c.Request.Context(), id); err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menghapus template", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Template deleted"})
}

// createOnboardingTaskHandler lets HR/Manager add an ad-hoc task to an existing onboarding session
func createOnboardingTaskHandler(c *gin.Context) {
	sessionID, err := strconv.Atoi(c.Param("sessionId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid session id", nil)
		return
	}

	var task models.OnboardingTask
	if err := c.ShouldBindJSON(&task); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if task.Title == "" {
		RespondWithError(c, http.StatusBadRequest, "title_required", "Judul task wajib diisi", nil)
		return
	}
	task.SessionID = sessionID

	id, err := repository.CreateOnboardingTask(c.Request.Context(), &task)
	if err != nil {
		log.Printf("ERROR in createOnboardingTaskHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat task", err.Error())
		return
	}

	repository.RecalculateOnboardingProgress(c.Request.Context(), sessionID)

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Task created"})
}
