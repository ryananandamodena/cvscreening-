package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== BENEFITS EXTRAS ====================

// getBenefitsAnalyticsHandler returns aggregated benefits enrollment data
func getBenefitsAnalyticsHandler(c *gin.Context) {
	analytics, err := repository.GetBenefitsAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

// ==================== SUCCESSION EXTRAS ====================

// getSuccessionCandidatesHandler returns succession candidates across all plans
func getSuccessionCandidatesHandler(c *gin.Context) {
	candidates, err := repository.GetAllSuccessionCandidates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, candidates)
}

// getNineBoxGridHandler returns the 9-box succession/performance grid
func getNineBoxGridHandler(c *gin.Context) {
	grid, err := repository.GetNineBoxGrid(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, grid)
}

// ==================== COMPENSATION EXTRAS ====================

// getSalaryGradesHandler returns compensation bands adapted into the SalaryGrade shape
func getSalaryGradesHandler(c *gin.Context) {
	grades, err := repository.GetSalaryGrades(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, grades)
}

// getCompensationStructuresHandler returns per-employee compensation structures
func getCompensationStructuresHandler(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Query("employeeId"))
	structures, err := repository.GetCompensationStructures(c.Request.Context(), employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, structures)
}

// getCompensationAnalyticsHandler returns aggregated salary analytics
func getCompensationAnalyticsHandler(c *gin.Context) {
	analytics, err := repository.GetCompensationAnalytics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

// ==================== TRAINING EXTRAS ====================

// getTrainingEmployeeHandler returns training enrollments, optionally scoped to one employee
func getTrainingEmployeeHandler(c *gin.Context) {
	employeeIDStr := c.Query("employeeId")
	if employeeIDStr == "" {
		enrollments, err := repository.GetAllTrainingEnrollments(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, enrollments)
		return
	}

	employeeID, err := strconv.Atoi(employeeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employeeId"})
		return
	}
	enrollments, err := repository.GetEnrollmentsByEmployee(c.Request.Context(), employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, enrollments)
}
