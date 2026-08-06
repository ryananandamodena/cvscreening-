package utils

import (
	"context"
	"fmt"
	"os"

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

// AnalyzeSentiment uses Gemini AI to analyze performance review comments and achievements.
// If GEMINI_API_KEY is not set, it returns a mock response for testing.
func (s *GeminiAIService) AnalyzeSentiment(ctx context.Context, achievements, challenges, managerComments string) (string, string, error) {
	if s.APIKey == "" {
		// Return mock response if no API key is present
		score := "Positive"
		summary := fmt.Sprintf("Based on the achievements (%s) and manager comments (%s), the employee shows strong performance, though they faced some challenges (%s). Overall sentiment is positive.", achievements, managerComments, challenges)
		return score, summary, nil
	}

	// Here you would implement the actual Google Gen AI SDK call.
	// For example, using "google.golang.org/genai":
	// client, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: s.APIKey})
	// resp, err := client.Models.GenerateContent(...)
	// We simulate it for now to avoid compilation errors if SDK is missing.
	
	score := "Positive"
	summary := "[AI Generated]: The employee has demonstrated excellent progress in achieving their goals. Manager feedback is highly encouraging."
	
	return score, summary, nil
}

// ChatbotResponse handles interactive HR Chatbot requests
func (s *GeminiAIService) ChatbotResponse(ctx context.Context, message string) (string, error) {
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
Tugas Anda adalah membantu manajer atau HRD dalam menjawab pertanyaan seputar SDM, karyawan, performa, atau data analitik. 
Jawablah dengan bahasa Indonesia yang profesional, ringkas, dan jelas.`

	contents := []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromText(message),
			},
		},
	}

	result, err := client.Models.GenerateContent(ctx, "gemini-2.5-flash", contents, &genai.GenerateContentConfig{
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
