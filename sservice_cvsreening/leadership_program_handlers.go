package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func getLeadershipProgramsHandler(c *gin.Context) {
	programs, err := repository.GetLeadershipPrograms(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getLeadershipProgramsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leadership programs", err.Error())
		return
	}
	c.JSON(http.StatusOK, programs)
}

func createLeadershipProgramHandler(c *gin.Context) {
	var p models.LeadershipDevelopment
	if err := c.ShouldBindJSON(&p); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateLeadershipProgram(c.Request.Context(), &p)
	if err != nil {
		log.Printf("Failed to create leadership program: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create leadership program", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Leadership program created successfully"})
}

func updateLeadershipProgramHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid leadership program ID", nil)
		return
	}
	var p models.LeadershipDevelopment
	if err := c.ShouldBindJSON(&p); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	p.ID = id
	if err := repository.UpdateLeadershipProgram(c.Request.Context(), &p); err != nil {
		log.Printf("Failed to update leadership program: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update leadership program", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Leadership program updated successfully"})
}

func enrollInLeadershipProgramHandler(c *gin.Context) {
	programID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid leadership program ID", nil)
		return
	}
	var payload struct {
		EmployeeID int `json:"employeeId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.EnrollInLeadershipProgram(c.Request.Context(), programID, payload.EmployeeID); err != nil {
		log.Printf("Failed to enroll in leadership program: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to enroll in leadership program", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Enrolled successfully"})
}

func completeLeadershipProgramHandler(c *gin.Context) {
	programID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid leadership program ID", nil)
		return
	}
	var payload struct {
		EmployeeID int      `json:"employeeId" binding:"required"`
		Outcomes   []string `json:"outcomes"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.CompleteLeadershipProgram(c.Request.Context(), programID, payload.EmployeeID, payload.Outcomes); err != nil {
		log.Printf("Failed to complete leadership program: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to complete leadership program", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Marked completed successfully"})
}
