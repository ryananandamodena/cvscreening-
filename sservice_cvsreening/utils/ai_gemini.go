package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"google.golang.org/genai"
)

// GeminiAIService represents the Gemini AI client service
type GeminiAIService struct {
	APIKey string
}

func NewGeminiAIService() *GeminiAIService {
	return &GeminiAIService{
		APIKey: os.Getenv("GEMINI_API_KEY"),
	}
}

// Sentiment analysis statuses. "success" means Gemini actually ran and produced a parseable
// result — callers must only persist/display sentiment/summary when Status == SentimentStatusSuccess.
// The other two statuses carry no fabricated sentiment/summary at all (both are left empty) so a
// caller can never mistake "AI didn't run" for a real "positive" result.
const (
	SentimentStatusSuccess     = "success"
	SentimentStatusUnavailable = "unavailable" // no API key configured — AI was never invoked
	SentimentStatusFailed      = "failed"      // API key present, but the call/parse failed
)

// SentimentResult is the structured outcome of AnalyzeSentiment. Sentiment/Confidence/Summary
// are only meaningful when Status == SentimentStatusSuccess; every other status leaves them at
// their zero value on purpose.
type SentimentResult struct {
	Sentiment  string  `json:"sentiment,omitempty"`
	Confidence float64 `json:"confidence,omitempty"`
	Summary    string  `json:"summary,omitempty"`
	Source     string  `json:"source,omitempty"`
	Status     string  `json:"status"`
}

type geminiSentimentResponse struct {
	Sentiment  string  `json:"sentiment"`
	Confidence float64 `json:"confidence"`
	Summary    string  `json:"summary"`
}

// AnalyzeSentiment uses Gemini AI to analyze performance review comments and achievements.
// It never fabricates a result: if no API key is configured, or the Gemini call/parse fails,
// it returns a result with no sentiment/summary and an explicit non-success Status instead.
func (s *GeminiAIService) AnalyzeSentiment(ctx context.Context, achievements, challenges, managerComments string) (SentimentResult, error) {
	if s.APIKey == "" {
		return SentimentResult{Status: SentimentStatusUnavailable}, nil
	}

	callCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	client, err := genai.NewClient(callCtx, &genai.ClientConfig{
		APIKey:  s.APIKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		// Never log s.APIKey itself — only that client construction failed.
		log.Printf("AnalyzeSentiment: failed to create genai client: %v", err)
		return SentimentResult{Status: SentimentStatusFailed}, nil
	}

	prompt := fmt.Sprintf(`Analyze the sentiment of this employee performance review. Respond with ONLY a valid JSON object, no markdown, no extra text, in exactly this shape:
{"sentiment": "positive" | "neutral" | "negative", "confidence": <number 0.0-1.0>, "summary": "<2-3 sentence summary in English>"}

Achievements: %s
Challenges: %s
Manager comments: %s`, achievements, challenges, managerComments)

	systemInstruction := "You are an HR performance-review sentiment analyzer. Always respond with a single valid JSON object matching the requested schema, and nothing else."

	result, err := client.Models.GenerateContent(callCtx, "gemini-3.6-flash",
		[]*genai.Content{{Role: "user", Parts: []*genai.Part{genai.NewPartFromText(prompt)}}},
		&genai.GenerateContentConfig{
			SystemInstruction: &genai.Content{Parts: []*genai.Part{genai.NewPartFromText(systemInstruction)}},
		},
	)
	if err != nil {
		// Covers timeout, invalid key, quota exceeded, rate limit, network errors — all
		// surfaced by the SDK as a plain error here. Log the error, not any request content.
		log.Printf("AnalyzeSentiment: Gemini API call failed: %v", err)
		return SentimentResult{Status: SentimentStatusFailed}, nil
	}

	var responseText string
	if len(result.Candidates) > 0 && result.Candidates[0].Content != nil {
		for _, p := range result.Candidates[0].Content.Parts {
			if p.Text != "" {
				responseText = p.Text
				break
			}
		}
	}
	if responseText == "" {
		log.Printf("AnalyzeSentiment: Gemini returned no content")
		return SentimentResult{Status: SentimentStatusFailed}, nil
	}

	parsed, err := parseSentimentResponse(responseText)
	if err != nil {
		log.Printf("AnalyzeSentiment: failed to parse Gemini response: %v", err)
		return SentimentResult{Status: SentimentStatusFailed}, nil
	}

	return SentimentResult{
		Sentiment:  parsed.Sentiment,
		Confidence: parsed.Confidence,
		Summary:    parsed.Summary,
		Source:     "gemini",
		Status:     SentimentStatusSuccess,
	}, nil
}

// parseSentimentResponse strips common markdown code-fence wrapping (models frequently ignore
// "no markdown" instructions) and validates the shape before trusting it.
func parseSentimentResponse(text string) (*geminiSentimentResponse, error) {
	cleaned := strings.TrimSpace(text)
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	cleaned = strings.TrimSpace(cleaned)

	var resp geminiSentimentResponse
	if err := json.Unmarshal([]byte(cleaned), &resp); err != nil {
		return nil, fmt.Errorf("invalid JSON: %w", err)
	}

	switch resp.Sentiment {
	case "positive", "neutral", "negative":
	default:
		return nil, fmt.Errorf("unrecognized sentiment value: %q", resp.Sentiment)
	}
	if resp.Confidence < 0.0 || resp.Confidence > 1.0 {
		return nil, fmt.Errorf("confidence out of range: %v", resp.Confidence)
	}
	return &resp, nil
}

// ChatbotResponse handles interactive HR Chatbot requests. `employeeContext` is a plain-text
// snapshot of the calling employee's own real data (leave balance, today's attendance/shift —
// see buildChatbotEmployeeContext in ai_handlers.go), letting the bot answer self-service
// questions ("sisa cuti saya berapa?") directly instead of deflecting to "check the portal
// yourself". Pass "" when the caller has no linked employee record (falls back to the previous
// generic manager/HRD-facing behavior).
func (s *GeminiAIService) ChatbotResponse(ctx context.Context, message string, employeeContext string) (string, error) {
	if s.APIKey == "" {
		return "Ini adalah respons simulasi dari AI HR Assistant. Anda bertanya: " + message, nil
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  s.APIKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create genai client: %w", err)
	}

	systemInstruction := `Anda adalah 'Terai AI Assistant', asisten cerdas khusus untuk sistem HRIS (Human Resource Information System).
Tugas Anda adalah membantu karyawan, manajer, atau HRD menjawab pertanyaan seputar SDM — termasuk pertanyaan self-service pribadi seperti sisa cuti, status absensi, atau jadwal shift.
Jawablah dengan bahasa Indonesia yang profesional, ringkas, dan jelas.
Jika data pribadi karyawan yang bertanya disertakan di bawah, gunakan data itu untuk menjawab langsung dengan angka/fakta yang konkret — jangan menyuruh mereka mengecek sendiri ke portal/HRD kalau jawabannya sudah tersedia di data tersebut.
Jangan pernah mengarang angka atau data yang tidak ada di konteks yang diberikan; kalau datanya tidak tersedia, katakan terus terang bahwa Anda tidak punya informasi itu.`
	if employeeContext != "" {
		systemInstruction += "\n\n" + employeeContext
	}

	contents := []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromText(message),
			},
		},
	}

	result, err := client.Models.GenerateContent(ctx, "gemini-3.6-flash", contents, &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				genai.NewPartFromText(systemInstruction),
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate AI content: %w", err)
	}

	if len(result.Candidates) > 0 && result.Candidates[0].Content != nil {
		for _, p := range result.Candidates[0].Content.Parts {
			if p.Text != "" {
				return p.Text, nil
			}
		}
	}

	return "Maaf, saya tidak dapat menghasilkan respons yang valid saat ini.", nil
}
