package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func getCandidatesHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	candidates, total, err := repository.GetCandidates(c.Request.Context(), page, limit)
	if err != nil {
		log.Printf("ERROR in getCandidatesHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch candidates", "details": err.Error()})
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       candidates,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func getCandidateByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	candidate, err := repository.GetCandidateByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "models.Candidate not found"})
		return
	}
	c.JSON(http.StatusOK, candidate)
}

func searchCandidatesHandler(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	// 1. Extract filters using AI
	filters, err := aiService.ExtractSearchFilters(c.Request.Context(), query)
	if err != nil {
		log.Printf("AI filter extraction failed: %v", err)
		// Fallback: simple text search if AI fails?
		// For now, return error or basic search
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process search query"})
		return
	}

	// 2. Search in Database
	candidates, err := repository.SearchCandidates(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database search failed"})
		return
	}

	// 3. Return results
	if candidates == nil {
		candidates = []models.Candidate{}
	}

	// Create a summary for the user
	summary := fmt.Sprintf("Found %d candidates matching: Role='%s', Skills=%v, Exp>=%d",
		len(candidates), filters.Role, filters.Skills, filters.ExperienceYears)

	c.JSON(http.StatusOK, gin.H{
		"data": candidates,
		"meta": gin.H{
			"filters": filters,
			"summary": summary,
		},
	})
}
