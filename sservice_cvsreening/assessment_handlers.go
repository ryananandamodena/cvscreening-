package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// ASSESSMENT/TEST ONLINE HANDLERS
// =====================================================

// getAssessmentsHandler retrieves all assessments
func getAssessmentsHandler(c *gin.Context) {
	status := c.Query("status")

	assessments, err := repository.GetAssessments(c.Request.Context(), status)
	if err != nil {
		log.Printf("Failed to get assessments: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assessments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": assessments})
}

// createAssessmentHandler creates a new assessment
func createAssessmentHandler(c *gin.Context) {
	var req models.Assessment
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	id, err := repository.CreateAssessment(c.Request.Context(), &req)
	if err != nil {
		log.Printf("Failed to create assessment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assessment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Assessment created successfully"})
}

// getAssessmentByIDHandler retrieves a single assessment
func getAssessmentByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	assessment, err := repository.GetAssessmentByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	c.JSON(http.StatusOK, assessment)
}

// updateAssessmentHandler updates an assessment
func updateAssessmentHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req models.Assessment
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	req.ID = id

	if err := repository.UpdateAssessment(c.Request.Context(), &req); err != nil {
		log.Printf("Failed to update assessment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update assessment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assessment updated successfully"})
}

// deleteAssessmentHandler deletes an assessment
func deleteAssessmentHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := repository.DeleteAssessment(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete assessment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete assessment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Assessment deleted successfully"})
}

// getAssessmentQuestionsHandler retrieves questions for an assessment
func getAssessmentQuestionsHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	questions, err := repository.GetAssessmentQuestions(c.Request.Context(), id)
	if err != nil {
		log.Printf("Failed to get questions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch questions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": questions})
}

// createAssessmentQuestionHandler creates a new question
func createAssessmentQuestionHandler(c *gin.Context) {
	idStr := c.Param("id")
	var assessmentID int
	if _, err := fmt.Sscanf(idStr, "%d", &assessmentID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req models.AssessmentQuestion
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	// Use req to avoid unused variable error until implementation
	_ = req

	req.AssessmentID = assessmentID
	id, err := repository.CreateAssessmentQuestion(c.Request.Context(), &req)
	if err != nil {
		log.Printf("Failed to create question: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "models.Question created successfully"})
}

// updateAssessmentQuestionHandler updates an existing question
func updateAssessmentQuestionHandler(c *gin.Context) {
	idStr := c.Param("id")   // Assessment ID (unused but good for validation context)
	qidStr := c.Param("qid") // Question ID

	// We might not need assessment ID if question ID is global unique PK, which it usually is in Postgres.
	// But let's parse both.
	var id, qid int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Assessment ID"})
		return
	}
	if _, err := fmt.Sscanf(qidStr, "%d", &qid); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Question ID"})
		return
	}

	var req models.AssessmentQuestion
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	req.ID = qid
	req.AssessmentID = id // Ensure consistency

	if err := repository.UpdateAssessmentQuestion(c.Request.Context(), &req); err != nil {
		log.Printf("Failed to update question: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question updated successfully"})
}

// deleteAssessmentQuestionHandler deletes a question
func deleteAssessmentQuestionHandler(c *gin.Context) {
	qidStr := c.Param("qid")
	var qid int
	if _, err := fmt.Sscanf(qidStr, "%d", &qid); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Question ID"})
		return
	}

	if err := repository.DeleteAssessmentQuestion(c.Request.Context(), qid); err != nil {
		log.Printf("Failed to delete question: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question deleted successfully"})
}

// getAssessmentTemplatesHandler retrieves pre-built assessment templates
func getAssessmentTemplatesHandler(c *gin.Context) {
	// Return mock templates for now
	templates := []gin.H{
		{
			"id":                1,
			"name":              "Big Five Personality Test",
			"description":       "Measure personality traits: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism",
			"assessmentType":    "psychotest",
			"estimatedDuration": 15,
			"difficulty":        "medium",
		},
		{
			"id":                2,
			"name":              "JavaScript Coding Challenge",
			"description":       "Test JavaScript proficiency with coding problems",
			"assessmentType":    "coding",
			"estimatedDuration": 45,
			"difficulty":        "hard",
		},
		{
			"id":                3,
			"name":              "English Proficiency Test",
			"description":       "Assess English language skills: Grammar, Vocabulary, Reading Comprehension",
			"assessmentType":    "language",
			"estimatedDuration": 30,
			"difficulty":        "medium",
		},
		{
			"id":                4,
			"name":              "Logical Reasoning Test",
			"description":       "Evaluate logical thinking and problem-solving abilities",
			"assessmentType":    "psychotest",
			"estimatedDuration": 20,
			"difficulty":        "medium",
		},
		{
			"id":                5,
			"name":              "Python Technical Assessment",
			"description":       "Comprehensive Python programming test",
			"assessmentType":    "coding",
			"estimatedDuration": 60,
			"difficulty":        "hard",
		},
	}

	c.JSON(http.StatusOK, gin.H{"data": templates})
}

// =====================================================
// ASSESSMENT ATTEMPT/ANSWER HANDLERS
// =====================================================

func startAssessmentAttemptHandler(c *gin.Context) {
	idStr := c.Param("id")
	var assessmentID int
	if _, err := fmt.Sscanf(idStr, "%d", &assessmentID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment ID"})
		return
	}

	var payload struct {
		CandidateID   int `json:"candidateId" binding:"required"`
		JobID         int `json:"jobId"`
		ApplicationID int `json:"applicationId"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attempt := &models.AssessmentAttempt{
		AssessmentID:  assessmentID,
		CandidateID:   payload.CandidateID,
		JobID:         payload.JobID,
		ApplicationID: payload.ApplicationID,
		IPAddress:     c.ClientIP(),
		UserAgent:     c.GetHeader("User-Agent"),
	}

	attemptID, err := repository.CreateAssessmentAttempt(c.Request.Context(), attempt)
	if err != nil {
		log.Printf("Failed to create assessment attempt: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start assessment"})
		return
	}

	// Start the attempt
	if err := repository.StartAssessmentAttempt(c.Request.Context(), attemptID); err != nil {
		log.Printf("Failed to start assessment attempt: %v", err)
	}

	// Get questions for the assessment
	questions, err := repository.GetAssessmentQuestions(c.Request.Context(), assessmentID)
	if err != nil {
		log.Printf("Failed to fetch assessment questions: %v", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"attemptId": attemptID,
		"questions": questions,
		"message":   "Assessment started",
	})
}

func getAssessmentAttemptHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attempt ID"})
		return
	}

	attempt, err := repository.GetAssessmentAttemptByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment attempt not found"})
		return
	}

	c.JSON(http.StatusOK, attempt)
}

func submitAssessmentAttemptHandler(c *gin.Context) {
	idStr := c.Param("id")
	var attemptID int
	if _, err := fmt.Sscanf(idStr, "%d", &attemptID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attempt ID"})
		return
	}

	// Get all answers for this attempt to calculate score
	answers, err := repository.GetAssessmentAnswers(c.Request.Context(), attemptID)
	if err != nil {
		log.Printf("Failed to get answers for scoring: %v", err)
	}

	// Calculate total score
	var totalScore float64
	for _, a := range answers {
		totalScore += float64(a.PointsEarned)
	}

	// Determine pass/fail (default threshold 70%)
	passed := totalScore >= 70.0

	if err := repository.SubmitAssessmentAttempt(c.Request.Context(), attemptID, totalScore, passed); err != nil {
		log.Printf("Failed to submit assessment attempt: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit assessment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Assessment submitted successfully",
		"totalScore": totalScore,
		"passed":     passed,
	})
}

func saveAssessmentAnswerHandler(c *gin.Context) {
	idStr := c.Param("id")
	var attemptID int
	if _, err := fmt.Sscanf(idStr, "%d", &attemptID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attempt ID"})
		return
	}

	var answer models.AssessmentAnswer
	if err := c.ShouldBindJSON(&answer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	answer.AttemptID = attemptID

	if err := repository.SaveAssessmentAnswer(c.Request.Context(), &answer); err != nil {
		log.Printf("Failed to save answer: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save answer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Answer saved"})
}

func getAssessmentAnswersHandler(c *gin.Context) {
	idStr := c.Param("id")
	var attemptID int
	if _, err := fmt.Sscanf(idStr, "%d", &attemptID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attempt ID"})
		return
	}

	answers, err := repository.GetAssessmentAnswers(c.Request.Context(), attemptID)
	if err != nil {
		log.Printf("Failed to get assessment answers: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get answers"})
		return
	}
	if answers == nil {
		answers = []models.AssessmentAnswer{}
	}

	c.JSON(http.StatusOK, gin.H{"data": answers})
}

func getCandidateAttemptsHandler(c *gin.Context) {
	idStr := c.Param("id")
	var candidateID int
	if _, err := fmt.Sscanf(idStr, "%d", &candidateID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid candidate ID"})
		return
	}

	attempts, err := repository.GetCandidateAttempts(c.Request.Context(), candidateID)
	if err != nil {
		log.Printf("Failed to get candidate attempts: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get attempts"})
		return
	}
	if attempts == nil {
		attempts = []models.AssessmentAttempt{}
	}

	c.JSON(http.StatusOK, gin.H{"data": attempts})
}

func getAssessmentAttemptResultHandler(c *gin.Context) {
	idStr := c.Param("id")
	var attemptID int
	if _, err := fmt.Sscanf(idStr, "%d", &attemptID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attempt ID"})
		return
	}

	result, err := repository.GetAssessmentAttemptResult(c.Request.Context(), attemptID)
	if err != nil {
		log.Printf("Failed to get assessment result: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get result"})
		return
	}
	if result == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment attempt not found"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// assignAssessmentHandler assigns a candidate to an assessment
func assignAssessmentHandler(c *gin.Context) {
	assessmentIDStr := c.Param("id")
	var assessmentID int
	if _, err := fmt.Sscanf(assessmentIDStr, "%d", &assessmentID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Assessment ID"})
		return
	}

	var payload struct {
		CandidateID int `json:"candidateId" binding:"required"`
		JobID       int `json:"jobId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify assessment exists
	assessment, err := repository.GetAssessmentByID(c.Request.Context(), assessmentID)
	if err != nil || assessment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	// Verify candidate exists
	candidate, err := repository.GetCandidateByID(c.Request.Context(), payload.CandidateID)
	if err != nil || candidate == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Candidate not found"})
		return
	}

	// Create Attempt
	attempt := &models.AssessmentAttempt{
		AssessmentID: assessmentID,
		CandidateID:  payload.CandidateID,
		JobID:        payload.JobID,
		Status:       "invited",
		CreatedAt:    time.Now(),
	}

	attemptID, err := repository.CreateAssessmentAttempt(c.Request.Context(), attempt)
	if err != nil {
		log.Printf("Failed to create assessment attempt: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign assessment"})
		return
	}

	// Send Email Invitation
	assessmentLink := fmt.Sprintf("/assessments/%d/start?attempt=%d", assessmentID, attemptID)
	go func() {
		emailService.SendAssessmentInvite(candidate.Email, candidate.FullName, assessment.Title, assessmentLink)
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":   "Assessment assigned successfully",
		"attemptId": attemptID,
	})
}
