package main

import "github.com/gin-gonic/gin"

// registerBenefitsSuccessionRoutes wires up benefits (generic plans, insurance,
// allowances, flexible benefits, retirement, insurance continuation),
// compensation, and succession planning (plans/candidates, nine-box, career
// paths, leadership programs). Split out of main() verbatim — same routes,
// same order.
func registerBenefitsSuccessionRoutes(protected *gin.RouterGroup) {
	// Benefits
	protected.GET("/benefits/plans", getBenefitPlansHandler)
	protected.POST("/benefits/plans", createBenefitPlanHandler)
	protected.PUT("/benefits/plans/:id", updateBenefitPlanHandler)
	protected.DELETE("/benefits/plans/:id", deleteBenefitPlanHandler)
	protected.GET("/benefits/employee", getEmployeeBenefitsHandler)
	protected.POST("/benefits/enroll", enrollEmployeeBenefitHandler)
	protected.POST("/benefits/unenroll", unenrollEmployeeBenefitHandler)
	protected.GET("/benefits/analytics", getBenefitsAnalyticsHandler)

	// Insurance Plans (distinct from the generic benefit_plans model above)
	protected.GET("/benefits/insurance-plans", getInsurancePlansHandler)
	protected.POST("/benefits/insurance-plans", createInsurancePlanHandler)
	protected.PUT("/benefits/insurance-plans/:id", updateInsurancePlanHandler)
	protected.DELETE("/benefits/insurance-plans/:id", deleteInsurancePlanHandler)
	protected.POST("/benefits/insurance-plans/:id/enroll", enrollInsurancePlanHandler)
	protected.GET("/benefits/insurance-enrollments", getEmployeeInsuranceEnrollmentsHandler)
	protected.PUT("/benefits/insurance-enrollments/:id/terminate", terminateInsuranceEnrollmentHandler)
	protected.GET("/benefits/dependents/:employeeId", getDependentsHandler)
	protected.POST("/benefits/dependents/:employeeId", addDependentHandler)
	protected.PUT("/benefits/dependents/:employeeId/:dependentId", updateDependentHandler)
	protected.DELETE("/benefits/dependents/:employeeId/:dependentId", removeDependentHandler)

	// Allowances
	protected.GET("/benefits/allowances", getAllowancesHandler)
	protected.POST("/benefits/allowances", createAllowanceHandler)
	protected.PUT("/benefits/allowances/:id", updateAllowanceHandler)
	protected.DELETE("/benefits/allowances/:id", deleteAllowanceHandler)
	protected.POST("/benefits/employee/:employeeId/allowances/:allowanceId", assignAllowanceHandler)

	// Flexible Benefits
	protected.GET("/benefits/flexible", getFlexibleBenefitsHandler)
	protected.POST("/benefits/flexible", createFlexibleBenefitHandler)
	protected.PUT("/benefits/flexible/:id", updateFlexibleBenefitHandler)
	protected.POST("/benefits/flexible/enroll", enrollFlexibleBenefitHandler)

	// Retirement Plans
	protected.GET("/benefits/retirement", getRetirementPlansHandler)
	protected.POST("/benefits/retirement", createRetirementPlanHandler)
	protected.PUT("/benefits/retirement/:id", updateRetirementPlanHandler)
	protected.POST("/benefits/retirement/enroll", enrollRetirementPlanHandler)

	// Insurance Continuation (Indonesian-context equivalent of "COBRA")
	protected.POST("/benefits/insurance-continuation/initiate", initiateInsuranceContinuationHandler)
	protected.GET("/benefits/insurance-continuation", getInsuranceContinuationsHandler)
	protected.POST("/benefits/insurance-continuation/:id/payment", recordInsuranceContinuationPaymentHandler)

	// Compensation
	protected.GET("/compensation/bands", getCompensationBandsHandler)
	protected.POST("/compensation/bands", upsertCompensationBandHandler)
	protected.GET("/compensation/grades", getSalaryGradesHandler)
	protected.GET("/compensation/structures", getCompensationStructuresHandler)
	protected.GET("/compensation/analytics", getCompensationAnalyticsHandler)

	// Succession Planning
	protected.GET("/succession/plans", getSuccessionPlansHandler)
	protected.POST("/succession/plans", createSuccessionPlanHandler)
	protected.PUT("/succession/plans/:id", updateSuccessionPlanHandler)
	protected.DELETE("/succession/plans/:id", deleteSuccessionPlanHandler)
	protected.POST("/succession/plans/:id/candidates", addSuccessionCandidateHandler)
	protected.DELETE("/succession/plans/:planId/candidates/:id", removeSuccessionCandidateHandler)
	protected.GET("/succession/candidates", getSuccessionCandidatesHandler)
	protected.GET("/succession/nine-box", getNineBoxGridHandler)

	// Career Paths
	protected.GET("/succession/career-paths", getCareerPathsHandler)
	protected.GET("/succession/career-paths/:id", getCareerPathByIDHandler)
	protected.POST("/succession/career-paths", createCareerPathHandler)
	protected.PUT("/succession/career-paths/:id", updateCareerPathHandler)
	protected.PUT("/succession/career-paths/:id/milestones/:milestoneId", updateCareerMilestoneHandler)

	// Leadership Development Programs
	protected.GET("/succession/leadership-programs", getLeadershipProgramsHandler)
	protected.POST("/succession/leadership-programs", createLeadershipProgramHandler)
	protected.PUT("/succession/leadership-programs/:id", updateLeadershipProgramHandler)
	protected.POST("/succession/leadership-programs/:id/enroll", enrollInLeadershipProgramHandler)
	protected.POST("/succession/leadership-programs/:id/complete", completeLeadershipProgramHandler)
	protected.POST("/succession/leadership-programs/:id/modules", addLeadershipModuleHandler)
	protected.PUT("/succession/leadership-programs/:id/modules/:moduleId", updateLeadershipModuleHandler)
	protected.DELETE("/succession/leadership-programs/:id/modules/:moduleId", deleteLeadershipModuleHandler)
}
