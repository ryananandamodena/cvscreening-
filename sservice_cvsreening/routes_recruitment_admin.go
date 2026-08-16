package main

import "github.com/gin-gonic/gin"

// registerRecruitmentAdminRoutes wires up the staff-facing (AuthMiddleware-gated)
// side of the recruitment pipeline: screening, candidates, job/interview/assessment
// management, offer letters, LinkedIn import, scorecards, recordings, advanced
// analytics/reports, skill matching, and the generic integrations group.
//
// Every route in this file is recruitment/HR-ops data (candidate PII, screenings,
// interviews, assessments, offer letters, scorecards, recordings, org settings,
// integration credentials) — none of it is self-service employee data, so the whole
// group requires at least recruiter/admin. Previously this entire file was reachable
// by ANY authenticated employee (a plain "viewer" role could read candidate PII,
// interview scorecards, etc.) — that's the vulnerability this gate closes.
func registerRecruitmentAdminRoutes(protected *gin.RouterGroup) {
	// Job postings are visible to every employee (mobile's internal job board lets any
	// employee browse/consider open positions) — self-service read, not recruiter-exclusive.
	// Only creating/editing/closing a job posting is a recruiter/HR action (gated below).
	protected.GET("/jobs/:id", getJobByIDHandler)

	recruitmentStaff := protected.Group("/")
	recruitmentStaff.Use(RecruiterOrAdmin())

	// Screening
	recruitmentStaff.POST("/screening", screeningHandler)
	recruitmentStaff.GET("/screenings", getScreeningsHandler)
	recruitmentStaff.GET("/screenings/:id", getScreeningByIDHandler)
	recruitmentStaff.PATCH("/screenings/:id", updateScreeningStatusHandler)
	recruitmentStaff.POST("/screening/bulk", bulkScreeningHandler)
	recruitmentStaff.GET("/jobs/:id/leaderboard", getLeaderboardHandler)

	// Analytics & Settings
	recruitmentStaff.GET("/analytics/dashboard", getHRAnalyticsHandler)
	recruitmentStaff.GET("/analytics", getAnalyticsHandler)
	recruitmentStaff.GET("/settings", getSettingsHandler)
	recruitmentStaff.GET("/questions", getAllQuestionsHandler)
	// Updating global app settings needs admin specifically, not just recruiter/HR.
	adminOnlySettings := recruitmentStaff.Group("/")
	adminOnlySettings.Use(AdminOnly())
	adminOnlySettings.POST("/settings", updateSettingsHandler)

	// Candidates
	recruitmentStaff.GET("/candidates", getCandidatesHandler)
	recruitmentStaff.GET("/search/candidates", searchCandidatesHandler)
	recruitmentStaff.GET("/candidates/:id", getCandidateByIDHandler)
	recruitmentStaff.GET("/candidates/:id/attempts", getCandidateAttemptsHandler)

	// Job Management (GET /jobs/:id is registered above as self-service)
	recruitmentStaff.POST("/jobs", createJobHandler)
	recruitmentStaff.PUT("/jobs/:id", updateJobHandler)
	recruitmentStaff.DELETE("/jobs/:id", deleteJobHandler)

	// Interview Management
	recruitmentStaff.POST("/interviews", createInterviewHandler)
	recruitmentStaff.GET("/interviews", getInterviewsHandler)
	recruitmentStaff.PUT("/interviews/:id/feedback", updateInterviewFeedbackHandler)
	recruitmentStaff.POST("/interviews/:id/cancel", cancelInterviewHandler)
	recruitmentStaff.POST("/interviews/:id/finalize", finalizeInterviewHandler)

	// Interview Schedule
	recruitmentStaff.GET("/interview-schedules", getInterviewSchedulesHandler)
	recruitmentStaff.POST("/interview-schedules", createInterviewScheduleHandler)
	recruitmentStaff.GET("/interview-schedules/:id", getInterviewScheduleByIDHandler)
	recruitmentStaff.PUT("/interview-schedules/:id", updateInterviewScheduleHandler)
	recruitmentStaff.POST("/interview-schedules/:id/cancel", cancelInterviewScheduleHandler)

	// Assessment Management (CRUD by admin/recruiter)
	recruitmentStaff.GET("/assessments", getAssessmentsHandler)
	recruitmentStaff.POST("/assessments", createAssessmentHandler)
	recruitmentStaff.PUT("/assessments/:id", updateAssessmentHandler)
	recruitmentStaff.DELETE("/assessments/:id", deleteAssessmentHandler)
	recruitmentStaff.POST("/assessments/:id/questions", createAssessmentQuestionHandler)
	recruitmentStaff.PUT("/assessments/:id/questions/:qid", updateAssessmentQuestionHandler)
	recruitmentStaff.DELETE("/assessments/:id/questions/:qid", deleteAssessmentQuestionHandler)
	recruitmentStaff.POST("/assessments/:id/assign", assignAssessmentHandler)

	// Interview Questions
	recruitmentStaff.POST("/jobs/:id/questions", createQuestionHandler)
	recruitmentStaff.GET("/jobs/:id/questions", getInterviewQuestionsHandler)
	recruitmentStaff.PUT("/questions/:id", updateInterviewQuestionHandler)
	recruitmentStaff.DELETE("/questions/:id", deleteQuestionHandler)

	// Offer Letter Management
	recruitmentStaff.GET("/offer-letters", listOfferLettersHandler)
	recruitmentStaff.GET("/offer-letters/:id", getOfferLetterHandler)
	recruitmentStaff.POST("/offer-letters", createOfferLetterHandler)
	recruitmentStaff.PUT("/offer-letters/:id", updateOfferLetterHandler)
	recruitmentStaff.PATCH("/offer-letters/:id/send", sendOfferLetterHandler)
	recruitmentStaff.PATCH("/offer-letters/:id/status", updateOfferLetterStatusHandler)
	recruitmentStaff.DELETE("/offer-letters/:id", deleteOfferLetterHandler)

	// LinkedIn Integration
	recruitmentStaff.POST("/candidates/import", importCandidateHandler)
	recruitmentStaff.POST("/linkedin/search", searchLinkedInHandler)

	// Interview Scorecards
	// NOTE: the schema has no interviewer-identity link (Interview.Interviewer is a free-text
	// name, not a user/employee FK), so a precise "only the assigned interviewer" check can't
	// be enforced without guessing a name match — flagged as a business decision (needs a
	// schema change to add a real interviewer_user_id/interviewer_employee_id column). This
	// gate is the safe floor: no plain employee can read/write scorecards at all.
	recruitmentStaff.GET("/interviews/:id/scorecard", getScorecardHandler)
	recruitmentStaff.GET("/interviews/:id/scorecards", getScorecardsHandler)
	recruitmentStaff.POST("/interviews/:id/scorecard", createScorecardHandler)
	recruitmentStaff.PUT("/scorecards/:id", updateScorecardHandler)
	recruitmentStaff.DELETE("/scorecards/:id", deleteScorecardHandler)

	// Recording Management
	recruitmentStaff.GET("/interviews/:id/recordings", getRecordingsHandler)
	recruitmentStaff.GET("/recordings/:id", getRecordingByIDHandler)
	recruitmentStaff.POST("/recordings", createRecordingHandler)
	recruitmentStaff.DELETE("/recordings/:id", deleteRecordingHandler)

	// Advanced Analytics & Reports
	recruitmentStaff.GET("/analytics/advanced", getAdvancedAnalyticsHandler)

	// Advanced Analytics UI endpoints — real, database-backed metrics.
	// Predictive analytics is a rule-based heuristic (see repository doc comment),
	// not a trained ML model; its response is flagged isHeuristic:true.
	recruitmentStaff.GET("/analytics/realtime", getRealtimeAnalyticsHandler)
	recruitmentStaff.GET("/analytics/performance", getAdvancedPerformanceAnalyticsHandler)
	recruitmentStaff.GET("/analytics/predictive", getPredictiveAnalyticsHandler)
	recruitmentStaff.GET("/analytics/workforce", getWorkforceAnalyticsHandler)
	recruitmentStaff.GET("/reports", getReportsDataHandler)
	recruitmentStaff.GET("/reports/screening/:id", getScreeningReportHandler)
	recruitmentStaff.GET("/reports/interview/:id", getInterviewReportHandler)

	// Skill Matching
	recruitmentStaff.POST("/skill-matching", skillMatchingHandler)

	// Integrations Management — connecting/configuring third-party integrations (credentials,
	// OAuth) and sending outbound messages need admin specifically.
	recruitmentStaff.GET("/integrations", getIntegrationsHandler)
	recruitmentStaff.GET("/integrations/:type", getIntegrationByTypeHandler)
	recruitmentStaff.GET("/integrations/:type/templates", whatsappTemplatesHandler)
	adminOnlyIntegrations := recruitmentStaff.Group("/")
	adminOnlyIntegrations.Use(AdminOnly())
	{
		adminOnlyIntegrations.POST("/integrations/:type/connect", connectIntegrationHandler)
		adminOnlyIntegrations.POST("/integrations/:type/disconnect", disconnectIntegrationHandler)
		adminOnlyIntegrations.POST("/integrations/:type/test", testIntegrationHandler)
		adminOnlyIntegrations.POST("/integrations/:type/auth", googleCalendarAuthHandler)
		adminOnlyIntegrations.POST("/integrations/:type/sync", googleCalendarSyncHandler)
		adminOnlyIntegrations.POST("/integrations/:type/config", whatsappConfigHandler)
		adminOnlyIntegrations.POST("/integrations/:type/send", whatsappSendHandler)
	}
}
