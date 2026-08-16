package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// The routes this gates are RecruiterOrAdmin()-gated at the router level (routes_attendance.go),
// but this function only ever matched "admin"/"hr"/"hr_admin"/"hr_manager" — none of which
// "recruiter" is, so a recruiter who legitimately passed the route middleware was rejected here
// anyway. Fixed to match the real backend role model (Module 14).
func isHRRoleForApprovals(role string) bool {
	switch strings.ToLower(role) {
	case "admin", "recruiter":
		return true
	}
	return false
}

// ==================== FLOW CONFIGURATION (HR/Admin only) ====================

func createApprovalFlowHandler(c *gin.Context) {
	if !isHRRoleForApprovals(GetUserRoleFromContext(c)) {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Hanya HR/Admin yang dapat mengatur approval flow", nil)
		return
	}

	var req struct {
		ModuleName     string `json:"moduleName" binding:"required"`
		FlowName       string `json:"flowName" binding:"required"`
		EmploymentType string `json:"employmentType"`
		IsActive       bool   `json:"isActive"`
		Levels         []struct {
			LevelOrder         int    `json:"levelOrder" binding:"required"`
			LevelName          string `json:"levelName" binding:"required"`
			ApproverType       string `json:"approverType" binding:"required"`
			ApproverRole       string `json:"approverRole"`
			ApproverEmployeeID *int   `json:"approverEmployeeId"`
		} `json:"levels" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	flow := models.ApprovalFlow{
		ModuleName:     req.ModuleName,
		FlowName:       req.FlowName,
		EmploymentType: req.EmploymentType,
		IsActive:       req.IsActive,
	}
	for _, l := range req.Levels {
		if l.ApproverType != "manager_of_requester" && l.ApproverType != "role" && l.ApproverType != "specific_user" {
			RespondWithError(c, http.StatusBadRequest, "invalid_approver_type",
				"approverType harus salah satu dari: manager_of_requester, role, specific_user", nil)
			return
		}
		flow.Levels = append(flow.Levels, models.ApprovalFlowLevel{
			LevelOrder: l.LevelOrder, LevelName: l.LevelName, ApproverType: l.ApproverType,
			ApproverRole: l.ApproverRole, ApproverEmployeeID: l.ApproverEmployeeID,
		})
	}

	id, err := repository.CreateApprovalFlow(c.Request.Context(), &flow)
	if err != nil {
		log.Printf("ERROR in createApprovalFlowHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat approval flow", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Approval flow created"})
}

func getApprovalFlowsHandler(c *gin.Context) {
	flows, err := repository.GetApprovalFlows(c.Request.Context(), c.Query("module"))
	if err != nil {
		log.Printf("ERROR in getApprovalFlowsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil approval flows", err.Error())
		return
	}
	c.JSON(http.StatusOK, flows)
}

func setApprovalFlowActiveHandler(c *gin.Context) {
	if !isHRRoleForApprovals(GetUserRoleFromContext(c)) {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Hanya HR/Admin yang dapat mengatur approval flow", nil)
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid flow id", nil)
		return
	}
	var req struct {
		Active bool `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.SetApprovalFlowActive(c.Request.Context(), id, req.Active); err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memperbarui status flow", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Flow status updated"})
}

func deleteApprovalFlowHandler(c *gin.Context) {
	if !isHRRoleForApprovals(GetUserRoleFromContext(c)) {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Hanya HR/Admin yang dapat mengatur approval flow", nil)
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid flow id", nil)
		return
	}
	if err := repository.DeleteApprovalFlow(c.Request.Context(), id); err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menghapus flow", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Flow deleted"})
}

// ==================== APPROVAL REQUESTS (generic, any module) ====================

func getMyApprovalRequestsHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	requests, err := repository.GetMyApprovalRequests(c.Request.Context(), employeeID, c.Query("module"))
	if err != nil {
		log.Printf("ERROR in getMyApprovalRequestsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data", err.Error())
		return
	}
	c.JSON(http.StatusOK, requests)
}

func getPendingApprovalsHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	requests, err := repository.GetPendingApprovalsForEmployee(c.Request.Context(), employeeID, GetUserRoleFromContext(c))
	if err != nil {
		log.Printf("ERROR in getPendingApprovalsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data", err.Error())
		return
	}
	c.JSON(http.StatusOK, requests)
}

// This route carries no role middleware and previously returned the full approval request —
// which can carry sensitive module data such as a salary-change or contract payload — to any
// authenticated user who guessed/enumerated an id, with no ownership check at all (Module 14
// IDOR fix). Only the requester, an employee currently authorized to act on it, or an admin may
// view it.
func getApprovalRequestHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid request id", nil)
		return
	}
	req, err := repository.GetApprovalRequestByID(c.Request.Context(), id)
	if err != nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Approval request not found", nil)
		return
	}

	ownEmployeeID, ok := resolveOwnEmployeeID(c)
	if !ok {
		return
	}
	if GetUserRoleFromContext(c) != "admin" && ownEmployeeID != req.RequesterEmployeeID {
		authorized, authErr := repository.IsAuthorizedApprover(c.Request.Context(), id, ownEmployeeID, GetUserRoleFromContext(c))
		if authErr != nil || !authorized {
			RespondWithError(c, http.StatusForbidden, "forbidden", "You are not authorized to view this approval request", nil)
			return
		}
	}

	c.JSON(http.StatusOK, req)
}

// actOnApprovalRequestHandler is the single generic endpoint every module's approval action goes through.
// On final approval, it dispatches to the owning module's finalization logic.
func actOnApprovalRequestHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid request id", nil)
		return
	}
	var req struct {
		Action               string `json:"action" binding:"required"` // approve, reject, return, delegate
		Comment              string `json:"comment" binding:"required"`
		DelegateToEmployeeID *int   `json:"delegateToEmployeeId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Komentar wajib diisi", err.Error())
		return
	}

	actorEmployeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || actorEmployeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	// IsAuthorizedApprover's approverMatchClause covers manager_of_requester/specific_user/role/
	// delegation, but for approver_type="role" it doesn't exclude the requester themself if they
	// happen to also hold that role — self-approval was possible. Leave's own
	// authorizeLeaveApprover blocks this explicitly (even for admin); mirrored here for the
	// generic engine every other module's approvals route through (Module 14 fix).
	approvalReq, err := repository.GetApprovalRequestByID(c.Request.Context(), id)
	if err != nil || approvalReq == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Approval request not found", nil)
		return
	}
	if actorEmployeeID == approvalReq.RequesterEmployeeID {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Anda tidak dapat menyetujui atau menolak pengajuan Anda sendiri", nil)
		return
	}

	authorized, err := repository.IsAuthorizedApprover(c.Request.Context(), id, actorEmployeeID, GetUserRoleFromContext(c))
	if err != nil || !authorized {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Anda tidak berwenang melakukan aksi pada pengajuan ini", nil)
		return
	}

	result, err := repository.ActOnApprovalRequest(c.Request.Context(), id, actorEmployeeID, req.Action, req.Comment, req.DelegateToEmployeeID)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "action_failed", err.Error(), nil)
		return
	}

	if result.FinalStatus == "approved" {
		if applyErr := finalizeApprovedRequest(c, id); applyErr != nil {
			log.Printf("ERROR finalizing approved request %d: %v", id, applyErr)
			RespondWithError(c, http.StatusInternalServerError, "server_error",
				"Disetujui, tapi gagal menerapkan perubahan ke data terkait", applyErr.Error())
			return
		}
	} else if result.FinalStatus == "rejected" && approvalReq.ModuleName == "claim_request" {
		// Only claim_request needs its own status synced on rejection today — overtime/leave/
		// contract modules don't keep a separate mirrored status field that would otherwise go
		// stale, so this stays claim-specific rather than a new generic engine hook.
		if err := repository.UpdateClaimStatus(c.Request.Context(), approvalReq.ReferenceID, "rejected"); err != nil {
			log.Printf("WARN: failed to sync claim %d status to rejected: %v", approvalReq.ReferenceID, err)
		}
	} else if result.FinalStatus == "rejected" && approvalReq.ModuleName == "shift_swap_request" {
		if err := repository.UpdateShiftSwapStatus(c.Request.Context(), approvalReq.ReferenceID, "rejected"); err != nil {
			log.Printf("WARN: failed to sync shift swap request %d status to rejected: %v", approvalReq.ReferenceID, err)
		}
	}

	userID := GetUserIDFromContext(c)
	userEmail := GetUserEmailFromContext(c)
	auditDetail, _ := json.Marshal(gin.H{"comment": req.Comment, "finalStatus": result.FinalStatus})
	go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
		UserID:     &userID,
		UserEmail:  userEmail,
		Action:     req.Action, // approve, reject, return, delegate
		Module:     "approval_engine",
		EntityType: "approval_request",
		EntityID:   &id,
		NewValue:   auditDetail,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	notifyApprovalOutcome(c, id, result.FinalStatus, req.Comment)

	c.JSON(http.StatusOK, gin.H{"message": "Action recorded", "finalStatus": result.FinalStatus})
}

// notifyApprovalOutcome emails the requester on a final decision, or the next-level approver
// (when resolvable) when the request advances to another pending level.
func notifyApprovalOutcome(c *gin.Context, requestID int, finalStatus, comment string) {
	request, err := repository.GetApprovalRequestByID(c.Request.Context(), requestID)
	if err != nil {
		log.Printf("WARN: could not load request %d for notification: %v", requestID, err)
		return
	}
	moduleLabel := request.ModuleName

	if finalStatus != "" {
		requester, err := repository.GetEmployeeByID(c.Request.Context(), request.RequesterEmployeeID)
		if err == nil && requester.Email != "" {
			emailService.SendApprovalDecisionEmail(requester.Email, requester.FullName, moduleLabel, request.Summary, finalStatus, comment)
		}
		return
	}

	// Still pending: try to notify whoever now holds the current level, if resolvable.
	for _, lvl := range request.Levels {
		if lvl.LevelOrder != request.CurrentLevel {
			continue
		}
		if lvl.ApproverType == "manager_of_requester" {
			requester, err := repository.GetEmployeeByID(c.Request.Context(), request.RequesterEmployeeID)
			if err == nil && requester.ManagerID != nil {
				manager, err := repository.GetEmployeeByID(c.Request.Context(), *requester.ManagerID)
				if err == nil && manager.Email != "" {
					emailService.SendApprovalPendingEmail(manager.Email, manager.FullName, moduleLabel, requester.FullName, request.Summary)
				}
			} else if err == nil {
				// No manager on record for this requester: the generic "manager_of_requester"
				// level has nobody to resolve to. approverMatchClause escalates this case to
				// hr_admin, so make sure hr_admin actually gets notified instead of the request
				// sitting pending with no one aware of it.
				log.Printf("WARN: approval request %d escalated to hr_admin — requester %d has no manager_id", requestID, request.RequesterEmployeeID)
				hrAdmins, hrErr := repository.GetEmployeesByUserRole(c.Request.Context(), "hr_admin")
				if hrErr == nil {
					for _, hr := range hrAdmins {
						if hr.Email != "" {
							emailService.SendApprovalPendingEmail(hr.Email, hr.FullName, moduleLabel, requester.FullName, request.Summary)
						}
					}
				}
			}
		} else if lvl.ApproverType == "specific_user" && lvl.ApproverEmployeeID != nil {
			approver, err := repository.GetEmployeeByID(c.Request.Context(), *lvl.ApproverEmployeeID)
			requester, rErr := repository.GetEmployeeByID(c.Request.Context(), request.RequesterEmployeeID)
			if err == nil && rErr == nil && approver.Email != "" {
				emailService.SendApprovalPendingEmail(approver.Email, approver.FullName, moduleLabel, requester.FullName, request.Summary)
			}
		}
	}
}

// finalizeApprovedRequest is where each module's post-approval side effects live.
// This is the "callback" the generic engine invokes — new modules add a case here
// without touching the approval engine's core tables/logic.
func finalizeApprovedRequest(c *gin.Context, requestID int) error {
	request, err := repository.GetApprovalRequestByID(c.Request.Context(), requestID)
	if err != nil {
		return err
	}

	switch request.ModuleName {
	case "overtime_request":
		return applyApprovedOvertimeRequest(c, request.ReferenceID)
	case "salary_change":
		return repository.ApplySalaryChangeRequest(c.Request.Context(), request.ReferenceID)
	case "employee_contract":
		return repository.ActivateContract(c.Request.Context(), request.ReferenceID)
	case "claim_request":
		return repository.UpdateClaimStatus(c.Request.Context(), request.ReferenceID, "approved")
	case "shift_swap_request":
		return repository.UpdateShiftSwapStatus(c.Request.Context(), request.ReferenceID, "approved")
	default:
		// Modules without a finalization hook simply rely on their own status being "approved"; nothing else to do.
		return nil
	}
}

func cancelApprovalRequestHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid request id", nil)
		return
	}
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	if err := repository.CancelApprovalRequest(c.Request.Context(), id, employeeID); err != nil {
		RespondWithError(c, http.StatusBadRequest, "cancel_failed", err.Error(), nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Request cancelled"})
}

// ==================== DELEGATIONS ====================

func createDelegationHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	var req struct {
		DelegateEmployeeID int    `json:"delegateEmployeeId" binding:"required"`
		ModuleName         string `json:"moduleName"`
		StartDate          string `json:"startDate" binding:"required"`
		EndDate            string `json:"endDate" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateApprovalDelegation(c.Request.Context(), employeeID, req.DelegateEmployeeID, req.ModuleName, req.StartDate, req.EndDate)
	if err != nil {
		log.Printf("ERROR in createDelegationHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat delegasi", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Delegation created"})
}

func getMyDelegationsHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	delegations, err := repository.GetMyDelegations(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data delegasi", err.Error())
		return
	}
	c.JSON(http.StatusOK, delegations)
}

func deactivateDelegationHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid delegation id", nil)
		return
	}
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	if err := repository.DeactivateApprovalDelegation(c.Request.Context(), id, employeeID); err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menonaktifkan delegasi", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Delegation deactivated"})
}
