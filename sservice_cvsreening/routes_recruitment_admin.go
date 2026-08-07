package main

import "github.com/gin-gonic/gin"

// registerRecruitmentAdminRoutes wires up the staff-facing (AuthMiddleware-gated)
// side of the recruitment pipeline: screening, candidates, job/interview/assessment
// management, offer letters, LinkedIn import, scorecards, recordings, advanced
// analytics/reports, skill matching, and the generic integrations group. Split out
// of main() verbatim — same routes, same order.
func registerRecruitmentAdminRoutes(protected *gin.RouterGroup) {
	// Screening
	protected.POST("/screening", screeningHandler)
	protected.GET("/screenings", getScreeningsHandler)
	protected.GET("/screenings/:id", getScreeningByIDHandler)
	protected.PATCH("/screenings/:id", updateScreeningStatusHandler)
	protected.POST("/screening/bulk", bulkScreeningHandler)
	protected.GET("/jobs/:id/leaderboard", getLeaderboardHandler)

	// Analytics & Settings
	protected.GET("/analytics/dashboard", getHRAnalyticsHandler)
	protected.GET("/analytics", getAnalyticsHandler)
	protected.GET("/settings", getSettingsHandler)
	protected.POST("/settings", updateSettingsHandler)
	protected.GET("/questions", getAllQuestionsHandler)

	// Candidates
	protected.GET("/candidates", getCandidatesHandler)
	protected.GET("/search/candidates", searchCandidatesHandler)
	protected.GET("/candidates/:id", getCandidateByIDHandler)
	protected.GET("/candidates/:id/attempts", getCandidateAttemptsHandler)

	// Job Management
	protected.POST("/jobs", createJobHandler)
	protected.GET("/jobs/:id", getJobByIDHandler)
	protected.PUT("/jobs/:id", updateJobHandler)
	protected.DELETE("/jobs/:id", deleteJobHandler)

	// Interview Management
	protected.POST("/interviews", createInterviewHandler)
	protected.GET("/interviews", getInterviewsHandler)
	protected.PUT("/interviews/:id/feedback", updateInterviewFeedbackHandler)
	protected.POST("/interviews/:id/cancel", cancelInterviewHandler)
	protected.POST("/interviews/:id/finalize", finalizeInterviewHandler)

	// Interview Schedule
	protected.GET("/interview-schedules", getInterviewSchedulesHandler)
	protected.POST("/interview-schedules", createInterviewScheduleHandler)
	protected.GET("/interview-schedules/:id", getInterviewScheduleByIDHandler)
	protected.PUT("/interview-schedules/:id", updateInterviewScheduleHandler)
	protected.POST("/interview-schedules/:id/cancel", cancelInterviewScheduleHandler)

	// Assessment Management (CRUD by admin/recruiter)
	protected.GET("/assessments", getAssessmentsHandler)
	protected.POST("/assessments", createAssessmentHandler)
	protected.PUT("/assessments/:id", updateAssessmentHandler)
	protected.DELETE("/assessments/:id", deleteAssessmentHandler)
	protected.POST("/assessments/:id/questions", createAssessmentQuestionHandler)
	protected.PUT("/assessments/:id/questions/:qid", updateAssessmentQuestionHandler)
	protected.DELETE("/assessments/:id/questions/:qid", deleteAssessmentQuestionHandler)
	protected.POST("/assessments/:id/assign", assignAssessmentHandler)

	// Interview Questions
	protected.POST("/jobs/:id/questions", createQuestionHandler)
	protected.GET("/jobs/:id/questions", getInterviewQuestionsHandler)
	protected.PUT("/questions/:id", updateInterviewQuestionHandler)
	protected.DELETE("/questions/:id", deleteQuestionHandler)

	// Offer Letter Management
	protected.GET("/offer-letters", listOfferLettersHandler)
	protected.POST("/offer-letters", createOfferLetterHandler)
	protected.GET("/offer-letters/:id", getOfferLetterHandler)
	protected.PUT("/offer-letters/:id", updateOfferLetterHandler)
	protected.PATCH("/offer-letters/:id/send", sendOfferLetterHandler)
	protected.PATCH("/offer-letters/:id/status", updateOfferLetterStatusHandler)
	protected.DELETE("/offer-letters/:id", deleteOfferLetterHandler)

	// LinkedIn Integration
	protected.POST("/candidates/import", importCandidateHandler)
	protected.POST("/linkedin/search", searchLinkedInHandler)

	// Interview Scorecards
	protected.GET("/interviews/:id/scorecard", getScorecardHandler)
	protected.GET("/interviews/:id/scorecards", getScorecardsHandler)
	protected.POST("/interviews/:id/scorecard", createScorecardHandler)
	protected.PUT("/scorecards/:id", updateScorecardHandler)
	protected.DELETE("/scorecards/:id", deleteScorecardHandler)

	// Recording Management
	protected.GET("/interviews/:id/recordings", getRecordingsHandler)
	protected.GET("/recordings/:id", getRecordingByIDHandler)
	protected.POST("/recordings", createRecordingHandler)
	protected.DELETE("/recordings/:id", deleteRecordingHandler)

	// Advanced Analytics & Reports
	protected.GET("/analytics/advanced", getAdvancedAnalyticsHandler)

	// Advanced Analytics UI endpoints — real, database-backed metrics.
	// Predictive analytics is a rule-based heuristic (see repository doc comment),
	// not a trained ML model; its response is flagged isHeuristic:true.
	protected.GET("/analytics/realtime", getRealtimeAnalyticsHandler)
	protected.GET("/analytics/performance", getAdvancedPerformanceAnalyticsHandler)
	protected.GET("/analytics/predictive", getPredictiveAnalyticsHandler)
	protected.GET("/analytics/workforce", getWorkforceAnalyticsHandler)
	protected.GET("/reports", getReportsDataHandler)
	protected.GET("/reports/screening/:id", getScreeningReportHandler)
	protected.GET("/reports/interview/:id", getInterviewReportHandler)

	// Skill Matching
	protected.POST("/skill-matching", skillMatchingHandler)

	// Integrations Management
	protected.GET("/integrations", getIntegrationsHandler)
	protected.GET("/integrations/:type", getIntegrationByTypeHandler)
	protected.POST("/integrations/:type/connect", connectIntegrationHandler)
	protected.POST("/integrations/:type/disconnect", disconnectIntegrationHandler)
	protected.POST("/integrations/:type/test", testIntegrationHandler)
	protected.POST("/integrations/:type/auth", googleCalendarAuthHandler)
	protected.POST("/integrations/:type/sync", googleCalendarSyncHandler)
	protected.POST("/integrations/:type/config", whatsappConfigHandler)
	protected.POST("/integrations/:type/send", whatsappSendHandler)
	protected.GET("/integrations/:type/templates", whatsappTemplatesHandler)
}
