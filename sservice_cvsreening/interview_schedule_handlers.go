package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// INTERVIEW SCHEDULE HANDLERS
// =====================================================

func getInterviewSchedulesHandler(c *gin.Context) {
	status := c.Query("status")
	interviewType := c.Query("type")

	schedules, err := repository.GetInterviewSchedules(c.Request.Context(), status, interviewType)
	if err != nil {
		log.Printf("Failed to fetch interview schedules: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch interview schedules"})
		return
	}
	if schedules == nil {
		schedules = []repository.InterviewSchedule{}
	}
	c.JSON(http.StatusOK, gin.H{"data": schedules})
}

func createInterviewScheduleHandler(c *gin.Context) {
	var s repository.InterviewSchedule
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := repository.CreateInterviewSchedule(c.Request.Context(), &s)
	if err != nil {
		log.Printf("Failed to create interview schedule: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create interview schedule"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Interview schedule created"})
}

func getInterviewScheduleByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	schedule, err := repository.GetInterviewScheduleByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Interview schedule not found"})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

func updateInterviewScheduleHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var s repository.InterviewSchedule
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s.ID = id

	if err := repository.UpdateInterviewSchedule(c.Request.Context(), &s); err != nil {
		log.Printf("Failed to update interview schedule: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update schedule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interview schedule updated"})
}

func cancelInterviewScheduleHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&payload)

	if err := repository.CancelInterviewSchedule(c.Request.Context(), id, payload.Reason); err != nil {
		log.Printf("Failed to cancel interview schedule: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel schedule"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interview schedule cancelled"})
}
