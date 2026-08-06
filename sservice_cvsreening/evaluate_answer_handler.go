package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"google.golang.org/genai"
)

// evaluateAnswerHandler handles video evaluation per question
func evaluateAnswerHandler(c *gin.Context) {
	// Parse multipart form
	if err := c.Request.ParseMultipartForm(30 << 20); err != nil { // 30 MB limit
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form: " + err.Error()})
		return
	}

	question := c.PostForm("question")
	lang := c.PostForm("lang")

	file, header, err := c.Request.FormFile("video_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get video file: " + err.Error()})
		return
	}
	defer file.Close()

	// Read video bytes
	videoBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read video file: " + err.Error()})
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Gemini API key not configured"})
		return
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize AI client"})
		return
	}

	langDirective := "You MUST respond and provide all evaluations entirely in English. Do NOT use Indonesian."
	if lang == "id" {
		langDirective = "You MUST respond and provide all evaluations entirely in Bahasa Indonesia. Do NOT use English."
	}

	systemInstruction := fmt.Sprintf(`You are an expert AI Evaluator for an interview.
Your role is to WATCH and LISTEN to the candidate's video/audio answer.

LANGUAGE DIRECTIVE: %s

You must analyze the candidate's response and return exactly a JSON object (without markdown code blocks) with two fields:
1. "transcript": The accurate transcription of what the candidate said in the video.
2. "evaluation": Your evaluation of the answer based on the question asked. Provide a score out of 100 and constructive feedback.

Format:
{
  "transcript": "...",
  "evaluation": "Score: 85/100. Feedback: ..."
}`, langDirective)

	prompt := fmt.Sprintf("Question asked: %s\nPlease evaluate the candidate's video answer.", question)

	temp := float32(0.7)
	result, err := client.Models.GenerateContent(ctx, "gemini-2.5-flash", []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromBytes(videoBytes, header.Header.Get("Content-Type")),
				genai.NewPartFromText(prompt),
			},
		},
	}, &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				genai.NewPartFromText(systemInstruction),
			},
		},
		Temperature:     &temp,
		MaxOutputTokens: 1000,
		ResponseMIMEType: "application/json",
	})

	if err != nil {
		log.Printf("Gemini API error in evaluateAnswerHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to evaluate answer: " + err.Error()})
		return
	}

	if result == nil || len(result.Candidates) == 0 || result.Candidates[0].Content == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response from AI"})
		return
	}

	// Extract JSON from response
	aiText := ""
	for _, p := range result.Candidates[0].Content.Parts {
		if p.Text != "" {
			aiText += p.Text
		}
	}

	var evalResult struct {
		Transcript string `json:"transcript"`
		Evaluation string `json:"evaluation"`
	}

	if err := json.Unmarshal([]byte(aiText), &evalResult); err != nil {
		log.Printf("Failed to parse AI JSON response: %v, raw text: %s", err, aiText)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	c.JSON(http.StatusOK, evalResult)
}
