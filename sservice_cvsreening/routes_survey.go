package main

import "github.com/gin-gonic/gin"

// registerSurveyRoutes wires up the Employee Survey module: any authenticated employee can
// list/view surveys and submit/view their own response; creating surveys/questions is an
// HR/admin action, gated the same way user management is (AdminOnly()).
func registerSurveyRoutes(protected *gin.RouterGroup) {
	protected.GET("/surveys", getSurveysHandler)
	protected.GET("/surveys/:id", getSurveyByIDHandler)
	protected.GET("/surveys/:id/questions", getSurveyQuestionsHandler)
	protected.POST("/surveys/:id/responses", submitSurveyResponseHandler)
	protected.GET("/surveys/:id/my-response", getMySurveyResponseHandler)

	adminOnly := protected.Group("/")
	adminOnly.Use(AdminOnly())
	{
		adminOnly.POST("/surveys", createSurveyHandler)
		adminOnly.POST("/surveys/:id/questions", createSurveyQuestionHandler)
	}
}
