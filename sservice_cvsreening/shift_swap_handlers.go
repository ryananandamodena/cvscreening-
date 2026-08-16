package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// createSwapShiftRequestHandler lets an employee request a shift swap with a colleague,
// approved by their manager via the Master Approval Engine — same plug-in pattern as
// createOvertimeRequestHandler. This replaces the mobile app's previous call to
// POST /approvals/requests, a generic endpoint that has never existed.
func createSwapShiftRequestHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	var req struct {
		ShiftID          *int   `json:"shiftId"`
		TargetEmployeeID int    `json:"targetEmployeeId" binding:"required"`
		Date             string `json:"date" binding:"required"`
		Reason           string `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	if _, err := time.Parse("2006-01-02", req.Date); err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_date", "date must be YYYY-MM-DD", nil)
		return
	}
	if req.TargetEmployeeID == employeeID {
		RespondWithError(c, http.StatusBadRequest, "invalid_target", "Tidak bisa mengajukan swap shift dengan diri sendiri", nil)
		return
	}
	if target, err := repository.GetEmployeeByID(c.Request.Context(), req.TargetEmployeeID); err != nil || target == nil {
		RespondWithError(c, http.StatusBadRequest, "target_not_found", "Karyawan tujuan tidak ditemukan", nil)
		return
	}

	id, err := repository.CreateShiftSwapRequest(c.Request.Context(), employeeID, req.ShiftID, req.TargetEmployeeID, req.Date, req.Reason)
	if err != nil {
		log.Printf("ERROR in createSwapShiftRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat pengajuan swap shift", err.Error())
		return
	}

	summary := fmt.Sprintf("Swap shift pada %s", req.Date)
	approvalID, err := repository.SubmitApprovalRequest(c.Request.Context(), "shift_swap_request", id, employeeID, summary)
	if err != nil {
		log.Printf("ERROR submitting shift swap request %d for approval: %v", id, err)
		RespondWithError(c, http.StatusInternalServerError, "no_approval_flow",
			"Pengajuan swap shift dibuat, tapi belum ada approval flow aktif untuk modul shift_swap_request", err.Error())
		return
	}
	notifyApprovalOutcome(c, approvalID, "", "")
	logAudit(c, "SHIFT_SWAP_SUBMITTED", "attendance", "shift_swap_request", id)

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Shift swap request submitted for approval"})
}

func getMyShiftSwapRequestsHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	requests, err := repository.GetMyShiftSwapRequests(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data swap shift", err.Error())
		return
	}
	c.JSON(http.StatusOK, requests)
}