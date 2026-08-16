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

	// 1. Try AI-based filter extraction first. If it fails (quota, timeout, malformed
	// response, etc.), fall back to a basic substring search instead of failing the whole
	// request — but the fallback must be clearly labeled as such (`meta.source`), never
	// presented to the caller as if it were the AI result.
	source := "ai"
	filters, err := aiService.ExtractSearchFilters(c.Request.Context(), query)
	if err != nil {
		log.Printf("AI filter extraction failed, falling back to basic search: %v", err)
		source = "basic_search"
		filters = &models.SearchFilters{Query: query, Role: query}
	}

	// 2. Search in Database
	candidates, err := repository.SearchCandidates(c.Request.Context(), filters)
	if err != nil {
		log.Printf("ERROR in searchCandidatesHandler: database search failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database search failed"})
		return
	}

	// 3. Return results
	if candidates == nil {
		candidates = []models.Candidate{}
	}

	var summary string
	if source == "ai" {
		summary = fmt.Sprintf("Found %d candidates matching: Role='%s', Skills=%v, Exp>=%d",
			len(candidates), filters.Role, filters.Skills, filters.ExperienceYears)
	} else {
		summary = fmt.Sprintf("Found %d candidates matching \"%s\" (basic search — AI search was unavailable)", len(candidates), query)
	}

	c.JSON(http.StatusOK, gin.H{
		"data": candidates,
		"meta": gin.H{
			"filters": filters,
			"summary": summary,
			"source":  source,
		},
	})
}
