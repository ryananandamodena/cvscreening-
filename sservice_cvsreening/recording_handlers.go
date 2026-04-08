package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// RECORDING HANDLERS
// =====================================================

func getRecordingsHandler(c *gin.Context) {
	idStr := c.Param("id")
	var interviewID int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interview ID"})
		return
	}

	recordings, err := repository.GetRecordingsByInterviewID(c.Request.Context(), interviewID)
	if err != nil {
		log.Printf("Failed to fetch recordings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recordings"})
		return
	}
	if recordings == nil {
		recordings = []repository.RecordingMeta{}
	}
	c.JSON(http.StatusOK, gin.H{"data": recordings})
}

func getRecordingByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	recording, err := repository.GetRecordingByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recording not found"})
		return
	}
	c.JSON(http.StatusOK, recording)
}

func createRecordingHandler(c *gin.Context) {
	var rec repository.RecordingMeta
	if err := c.ShouldBindJSON(&rec); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := repository.CreateRecordingMeta(c.Request.Context(), &rec)
	if err != nil {
		log.Printf("Failed to create recording: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create recording metadata"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Recording metadata created"})
}

func deleteRecordingHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := repository.DeleteRecording(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete recording: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recording"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recording deleted"})
}
