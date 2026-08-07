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
	protected.GET("/attendance/team", getTeamAttendanceHandler)
	protected.GET("/attendance/reports/monthly", getMonthlyAttendanceReportHandler)
	protected.GET("/attendance/office-location", getOfficeLocationHandler)
	protected.PUT("/attendance/office-location", updateOfficeLocationHandler)

	// Attendance Corrections
	protected.POST("/attendance/corrections", createCorrectionHandler)
	protected.GET("/attendance/corrections", getCorrectionsHandler)
	protected.PUT("/attendance/corrections/:id/manager-review", managerReviewCorrectionHandler)
	protected.PUT("/attendance/corrections/:id/hr-review", hrReviewCorrectionHandler)
	protected.PUT("/attendance/corrections/:id/cancel", cancelCorrectionHandler)

	// Master Approval Engine
	protected.POST("/approvals/flows", createApprovalFlowHandler)
	protected.GET("/approvals/flows", getApprovalFlowsHandler)
	protected.PUT("/approvals/flows/:id/active", setApprovalFlowActiveHandler)
	protected.DELETE("/approvals/flows/:id", deleteApprovalFlowHandler)
	protected.GET("/approvals/requests/mine", getMyApprovalRequestsHandler)
	protected.GET("/approvals/requests/pending", getPendingApprovalsHandler)
	protected.GET("/approvals/requests/:id", getApprovalRequestHandler)
	protected.PUT("/approvals/requests/:id/act", actOnApprovalRequestHandler)
	protected.PUT("/approvals/requests/:id/cancel", cancelApprovalRequestHandler)
	protected.POST("/approvals/delegations", createDelegationHandler)
	protected.GET("/approvals/delegations", getMyDelegationsHandler)
	protected.PUT("/approvals/delegations/:id/deactivate", deactivateDelegationHandler)

	// Overtime Request (reference module using the Master Approval Engine)
	protected.POST("/overtime/requests", createOvertimeRequestHandler)
	protected.GET("/overtime/requests/mine", getMyOvertimeRequestsHandler)
	// NOTE: static paths MUST come before wildcard (:id) in Gin
	protected.GET("/shifts", getShiftsHandler)
	protected.POST("/shifts", createShiftHandler)
	protected.POST("/shifts/assign", assignShiftHandler)
	protected.GET("/shifts/assignments", getEmployeeShiftAssignmentsHandler)
	protected.DELETE("/shifts/assignments/:id", removeShiftAssignmentHandler)
	protected.PUT("/shifts/:id", updateShiftHandler)
	protected.DELETE("/shifts/:id", deleteShiftHandler)
	protected.GET("/employees/:id/shift", getEmployeeShiftHandler)
}
