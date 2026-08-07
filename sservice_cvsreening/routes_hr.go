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

	// Core HR Management
	// NOTE: static paths (/employees/stats/summary) MUST come before wildcard (/employees/:id)
	protected.GET("/employees", getEmployeesHandler)
	protected.GET("/employees/me", getMyEmployeeHandler)
	protected.GET("/employees/stats/summary", getEmployeeStatsHandler)
	protected.POST("/employees", createEmployeeHandler)
	protected.POST("/candidates/convert", convertCandidateHandler)
	protected.GET("/employees/:id", getEmployeeByIDHandler)
	protected.PUT("/employees/:id", updateEmployeeHandler)
	protected.DELETE("/employees/:id", deleteEmployeeHandler)
	protected.GET("/employees/:id/candidate-history", getEmployeeCandidateHistoryHandler)

	// Contracts
	protected.GET("/employees/:id/contracts", getEmployeeContractsHandler)
	protected.POST("/employees/:id/contracts", createContractHandler)
	protected.GET("/contracts/expiring", getExpiringContractsHandler)
	protected.POST("/contracts/:id/sign", signContractHandler)

	// Performance Management
	protected.GET("/performance/reviews", getPerformanceReviewsHandler)
	protected.POST("/performance/reviews", createPerformanceReviewHandler)
	protected.PUT("/performance/reviews/:id", updatePerformanceReviewHandler)
	protected.POST("/performance/reviews/:id/analyze", analyzePerformanceHandler)

	// Advanced AI Features
	protected.POST("/ai/chatbot", aiChatbotHandler)

	// Performance Management (cont'd — historically filed under a duplicate
	// "Training & Development" comment; left grouped with performance since
	// that's what these routes actually are)
	protected.GET("/performance/reviews/:id", getPerformanceReviewByIDHandler)
	protected.GET("/performance/goals", getGoalsHandler)
	protected.POST("/performance/goals", createGoalHandler)
	protected.PUT("/performance/goals/:id", updateGoalHandler)
	protected.DELETE("/performance/goals/:id", deleteGoalHandler)
	protected.GET("/performance/analytics", getPerformanceAnalyticsHandler)

	// Training & Development
	protected.GET("/training/programs", getTrainingProgramsHandler)
	protected.POST("/training/programs", createTrainingProgramHandler)
	protected.POST("/training/programs/:id/enroll", enrollInTrainingHandler)
	protected.GET("/training/my-trainings", getMyTrainingsHandler)
	protected.GET("/training/employee", getTrainingEmployeeHandler)
}
