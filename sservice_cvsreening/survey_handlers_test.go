package main

import (
	"testing"

	"github.com/ryantriananda/sservice_cvsreening/models"
)

func strPtr(s string) *string { return &s }

func ratingQuestion() models.SurveyQuestion {
	return models.SurveyQuestion{
		ID:           1,
		QuestionType: models.SurveyQuestionTypeRating,
		QuestionText: "How satisfied are you?",
		Options:      []byte(`[]`),
		Required:     true,
	}
}

func singleChoiceQuestion() models.SurveyQuestion {
	return models.SurveyQuestion{
		ID:           2,
		QuestionType: models.SurveyQuestionTypeSingleChoice,
		QuestionText: "Work-life balance?",
		Options:      []byte(`[{"value":"poor","label":"Poor"},{"value":"good","label":"Good"}]`),
		Required:     true,
	}
}

func multipleChoiceQuestion() models.SurveyQuestion {
	return models.SurveyQuestion{
		ID:           3,
		QuestionType: models.SurveyQuestionTypeMultipleChoice,
		QuestionText: "Which benefits matter?",
		Options:      []byte(`[{"value":"health","label":"Health"},{"value":"wfh","label":"WFH"}]`),
		Required:     true,
	}
}

func textQuestion() models.SurveyQuestion {
	return models.SurveyQuestion{
		ID:           4,
		QuestionType: models.SurveyQuestionTypeText,
		QuestionText: "Additional feedback?",
		Options:      []byte(`[]`),
		Required:     false,
	}
}

func TestValidateSurveyAnswer_Rating_Valid(t *testing.T) {
	q := ratingQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("5")}
	if err := validateSurveyAnswer(q, a); err != nil {
		t.Errorf("expected valid rating answer, got error: %v", err)
	}
}

func TestValidateSurveyAnswer_Rating_EmptyValue(t *testing.T) {
	q := ratingQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("")}
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error for empty rating value, got nil")
	}
}

func TestValidateSurveyAnswer_Rating_NilValue(t *testing.T) {
	q := ratingQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID}
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error for nil rating value, got nil")
	}
}

func TestValidateSurveyAnswer_SingleChoice_ValidOption(t *testing.T) {
	q := singleChoiceQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("good")}
	if err := validateSurveyAnswer(q, a); err != nil {
		t.Errorf("expected valid single_choice answer, got error: %v", err)
	}
}

func TestValidateSurveyAnswer_SingleChoice_InvalidOption(t *testing.T) {
	q := singleChoiceQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("does_not_exist")}
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error for invalid single_choice option, got nil")
	}
}

func TestValidateSurveyAnswer_MultipleChoice_ValidOptions(t *testing.T) {
	q := multipleChoiceQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Values: []string{"health", "wfh"}}
	if err := validateSurveyAnswer(q, a); err != nil {
		t.Errorf("expected valid multiple_choice answer, got error: %v", err)
	}
}

func TestValidateSurveyAnswer_MultipleChoice_OneInvalidOption(t *testing.T) {
	q := multipleChoiceQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Values: []string{"health", "does_not_exist"}}
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error when one of several options is invalid, got nil")
	}
}

func TestValidateSurveyAnswer_MultipleChoice_Empty(t *testing.T) {
	q := multipleChoiceQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Values: []string{}}
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error for empty multiple_choice selection, got nil")
	}
}

func TestValidateSurveyAnswer_Text_Optional(t *testing.T) {
	q := textQuestion() // required = false
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("")}
	// Note: an empty value for a non-required question is still rejected by validateSurveyAnswer
	// itself (it only validates shape, not required-ness) — required-ness is enforced separately
	// in submitSurveyResponseHandler by simply not requiring an entry for optional questions at all.
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error for empty text value when an answer entry is present, got nil")
	}
}

func TestValidateSurveyAnswer_Text_Valid(t *testing.T) {
	q := textQuestion()
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("Great place to work")}
	if err := validateSurveyAnswer(q, a); err != nil {
		t.Errorf("expected valid text answer, got error: %v", err)
	}
}

func TestValidateSurveyAnswer_UnknownQuestionType(t *testing.T) {
	q := ratingQuestion()
	q.QuestionType = "ranking" // not a recognized type
	a := models.SurveyAnswerInput{QuestionID: q.ID, Value: strPtr("1")}
	if err := validateSurveyAnswer(q, a); err == nil {
		t.Error("expected error for unrecognized question type, got nil")
	}
}

func TestIsValidOption(t *testing.T) {
	options := []byte(`[{"value":"a","label":"A"},{"value":"b","label":"B"}]`)
	if !isValidOption(options, "a") {
		t.Error("expected 'a' to be a valid option")
	}
	if isValidOption(options, "c") {
		t.Error("expected 'c' to be an invalid option")
	}
	if isValidOption([]byte(`not json`), "a") {
		t.Error("expected malformed options JSON to make every value invalid")
	}
}
