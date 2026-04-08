package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// INTERVIEW SCORECARD HANDLERS
// =====================================================

func getScorecardHandler(c *gin.Context) {
	idStr := c.Param("id")
	var interviewID int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID"})
		return
	}

	scorecard, err := repository.GetScorecardByInterviewID(c.Request.Context(), interviewID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scorecard not found"})
		return
	}
	c.JSON(http.StatusOK, scorecard)
}

func getScorecardsHandler(c *gin.Context) {
	idStr := c.Param("id")
	var interviewID int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID"})
		return
	}

	scorecards, err := repository.GetScorecardsByInterviewID(c.Request.Context(), interviewID)
	if err != nil {
		log.Printf("Failed to fetch scorecards: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scorecards"})
		return
	}
	if scorecards == nil {
		scorecards = []repository.InterviewScorecard{}
	}
	c.JSON(http.StatusOK, gin.H{"data": scorecards})
}

func createScorecardHandler(c *gin.Context) {
	idStr := c.Param("id")
	var interviewID int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID"})
		return
	}

	var sc repository.InterviewScorecard
	if err := c.ShouldBindJSON(&sc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sc.InterviewID = interviewID

	id, err := repository.CreateScorecard(c.Request.Context(), &sc)
	if err != nil {
		log.Printf("Failed to create scorecard: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create scorecard"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Scorecard created"})
}

func updateScorecardHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var sc repository.InterviewScorecard
	if err := c.ShouldBindJSON(&sc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	sc.ID = id

	if err := repository.UpdateScorecard(c.Request.Context(), &sc); err != nil {
		log.Printf("Failed to update scorecard: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update scorecard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scorecard updated"})
}

func deleteScorecardHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := repository.DeleteScorecard(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete scorecard: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete scorecard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scorecard deleted"})
}
