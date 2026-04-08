package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// models.Interview models.Questions Handlers

func getAllQuestionsHandler(c *gin.Context) {
	questions, err := repository.GetAllInterviewQuestions(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch questions"})
		return
	}
	if questions == nil {
		c.JSON(http.StatusOK, []models.InterviewQuestion{})
		return
	}
	c.JSON(http.StatusOK, questions)
}

func getSettingsHandler(c *gin.Context) {
	settings, err := repository.GetSettings(c.Request.Context())
	if err != nil {
		log.Printf("Failed to get settings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func updateSettingsHandler(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.UpdateSettings(c.Request.Context(), payload); err != nil {
		log.Printf("Failed to update settings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	// Log the update for audit purposes
	userId := 1 // Default to system/admin for now as we don't have user context easily here without middleware extraction
	// In a real app, extract user ID from JWT context
	repository.LogActivity(c.Request.Context(), userId, "update_settings", "settings", 0, "Updated global settings", c.ClientIP())

	c.JSON(http.StatusOK, gin.H{"message": "Settings updated successfully", "updated": payload})
}

func createQuestionHandler(c *gin.Context) {
	jobIDStr := c.Param("id")
	var jobID int
	if _, err := fmt.Sscanf(jobIDStr, "%d", &jobID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Job ID"})
		return
	}

	var q models.InterviewQuestion
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	q.JobID = jobID

	id, err := repository.CreateInterviewQuestion(c.Request.Context(), &q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "models.Question added"})
}

func getInterviewQuestionsHandler(c *gin.Context) {
	jobIDStr := c.Param("id")
	var jobID int
	if _, err := fmt.Sscanf(jobIDStr, "%d", &jobID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Job ID"})
		return
	}

	questions, err := repository.GetInterviewQuestions(c.Request.Context(), jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch questions"})
		return
	}
	if questions == nil {
		c.JSON(http.StatusOK, []models.InterviewQuestion{})
		return
	}
	c.JSON(http.StatusOK, questions)
}

func updateInterviewQuestionHandler(c *gin.Context) {
	idStr := c.Param("qid")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Question ID"})
		return
	}

	var q models.InterviewQuestion
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	q.ID = id

	if err := repository.UpdateInterviewQuestion(c.Request.Context(), &q); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "models.Question updated"})
}

func deleteQuestionHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Question ID"})
		return
	}

	if err := repository.DeleteInterviewQuestion(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "models.Question deleted"})
}
