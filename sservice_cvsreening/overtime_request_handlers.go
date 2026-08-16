package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// createOvertimeRequestHandler lets an employee request overtime approval.
// This is the reference implementation of a "new module" plugging into the
// generic Master Approval Engine without any changes to the engine itself.
func createOvertimeRequestHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	var req struct {
		OvertimeDate string  `json:"overtimeDate" binding:"required"`
		Hours        float64 `json:"hours" binding:"required"`
		Reason       string  `json:"reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if req.Hours <= 0 || req.Hours > 12 {
		RespondWithError(c, http.StatusBadRequest, "invalid_hours", "Jam lembur harus antara 0-12 jam", nil)
		return
	}

	id, err := repository.CreateOvertimeRequest(c.Request.Context(), employeeID, req.OvertimeDate, req.Hours, req.Reason)
	if err != nil {
		log.Printf("ERROR in createOvertimeRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat pengajuan lembur", err.Error())
		return
	}

	summary := fmt.Sprintf("%.1f jam lembur pada %s", req.Hours, req.OvertimeDate)
	approvalID, err := repository.SubmitApprovalRequest(c.Request.Context(), "overtime_request", id, employeeID, summary)
	if err != nil {
		log.Printf("ERROR submitting overtime request %d for approval: %v", id, err)
		RespondWithError(c, http.StatusInternalServerError, "no_approval_flow",
			"Pengajuan lembur dibuat, tapi belum ada approval flow aktif untuk modul overtime_request", err.Error())
		return
	}
	notifyApprovalOutcome(c, approvalID, "", "")
	logAudit(c, "OVERTIME_SUBMITTED", "overtime", "overtime_request", id)

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Overtime request submitted for approval"})
}

func getMyOvertimeRequestsHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	requests, err := repository.GetMyOvertimeRequests(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data lembur", err.Error())
		return
	}
	c.JSON(http.StatusOK, requests)
}

// applyApprovedOvertimeRequest is the module-specific finalization hook invoked by the
// generic approval engine once an overtime request clears its final approval level.
func applyApprovedOvertimeRequest(c *gin.Context, overtimeRequestID int) error {
	ot, err := repository.GetOvertimeRequestByID(c.Request.Context(), overtimeRequestID)
	if err != nil {
		return err
	}
	return repository.AddApprovedOvertimeToAttendance(c.Request.Context(), ot.EmployeeID, ot.OvertimeDate, ot.Hours)
}
