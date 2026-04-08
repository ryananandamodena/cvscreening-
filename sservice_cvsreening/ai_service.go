package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/sashabaranov/go-openai"
)

type AIService struct {
	client *openai.Client
}

// ScoringBreakdown represents detailed scoring per category
type ScoringBreakdown struct {
	Education       CategoryScore `json:"education"`
	Experience      CategoryScore `json:"experience"`
	TechnicalSkills CategoryScore `json:"technicalSkills"`
	SoftSkills      CategoryScore `json:"softSkills"`
	AdditionalInfo  CategoryScore `json:"additionalInfo"`
}

// CategoryScore represents score for a single category
type CategoryScore struct {
	Score    int    `json:"score"`
	MaxScore int    `json:"maxScore"`
	Details  string `json:"details"`
}

// KeywordsAnalysis represents keyword matching analysis
type KeywordsAnalysis struct {
	MatchPercentage int      `json:"matchPercentage"`
	MatchedKeywords []string `json:"matchedKeywords"`
	MissingKeywords []string `json:"missingKeywords"`
}

func NewAIService(apiKey, orgID string) (*AIService, error) {
	config := openai.DefaultConfig(apiKey)
	if orgID != "" {
		config.OrgID = orgID
	}

	client := openai.NewClientWithConfig(config)

	return &AIService{
		client: client,
	}, nil
}

func (s *AIService) Close() error {
	// OpenAI client doesn't need explicit closing
	return nil
}

// AnalyzeCV performs CV screening against a Job Description using OpenAI
func (s *AIService) AnalyzeCV(ctx context.Context, jd, cv string) (*models.ScreeningResult, error) {
	log.Printf("Starting AI analysis for CV screening with OpenAI...")

	prompt := fmt.Sprintf(`Anda adalah sistem AI untuk melakukan screening CV kandidat terhadap lowongan pekerjaan. Analisis kesesuaian antara CV dan Job Description, kemudian berikan skor kecocokan beserta penjelasan detail.

## Job Description:
%s

## Candidate CV:
%s

## KRITERIA PENILAIAN:

### 1. PENDIDIKAN (Bobot: 15%%)
- Kesesuaian jurusan dengan posisi
- Level pendidikan (D3/S1/S2/S3)
- Akreditasi institusi (jika relevan)
- IPK (jika tersedia)

### 2. PENGALAMAN KERJA (Bobot: 35%%)
- Jumlah tahun pengalaman
- Relevansi pengalaman dengan posisi
- Level/senioritas posisi sebelumnya
- Industri yang sama/terkait
- Achievement dan pencapaian

### 3. KEAHLIAN TEKNIS (Bobot: 30%%)
- Hard skills yang match dengan requirement
- Sertifikasi profesional
- Tools/software yang dikuasai
- Kemampuan bahasa (jika required)

### 4. SOFT SKILLS (Bobot: 10%%)
- Leadership
- Komunikasi
- Problem solving
- Teamwork
- Kemampuan adaptasi

### 5. INFORMASI TAMBAHAN (Bobot: 10%%)
- Portfolio/project
- Training & workshop
- Volunteer/organisasi
- Awards & recognition

## MATCH SCORE INTERPRETATION:
- 90-100: Excellent Match - Highly Recommended
- 75-89: Good Match - Recommended
- 60-74: Fair Match - Consider for Interview
- 45-59: Partial Match - Review Carefully
- 0-44: Poor Match - Not Recommended

## CRITICAL INSTRUCTION FOR NAME EXTRACTION:
- Nama kandidat biasanya di bagian PALING ATAS CV
- Cari nama sebelum informasi email/phone/address
- JANGAN gunakan placeholder seperti "John Doe", "Jane Doe", "Unknown"
- Jika tidak jelas, gunakan bagian email sebelum @ sebagai nama

Return your analysis as a valid JSON object with this exact structure:
{
	"score": <number 0-100 based on weighted calculation>,
	"recommendation": "Proceed to Interview / Review Carefully / Not Recommended",
	"scoringBreakdown": {
		"education": {"score": <0-15>, "maxScore": 15, "details": "explanation"},
		"experience": {"score": <0-35>, "maxScore": 35, "details": "explanation"},
		"technicalSkills": {"score": <0-30>, "maxScore": 30, "details": "explanation"},
		"softSkills": {"score": <0-10>, "maxScore": 10, "details": "explanation"},
		"additionalInfo": {"score": <0-10>, "maxScore": 10, "details": "explanation"}
	},
	"strengths": ["strength1", "strength2", "strength3"],
	"gaps": ["gap1", "gap2", "gap3"],
	"keywordsAnalysis": {
		"matchPercentage": <0-100>,
		"matchedKeywords": ["keyword1", "keyword2"],
		"missingKeywords": ["keyword1", "keyword2"]
	},
	"redFlags": ["flag1 if any"],
	"interviewQuestions": ["question1", "question2", "question3"],
	"matchedSkills": ["skill1", "skill2"],
	"missingSkills": ["skill1", "skill2"],
	"reasoning": "2-3 sentence comprehensive summary",
	"biasCorrection": "note on bias mitigation",
	"confidence": <number 0.0-1.0>,
	"candidateName": "extracted full name from CV",
	"email": "extracted email",
	"phone": "extracted phone",
	"experienceYears": <integer>,
	"skills": ["skill1", "skill2"],
	"education": ["Degree - Institution"],
	"currentCompany": "Company Name",
	"currentPosition": "Job Title"
}`, jd, cv)

	log.Printf("Sending request to OpenAI API with enhanced scoring criteria...")

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are an expert recruitment AI assistant specializing in CV screening with weighted scoring criteria. Always respond with valid JSON. Be objective and detailed in your analysis.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.5,
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		},
	)

	if err != nil {
		log.Printf("ERROR: OpenAI API call failed: %v", err)
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Choices) == 0 {
		log.Printf("ERROR: No choices in OpenAI response")
		return nil, fmt.Errorf("no response from AI model")
	}

	responseText := resp.Choices[0].Message.Content
	log.Printf("Received response from OpenAI (length: %d chars)", len(responseText))

	// Parse JSON response
	result, err := parseJSONResponse(responseText)
	if err != nil {
		log.Printf("ERROR: Failed to parse JSON response: %v", err)
		log.Printf("Raw response: %s", responseText)
		// Return a fallback result instead of failing completely
		return &models.ScreeningResult{
			Score:          70,
			MatchedSkills:  []string{"General IT skills"},
			MissingSkills:  []string{"Specific technical details unclear"},
			Reasoning:      "AI could not fully parse response format. Manual review recommended.",
			BiasCorrection: "Automated bias check inconclusive.",
			Confidence:     0.50,
			Recommendation: "Review Carefully",
		}, nil
	}

	log.Printf("✅ AI Analysis completed successfully - Score: %d, Recommendation: %s, Confidence: %.2f", result.Score, result.Recommendation, result.Confidence)
	return result, nil
}

// parseJSONResponse converts JSON response into models.ScreeningResult
func parseJSONResponse(jsonText string) (*models.ScreeningResult, error) {
	var result models.ScreeningResult
	err := json.Unmarshal([]byte(jsonText), &result)
	if err != nil {
		return nil, fmt.Errorf("JSON unmarshal error: %w", err)
	}

	// Validate the result
	if result.Score < 0 || result.Score > 100 {
		return nil, fmt.Errorf("invalid score: %d", result.Score)
	}

	if result.Confidence < 0.0 || result.Confidence > 1.0 {
		return nil, fmt.Errorf("invalid confidence: %.2f", result.Confidence)
	}

	return &result, nil
}

// ExtractSearchFilters parses natural language query into structured filters
func (s *AIService) ExtractSearchFilters(ctx context.Context, query string) (*models.SearchFilters, error) {
	log.Printf("Extracting search filters from query: %s", query)

	prompt := fmt.Sprintf(`Extract search filters from this recruitment query: "%s"

	Return JSON with:
	- role: Job title or role mentioned (e.g. "Frontend Dev")
	- experienceYears: Minimum years of experience (integer, 0 if not specified)
	- skills: Array of technical skills mentioned (e.g. ["React", "TypeScript"])
	- location: Location if mentioned (e.g. "Remote", "Jakarta")
	- education: Education level if mentioned (e.g. "S1", "Bachelor")
	
	Example Input: "Find me a Senior React Developer with 5 years exp"
	Example Output: {"role": "React Developer", "experienceYears": 5, "skills": ["React"], "location": "", "education": ""}
	
	Respond ONLY with valid JSON.`, query)

	resp, err := s.client.CreateChatCompletion(
		ctx,
		openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are a recruitment query parser. Output valid JSON only.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0.1,
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
		},
	)

	if err != nil {
		return nil, fmt.Errorf("AI filter extraction failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	var filters models.SearchFilters
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &filters); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	filters.Query = query
	return &filters, nil
}
