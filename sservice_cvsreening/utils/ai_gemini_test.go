package utils

import "testing"

func TestParseSentimentResponse_Valid(t *testing.T) {
	resp, err := parseSentimentResponse(`{"sentiment": "positive", "confidence": 0.85, "summary": "Great work overall."}`)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Sentiment != "positive" || resp.Confidence != 0.85 {
		t.Errorf("unexpected parsed result: %+v", resp)
	}
}

func TestParseSentimentResponse_StripsMarkdownFence(t *testing.T) {
	resp, err := parseSentimentResponse("```json\n{\"sentiment\": \"neutral\", \"confidence\": 0.5, \"summary\": \"Mixed.\"}\n```")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if resp.Sentiment != "neutral" {
		t.Errorf("expected neutral, got %s", resp.Sentiment)
	}
}

func TestParseSentimentResponse_InvalidJSON(t *testing.T) {
	if _, err := parseSentimentResponse("not json at all"); err == nil {
		t.Error("expected error for invalid JSON, got nil")
	}
}

func TestParseSentimentResponse_UnrecognizedSentiment(t *testing.T) {
	_, err := parseSentimentResponse(`{"sentiment": "ecstatic", "confidence": 0.9, "summary": "x"}`)
	if err == nil {
		t.Error("expected error for unrecognized sentiment value, got nil")
	}
}

func TestParseSentimentResponse_ConfidenceOutOfRange(t *testing.T) {
	_, err := parseSentimentResponse(`{"sentiment": "positive", "confidence": 1.5, "summary": "x"}`)
	if err == nil {
		t.Error("expected error for out-of-range confidence, got nil")
	}
}

// Regression test for the P0 fix: AnalyzeSentiment must never fabricate a "Positive" result —
// with no API key configured, it must report SentimentStatusUnavailable and leave
// Sentiment/Confidence/Summary empty, not a canned positive response.
func TestAnalyzeSentiment_NoAPIKey_ReturnsUnavailable_NotFakeData(t *testing.T) {
	svc := &GeminiAIService{APIKey: ""}
	result, err := svc.AnalyzeSentiment(nil, "shipped 3 projects", "tight deadlines", "solid performer") //nolint:staticcheck // nil ctx ok, no API call is made
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result.Status != SentimentStatusUnavailable {
		t.Errorf("expected status %q, got %q", SentimentStatusUnavailable, result.Status)
	}
	if result.Sentiment != "" || result.Summary != "" || result.Confidence != 0 || result.Source != "" {
		t.Errorf("expected no fabricated sentiment/summary/confidence/source when AI is unavailable, got: %+v", result)
	}
}
