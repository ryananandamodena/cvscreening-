package main

import (
	"testing"
)

func TestParseJSONResponse_Valid(t *testing.T) {
	jsonText := `{
		"score": 85,
		"recommendation": "Recommended",
		"confidence": 0.9,
		"matchedSkills": ["Go", "React"],
		"missingSkills": ["Docker"],
		"reasoning": "Good match",
		"biasCorrection": "None"
	}`

	result, err := parseJSONResponse(jsonText)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if result.Score != 85 {
		t.Errorf("Expected score 85, got %d", result.Score)
	}
	if result.Recommendation != "Recommended" {
		t.Errorf("Expected recommendation 'Recommended', got '%s'", result.Recommendation)
	}
}

func TestParseJSONResponse_InvalidJSON(t *testing.T) {
	jsonText := `{ invalid json }`

	_, err := parseJSONResponse(jsonText)
	if err == nil {
		t.Error("Expected error for invalid JSON, got nil")
	}
}

func TestParseJSONResponse_InvalidScore(t *testing.T) {
	jsonText := `{
		"score": 150,
		"recommendation": "Recommended",
		"confidence": 0.9
	}`

	_, err := parseJSONResponse(jsonText)
	if err == nil {
		t.Error("Expected error for invalid score > 100, got nil")
	}
}
