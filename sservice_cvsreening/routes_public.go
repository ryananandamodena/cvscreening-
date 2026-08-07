package main

import (
	"time"

	"github.com/gin-gonic/gin"
)

// registerPublicRoutes wires up every endpoint reachable without a staff login:
// public auth (register/login/refresh), the live-interview WebSocket handshake,
// candidate-facing interview/assessment flows, and the candidate portal
// (including its own CandidateAuthMiddleware-protected sub-group). Split out of
// main() verbatim — same routes, same order, just grouped by concern.
func registerPublicRoutes(r *gin.Engine, api *gin.RouterGroup) {
	// Public Auth Routes - Stricter Rate Limit (20 req/min overall)
	auth := api.Group("/")
	auth.Use(RateLimitMiddleware(20, time.Minute))
	{
		auth.POST("/register", registerHandler)
		auth.POST("/login", RateLimitMiddleware(30, time.Minute), loginHandler)
		auth.POST("/refresh", refreshTokenHandler)
	}

	// ==================== PUBLIC ROUTES ====================
	// Only endpoints that candidates/public genuinely need without login

	// Live Interview WebSocket (no auth required for WS handshake)
	api.GET("/ai/live-interview", liveInterviewHandler)

	// Evaluate Video Answer endpoint (Public for candidate interview)
	api.POST("/ai/evaluate-answer", evaluateAnswerHandler)

	// Public Job Listing (for Careers page)
	api.GET("/jobs", getJobsHandler)

	// Candidate Interview Flow (accessed via unique token link)
	api.GET("/interviews/:id", getInterviewByIDHandler)
	api.POST("/interviews/:id/submit", submitInterviewHandler)
	api.GET("/interviews/:id/responses", getInterviewResponsesHandler)
	api.POST("/interviews/:id/responses", saveQuestionResponseHandler)
	api.GET("/interviews/:id/responses/:order", getQuestionResponseHandler)
	api.DELETE("/interviews/:id/responses/:order", deleteQuestionResponseHandler)
	api.GET("/interviews/:id/progress", getInterviewProgressHandler)

	// Assessment Taking (candidate flow)
	api.GET("/assessments/:id", getAssessmentByIDHandler)
	api.GET("/assessments/:id/questions", getAssessmentQuestionsHandler)
	api.GET("/assessments/:id/templates", getAssessmentTemplatesHandler)
	api.POST("/assessments/:id/start", startAssessmentAttemptHandler)
	api.GET("/assessment-attempts/:id", getAssessmentAttemptHandler)
	api.POST("/assessment-attempts/:id/submit", submitAssessmentAttemptHandler)
	api.POST("/assessment-attempts/:id/answer", saveAssessmentAnswerHandler)
	api.GET("/assessment-attempts/:id/answers", getAssessmentAnswersHandler)
	api.GET("/assessment-attempts/:id/result", getAssessmentAttemptResultHandler)

	// Candidate Portal Routes (Public for candidates)
	api.POST("/candidate/register", candidatePortalRegisterHandler)
	api.POST("/candidate/login", candidatePortalLoginHandler)
	api.GET("/candidate/jobs", getPublicJobsHandler)

	// Protected Candidate Routes (requires candidate auth)
	candidateProtected := api.Group("/")
	candidateProtected.Use(CandidateAuthMiddleware())
	{
		candidateProtected.POST("/candidate/apply", submitApplicationHandler)
		candidateProtected.GET("/candidate/applications", getCandidateApplicationsHandler)
		candidateProtected.GET("/candidate/applications/:id", getApplicationByIDHandler)
	}

	// Serve uploaded files (Recordings)
	r.Static("/uploads", "./uploads")
}
