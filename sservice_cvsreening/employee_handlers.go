package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
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

// getEmployeeByIDHandler returns a full employee record, including sensitive PII (national ID,
// tax ID, bank account, BPJS numbers, birth date, address, etc.) — unlike the trimmed directory
// list (getEmployeesHandler), this is only available to the employee themselves or HR/admin.
func getEmployeeByIDHandler(c *gin.Context) {
	requestedID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	id, ok := authorizeEmployeeTarget(c, requestedID)
	if !ok {
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

// signContractHandler handles digital signatures for contracts. The signature image is
// actually decoded and written to disk under the same ./uploads tree the rest of the app
// serves from (r.Static("/uploads", "./uploads")) — it never claims success without a real
// file backing the returned URL.
func signContractHandler(c *gin.Context) {
	contractID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid contract ID", nil)
		return
	}

	contractEmployeeID, err := repository.GetContractEmployeeID(c.Request.Context(), contractID)
	if err != nil {
		log.Printf("ERROR in signContractHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to load contract", err.Error())
		return
	}
	if contractEmployeeID == 0 {
		RespondWithError(c, http.StatusNotFound, "contract_not_found", "Contract not found", nil)
		return
	}

	// An employee may only sign their own contract; HR/admin roles may countersign on the
	// company's behalf. Ownership is resolved server-side — never trust a client-supplied
	// employeeId for this check.
	role := GetUserRoleFromContext(c)
	if role != "admin" && role != "hiring_manager" && role != "recruiter" {
		actingEmployeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
		if actingEmployeeID == 0 || actingEmployeeID != contractEmployeeID {
			RespondWithError(c, http.StatusForbidden, "forbidden", "You may only sign your own contract", nil)
			return
		}
	}

	var req struct {
		SignatureBase64 string `json:"signatureBase64" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Signature is required", err.Error())
		return
	}

	imageBytes, err := decodeSignatureImage(req.SignatureBase64)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_signature", "Signature image is invalid", err.Error())
		return
	}

	uploadDir := "uploads/signatures"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Printf("ERROR in signContractHandler: failed to create upload directory: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to save signature", nil)
		return
	}

	filename := fmt.Sprintf("contract_%d_%d.png", contractID, time.Now().Unix())
	diskPath := filepath.Join(uploadDir, filename)
	if err := os.WriteFile(diskPath, imageBytes, 0644); err != nil {
		log.Printf("ERROR in signContractHandler: failed to write signature file: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to save signature", nil)
		return
	}

	// URL matches the static file mount exactly — the file at this path genuinely exists on
	// disk at this point, unlike the previous hardcoded/never-written URL.
	signatureURL := "/uploads/signatures/" + filename

	if err := repository.SignContract(c.Request.Context(), contractID, signatureURL); err != nil {
		// The file was written but the DB update failed — clean it up rather than leaving an
		// orphaned file whose URL a client might still show as "signed".
		_ = os.Remove(diskPath)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to sign contract", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contract signed successfully", "signatureUrl": signatureURL})
}

// decodeSignatureImage accepts either a raw base64 string or a data: URL
// (e.g. "data:image/png;base64,...") and returns the decoded image bytes.
func decodeSignatureImage(input string) ([]byte, error) {
	data := input
	if idx := strings.Index(data, ","); idx != -1 && strings.HasPrefix(data, "data:") {
		data = data[idx+1:]
	}
	data = strings.TrimSpace(data)
	if data == "" {
		return nil, fmt.Errorf("empty signature data")
	}
	decoded, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return nil, fmt.Errorf("invalid base64: %w", err)
	}
	if len(decoded) == 0 {
		return nil, fmt.Errorf("decoded signature is empty")
	}
	return decoded, nil
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
		c.JSON(http.StatusOK, gin.H{"candidateId": nil, "screenings": []interface{}{}, "interviews": []interface{}{}, "assessments": []interface{}{}})
		return
	}
	c.JSON(http.StatusOK, history)
}
