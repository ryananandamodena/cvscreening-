package main

import "github.com/gin-gonic/gin"

// registerAttendanceRoutes wires up clock-in/out, shifts, attendance corrections,
// the master approval engine, and overtime requests (the approval engine's
// reference module). Split out of main() verbatim — same routes, same order.
func registerAttendanceRoutes(protected *gin.RouterGroup) {
	// Attendance & Shifts
	protected.POST("/attendance/clock-in", clockInHandler)
	protected.POST("/attendance/clock-out", clockOutHandler)
	protected.POST("/attendance/break-start", breakStartHandler)
	protected.POST("/attendance/break-end", breakEndHandler)
	protected.GET("/attendance/today-breaks", getTodayBreaksHandler)
	protected.GET("/attendance/qr-token", getQRTokenHandler)
	protected.POST("/attendance/face-enrollment", enrollFaceHandler)
	protected.GET("/attendance/face-enrollment/status", getFaceEnrollmentStatusHandler)
	protected.GET("/attendance/today", getTodayAttendanceHandler)
	protected.GET("/attendance/history", getAttendanceHistoryHandler)
	protected.GET("/attendance/office-location", getOfficeLocationHandler)

	// Attendance Corrections — employee submits/cancels their own; manager/HR review below.
	protected.POST("/attendance/corrections", createCorrectionHandler)
	protected.GET("/attendance/corrections", getCorrectionsHandler)
	protected.PUT("/attendance/corrections/:id/cancel", cancelCorrectionHandler)

	// Master Approval Engine — act/cancel/mine/delegations all resolve identity from the JWT
	// and check IsAuthorizedApprover internally (registered further below); flow definitions
	// (org-wide workflow config) are gated below since they were previously editable by any
	// authenticated employee.

	// Overtime Request (reference module using the Master Approval Engine)
	protected.POST("/overtime/requests", createOvertimeRequestHandler)
	protected.GET("/overtime/requests/mine", getMyOvertimeRequestsHandler)

	// Shift Swap Request (another module using the Master Approval Engine — replaces the
	// mobile app's previous, nonexistent POST /approvals/requests call).
	protected.POST("/swap-shift/requests", createSwapShiftRequestHandler)
	protected.GET("/swap-shift/requests/mine", getMyShiftSwapRequestsHandler)
	// NOTE: static paths MUST come before wildcard (:id) in Gin
	protected.GET("/shifts", getShiftsHandler)
	protected.GET("/shifts/assignments", getEmployeeShiftAssignmentsHandler)
	protected.GET("/employees/:id/shift", getEmployeeShiftHandler)

	// HR/Admin: org-wide approval-flow definitions, shift definitions/assignments, and the
	// two-stage attendance-correction review chain. None of this was gated before — any
	// authenticated employee could approve their own correction "as a manager", define/delete
	// company-wide approval workflows, or assign/remove shifts for any employee.
	hrOrAdmin := protected.Group("/")
	hrOrAdmin.Use(HROrAdmin())
	{
		hrOrAdmin.PUT("/attendance/office-location", updateOfficeLocationHandler)
		hrOrAdmin.GET("/attendance/location-exemptions", getLocationExemptionsHandler)
		hrOrAdmin.PUT("/attendance/location-exemptions/:employeeId", setLocationExemptionHandler)
		hrOrAdmin.PUT("/attendance/corrections/:id/manager-review", managerReviewCorrectionHandler)
		hrOrAdmin.PUT("/attendance/corrections/:id/hr-review", hrReviewCorrectionHandler)
		hrOrAdmin.POST("/approvals/flows", createApprovalFlowHandler)
		hrOrAdmin.GET("/approvals/flows", getApprovalFlowsHandler)
		hrOrAdmin.PUT("/approvals/flows/:id/active", setApprovalFlowActiveHandler)
		hrOrAdmin.DELETE("/approvals/flows/:id", deleteApprovalFlowHandler)
		hrOrAdmin.POST("/shifts", createShiftHandler)
		hrOrAdmin.POST("/shifts/assign", assignShiftHandler)
		hrOrAdmin.DELETE("/shifts/assignments/:id", removeShiftAssignmentHandler)
		hrOrAdmin.PUT("/shifts/:id", updateShiftHandler)
		hrOrAdmin.DELETE("/shifts/:id", deleteShiftHandler)
	}

	// Org-wide attendance visibility (every employee, not just a manager's direct reports —
	// GetTeamAttendance has no manager-scoping filter in its query) was previously readable by
	// any authenticated employee. Restricted to manager/HR/admin as an interim floor; a true
	// "manager sees only their own team" scope would need the repository query changed to
	// filter by employees.manager_id — flagged as a follow-up, not guessed here.
	managerOrAdmin := protected.Group("/")
	managerOrAdmin.Use(HiringManagerOrAdmin())
	{
		managerOrAdmin.GET("/attendance/team", getTeamAttendanceHandler)
		managerOrAdmin.GET("/attendance/reports/monthly", getMonthlyAttendanceReportHandler)
	}

	// approvals/requests/:id, /act, /cancel, /delegations resolve identity from the JWT and
	// check IsAuthorizedApprover/ownership internally — left ungated at the route level on
	// purpose (matches the existing, already-verified-safe approval-engine pattern).
	protected.GET("/approvals/requests/pending", getPendingApprovalsHandler)
	// getMyApprovalRequestsHandler existed but was never wired to a route — added here (static
	// path registered before the /:id wildcard, same convention as /employees/stats/summary).
	protected.GET("/approvals/requests/mine", getMyApprovalRequestsHandler)
	protected.GET("/approvals/requests/:id", getApprovalRequestHandler)
	protected.PUT("/approvals/requests/:id/act", actOnApprovalRequestHandler)
	protected.PUT("/approvals/requests/:id/cancel", cancelApprovalRequestHandler)
	protected.POST("/approvals/delegations", createDelegationHandler)
	protected.GET("/approvals/delegations", getMyDelegationsHandler)
	protected.PUT("/approvals/delegations/:id/deactivate", deactivateDelegationHandler)
}
