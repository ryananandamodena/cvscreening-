package main

import "github.com/gin-gonic/gin"

// registerBenefitsSuccessionRoutes wires up benefits (generic plans, insurance,
// allowances, flexible benefits, retirement, insurance continuation),
// compensation, and succession planning (plans/candidates, nine-box, career
// paths, leadership programs). Split out of main() verbatim — same routes,
// same order.
func registerBenefitsSuccessionRoutes(protected *gin.RouterGroup) {
	// Benefits — self-service reads/actions. IDOR on employeeId is handled inside the handlers
	// themselves via authorizeEmployeeTarget (own record, or admin/manager override).
	protected.GET("/benefits/plans", getBenefitPlansHandler)
	protected.GET("/benefits/employee", getEmployeeBenefitsHandler)
	protected.POST("/benefits/enroll", enrollEmployeeBenefitHandler)
	protected.POST("/benefits/unenroll", unenrollEmployeeBenefitHandler)
	protected.GET("/benefits/insurance-plans", getInsurancePlansHandler)
	protected.GET("/benefits/insurance-enrollments", getEmployeeInsuranceEnrollmentsHandler)
	protected.GET("/benefits/dependents/:employeeId", getDependentsHandler)
	protected.GET("/benefits/allowances", getAllowancesHandler)
	protected.GET("/benefits/flexible", getFlexibleBenefitsHandler)
	protected.POST("/benefits/flexible/enroll", enrollFlexibleBenefitHandler)
	protected.GET("/benefits/retirement", getRetirementPlansHandler)
	protected.POST("/benefits/retirement/enroll", enrollRetirementPlanHandler)
	protected.GET("/benefits/insurance-continuation", getInsuranceContinuationsHandler)
	protected.GET("/succession/career-paths", getCareerPathsHandler)
	protected.GET("/succession/career-paths/:id", getCareerPathByIDHandler)
	protected.GET("/succession/leadership-programs", getLeadershipProgramsHandler)
	protected.POST("/succession/leadership-programs/:id/enroll", enrollInLeadershipProgramHandler)

	// HR/Admin administrative actions: creating/editing/deleting benefit plans, insurance
	// plans, allowances, dependents, retirement/flexible-benefit plans, and anything that
	// targets or affects employees org-wide rather than the caller's own record. None of this
	// was gated before — any authenticated employee could create/edit/delete these.
	// Was RecruiterOrAdmin() despite the comment above already saying "HR/Admin" — same bug
	// class as routes_attendance.go/routes_hr.go, fixed the same way.
	hrOrAdmin := protected.Group("/")
	hrOrAdmin.Use(HROrAdmin())
	{
		hrOrAdmin.POST("/benefits/plans", createBenefitPlanHandler)
		hrOrAdmin.PUT("/benefits/plans/:id", updateBenefitPlanHandler)
		hrOrAdmin.DELETE("/benefits/plans/:id", deleteBenefitPlanHandler)
		hrOrAdmin.GET("/benefits/analytics", getBenefitsAnalyticsHandler)

		hrOrAdmin.POST("/benefits/insurance-plans", createInsurancePlanHandler)
		hrOrAdmin.PUT("/benefits/insurance-plans/:id", updateInsurancePlanHandler)
		hrOrAdmin.DELETE("/benefits/insurance-plans/:id", deleteInsurancePlanHandler)
		hrOrAdmin.POST("/benefits/insurance-plans/:id/enroll", enrollInsurancePlanHandler)
		hrOrAdmin.PUT("/benefits/insurance-enrollments/:id/terminate", terminateInsuranceEnrollmentHandler)
		hrOrAdmin.POST("/benefits/dependents/:employeeId", addDependentHandler)
		hrOrAdmin.PUT("/benefits/dependents/:employeeId/:dependentId", updateDependentHandler)
		hrOrAdmin.DELETE("/benefits/dependents/:employeeId/:dependentId", removeDependentHandler)

		hrOrAdmin.POST("/benefits/allowances", createAllowanceHandler)
		hrOrAdmin.PUT("/benefits/allowances/:id", updateAllowanceHandler)
		hrOrAdmin.DELETE("/benefits/allowances/:id", deleteAllowanceHandler)
		hrOrAdmin.POST("/benefits/employee/:employeeId/allowances/:allowanceId", assignAllowanceHandler)
		hrOrAdmin.POST("/benefits/insurance-continuation/initiate", initiateInsuranceContinuationHandler)
		// Was in the `protected` group with NO gate at all — any authenticated employee could
		// POST a fabricated premium payment onto any continuation record by guessing/incrementing
		// :id (IDOR). Recording a received premium payment is an HR/finance action, not
		// self-service, so this belongs here alongside initiateInsuranceContinuationHandler.
		hrOrAdmin.POST("/benefits/insurance-continuation/:id/payment", recordInsuranceContinuationPaymentHandler)

		hrOrAdmin.POST("/benefits/flexible", createFlexibleBenefitHandler)
		hrOrAdmin.PUT("/benefits/flexible/:id", updateFlexibleBenefitHandler)
		hrOrAdmin.POST("/benefits/retirement", createRetirementPlanHandler)
		hrOrAdmin.PUT("/benefits/retirement/:id", updateRetirementPlanHandler)

		// Succession/career/leadership: sensitive HR-only data (performance/potential
		// assessments, promotion pipelines) as well as its administrative CRUD.
		hrOrAdmin.GET("/succession/plans", getSuccessionPlansHandler)
		hrOrAdmin.POST("/succession/plans", createSuccessionPlanHandler)
		hrOrAdmin.PUT("/succession/plans/:id", updateSuccessionPlanHandler)
		hrOrAdmin.DELETE("/succession/plans/:id", deleteSuccessionPlanHandler)
		hrOrAdmin.POST("/succession/plans/:id/candidates", addSuccessionCandidateHandler)
		hrOrAdmin.DELETE("/succession/plans/:id/candidates/:candidateId", removeSuccessionCandidateHandler)
		hrOrAdmin.GET("/succession/candidates", getSuccessionCandidatesHandler)
		hrOrAdmin.GET("/succession/nine-box", getNineBoxGridHandler)

		hrOrAdmin.POST("/succession/career-paths", createCareerPathHandler)
		hrOrAdmin.PUT("/succession/career-paths/:id", updateCareerPathHandler)
		hrOrAdmin.PUT("/succession/career-paths/:id/milestones/:milestoneId", updateCareerMilestoneHandler)

		hrOrAdmin.POST("/succession/leadership-programs", createLeadershipProgramHandler)
		hrOrAdmin.PUT("/succession/leadership-programs/:id", updateLeadershipProgramHandler)
		hrOrAdmin.POST("/succession/leadership-programs/:id/complete", completeLeadershipProgramHandler)
		hrOrAdmin.POST("/succession/leadership-programs/:id/modules", addLeadershipModuleHandler)
		hrOrAdmin.PUT("/succession/leadership-programs/:id/modules/:moduleId", updateLeadershipModuleHandler)
		hrOrAdmin.DELETE("/succession/leadership-programs/:id/modules/:moduleId", deleteLeadershipModuleHandler)
	}

	// Compensation is the most sensitive HR data (salary bands, grades, comp analytics) —
	// Finance owns this end to end (mirrors FinanceOrAdmin gating payroll elsewhere); plain HR
	// (recruiter) is deliberately excluded here — flagged as a business decision if HR also
	// needs visibility.
	financeOrAdmin := protected.Group("/")
	financeOrAdmin.Use(FinanceOrAdmin())
	{
		financeOrAdmin.GET("/compensation/bands", getCompensationBandsHandler)
		financeOrAdmin.POST("/compensation/bands", upsertCompensationBandHandler)
		financeOrAdmin.GET("/compensation/grades", getSalaryGradesHandler)
		financeOrAdmin.GET("/compensation/structures", getCompensationStructuresHandler)
		financeOrAdmin.GET("/compensation/analytics", getCompensationAnalyticsHandler)
	}
}
