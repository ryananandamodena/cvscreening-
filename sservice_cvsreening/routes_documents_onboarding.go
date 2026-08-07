package main

import "github.com/gin-gonic/gin"

// registerDocumentsOnboardingRoutes wires up company documents/policies,
// onboarding sessions/tasks/templates, and organization (departments/positions).
// Split out of main() verbatim — same routes, same order.
func registerDocumentsOnboardingRoutes(protected *gin.RouterGroup) {
	// Document Management
	protected.GET("/documents", getDocumentsHandler)
	protected.POST("/documents", createDocumentHandler)
	protected.GET("/documents/policies", getPoliciesHandler)
	protected.POST("/documents/policies", createPolicyHandler)
	protected.PUT("/documents/policies/:id", updatePolicyHandler)
	protected.DELETE("/documents/policies/:id", deletePolicyHandler)
	protected.GET("/documents/contracts", getDocumentContractsHandler)
	protected.GET("/documents/compliance", getComplianceRecordsHandler)

	// Onboarding
	protected.GET("/onboarding/sessions", getOnboardingSessionsHandler)
	protected.POST("/onboarding/sessions", createOnboardingSessionHandler)
	protected.GET("/onboarding/sessions/:sessionId/tasks", getOnboardingTasksHandler)
	protected.POST("/onboarding/sessions/:sessionId/tasks", createOnboardingTaskHandler)
	protected.PUT("/onboarding/tasks/:taskId", updateOnboardingTaskHandler)
	protected.GET("/onboarding/templates", getOnboardingTemplatesHandler)
	protected.POST("/onboarding/templates", createOnboardingTemplateHandler)
	protected.PUT("/onboarding/templates/:id/active", setOnboardingTemplateActiveHandler)
	protected.DELETE("/onboarding/templates/:id", deleteOnboardingTemplateHandler)

	// Organization
	protected.GET("/departments", getDepartmentsHandler)
	protected.GET("/departments/:id", getDepartmentByIDHandler)
	protected.POST("/departments", createDepartmentHandler)
	protected.PUT("/departments/:id", updateDepartmentHandler)
	protected.DELETE("/departments/:id", deleteDepartmentHandler)

	protected.GET("/positions", getPositionsHandler)
	protected.GET("/positions/:id", getPositionByIDHandler)
	protected.POST("/positions", createPositionHandler)
	protected.PUT("/positions/:id", updatePositionHandler)
	protected.DELETE("/positions/:id", deletePositionHandler)
}
