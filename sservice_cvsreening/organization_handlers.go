package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== DEPARTMENT HANDLERS ====================

func getDepartmentsHandler(c *gin.Context) {
	depts, err := repository.GetDepartments(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getDepartmentsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch departments", err.Error())
		return
	}
	c.JSON(http.StatusOK, depts)
}

func getDepartmentByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid department ID", nil)
		return
	}

	dept, err := repository.GetDepartmentByID(c.Request.Context(), id)
	if err != nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Department not found", nil)
		return
	}
	c.JSON(http.StatusOK, dept)
}

func createDepartmentHandler(c *gin.Context) {
	var dept models.Department
	if err := c.ShouldBindJSON(&dept); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	id, err := repository.CreateDepartment(c.Request.Context(), &dept)
	if err != nil {
		log.Printf("Failed to create department: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create department", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Department created successfully"})
}

func updateDepartmentHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid department ID", nil)
		return
	}

	var dept models.Department
	if err := c.ShouldBindJSON(&dept); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	dept.ID = id

	if err := repository.UpdateDepartment(c.Request.Context(), &dept); err != nil {
		log.Printf("Failed to update department: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update department", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Department updated successfully"})
}

func deleteDepartmentHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid department ID", nil)
		return
	}

	if err := repository.DeleteDepartment(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete department: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete department", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Department deleted successfully"})
}

// ==================== POSITION HANDLERS ====================

func getPositionsHandler(c *gin.Context) {
	deptID, _ := strconv.Atoi(c.Query("departmentId"))

	positions, err := repository.GetPositions(c.Request.Context(), deptID)
	if err != nil {
		log.Printf("ERROR in getPositionsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch positions", err.Error())
		return
	}
	c.JSON(http.StatusOK, positions)
}

func getPositionByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid position ID", nil)
		return
	}

	pos, err := repository.GetPositionByID(c.Request.Context(), id)
	if err != nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Position not found", nil)
		return
	}
	c.JSON(http.StatusOK, pos)
}

func createPositionHandler(c *gin.Context) {
	var pos models.Position
	if err := c.ShouldBindJSON(&pos); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	id, err := repository.CreatePosition(c.Request.Context(), &pos)
	if err != nil {
		log.Printf("Failed to create position: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create position", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Position created successfully"})
}

func updatePositionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid position ID", nil)
		return
	}

	var pos models.Position
	if err := c.ShouldBindJSON(&pos); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	pos.ID = id

	if err := repository.UpdatePosition(c.Request.Context(), &pos); err != nil {
		log.Printf("Failed to update position: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update position", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Position updated successfully"})
}

func deletePositionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid position ID", nil)
		return
	}

	if err := repository.DeletePosition(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete position: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete position", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Position deleted successfully"})
}

// ==================== AUDIT TRAIL HANDLERS ====================

func getAuditTrailHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	userID, _ := strconv.Atoi(c.Query("userId"))

	filter := models.AuditTrailFilter{
		Module:     c.Query("module"),
		Action:     c.Query("action"),
		EntityType: c.Query("entityType"),
		Severity:   c.Query("severity"),
		UserID:     userID,
		Page:       page,
		Limit:      limit,
	}

	audits, total, err := repository.GetAuditTrail(c.Request.Context(), filter)
	if err != nil {
		log.Printf("ERROR in getAuditTrailHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch audit records", err.Error())
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       audits,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}
