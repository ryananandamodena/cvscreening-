package main

import (
	"log"
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

// policyRequest is the write-request shape for policy create/update — separates the
// optional `content` field (policy body text) from the CompanyPolicy read model.
type policyRequest struct {
	repository.CompanyPolicy
	Content string `json:"content"`
}

// createPolicyHandler creates a new company policy
func createPolicyHandler(c *gin.Context) {
	var req policyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	var createdBy *int
	if uid := GetUserIDFromContext(c); uid > 0 {
		createdBy = &uid
	}
	id, err := repository.CreatePolicy(c.Request.Context(), &req.CompanyPolicy, req.Content, createdBy)
	if err != nil {
		log.Printf("Failed to create policy: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create policy", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Policy created successfully"})
}

// updatePolicyHandler updates an existing company policy
func updatePolicyHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid policy ID", nil)
		return
	}
	var req policyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	req.CompanyPolicy.ID = id
	if err := repository.UpdatePolicy(c.Request.Context(), &req.CompanyPolicy, req.Content); err != nil {
		log.Printf("Failed to update policy: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update policy", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Policy updated successfully"})
}

// deletePolicyHandler deletes a company policy
func deletePolicyHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid policy ID", nil)
		return
	}
	if err := repository.DeletePolicy(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete policy: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete policy", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Policy deleted successfully"})
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
