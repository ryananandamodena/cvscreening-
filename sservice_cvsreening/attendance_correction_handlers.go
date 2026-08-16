package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// GetUserRoleFromContext retrieves the authenticated user's role from the Gin context
func GetUserRoleFromContext(c *gin.Context) string {
	if role, exists := c.Get("role"); exists {
		if r, ok := role.(string); ok {
			return r
		}
	}
	return ""
}

const correctionMaxAgeDays = 7

var correctionTypesRequiringEvidence = map[string]bool{
	"business_trip":   true,
	"remote_working":  true,
	"official_duty":   true,
	"system_error":    true,
}

var validCorrectionTypes = map[string]bool{
	"forgot_check_in": true, "forgot_check_out": true, "wrong_check_in": true, "wrong_check_out": true,
	"gps_failed": true, "face_failed": true, "system_error": true,
	"business_trip": true, "remote_working": true, "official_duty": true, "other": true,
}

// createCorrectionHandler lets an employee submit an attendance correction request
func createCorrectionHandler(c *gin.Context) {
	var req struct {
		AttendanceDate    string `json:"attendanceDate" binding:"required"`
		CorrectionType    string `json:"correctionType" binding:"required"`
		RequestedClockIn  string `json:"requestedClockIn"`
		RequestedClockOut string `json:"requestedClockOut"`
		Reason            string `json:"reason" binding:"required"`
		EvidenceURL       string `json:"evidenceUrl"`
		Notes             string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	if !validCorrectionTypes[req.CorrectionType] {
		RespondWithError(c, http.StatusBadRequest, "invalid_correction_type", "Jenis koreksi tidak valid", nil)
		return
	}
	if strings.TrimSpace(req.Reason) == "" {
		RespondWithError(c, http.StatusBadRequest, "reason_required", "Alasan koreksi wajib diisi", nil)
		return
	}
	if correctionTypesRequiringEvidence[req.CorrectionType] && strings.TrimSpace(req.EvidenceURL) == "" {
		RespondWithError(c, http.StatusBadRequest, "evidence_required", "Bukti pendukung (foto/dokumen) wajib untuk jenis koreksi ini", nil)
		return
	}

	attDate, err := time.Parse("2006-01-02", req.AttendanceDate)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_date", "Format tanggal tidak valid", nil)
		return
	}
	if time.Since(attDate) > correctionMaxAgeDays*24*time.Hour {
		RespondWithError(c, http.StatusBadRequest, "correction_window_expired",
			"Pengajuan koreksi hanya bisa dilakukan maksimal 7 hari setelah tanggal absensi", nil)
		return
	}
	if attDate.After(time.Now()) {
		RespondWithError(c, http.StatusBadRequest, "invalid_date", "Tanggal absensi tidak boleh di masa depan", nil)
		return
	}

	correction := models.AttendanceCorrection{
		EmployeeID:     employeeID,
		AttendanceDate: attDate,
		CorrectionType: req.CorrectionType,
		Reason:         req.Reason,
		EvidenceURL:    req.EvidenceURL,
		Notes:          req.Notes,
	}
	if req.RequestedClockIn != "" {
		correction.RequestedClockIn = &req.RequestedClockIn
	}
	if req.RequestedClockOut != "" {
		correction.RequestedClockOut = &req.RequestedClockOut
	}

	id, err := repository.CreateAttendanceCorrection(c.Request.Context(), &correction)
	if err != nil {
		if strings.Contains(err.Error(), "uniq_active_correction_per_day") {
			RespondWithError(c, http.StatusConflict, "duplicate_correction", "Sudah ada pengajuan koreksi aktif untuk tanggal ini", nil)
			return
		}
		log.Printf("ERROR in createCorrectionHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengajukan koreksi", err.Error())
		return
	}

	if requester, rErr := repository.GetEmployeeByID(c.Request.Context(), employeeID); rErr == nil && requester.ManagerID != nil {
		if manager, mErr := repository.GetEmployeeByID(c.Request.Context(), *requester.ManagerID); mErr == nil && manager.Email != "" {
			summary := fmt.Sprintf("Koreksi absensi %s (%s)", req.AttendanceDate, req.CorrectionType)
			emailService.SendApprovalPendingEmail(manager.Email, manager.FullName, "Koreksi Absensi", requester.FullName, summary)
		}
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Correction request submitted"})
}

// getCorrectionsHandler lists correction requests, scoped by role
func getCorrectionsHandler(c *gin.Context) {
	employeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	role := strings.ToLower(GetUserRoleFromContext(c))
	scope := c.Query("scope") // "mine", "manager", "hr"

	filter := repository.CorrectionFilter{Status: c.Query("status")}

	switch scope {
	case "manager":
		filter.PendingManagerFor = employeeID
	case "hr":
		if !isHRRole(role) {
			RespondWithError(c, http.StatusForbidden, "forbidden", "Anda tidak memiliki akses HR", nil)
			return
		}
		filter.PendingHR = true
	default:
		filter.EmployeeID = employeeID
	}

	corrections, err := repository.GetAttendanceCorrections(c.Request.Context(), filter)
	if err != nil {
		log.Printf("ERROR in getCorrectionsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data koreksi", err.Error())
		return
	}
	c.JSON(http.StatusOK, corrections)
}

// hrReviewCorrectionHandler's route is gated by RecruiterOrAdmin() at the router level
// (routes_attendance.go), but this function only ever matched "admin"/"hr"/"hr_admin"/
// "hr_manager" — none of which "recruiter" is, so a recruiter who legitimately passed the route
// middleware was rejected here anyway. Fixed to match the real backend role model (Module 14).
func isHRRole(role string) bool {
	switch role {
	case "admin", "recruiter":
		return true
	}
	return false
}

// managerReviewCorrectionHandler lets a manager approve/reject a correction from their reports
func managerReviewCorrectionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid correction id", nil)
		return
	}
	var req struct {
		Approve bool   `json:"approve"`
		Comment string `json:"comment" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Komentar wajib diisi", err.Error())
		return
	}

	managerEmployeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || managerEmployeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	// Self-review was never blocked here — route-level RecruiterOrAdmin() gating restricts who
	// can call this endpoint at all, but not whether the caller is reviewing their own
	// correction request. Mirrors Leave's authorizeLeaveApprover self-check (Module 14 fix).
	correction, err := repository.GetAttendanceCorrectionByID(c.Request.Context(), id)
	if err != nil || correction == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Correction request not found", nil)
		return
	}
	if managerEmployeeID == correction.EmployeeID {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Anda tidak dapat mereview koreksi Anda sendiri", nil)
		return
	}

	if err := repository.ManagerReviewCorrection(c.Request.Context(), id, managerEmployeeID, req.Approve, req.Comment); err != nil {
		RespondWithError(c, http.StatusBadRequest, "review_failed", err.Error(), nil)
		return
	}

	decision := "manager_approved"
	if !req.Approve {
		decision = "rejected"
	}
	notifyCorrectionDecision(c, id, decision, req.Comment)

	c.JSON(http.StatusOK, gin.H{"message": "Manager review recorded"})
}

// hrReviewCorrectionHandler lets HR give the final decision; approving applies the correction to the attendance record
func hrReviewCorrectionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid correction id", nil)
		return
	}
	role := strings.ToLower(GetUserRoleFromContext(c))
	if !isHRRole(role) {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Hanya HR yang dapat melakukan review final", nil)
		return
	}

	var req struct {
		Approve bool   `json:"approve"`
		Comment string `json:"comment" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Komentar wajib diisi", err.Error())
		return
	}

	hrEmployeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || hrEmployeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	correction, err := repository.GetAttendanceCorrectionByID(c.Request.Context(), id)
	if err != nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Correction request not found", nil)
		return
	}
	// Same self-review fix as managerReviewCorrectionHandler (Module 14).
	if hrEmployeeID == correction.EmployeeID {
		RespondWithError(c, http.StatusForbidden, "forbidden", "Anda tidak dapat mereview koreksi Anda sendiri", nil)
		return
	}

	if err := repository.HRReviewCorrection(c.Request.Context(), id, hrEmployeeID, req.Approve, req.Comment); err != nil {
		RespondWithError(c, http.StatusBadRequest, "review_failed", err.Error(), nil)
		return
	}

	if req.Approve {
		status := "present"
		lateMinutes, earlyLeaveMinutes := 0, 0
		overtimeHours := 0.0

		if shift, shiftErr := repository.GetEmployeeShift(c.Request.Context(), correction.EmployeeID, correction.AttendanceDate); shiftErr == nil && shift != nil {
			if correction.RequestedClockIn != nil {
				if shiftStart, parseErr := shiftTimeToday(correction.AttendanceDate, shift.StartTime); parseErr == nil {
					if clockIn, ciErr := shiftTimeToday(correction.AttendanceDate, *correction.RequestedClockIn); ciErr == nil {
						threshold := shiftStart.Add(time.Duration(shift.ToleranceMinutes) * time.Minute)
						if clockIn.After(threshold) {
							status = "late"
							lateMinutes = int(clockIn.Sub(shiftStart).Minutes())
						}
					}
				}
			}
			if correction.RequestedClockOut != nil {
				if shiftEnd, parseErr := shiftTimeToday(correction.AttendanceDate, shift.EndTime); parseErr == nil {
					if clockOut, coErr := shiftTimeToday(correction.AttendanceDate, *correction.RequestedClockOut); coErr == nil {
						if clockOut.Before(shiftEnd) {
							earlyLeaveMinutes = int(shiftEnd.Sub(clockOut).Minutes())
						} else if clockOut.After(shiftEnd) {
							overtimeHours = clockOut.Sub(shiftEnd).Hours()
						}
					}
				}
			}
		}

		if applyErr := repository.ApplyCorrectionToAttendance(
			c.Request.Context(), correction.EmployeeID, correction.AttendanceDate,
			correction.RequestedClockIn, correction.RequestedClockOut,
			status, lateMinutes, earlyLeaveMinutes, overtimeHours,
		); applyErr != nil {
			log.Printf("ERROR applying correction to attendance: %v", applyErr)
			RespondWithError(c, http.StatusInternalServerError, "server_error", "Koreksi disetujui tapi gagal memperbarui data absensi", applyErr.Error())
			return
		}

		userID := GetUserIDFromContext(c)
		userEmail := GetUserEmailFromContext(c)
		correctionID := id
		go repository.LogAuditTrail(context.Background(), &models.AuditTrail{
			UserID: &userID, UserEmail: userEmail, Action: "approve", Module: "attendance",
			EntityType: "attendance_correction", EntityID: &correctionID,
			IPAddress: c.ClientIP(), UserAgent: c.Request.UserAgent(),
		})
	}

	hrDecision := "hr_approved"
	if !req.Approve {
		hrDecision = "rejected"
	}
	notifyCorrectionDecision(c, id, hrDecision, req.Comment)

	c.JSON(http.StatusOK, gin.H{"message": "HR review recorded"})
}

// notifyCorrectionDecision emails the employee whenever their correction request's status changes
func notifyCorrectionDecision(c *gin.Context, correctionID int, decision, comment string) {
	correction, err := repository.GetAttendanceCorrectionByID(c.Request.Context(), correctionID)
	if err != nil {
		log.Printf("WARN: could not load correction %d for notification: %v", correctionID, err)
		return
	}
	employee, err := repository.GetEmployeeByID(c.Request.Context(), correction.EmployeeID)
	if err != nil || employee.Email == "" {
		return
	}
	summary := fmt.Sprintf("Koreksi absensi %s (%s)", correction.AttendanceDate.Format("2006-01-02"), correction.CorrectionType)

	switch decision {
	case "manager_approved":
		emailService.SendApprovalDecisionEmail(employee.Email, employee.FullName, "Koreksi Absensi", summary, "approved", comment+" (diteruskan ke HR untuk persetujuan final)")
	case "hr_approved":
		emailService.SendApprovalDecisionEmail(employee.Email, employee.FullName, "Koreksi Absensi", summary, "approved", comment)
	case "rejected":
		emailService.SendApprovalDecisionEmail(employee.Email, employee.FullName, "Koreksi Absensi", summary, "rejected", comment)
	}
}

// cancelCorrectionHandler lets an employee withdraw their own pending request
func cancelCorrectionHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid correction id", nil)
		return
	}
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	if err := repository.CancelCorrection(c.Request.Context(), id, employeeID); err != nil {
		RespondWithError(c, http.StatusBadRequest, "cancel_failed", err.Error(), nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Correction request cancelled"})
}
