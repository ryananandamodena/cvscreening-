package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== SURVEYS (list / detail) ====================

// getSurveysHandler lists surveys. Any authenticated user may call this; an optional
// ?status= filter lets the mobile app ask for only "active" surveys (no employee record is
// required just to list — HasResponded simply reports false for callers with none).
func getSurveysHandler(c *gin.Context) {
	employeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	status := c.Query("status")

	surveys, err := repository.GetSurveys(c.Request.Context(), employeeID, status)
	if err != nil {
		log.Printf("ERROR in getSurveysHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat daftar survey", err.Error())
		return
	}
	c.JSON(http.StatusOK, surveys)
}

func getSurveyByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid survey id", nil)
		return
	}

	survey, err := repository.GetSurveyByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in getSurveyByIDHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat survey", err.Error())
		return
	}
	if survey == nil {
		RespondWithError(c, http.StatusNotFound, "survey_not_found", "Survey tidak ditemukan", nil)
		return
	}
	c.JSON(http.StatusOK, survey)
}

func getSurveyQuestionsHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid survey id", nil)
		return
	}

	survey, err := repository.GetSurveyByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in getSurveyQuestionsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat survey", err.Error())
		return
	}
	if survey == nil {
		RespondWithError(c, http.StatusNotFound, "survey_not_found", "Survey tidak ditemukan", nil)
		return
	}

	questions, err := repository.GetSurveyQuestions(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in getSurveyQuestionsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat pertanyaan survey", err.Error())
		return
	}
	c.JSON(http.StatusOK, questions)
}

// ==================== SURVEYS (admin management) ====================

type createSurveyRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	StartDate   *time.Time `json:"startDate"`
	EndDate     *time.Time `json:"endDate"`
}

func createSurveyHandler(c *gin.Context) {
	var req createSurveyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		RespondWithError(c, http.StatusBadRequest, "title_required", "Judul survey wajib diisi", nil)
		return
	}
	if req.Status != "" && req.Status != models.SurveyStatusDraft && req.Status != models.SurveyStatusActive && req.Status != models.SurveyStatusClosed {
		RespondWithError(c, http.StatusBadRequest, "invalid_status", "Status survey tidak valid", nil)
		return
	}

	createdBy := GetUserIDFromContext(c)
	survey := &models.Survey{
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		CreatedBy:   &createdBy,
	}

	id, err := repository.CreateSurvey(c.Request.Context(), survey)
	if err != nil {
		log.Printf("ERROR in createSurveyHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat survey", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Survey created"})
}

type createSurveyQuestionRequest struct {
	QuestionText string                        `json:"questionText"`
	QuestionType string                        `json:"questionType"`
	Options      []models.SurveyQuestionOption `json:"options"`
	Required     *bool                         `json:"required"`
	OrderIndex   int                           `json:"orderIndex"`
}

var validSurveyQuestionTypes = map[string]bool{
	models.SurveyQuestionTypeRating:         true,
	models.SurveyQuestionTypeSingleChoice:   true,
	models.SurveyQuestionTypeMultipleChoice: true,
	models.SurveyQuestionTypeText:           true,
}

func createSurveyQuestionHandler(c *gin.Context) {
	surveyID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid survey id", nil)
		return
	}

	survey, err := repository.GetSurveyByID(c.Request.Context(), surveyID)
	if err != nil {
		log.Printf("ERROR in createSurveyQuestionHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat survey", err.Error())
		return
	}
	if survey == nil {
		RespondWithError(c, http.StatusNotFound, "survey_not_found", "Survey tidak ditemukan", nil)
		return
	}

	var req createSurveyQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if strings.TrimSpace(req.QuestionText) == "" {
		RespondWithError(c, http.StatusBadRequest, "question_text_required", "Teks pertanyaan wajib diisi", nil)
		return
	}
	if !validSurveyQuestionTypes[req.QuestionType] {
		RespondWithError(c, http.StatusBadRequest, "invalid_question_type", "Tipe pertanyaan tidak valid", nil)
		return
	}
	if (req.QuestionType == models.SurveyQuestionTypeSingleChoice || req.QuestionType == models.SurveyQuestionTypeMultipleChoice) && len(req.Options) == 0 {
		RespondWithError(c, http.StatusBadRequest, "options_required", "Pertanyaan choice wajib memiliki opsi", nil)
		return
	}

	optionsJSON, err := json.Marshal(req.Options)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid options", err.Error())
		return
	}

	required := true
	if req.Required != nil {
		required = *req.Required
	}

	question := &models.SurveyQuestion{
		SurveyID:     surveyID,
		QuestionText: req.QuestionText,
		QuestionType: req.QuestionType,
		Options:      optionsJSON,
		Required:     required,
		OrderIndex:   req.OrderIndex,
	}

	id, err := repository.CreateSurveyQuestion(c.Request.Context(), question)
	if err != nil {
		log.Printf("ERROR in createSurveyQuestionHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal membuat pertanyaan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Question created"})
}

// ==================== SURVEY RESPONSES ====================

// submitSurveyResponseHandler re-validates everything the mobile client already checked —
// the client's validation is only a UX convenience, never the source of truth.
func submitSurveyResponseHandler(c *gin.Context) {
	surveyID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid survey id", nil)
		return
	}

	survey, err := repository.GetSurveyByID(c.Request.Context(), surveyID)
	if err != nil {
		log.Printf("ERROR in submitSurveyResponseHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat survey", err.Error())
		return
	}
	if survey == nil {
		RespondWithError(c, http.StatusNotFound, "survey_not_found", "Survey tidak ditemukan", nil)
		return
	}
	if survey.Status != models.SurveyStatusActive {
		RespondWithError(c, http.StatusBadRequest, "survey_inactive", "Survey ini sedang tidak menerima jawaban", nil)
		return
	}
	now := time.Now()
	if survey.StartDate != nil && now.Before(*survey.StartDate) {
		RespondWithError(c, http.StatusBadRequest, "survey_not_started", "Survey belum dibuka", nil)
		return
	}
	if survey.EndDate != nil && now.After(survey.EndDate.Add(24*time.Hour)) {
		RespondWithError(c, http.StatusBadRequest, "survey_expired", "Survey ini sudah ditutup", nil)
		return
	}

	employeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if employeeID == 0 {
		RespondWithError(c, http.StatusNotFound, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	alreadyResponded, err := repository.HasEmployeeResponded(c.Request.Context(), surveyID, employeeID)
	if err != nil {
		log.Printf("ERROR in submitSurveyResponseHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memeriksa status survey", err.Error())
		return
	}
	if alreadyResponded {
		RespondWithError(c, http.StatusConflict, "duplicate_submission", "Anda sudah mengisi survey ini", nil)
		return
	}

	var req models.SubmitSurveyResponseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	questions, err := repository.GetSurveyQuestions(c.Request.Context(), surveyID)
	if err != nil {
		log.Printf("ERROR in submitSurveyResponseHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat pertanyaan survey", err.Error())
		return
	}
	if len(questions) == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_questions", "Survey ini belum memiliki pertanyaan", nil)
		return
	}

	questionByID := make(map[int]models.SurveyQuestion, len(questions))
	for _, q := range questions {
		questionByID[q.ID] = q
	}

	answerByQuestionID := make(map[int]models.SurveyAnswerInput, len(req.Answers))
	for _, a := range req.Answers {
		q, ok := questionByID[a.QuestionID]
		if !ok {
			RespondWithError(c, http.StatusBadRequest, "question_not_found",
				"Salah satu jawaban merujuk ke pertanyaan yang tidak ada pada survey ini", nil)
			return
		}
		if err := validateSurveyAnswer(q, a); err != nil {
			RespondWithError(c, http.StatusBadRequest, "invalid_answer", err.Error(), nil)
			return
		}
		answerByQuestionID[a.QuestionID] = a
	}

	for _, q := range questions {
		if !q.Required {
			continue
		}
		if _, answered := answerByQuestionID[q.ID]; !answered {
			RespondWithError(c, http.StatusBadRequest, "required_question_unanswered",
				"Pertanyaan wajib belum dijawab: "+q.QuestionText, nil)
			return
		}
	}

	responseID, err := repository.SubmitSurveyResponse(c.Request.Context(), surveyID, employeeID, req.Answers)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			// Race: two concurrent submits both passed the pre-check above. The DB's UNIQUE
			// constraint is the real guard; this is just translating it to the same error shape.
			RespondWithError(c, http.StatusConflict, "duplicate_submission", "Anda sudah mengisi survey ini", nil)
			return
		}
		log.Printf("ERROR in submitSurveyResponseHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal menyimpan jawaban survey", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": responseID, "message": "Survey submitted successfully"})
}

// validateSurveyAnswer re-checks a single answer against its question definition: right shape
// for the question type, and (for choice questions) options that actually exist on the question.
func validateSurveyAnswer(q models.SurveyQuestion, a models.SurveyAnswerInput) error {
	switch q.QuestionType {
	case models.SurveyQuestionTypeRating, models.SurveyQuestionTypeText:
		if a.Value == nil || strings.TrimSpace(*a.Value) == "" {
			return errAnswerRequired(q)
		}
	case models.SurveyQuestionTypeSingleChoice:
		if a.Value == nil || strings.TrimSpace(*a.Value) == "" {
			return errAnswerRequired(q)
		}
		if !isValidOption(q.Options, *a.Value) {
			return errInvalidOption(q)
		}
	case models.SurveyQuestionTypeMultipleChoice:
		if len(a.Values) == 0 {
			return errAnswerRequired(q)
		}
		for _, v := range a.Values {
			if !isValidOption(q.Options, v) {
				return errInvalidOption(q)
			}
		}
	default:
		return errInvalidQuestionType(q)
	}
	return nil
}

func isValidOption(optionsJSON []byte, value string) bool {
	var options []models.SurveyQuestionOption
	if err := json.Unmarshal(optionsJSON, &options); err != nil {
		return false
	}
	for _, o := range options {
		if o.Value == value {
			return true
		}
	}
	return false
}

type surveyValidationError struct{ msg string }

func (e surveyValidationError) Error() string { return e.msg }

func errAnswerRequired(q models.SurveyQuestion) error {
	return surveyValidationError{"Jawaban tidak valid untuk pertanyaan: " + q.QuestionText}
}
func errInvalidOption(q models.SurveyQuestion) error {
	return surveyValidationError{"Opsi jawaban tidak valid untuk pertanyaan: " + q.QuestionText}
}
func errInvalidQuestionType(q models.SurveyQuestion) error {
	return surveyValidationError{"Tipe pertanyaan tidak dikenali untuk pertanyaan: " + q.QuestionText}
}

// getMySurveyResponseHandler lets an employee check whether they've already submitted a
// response — used by mobile to render the "already submitted" state when a survey is reopened.
func getMySurveyResponseHandler(c *gin.Context) {
	surveyID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid survey id", nil)
		return
	}

	survey, err := repository.GetSurveyByID(c.Request.Context(), surveyID)
	if err != nil {
		log.Printf("ERROR in getMySurveyResponseHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat survey", err.Error())
		return
	}
	if survey == nil {
		RespondWithError(c, http.StatusNotFound, "survey_not_found", "Survey tidak ditemukan", nil)
		return
	}

	employeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if employeeID == 0 {
		RespondWithError(c, http.StatusNotFound, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}

	response, err := repository.GetSurveyResponseByEmployee(c.Request.Context(), surveyID, employeeID)
	if err != nil {
		log.Printf("ERROR in getMySurveyResponseHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal memuat jawaban survey", err.Error())
		return
	}
	if response == nil {
		RespondWithError(c, http.StatusNotFound, "not_submitted", "Anda belum mengisi survey ini", nil)
		return
	}
	c.JSON(http.StatusOK, response)
}
