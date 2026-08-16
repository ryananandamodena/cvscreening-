package main

import "github.com/gin-gonic/gin"

// registerDocumentsOnboardingRoutes wires up company documents/policies,
// onboarding sessions/tasks/templates, and organization (departments/positions).
// Split out of main() verbatim — same routes, same order.
func registerDocumentsOnboardingRoutes(protected *gin.RouterGroup) {
	// Document Management — reads open; policy/document authoring is HR/admin below.
	protected.GET("/documents", getDocumentsHandler)
	protected.GET("/documents/policies", getPoliciesHandler)
	protected.GET("/documents/compliance", getComplianceRecordsHandler)

	// Onboarding — session/task reads and per-task completion stay open (employee's own
	// onboarding); creating sessions/tasks and managing templates is HR/admin below.
	protected.GET("/onboarding/sessions", getOnboardingSessionsHandler)
	protected.GET("/onboarding/sessions/:sessionId/tasks", getOnboardingTasksHandler)
	protected.PUT("/onboarding/tasks/:taskId", updateOnboardingTaskHandler)
	protected.GET("/onboarding/templates", getOnboardingTemplatesHandler)

	// Organization — read-only directory data stays open.
	protected.GET("/departments", getDepartmentsHandler)
	protected.GET("/departments/:id", getDepartmentByIDHandler)
	protected.GET("/positions", getPositionsHandler)
	protected.GET("/positions/:id", getPositionByIDHandler)

	// HR/Admin: none of the following were gated before — any authenticated employee could
	// create/edit/delete company policies, onboarding templates, departments, and positions.
	hrOrAdmin := protected.Group("/")
	hrOrAdmin.Use(RecruiterOrAdmin())
	{
		hrOrAdmin.POST("/documents", createDocumentHandler)
		hrOrAdmin.POST("/documents/policies", createPolicyHandler)
		hrOrAdmin.PUT("/documents/policies/:id", updatePolicyHandler)
		hrOrAdmin.DELETE("/documents/policies/:id", deletePolicyHandler)
		hrOrAdmin.GET("/documents/contracts", getDocumentContractsHandler)

		hrOrAdmin.POST("/onboarding/sessions", createOnboardingSessionHandler)
		hrOrAdmin.POST("/onboarding/sessions/:sessionId/tasks", createOnboardingTaskHandler)
		hrOrAdmin.POST("/onboarding/templates", createOnboardingTemplateHandler)
		hrOrAdmin.PUT("/onboarding/templates/:id/active", setOnboardingTemplateActiveHandler)
		hrOrAdmin.DELETE("/onboarding/templates/:id", deleteOnboardingTemplateHandler)
	}

	// Admin: departments/positions are structural org data, not HR-day-to-day — restricted to
	// admin (mirrors AdminOnly gating user management elsewhere).
	adminOnly := protected.Group("/")
	adminOnly.Use(AdminOnly())
	{
		adminOnly.POST("/departments", createDepartmentHandler)
		adminOnly.PUT("/departments/:id", updateDepartmentHandler)
		adminOnly.DELETE("/departments/:id", deleteDepartmentHandler)
		adminOnly.POST("/positions", createPositionHandler)
		adminOnly.PUT("/positions/:id", updatePositionHandler)
		adminOnly.DELETE("/positions/:id", deletePositionHandler)
	}
}
