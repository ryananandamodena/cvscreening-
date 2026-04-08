package main

import (
	"testing"
)

func TestExtractCandidateName(t *testing.T) {
	tests := []struct {
		name     string
		cvText   string
		email    string
		expected string
	}{
		{
			name:     "Name at top",
			cvText:   "John Doe\nSoftware Engineer\nEmail: john@example.com",
			email:    "john@example.com",
			expected: "John Doe",
		},
		{
			name:     "Name from email",
			cvText:   "Curriculum Vitae\nExperience...",
			email:    "jane.doe@example.com",
			expected: "Jane Doe",
		},
		{
			name:     "Skip generic headers",
			cvText:   "Curriculum Vitae\nResume\nAlice Smith\nDeveloper",
			email:    "",
			expected: "Alice Smith",
		},
		{
			name:     "Unknown fallback",
			cvText:   "This line has too many words to be a name",
			email:    "",
			expected: "Unknown Candidate",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractCandidateName(tt.cvText, tt.email)
			if result != tt.expected {
				t.Fatalf("FAILED %s: expected '%s', got '%s'", tt.name, tt.expected, result)
			}
		})
	}
}
