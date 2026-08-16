package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== CONTRACT HANDLERS ====================

// getEmployeeContractsHandler returns an employee's contract records (salary/terms/dates) —
// sensitive enough that only the employee themselves or their manager/HR/admin may view it.
func getEmployeeContractsHandler(c *gin.Context) {
	requestedID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	empID, ok := authorizeEmployeeTarget(c, requestedID)
	if !ok {
		return
	}

	contracts, err := repository.GetContractsByEmployeeID(c.Request.Context(), empID)
	if err != nil {
		log.Printf("ERROR in getEmployeeContractsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch contracts", err.Error())
		return
	}

	c.JSON(http.StatusOK, contracts)
}

func createContractHandler(c *gin.Context) {
	empID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}

	var contract models.EmployeeContract
	if err := c.ShouldBindJSON(&contract); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	contract.EmployeeID = empID

	id, err := repository.CreateContract(c.Request.Context(), &contract)
	if err != nil {
		log.Printf("Failed to create contract: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create contract", err.Error())
		return
	}

	// Log audit trail
	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     "create",
		Module:     "core_hr",
		EntityType: "contract",
		EntityID:   &id,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Contract created successfully"})
}

func getExpiringContractsHandler(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	contracts, err := repository.GetExpiringContracts(c.Request.Context(), days)
	if err != nil {
		log.Printf("ERROR in getExpiringContractsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch expiring contracts", err.Error())
		return
	}

	c.JSON(http.StatusOK, contracts)
}

// ==================== ONBOARDING HANDLERS ====================

func getOnboardingSessionsHandler(c *gin.Context) {
	status := c.Query("status")

	sessions, err := repository.GetOnboardingSessions(c.Request.Context(), status)
	if err != nil {
		log.Printf("ERROR in getOnboardingSessionsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch onboarding sessions", err.Error())
		return
	}

	// This route carries no role middleware (any authenticated employee can reach it, since an
	// employee needs to see their own onboarding session) — but the underlying query has no
	// employee_id filter, so it previously returned every employee's session org-wide to anyone.
	// Admin/recruiter (the same "HR staff" gate used elsewhere in this file) keep full visibility;
	// everyone else is scoped to their own record (Module 13 IDOR fix).
	role := GetUserRoleFromContext(c)
	if role != "admin" && role != "recruiter" {
		ownEmployeeID, ok := resolveOwnEmployeeID(c)
		if !ok {
			return
		}
		filtered := make([]models.OnboardingSession, 0, len(sessions))
		for _, s := range sessions {
			if s.EmployeeID == ownEmployeeID {
				filtered = append(filtered, s)
			}
		}
		sessions = filtered
	}

	c.JSON(http.StatusOK, sessions)
}

// authorizeOnboardingSession verifies the caller may read/modify the given onboarding session:
// admin/recruiter (HR staff) always may; anyone else only if it's their own session, or they are
// its owner's direct manager (mirrors authorizeEmployeeTarget's self-or-manager rule). Returns
// false if an error response was already written (caller must return immediately in that case).
func authorizeOnboardingSession(c *gin.Context, session *models.OnboardingSession) bool {
	role := GetUserRoleFromContext(c)
	if role == "admin" || role == "recruiter" {
		return true
	}
	_, ok := authorizeEmployeeTarget(c, session.EmployeeID)
	return ok
}

func createOnboardingSessionHandler(c *gin.Context) {
	var session models.OnboardingSession
	if err := c.ShouldBindJSON(&session); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	id, err := repository.CreateOnboardingSession(c.Request.Context(), &session)
	if err != nil {
		log.Printf("Failed to create onboarding session: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create onboarding session", err.Error())
		return
	}

	if session.TemplateID != nil {
		_, tasks, tplErr := repository.GetOnboardingTemplateByID(c.Request.Context(), *session.TemplateID)
		if tplErr != nil {
			log.Printf("WARN: onboarding session %d created but template %d could not be loaded: %v", id, *session.TemplateID, tplErr)
		} else if genErr := repository.GenerateTasksFromTemplate(c.Request.Context(), id, session.StartDate, tasks); genErr != nil {
			log.Printf("WARN: onboarding session %d created but tasks failed to generate: %v", id, genErr)
		}
	}

	// Auto-create a draft employment contract so HR starts from a shell record
	// instead of nothing, then route it through the employee_contract approval
	// flow (Direct Manager -> HR Admin, see schema_contract_approval.sql) — the
	// same pattern salary_change/overtime_request already use.
	contractID, contractErr := repository.CreateContract(c.Request.Context(), &models.EmployeeContract{
		EmployeeID:   session.EmployeeID,
		ContractType: "PKWT",
		StartDate:    session.StartDate,
		Status:       "draft",
		Notes:        "Auto-generated when onboarding started — lengkapi dan finalisasi kontrak ini.",
	})
	if contractErr != nil {
		log.Printf("WARN: onboarding session %d created but draft contract could not be created: %v", id, contractErr)
	} else {
		actorEmployeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
		if actorEmployeeID == 0 {
			log.Printf("WARN: draft contract %d created but could not submit for approval: creating user has no linked employee record", contractID)
		} else {
			employee, _ := repository.GetEmployeeByID(c.Request.Context(), session.EmployeeID)
			summary := fmt.Sprintf("Kontrak kerja baru untuk %s", employee.FullName)
			if _, subErr := repository.SubmitApprovalRequest(c.Request.Context(), "employee_contract", contractID, actorEmployeeID, summary); subErr != nil {
				log.Printf("WARN: draft contract %d created but could not submit for approval: %v", contractID, subErr)
			}
		}
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Onboarding session started successfully"})
}

func getOnboardingTasksHandler(c *gin.Context) {
	sessionID, err := strconv.Atoi(c.Param("sessionId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid session ID", nil)
		return
	}

	// The sessionId is client-supplied and this route carries no role middleware — without this
	// check, any authenticated employee could enumerate session IDs and read another employee's
	// onboarding task list (Module 13 IDOR fix).
	session, err := repository.GetOnboardingSessionByID(c.Request.Context(), sessionID)
	if err != nil || session == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Onboarding session not found", nil)
		return
	}
	if !authorizeOnboardingSession(c, session) {
		return
	}

	tasks, err := repository.GetOnboardingTasksBySessionID(c.Request.Context(), sessionID)
	if err != nil {
		log.Printf("ERROR in getOnboardingTasksHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch tasks", err.Error())
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func updateOnboardingTaskHandler(c *gin.Context) {
	taskID, err := strconv.Atoi(c.Param("taskId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid task ID", nil)
		return
	}

	var req struct {
		Status    string `json:"status" binding:"required"`
		SessionID int    `json:"sessionId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// The sessionId in the body is client-supplied and this route carries no role middleware —
	// without this check, any authenticated employee could mark another employee's onboarding
	// task complete/incomplete by guessing/enumerating taskId+sessionId (Module 13 IDOR fix).
	session, err := repository.GetOnboardingSessionByID(c.Request.Context(), req.SessionID)
	if err != nil || session == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Onboarding session not found", nil)
		return
	}
	if !authorizeOnboardingSession(c, session) {
		return
	}

	// Verifying session ownership above is not enough on its own — without also scoping the
	// update to that session, a caller who owns some onboarding session could still update an
	// arbitrary taskId belonging to someone else's session by guessing/enumerating IDs. Passing
	// req.SessionID here closes that gap (IDOR fix).
	if err := repository.UpdateOnboardingTaskStatus(c.Request.Context(), taskID, req.SessionID, req.Status); err != nil {
		log.Printf("Failed to update task status: %v", err)
		RespondWithError(c, http.StatusBadRequest, "not_found", "Task not found in this onboarding session", nil)
		return
	}

	// Recalculate progress for the session
	repository.RecalculateOnboardingProgress(c.Request.Context(), req.SessionID)

	c.JSON(http.StatusOK, gin.H{"message": "Task status updated"})
}
