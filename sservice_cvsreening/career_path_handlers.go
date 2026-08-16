package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// employeeId was previously an unauthenticated client-supplied query param with no ownership
// check on this self-service route — any authenticated user could read any other employee's
// career path by ID (Module 14 IDOR fix). authorizeEmployeeTarget resolves it to the caller's
// own record unless the caller is admin/that employee's manager.
func getCareerPathsHandler(c *gin.Context) {
	requestedID, _ := strconv.Atoi(c.Query("employeeId"))
	employeeID, ok := authorizeEmployeeTarget(c, requestedID)
	if !ok {
		return
	}
	paths, err := repository.GetCareerPaths(c.Request.Context(), employeeID)
	if err != nil {
		log.Printf("ERROR in getCareerPathsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch career paths", err.Error())
		return
	}
	c.JSON(http.StatusOK, paths)
}

// getCareerPathByIDHandler previously had NO authorization check at all — any authenticated
// user could read any other employee's career path (mentor, target positions, timeline,
// milestones) just by guessing/incrementing the id. Fixed the same way as every other
// single-item lookup in this codebase (getPerformanceReviewByIDHandler, etc.): resolve the
// path's actual EmployeeID and authorize against that via authorizeEmployeeTarget.
func getCareerPathByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid career path ID", nil)
		return
	}
	path, err := repository.GetCareerPathByID(c.Request.Context(), id)
	if err != nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Career path not found", nil)
		return
	}
	if _, ok := authorizeEmployeeTarget(c, path.EmployeeID); !ok {
		return
	}
	c.JSON(http.StatusOK, path)
}

// createCareerPathHandler creates a career path. Note: milestones are not created
// here — add them via a future dedicated endpoint if needed; this covers the core
// path (employee, mentor, target positions, timeline) which is what the Succession
// dashboard's create flow needs first.
func createCareerPathHandler(c *gin.Context) {
	var p models.CareerPath
	if err := c.ShouldBindJSON(&p); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateCareerPath(c.Request.Context(), &p)
	if err != nil {
		log.Printf("Failed to create career path: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create career path", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Career path created successfully"})
}

func updateCareerPathHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid career path ID", nil)
		return
	}
	var p models.CareerPath
	if err := c.ShouldBindJSON(&p); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	p.ID = id
	if err := repository.UpdateCareerPath(c.Request.Context(), &p); err != nil {
		log.Printf("Failed to update career path: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update career path", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Career path updated successfully"})
}

func updateCareerMilestoneHandler(c *gin.Context) {
	milestoneID, err := strconv.Atoi(c.Param("milestoneId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid milestone ID", nil)
		return
	}
	var payload struct {
		Status        string `json:"status" binding:"required"`
		CompletedDate string `json:"completedDate"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.UpdateCareerMilestone(c.Request.Context(), milestoneID, payload.Status, payload.CompletedDate); err != nil {
		log.Printf("Failed to update career milestone: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update milestone", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Milestone updated successfully"})
}
