package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

// ExtractTextWithGemini uses the Gemini API to extract text from a file (especially useful as an OCR fallback for scanned PDFs)
func ExtractTextWithGemini(fileBytes []byte, mimeType string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY is not set")
	}

	if mimeType == "" {
		mimeType = "application/pdf"
	}

	// Base64 encode the file data
	b64Data := base64.StdEncoding.EncodeToString(fileBytes)

	// Prepare Gemini API request
	// Note: using gemini-flash-latest which has multimodal capabilities including PDF understanding
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=%s", apiKey)

	reqBody := map[string]interface{}{
		"contents": []interface{}{
			map[string]interface{}{
				"parts": []interface{}{
					map[string]interface{}{
						"text": "Extract all readable text from this document. Output ONLY the exact raw text found in the document. Do not include markdown formatting, do not include explanations, and do not summarize.",
					},
					map[string]interface{}{
						"inline_data": map[string]interface{}{
							"mime_type": mimeType,
							"data":      b64Data,
						},
					},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature": 0.1, // low temperature for precise extraction
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Gemini request: %w", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to send request to Gemini API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Gemini API returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Parse response
	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Gemini API response: %w", err)
	}

	if err := json.Unmarshal(bodyBytes, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse Gemini API response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("Gemini API returned empty extraction result")
	}

	extractedText := geminiResp.Candidates[0].Content.Parts[0].Text
	log.Printf("[Gemini OCR] Successfully extracted %d characters", len(extractedText))
	
	return extractedText, nil
}
