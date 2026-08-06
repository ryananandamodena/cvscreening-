package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func paginatedLimit(c *gin.Context) int {
	limit, _ := strconv.Atoi(c.Query("limit"))
	if limit <= 0 {
		limit = 50
	}
	return limit
}

// getPoliciesHandler lists company policies
func getPoliciesHandler(c *gin.Context) {
	limit := paginatedLimit(c)
	policies, total, err := repository.GetPolicies(c.Request.Context(), c.Query("category"), c.Query("status"), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	if page < 1 {
		page = 1
	}
	totalPages := (total + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}
	c.JSON(http.StatusOK, gin.H{"data": policies, "total": total, "page": page, "totalPages": totalPages})
}

// getDocumentContractsHandler lists employment contracts for the Documents dashboard
func getDocumentContractsHandler(c *gin.Context) {
	limit := paginatedLimit(c)
	contracts, total, err := repository.GetContractSummaries(c.Request.Context(), c.Query("status"), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	if page < 1 {
		page = 1
	}
	totalPages := (total + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}
	c.JSON(http.StatusOK, gin.H{"data": contracts, "total": total, "page": page, "totalPages": totalPages})
}

// getComplianceRecordsHandler lists compliance tracking records
func getComplianceRecordsHandler(c *gin.Context) {
	limit := paginatedLimit(c)
	records, total, err := repository.GetComplianceRecords(c.Request.Context(), c.Query("status"), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	page, _ := strconv.Atoi(c.Query("page"))
	if page < 1 {
		page = 1
	}
	totalPages := (total + limit - 1) / limit
	if totalPages < 1 {
		totalPages = 1
	}
	c.JSON(http.StatusOK, gin.H{"data": records, "total": total, "page": page, "totalPages": totalPages})
}
