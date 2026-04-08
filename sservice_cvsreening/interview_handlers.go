package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func createInterviewHandler(c *gin.Context) {
	var i models.Interview
	if err := c.ShouldBindJSON(&i); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := repository.CreateInterview(c.Request.Context(), &i)
	if err != nil {
		log.Printf("Failed to schedule interview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to schedule interview"})
		return
	}

	// Send Interview Invite Email
	go func() {
		candidate, err := repository.GetCandidateByID(context.Background(), i.CandidateID)
		if err == nil && candidate != nil && candidate.Email != "" {
			emailService.SendInterviewInvite(candidate.Email, candidate.FullName, i.ScheduledAt.Format("Monday, 02 Jan 2006 at 15:04"), "https://meet.google.com/abc-defg-hij")
		} else {
			log.Printf("Warning: Could not send interview invite. Candidate not found or no email. ID: %d", i.CandidateID)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "models.Interview scheduled successfully"})
}

func getInterviewsHandler(c *gin.Context) {
	interviews, err := repository.GetInterviews(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch interviews"})
		return
	}
	if interviews == nil {
		c.JSON(http.StatusOK, []models.Interview{})
		return
	}
	c.JSON(http.StatusOK, interviews)
}

func updateInterviewFeedbackHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		Rating int    `json:"rating"`
		Notes  string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid feedback data"})
		return
	}

	if err := repository.UpdateInterviewFeedback(c.Request.Context(), id, payload.Rating, payload.Notes); err != nil {
		log.Printf("Failed to update interview feedback: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update feedback"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Feedback submitted successfully"})
}

func finalizeInterviewHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Parse multipart form (50MB max)
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	transcript := c.Request.FormValue("transcript")

	// Handle Recording File
	file, header, err := c.Request.FormFile("recording")
	var recordingPath string

	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/recordings"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			log.Printf("Failed to create upload directory: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording"})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("interview_%d_%d%s", id, time.Now().Unix(), getExtension(header.Filename))
		filepath := fmt.Sprintf("%s/%s", uploadDir, filename)

		// Save file
		out, err := os.Create(filepath)
		if err != nil {
			log.Printf("Failed to create file: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording file"})
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			log.Printf("Failed to save file content: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording content"})
			return
		}

		recordingPath = filepath
	} else if err != http.ErrMissingFile {
		log.Printf("Error retrieving recording file: %v", err)
	}

	if err := repository.FinalizeInterview(c.Request.Context(), id, transcript, recordingPath); err != nil {
		log.Printf("Failed to finalize interview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update interview record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "models.Interview finalized successfully", "recordingPath": recordingPath})
}

// cancelInterviewHandler cancels an interview
func cancelInterviewHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	if err := repository.CancelInterview(c.Request.Context(), id, req.Reason); err != nil {
		log.Printf("Failed to cancel interview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel interview"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "models.Interview cancelled successfully"})
}

// submitInterviewHandler is the public version of finalizeInterviewHandler for the candidate portal
func submitInterviewHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}

	// Parse multipart form (50MB max)
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	transcript := c.Request.FormValue("transcript")

	// Handle Recording File
	file, header, err := c.Request.FormFile("recording")
	var recordingPath string

	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/recordings"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			log.Printf("Failed to create upload directory: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording"})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("interview_%d_%d%s", id, time.Now().Unix(), getExtension(header.Filename))
		filepath := fmt.Sprintf("%s/%s", uploadDir, filename)

		// Save file
		out, err := os.Create(filepath)
		if err != nil {
			log.Printf("Failed to create file: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording file"})
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			log.Printf("Failed to save file content: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording content"})
			return
		}

		recordingPath = filepath
	} else if err != http.ErrMissingFile {
		log.Printf("Error retrieving recording file: %v", err)
	}

	if err := repository.FinalizeInterview(c.Request.Context(), id, transcript, recordingPath); err != nil {
		log.Printf("Failed to finalize interview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update interview record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "models.Interview submitted successfully"})
}

func getInterviewByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}

	interview, err := repository.GetInterviewByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("Failed to get interview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch interview details"})
		return
	}

	if interview == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "models.Interview not found"})
		return
	}

	c.JSON(http.StatusOK, interview)
}

// =====================================================
// INTERVIEW QUESTION RESPONSE HANDLERS (Save per models.Question Flow)
// =====================================================

// getInterviewResponsesHandler retrieves all question responses for an interview
func getInterviewResponsesHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}

	responses, err := repository.GetQuestionResponses(c.Request.Context(), id)
	if err != nil {
		log.Printf("Failed to get interview responses: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch responses"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": responses})
}

// saveQuestionResponseHandler saves a single question response
func saveQuestionResponseHandler(c *gin.Context) {
	idStr := c.Param("id")
	var interviewID int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}

	// Parse multipart form (50MB max for video)
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	// Parse form values
	questionOrderStr := c.Request.FormValue("questionOrder")
	var questionOrder int
	if _, err := fmt.Sscanf(questionOrderStr, "%d", &questionOrder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question order"})
		return
	}

	questionIDStr := c.Request.FormValue("questionId")
	var questionID *int
	if questionIDStr != "" {
		var qid int
		if _, err := fmt.Sscanf(questionIDStr, "%d", &qid); err == nil {
			questionID = &qid
		}
	}

	questionText := c.Request.FormValue("questionText")
	answerText := c.Request.FormValue("answerText")
	sentimentScoreStr := c.Request.FormValue("sentimentScore")

	var sentimentScore float64
	if sentimentScoreStr != "" {
		fmt.Sscanf(sentimentScoreStr, "%f", &sentimentScore)
	}

	aiAnalysisStr := c.Request.FormValue("aiAnalysis")
	var aiAnalysis []byte
	if aiAnalysisStr != "" {
		aiAnalysis = []byte(aiAnalysisStr)
	}

	// Handle Recording File
	file, header, err := c.Request.FormFile("recording")
	var recordingPath string
	var recordingDuration int

	if err == nil {
		defer file.Close()

		// Create uploads directory if it doesn't exist
		uploadDir := "uploads/responses"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			log.Printf("Failed to create upload directory: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording"})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("response_%d_q%d_%d%s", interviewID, questionOrder, time.Now().Unix(), getExtension(header.Filename))
		filepath := fmt.Sprintf("%s/%s", uploadDir, filename)

		// Save file
		out, err := os.Create(filepath)
		if err != nil {
			log.Printf("Failed to create file: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording file"})
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			log.Printf("Failed to save file content: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recording content"})
			return
		}

		recordingPath = filepath
	} else if err != http.ErrMissingFile {
		log.Printf("Error retrieving recording file: %v", err)
	}

	// Parse recording duration
	durationStr := c.Request.FormValue("recordingDuration")
	if durationStr != "" {
		fmt.Sscanf(durationStr, "%d", &recordingDuration)
	}

	// Create response object
	response := &models.InterviewQuestionResponse{
		InterviewID:              interviewID,
		QuestionID:               questionID,
		QuestionText:             questionText,
		QuestionOrder:            questionOrder,
		AnswerText:               answerText,
		RecordingPath:            recordingPath,
		RecordingDurationSeconds: recordingDuration,
		SentimentScore:           sentimentScore,
		AIAnalysis:               aiAnalysis,
	}

	// Save to database
	responseID, err := repository.SaveQuestionResponse(c.Request.Context(), response)
	if err != nil {
		log.Printf("Failed to save question response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Response saved successfully",
		"id":            responseID,
		"recordingPath": recordingPath,
	})
}

// getQuestionResponseHandler retrieves a specific question response
func getQuestionResponseHandler(c *gin.Context) {
	idStr := c.Param("id")
	orderStr := c.Param("order")

	var interviewID, questionOrder int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}
	if _, err := fmt.Sscanf(orderStr, "%d", &questionOrder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Question Order"})
		return
	}

	response, err := repository.GetQuestionResponseByOrder(c.Request.Context(), interviewID, questionOrder)
	if err != nil {
		log.Printf("Failed to get question response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch response"})
		return
	}

	if response == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Response not found"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// deleteQuestionResponseHandler deletes a question response (for retake)
func deleteQuestionResponseHandler(c *gin.Context) {
	idStr := c.Param("id")
	orderStr := c.Param("order")

	var interviewID, questionOrder int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}
	if _, err := fmt.Sscanf(orderStr, "%d", &questionOrder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Question Order"})
		return
	}

	if err := repository.DeleteQuestionResponse(c.Request.Context(), interviewID, questionOrder); err != nil {
		log.Printf("Failed to delete question response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Response deleted successfully"})
}

// getInterviewProgressHandler returns the current progress of an interview
func getInterviewProgressHandler(c *gin.Context) {
	idStr := c.Param("id")
	var interviewID int
	if _, err := fmt.Sscanf(idStr, "%d", &interviewID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid models.Interview ID"})
		return
	}

	answered, total, err := repository.GetInterviewProgress(c.Request.Context(), interviewID)
	if err != nil {
		log.Printf("Failed to get interview progress: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"answered": answered,
		"total":    total,
		"progress": float64(answered) / float64(max(total, 1)) * 100,
	})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
