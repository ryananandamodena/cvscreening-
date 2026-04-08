package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// OFFER LETTER HANDLERS
// =====================================================

func listOfferLettersHandler(c *gin.Context) {
	status := c.Query("status")
	offers, err := repository.GetOfferLetters(c.Request.Context(), status)
	if err != nil {
		log.Printf("Failed to list offer letters: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch offer letters"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": offers, "total": len(offers)})
}

func getOfferLetterHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	offer, err := repository.GetOfferLetterByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Offer letter not found"})
		return
	}
	c.JSON(http.StatusOK, offer)
}

func createOfferLetterHandler(c *gin.Context) {
	var offer models.OfferLetter
	if err := c.ShouldBindJSON(&offer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default currency if not provided
	if offer.SalaryCurrency == "" {
		offer.SalaryCurrency = "IDR"
	}
	if offer.TemplateType == "" {
		offer.TemplateType = "standard"
	}

	id, err := repository.CreateOfferLetter(c.Request.Context(), &offer)
	if err != nil {
		log.Printf("Failed to create offer letter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create offer letter"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Offer letter created successfully"})
}

func updateOfferLetterHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var offer models.OfferLetter
	if err := c.ShouldBindJSON(&offer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	offer.ID = id

	if err := repository.UpdateOfferLetter(c.Request.Context(), &offer); err != nil {
		log.Printf("Failed to update offer letter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update offer letter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Offer letter updated successfully"})
}

func sendOfferLetterHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := repository.SendOfferLetter(c.Request.Context(), id); err != nil {
		log.Printf("Failed to send offer letter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send offer letter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Offer letter sent successfully"})
}

func updateOfferLetterStatusHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	validStatuses := map[string]bool{"accepted": true, "declined": true, "expired": true, "draft": true}
	if !validStatuses[payload.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	if err := repository.UpdateOfferLetterStatus(c.Request.Context(), id, payload.Status); err != nil {
		log.Printf("Failed to update offer letter status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func deleteOfferLetterHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := repository.DeleteOfferLetter(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete offer letter: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete offer letter"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Offer letter deleted"})
}
