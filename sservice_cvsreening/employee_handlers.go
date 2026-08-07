package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== EMPLOYEE HANDLERS ====================

// getMyEmployeeHandler returns the employee record linked to the logged-in user account
func getMyEmployeeHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusNotFound, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	emp, err := repository.GetEmployeeByID(c.Request.Context(), employeeID)
	if err != nil {
		log.Printf("ERROR in getMyEmployeeHandler: %v", err)
		RespondWithError(c, http.StatusNotFound, "not_found", "Employee not found", nil)
		return
	}

	c.JSON(http.StatusOK, emp)
}

func getEmployeesHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	deptID, _ := strconv.Atoi(c.Query("departmentId"))
	posID, _ := strconv.Atoi(c.Query("positionId"))

	filter := models.EmployeeFilter{
		Search:           c.Query("search"),
		DepartmentID:     deptID,
		PositionID:       posID,
		EmploymentType:   c.Query("employmentType"),
		EmploymentStatus: c.DefaultQuery("employmentStatus", "active"),
		Page:             page,
		Limit:            limit,
	}

	employees, total, err := repository.GetEmployees(c.Request.Context(), filter)
	if err != nil {
		log.Printf("ERROR in getEmployeesHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch employees", err.Error())
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       employees,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func getEmployeeByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}

	emp, err := repository.GetEmployeeByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in getEmployeeByIDHandler: %v", err)
		RespondWithError(c, http.StatusNotFound, "not_found", "Employee not found", nil)
		return
	}

	c.JSON(http.StatusOK, emp)
}

func createEmployeeHandler(c *gin.Context) {
	var emp models.Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// Generate ID if not provided
	if emp.EmployeeID == "" {
		generatedID, err := repository.GenerateEmployeeID(c.Request.Context())
		if err != nil {
			log.Printf("Failed to generate employee ID: %v", err)
		} else {
			emp.EmployeeID = generatedID
		}
	}

	id, err := repository.CreateEmployee(c.Request.Context(), &emp)
	if err != nil {
		log.Printf("Failed to create employee: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create employee", err.Error())
		return
	}

	if err := repository.InitializeLeaveBalances(c.Request.Context(), id, time.Now().Year()); err != nil {
		log.Printf("WARNING: failed to initialize leave balances for employee %d: %v", id, err)
	}

	// Log audit trail
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     "create",
		Module:     "core_hr",
		EntityType: "employee",
		EntityID:   &id,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusCreated, gin.H{"id": id, "employeeId": emp.EmployeeID, "message": "Employee created successfully"})
}

func updateEmployeeHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}

	// Get old employee data for audit log
	oldEmp, _ := repository.GetEmployeeByID(c.Request.Context(), id)

	var emp models.Employee
	if err := c.ShouldBindJSON(&emp); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	emp.ID = id

	if err := repository.UpdateEmployee(c.Request.Context(), &emp); err != nil {
		log.Printf("Failed to update employee: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update employee", err.Error())
		return
	}

	// Log audit trail with before/after data
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	
	var oldJSON, newJSON []byte
	if oldEmp != nil {
		oldJSON, _ = json.Marshal(oldEmp)
	}
	newJSON, _ = json.Marshal(emp)

	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     "update",
		Module:     "core_hr",
		EntityType: "employee",
		EntityID:   &id,
		OldValue:   oldJSON,
		NewValue:   newJSON,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Employee updated successfully"})
}

func deleteEmployeeHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}

	if err := repository.DeleteEmployee(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete employee: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete employee", err.Error())
		return
	}

	// Log audit trail
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     "delete", // Soft delete in this case
		Module:     "core_hr",
		EntityType: "employee",
		EntityID:   &id,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, gin.H{"message": "Employee terminated successfully"})
}

func getEmployeeStatsHandler(c *gin.Context) {
	stats, err := repository.GetEmployeeStats(c.Request.Context())
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch stats", err.Error())
		return
	}
	c.JSON(http.StatusOK, stats)
}

// ==================== CANDIDATE TO EMPLOYEE CONVERSION ====================

func convertCandidateHandler(c *gin.Context) {
	var req models.ConvertCandidateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// 1. Get candidate details to prepopulate employee data
	candidate, err := repository.GetCandidateByID(c.Request.Context(), req.CandidateID)
	if err != nil || candidate == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Candidate not found", nil)
		return
	}

	// In a real scenario, this would ideally run inside a transaction
	// 2. Create employee record
	joinDate, _ := time.Parse("2006-01-02", req.JoinDate)
	emp := models.Employee{
		CandidateID:      &req.CandidateID,
		EmployeeID:       req.EmployeeID,
		FullName:         candidate.FullName,
		Email:            candidate.Email,
		Phone:            candidate.Phone,
		DepartmentID:     &req.DepartmentID,
		PositionID:       &req.PositionID,
		EmploymentType:   req.EmploymentType,
		EmploymentStatus: "active",
		JoinDate:         joinDate,
		ManagerID:        req.ManagerID,
	}

	empID, err := repository.CreateEmployee(c.Request.Context(), &emp)
	if err != nil {
		log.Printf("Failed to create employee during conversion: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to convert candidate", err.Error())
		return
	}

	if err := repository.InitializeLeaveBalances(c.Request.Context(), empID, time.Now().Year()); err != nil {
		log.Printf("WARNING: failed to initialize leave balances for employee %d: %v", empID, err)
	}

	// 3. Update candidate status to 'hired'
	if err := repository.UpdateCandidateStatus(c.Request.Context(), req.CandidateID, "hired"); err != nil {
		log.Printf("Warning: Failed to update candidate status after conversion: %v", err)
	}

	// 4. Update offer letter status if offer ID is provided
	if req.OfferID > 0 {
		if err := repository.UpdateOfferLetterStatus(c.Request.Context(), req.OfferID, "hired"); err != nil {
			log.Printf("Warning: Failed to update offer status after conversion: %v", err)
		}
	}

	// Log audit trail
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     "convert_candidate",
		Module:     "core_hr",
		EntityType: "employee",
		EntityID:   &empID,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, gin.H{
		"message":    "Candidate successfully converted to Employee",
		"employeeId": empID,
	})
}

// signContractHandler handles digital signatures for contracts
func signContractHandler(c *gin.Context) {
	contractID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid contract ID", nil)
		return
	}

	var req struct {
		SignatureBase64 string `json:"signatureBase64" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Signature is required", err.Error())
		return
	}

	// In a real application, decode Base64 and save as image file, then store URL.
	// For simplicity, we just store a mock URL or the base64 string directly if it's small.
	// Let's pretend we saved it to /uploads/signatures/
	signatureURL := "/uploads/signatures/contract_" + strconv.Itoa(contractID) + ".png"

	err = repository.SignContract(c.Request.Context(), contractID, signatureURL)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to sign contract", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contract signed successfully", "signatureUrl": signatureURL})
}

// getEmployeeCandidateHistoryHandler returns a converted employee's pre-hire
// screening/interview history, if any (see repository.GetEmployeeCandidateHistory).
func getEmployeeCandidateHistoryHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	history, err := repository.GetEmployeeCandidateHistory(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in getEmployeeCandidateHistoryHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch candidate history", err.Error())
		return
	}
	if history == nil {
		c.JSON(http.StatusOK, gin.H{"candidateId": nil, "screenings": []interface{}{}, "interviews": []interface{}{}})
		return
	}
	c.JSON(http.StatusOK, history)
}
