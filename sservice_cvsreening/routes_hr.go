package main

import "github.com/gin-gonic/gin"

// registerHRRoutes wires up leave management, core HR (employees/contracts),
// performance management, the AI chatbot, and training. Split out of main()
// verbatim — same routes, same order.
func registerHRRoutes(protected *gin.RouterGroup) {
	// Leave Management
	protected.GET("/leave/types", getLeaveTypesHandler)
	protected.GET("/leave/balances", getLeaveBalancesHandler)
	protected.GET("/leave/requests", getLeaveRequestsHandler)
	protected.GET("/leave/requests/:id", getLeaveRequestByIDHandler)
	protected.POST("/leave/requests", createLeaveRequestHandler)
	protected.PUT("/leave/requests/:id/approve", approveLeaveRequestHandler)
	protected.PUT("/leave/requests/:id/reject", rejectLeaveRequestHandler)
	protected.PUT("/leave/requests/:id/cancel", cancelLeaveRequestHandler)
	protected.GET("/holidays", getHolidaysHandler)

	// Core HR Management — self-service reads stay open; org-wide mutations are HR/admin-gated
	// below. NOTE: static paths (/employees/stats/summary) MUST come before wildcard (/employees/:id).
	protected.GET("/employees", getEmployeesHandler)
	protected.GET("/employees/me", getMyEmployeeHandler)
	// Profile photo (Module 15): self-service, identity resolved from JWT only — no employeeId
	// accepted from body/query, matching the authorizeEmployeeTarget/resolveOwnEmployeeID
	// convention used everywhere else in this file.
	protected.POST("/employees/me/photo", uploadMyPhotoHandler)
	protected.DELETE("/employees/me/photo", deleteMyPhotoHandler)
	protected.GET("/employees/:id", getEmployeeByIDHandler)
	protected.GET("/employees/:id/contracts", getEmployeeContractsHandler)
	protected.POST("/contracts/:id/sign", signContractHandler) // ownership enforced inside the handler
	protected.GET("/performance/reviews", getPerformanceReviewsHandler)
	protected.GET("/performance/reviews/:id", getPerformanceReviewByIDHandler)
	protected.GET("/performance/goals", getGoalsHandler)
	protected.POST("/performance/goals", createGoalHandler)
	protected.PUT("/performance/goals/:id", updateGoalHandler)
	protected.DELETE("/performance/goals/:id", deleteGoalHandler)
	protected.POST("/ai/chatbot", aiChatbotHandler)
	protected.GET("/training/programs", getTrainingProgramsHandler)
	protected.POST("/training/programs/:id/enroll", enrollInTrainingHandler)
	protected.GET("/training/my-trainings", getMyTrainingsHandler)

	// Employee self-service expense claims — identity always resolved from the JWT
	// (resolveOwnEmployeeID), never a client-supplied employeeId. Replaces mobile's previous
	// (incorrect) call to the HR-only POST /benefits/allowances.
	protected.POST("/claims", createClaimHandler)
	protected.GET("/claims/my", getMyClaimsHandler)

	// HR/Admin: employee lifecycle, contracts, performance reviews (manager/HR-authored,
	// not self-authored), training catalog. None of this was gated before — any authenticated
	// employee could create/edit/delete another employee's record, contract, or review.
	hrOrAdmin := protected.Group("/")
	hrOrAdmin.Use(RecruiterOrAdmin())
	{
		hrOrAdmin.GET("/employees/stats/summary", getEmployeeStatsHandler)
		hrOrAdmin.POST("/employees", createEmployeeHandler)
		hrOrAdmin.POST("/candidates/convert", convertCandidateHandler)
		hrOrAdmin.PUT("/employees/:id", updateEmployeeHandler)
		hrOrAdmin.DELETE("/employees/:id", deleteEmployeeHandler)
		// Profile photo (Module 15): admin/recruiter managing another employee's photo — same
		// route-level RecruiterOrAdmin() gate as every other employee-write action in this group.
		hrOrAdmin.POST("/employees/:id/photo", uploadEmployeePhotoHandler)
		hrOrAdmin.DELETE("/employees/:id/photo", deleteEmployeePhotoHandler)
		hrOrAdmin.GET("/employees/:id/candidate-history", getEmployeeCandidateHistoryHandler)
		hrOrAdmin.POST("/employees/:id/contracts", createContractHandler)
		hrOrAdmin.GET("/contracts/expiring", getExpiringContractsHandler)
		hrOrAdmin.POST("/performance/reviews", createPerformanceReviewHandler)
		hrOrAdmin.PUT("/performance/reviews/:id", updatePerformanceReviewHandler)
		hrOrAdmin.POST("/performance/reviews/:id/analyze", analyzePerformanceHandler)
		hrOrAdmin.GET("/performance/analytics", getPerformanceAnalyticsHandler)
		hrOrAdmin.POST("/training/programs", createTrainingProgramHandler)
		hrOrAdmin.GET("/training/employee", getTrainingEmployeeHandler)
	}
}
