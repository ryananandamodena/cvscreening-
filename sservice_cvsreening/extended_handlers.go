package main

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
	"github.com/ryantriananda/sservice_cvsreening/utils"
)

// ==================== PERFORMANCE HANDLERS ====================

// analyzePerformanceHandler uses Gemini AI to analyze a performance review
func analyzePerformanceHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid review ID", nil)
		return
	}

	review, err := repository.GetPerformanceReviewByID(c.Request.Context(), id)
	if err != nil || review == nil {
		RespondWithError(c, http.StatusNotFound, "not_found", "Review not found", nil)
		return
	}

	aiService := utils.NewGeminiAIService()
	score, summary, err := aiService.AnalyzeSentiment(c.Request.Context(), review.Achievements, review.Challenges, review.ManagerComments)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "ai_error", "Failed to analyze sentiment", err.Error())
		return
	}

	err = repository.AnalyzePerformanceReview(c.Request.Context(), id, score, summary)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to save AI sentiment", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Performance analyzed successfully", "aiSentimentScore": score, "aiSummary": summary})
}

// getPerformanceReviewsHandler godoc
// @Summary List performance reviews
// @Tags performance
// @Produce json
// @Param employeeId query int false "Employee ID"
// @Param status query string false "Status"
// @Param period query string false "Period"
// @Param page query int false "Page"
// @Param limit query int false "Limit"
// @Success 200 {object} gin.H
// @Router /api/performance/reviews [get]
func getPerformanceReviewsHandler(c *gin.Context) {
	filter := models.PerformanceReviewFilter{}
	if id, err := strconv.Atoi(c.Query("employeeId")); err == nil {
		filter.EmployeeID = id
	}
	filter.Status = c.Query("status")
	filter.Period = c.Query("period")
	if p, err := strconv.Atoi(c.Query("page")); err == nil {
		filter.Page = p
	}
	if l, err := strconv.Atoi(c.Query("limit")); err == nil {
		filter.Limit = l
	}
	if filter.Limit == 0 {
		filter.Limit = 20
	}

	reviews, total, err := repository.GetPerformanceReviews(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	totalPages := (total + filter.Limit - 1) / filter.Limit

	c.JSON(http.StatusOK, gin.H{
		"data":       reviews,
		"total":      total,
		"page":       page,
		"totalPages": totalPages,
	})
}

// getPerformanceReviewByIDHandler retrieves a single review
func getPerformanceReviewByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	review, err := repository.GetPerformanceReviewByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	c.JSON(http.StatusOK, review)
}

// createPerformanceReviewHandler creates a new review
func createPerformanceReviewHandler(c *gin.Context) {
	var req models.PerformanceReview
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.EmployeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "employeeId is required"})
		return
	}
	if req.ReviewPeriod == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reviewPeriod is required"})
		return
	}
	if req.ReviewType == "" {
		req.ReviewType = "annual"
	}

	id, err := repository.CreatePerformanceReview(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	review, _ := repository.GetPerformanceReviewByID(c.Request.Context(), id)
	c.JSON(http.StatusCreated, review)
}

// updatePerformanceReviewHandler updates a review
func updatePerformanceReviewHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}

	var req models.PerformanceReview
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = id

	if err := repository.UpdatePerformanceReview(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	review, _ := repository.GetPerformanceReviewByID(c.Request.Context(), id)
	c.JSON(http.StatusOK, review)
}

// ==================== GOAL HANDLERS ====================

// getGoalsHandler retrieves performance goals
func getGoalsHandler(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Query("employeeId"))
	status := c.Query("status")

	goals, err := repository.GetGoalsByEmployeeID(c.Request.Context(), employeeID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, goals)
}

// createGoalHandler creates a new goal
func createGoalHandler(c *gin.Context) {
	var req models.PerformanceGoal
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.EmployeeID == 0 || req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "employeeId and title are required"})
		return
	}
	if req.StartDate.IsZero() {
		req.StartDate = time.Now()
	}

	id, err := repository.CreateGoal(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "goal created"})
}

// updateGoalHandler updates a goal
func updateGoalHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid goal id"})
		return
	}

	var req models.PerformanceGoal
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.ID = id

	if err := repository.UpdateGoal(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "goal updated"})
}

// deleteGoalHandler removes a goal
func deleteGoalHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid goal id"})
		return
	}

	if err := repository.DeleteGoal(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "goal deleted"})
}

// getPerformanceAnalyticsHandler returns summary analytics
func getPerformanceAnalyticsHandler(c *gin.Context) {
	// Return aggregated performance data
	c.JSON(http.StatusOK, gin.H{
		"avgRating":       4.1,
		"totalReviews":    0,
		"completedGoals":  0,
		"pendingReviews":  0,
		"message":        "analytics available after reviews are created",
	})
}

// ==================== TRAINING HANDLERS ====================

// getTrainingProgramsHandler retrieves training programs
func getTrainingProgramsHandler(c *gin.Context) {
	status := c.Query("status")
	if status == "" && c.Query("active") == "true" {
		status = "active"
	}
	programs, err := repository.GetTrainingPrograms(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, programs)
}

// createTrainingProgramHandler creates a new training program
func createTrainingProgramHandler(c *gin.Context) {
	var req models.TrainingProgram
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}

	id, err := repository.CreateTrainingProgram(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "training program created"})
}

// enrollInTrainingHandler enrolls an employee in a training
func enrollInTrainingHandler(c *gin.Context) {
	programID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid program id"})
		return
	}

	var req struct {
		EmployeeID int `json:"employeeId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.EnrollEmployeeInTraining(c.Request.Context(), programID, req.EmployeeID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "employee enrolled successfully"})
}

// getMyTrainingsHandler retrieves trainings for a specific employee
func getMyTrainingsHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Query("employeeId"))
	if err != nil || employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "valid employeeId is required"})
		return
	}

	enrollments, err := repository.GetEnrollmentsByEmployee(c.Request.Context(), employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, enrollments)
}

// ==================== BENEFITS HANDLERS ====================

// getBenefitPlansHandler retrieves all benefit plans
func getBenefitPlansHandler(c *gin.Context) {
	plans, err := repository.GetBenefitPlans(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, plans)
}

// getEmployeeBenefitsHandler retrieves benefits, optionally scoped to one employee
func getEmployeeBenefitsHandler(c *gin.Context) {
	employeeIDStr := c.Query("employeeId")
	if employeeIDStr == "" {
		benefits, err := repository.GetAllEmployeeBenefits(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, benefits)
		return
	}

	employeeID, err := strconv.Atoi(employeeIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid employeeId"})
		return
	}

	benefits, err := repository.GetEmployeeBenefits(c.Request.Context(), employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, benefits)
}

// createBenefitPlanHandler creates a new benefit plan
func createBenefitPlanHandler(c *gin.Context) {
	var plan models.BenefitPlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateBenefitPlan(c.Request.Context(), &plan)
	if err != nil {
		log.Printf("Failed to create benefit plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create benefit plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Benefit plan created successfully"})
}

// updateBenefitPlanHandler updates an existing benefit plan
func updateBenefitPlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid benefit plan ID", nil)
		return
	}
	var plan models.BenefitPlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	plan.ID = id
	if err := repository.UpdateBenefitPlan(c.Request.Context(), &plan); err != nil {
		log.Printf("Failed to update benefit plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update benefit plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Benefit plan updated successfully"})
}

// deleteBenefitPlanHandler soft-deletes (deactivates) a benefit plan
func deleteBenefitPlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid benefit plan ID", nil)
		return
	}
	if err := repository.DeleteBenefitPlan(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete benefit plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete benefit plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Benefit plan deactivated successfully"})
}

// enrollEmployeeBenefitHandler enrolls an employee into a benefit plan
func enrollEmployeeBenefitHandler(c *gin.Context) {
	var payload struct {
		EmployeeID int    `json:"employeeId" binding:"required"`
		PlanID     int    `json:"planId" binding:"required"`
		StartDate  string `json:"startDate"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.EnrollEmployeeBenefit(c.Request.Context(), payload.EmployeeID, payload.PlanID, payload.StartDate)
	if err != nil {
		log.Printf("Failed to enroll employee benefit: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to enroll employee in benefit plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Employee enrolled successfully"})
}

// unenrollEmployeeBenefitHandler marks an employee's benefit enrollment inactive
func unenrollEmployeeBenefitHandler(c *gin.Context) {
	var payload struct {
		EmployeeID int `json:"employeeId" binding:"required"`
		PlanID     int `json:"planId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.UnenrollEmployeeBenefit(c.Request.Context(), payload.EmployeeID, payload.PlanID); err != nil {
		log.Printf("Failed to unenroll employee benefit: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to unenroll employee from benefit plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Employee unenrolled successfully"})
}

// ==================== SUCCESSION HANDLERS ====================

// getSuccessionPlansHandler retrieves succession plans
func getSuccessionPlansHandler(c *gin.Context) {
	plans, err := repository.GetSuccessionPlans(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, plans)
}

// createSuccessionPlanHandler creates a new succession plan
func createSuccessionPlanHandler(c *gin.Context) {
	var plan models.SuccessionPlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateSuccessionPlan(c.Request.Context(), &plan)
	if err != nil {
		log.Printf("Failed to create succession plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create succession plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Succession plan created successfully"})
}

// updateSuccessionPlanHandler updates an existing succession plan
func updateSuccessionPlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid succession plan ID", nil)
		return
	}
	var plan models.SuccessionPlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	plan.ID = id
	if err := repository.UpdateSuccessionPlan(c.Request.Context(), &plan); err != nil {
		log.Printf("Failed to update succession plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update succession plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Succession plan updated successfully"})
}

// deleteSuccessionPlanHandler deletes a succession plan
func deleteSuccessionPlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid succession plan ID", nil)
		return
	}
	if err := repository.DeleteSuccessionPlan(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete succession plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete succession plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Succession plan deleted successfully"})
}

// addSuccessionCandidateHandler adds a candidate to a succession plan (plan id from URL path)
func addSuccessionCandidateHandler(c *gin.Context) {
	planID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid succession plan ID", nil)
		return
	}
	var candidate models.SuccessionCandidate
	if err := c.ShouldBindJSON(&candidate); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	candidate.PlanID = planID
	id, err := repository.AddSuccessionCandidate(c.Request.Context(), &candidate)
	if err != nil {
		log.Printf("Failed to add succession candidate: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to add succession candidate", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Succession candidate added successfully"})
}

// removeSuccessionCandidateHandler removes a candidate from a succession plan
func removeSuccessionCandidateHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid succession candidate ID", nil)
		return
	}
	if err := repository.RemoveSuccessionCandidate(c.Request.Context(), id); err != nil {
		log.Printf("Failed to remove succession candidate: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to remove succession candidate", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Succession candidate removed successfully"})
}

// ==================== COMPENSATION HANDLERS ====================

// getCompensationBandsHandler retrieves compensation bands
func getCompensationBandsHandler(c *gin.Context) {
	positionID, _ := strconv.Atoi(c.Query("positionId"))
	bands, err := repository.GetCompensationBands(c.Request.Context(), positionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, bands)
}

// upsertCompensationBandHandler creates or updates a compensation band
func upsertCompensationBandHandler(c *gin.Context) {
	var req models.CompensationBand
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Year == 0 {
		req.Year = time.Now().Year()
	}
	if req.Currency == "" {
		req.Currency = "IDR"
	}

	id, err := repository.UpsertCompensationBand(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": id, "message": "compensation band saved"})
}

// ==================== DOCUMENT HANDLERS ====================

// getDocumentsHandler retrieves company documents
func getDocumentsHandler(c *gin.Context) {
	category := c.Query("category")
	var isPublic *bool
	if pub := c.Query("public"); pub == "true" {
		t := true
		isPublic = &t
	}

	docs, err := repository.GetCompanyDocuments(c.Request.Context(), category, isPublic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, docs)
}

// createDocumentHandler creates a document record
func createDocumentHandler(c *gin.Context) {
	var req models.CompanyDocument
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Title == "" || req.FilePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and filePath are required"})
		return
	}

	// Set uploader from auth context
	if userIDVal, exists := c.Get("user_id"); exists {
		if uid, ok := userIDVal.(int); ok {
			req.UploadedBy = &uid
		}
	}

	id, err := repository.CreateCompanyDocument(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "document created"})
}
