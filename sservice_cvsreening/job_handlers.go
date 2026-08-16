package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func getJobsHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	cacheKey := fmt.Sprintf("jobs_p%d_l%d", page, limit)
	if val, found := GetCache().Get(cacheKey); found {
		c.JSON(http.StatusOK, val)
		return
	}

	jobs, total, err := repository.GetJobs(c.Request.Context(), page, limit)
	if err != nil {
		log.Printf("ERROR in getJobsHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch jobs", "details": err.Error()})
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	response := models.PaginatedResponse{
		Data:       jobs,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	// Cache for 2 minutes
	GetCache().Set(cacheKey, response, 2*time.Minute)

	c.JSON(http.StatusOK, response)
}

func getJobByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	job, err := repository.GetJobByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}
	c.JSON(http.StatusOK, job)
}

func createJobHandler(c *gin.Context) {
	var job models.JobDescription
	if err := c.ShouldBindJSON(&job); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// Validate job data
	if validationErrors := ValidateJobData(job.Title, job.Department, job.Description); len(validationErrors) > 0 {
		RespondWithError(c, http.StatusBadRequest, "validation_failed", "Job data validation failed", validationErrors)
		return
	}

	id, err := repository.CreateJob(c.Request.Context(), &job)
	if err != nil {
		log.Printf("Failed to create job: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create job", nil)
		return
	}

	// Invalidate Cache
	GetCache().Delete("analytics_full")
	GetCache().Delete("jobs_p1_l10") // Invalidate first page

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Job created successfully"})

	// Log Activity
	repository.LogActivity(c.Request.Context(), GetUserIDFromContext(c), "create_job", "job", id, "Created job: "+job.Title, c.ClientIP())
}

func updateJobHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid job ID", nil)
		return
	}

	var job models.JobDescription
	if err := c.ShouldBindJSON(&job); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	job.ID = id

	// Validate job data
	if validationErrors := ValidateJobData(job.Title, job.Department, job.Description); len(validationErrors) > 0 {
		RespondWithError(c, http.StatusBadRequest, "validation_failed", "Job data validation failed", validationErrors)
		return
	}

	if err := repository.UpdateJob(c.Request.Context(), &job); err != nil {
		log.Printf("Failed to update job: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update job", nil)
		return
	}

	// Invalidate Cache
	GetCache().Delete("analytics_full")
	GetCache().Delete("jobs_p1_l10")

	c.JSON(http.StatusOK, gin.H{"message": "Job updated successfully"})
}

func deleteJobHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := repository.DeleteJob(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete job: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job"})
		return
	}

	// Invalidate Cache
	GetCache().Delete("analytics_full")
	GetCache().Delete("jobs_p1_l10")

	c.JSON(http.StatusOK, gin.H{"message": "Job deleted successfully"})
}
