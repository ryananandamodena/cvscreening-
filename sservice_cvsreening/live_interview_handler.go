package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"google.golang.org/genai"
)

// WebSocket upgrader with permissive CORS for development
var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in dev
	},
}

// wsMessage represents incoming WebSocket messages from the frontend
type wsMessage struct {
	Type              string `json:"type"`              // "config", "text", "end"
	SystemInstruction string `json:"systemInstruction"` // for type "config"
	Text              string `json:"text"`              // for type "text"
}

// wsResponse matches the frontend's expected message format
type wsResponse struct {
	ServerContent *serverContent `json:"serverContent,omitempty"`
}

type serverContent struct {
	ModelTurn   *modelTurn `json:"modelTurn,omitempty"`
	Interrupted bool       `json:"interrupted,omitempty"`
}

type modelTurn struct {
	Parts []part `json:"parts"`
}

type part struct {
	Text string `json:"text,omitempty"`
}

// liveInterviewSession manages a single WebSocket interview session
type liveInterviewSession struct {
	conn              *websocket.Conn
	mu                sync.Mutex
	systemInstruction string
	chatHistory       []*genai.Content
	geminiClient      *genai.Client
}

// liveInterviewHandler handles WebSocket connections for AI live interview
func liveInterviewHandler(c *gin.Context) {
	// Check Gemini API key
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("GEMINI_API_KEY not set, live interview unavailable")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Gemini API key not configured"})
		return
	}

	// Upgrade HTTP to WebSocket
	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	// Create Gemini client
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Printf("Failed to create Gemini client: %v", err)
		conn.WriteMessage(websocket.TextMessage, []byte(`{"error":"Failed to initialize AI"}`))
		return
	}

	session := &liveInterviewSession{
		conn:         conn,
		chatHistory:  []*genai.Content{},
		geminiClient: client,
	}

	log.Println("🎤 Live Interview WebSocket connected (Gemini)")

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		var msg wsMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("WebSocket message parse error: %v", err)
			continue
		}

		switch msg.Type {
		case "config":
			session.handleConfig(msg)
		case "text":
			session.handleText(msg)
		case "end":
			log.Println("🎤 Live Interview session ended by client")
			return
		default:
			log.Printf("Unknown WebSocket message type: %s", msg.Type)
		}
	}
}

// handleConfig initializes the interview session with system instruction
func (s *liveInterviewSession) handleConfig(msg wsMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.systemInstruction = msg.SystemInstruction
	if s.systemInstruction == "" {
		s.systemInstruction = `You are an expert AI Interviewer for RecruitAI. 
Your tone is professional, encouraging, and highly technical. 
Ask one question at a time. Do not provide answers. 
Analyze the candidate's technical depth and communication skills.`
	}

	// Clear chat history
	s.chatHistory = []*genai.Content{}

	log.Println("🎤 Live Interview configured with system instruction (Gemini)")

	// Send initial greeting from AI
	s.generateAndSendResponse("Start the interview with a warm, professional greeting. Introduce yourself as the AI interviewer and ask the first question based on your instructions.")
}

// handleText processes candidate text input and generates AI response
func (s *liveInterviewSession) handleText(msg wsMessage) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if msg.Text == "" {
		return
	}

	// Add candidate message to history
	s.chatHistory = append(s.chatHistory, &genai.Content{
		Role: "user",
		Parts: []*genai.Part{
			genai.NewPartFromText(msg.Text),
		},
	})

	// Generate AI response
	s.generateAndSendResponse("")
}

// generateAndSendResponse calls Gemini and sends the response via WebSocket
func (s *liveInterviewSession) generateAndSendResponse(extraPrompt string) {
	ctx := context.Background()

	// Build contents for the request
	contents := make([]*genai.Content, len(s.chatHistory))
	copy(contents, s.chatHistory)

	if extraPrompt != "" {
		contents = append(contents, &genai.Content{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromText(extraPrompt),
			},
		})
	}

	// Call Gemini API
	temp := float32(0.7)
	result, err := s.geminiClient.Models.GenerateContent(ctx, "gemini-3.6-flash", contents, &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{
			Parts: []*genai.Part{
				genai.NewPartFromText(s.systemInstruction),
			},
		},
		Temperature:     &temp,
		MaxOutputTokens: 500,
	})

	if err != nil {
		log.Printf("Gemini API error in live interview: %v", err)
		s.sendError("Failed to generate AI response: " + err.Error())
		return
	}

	if result == nil || len(result.Candidates) == 0 || result.Candidates[0].Content == nil {
		s.sendError("No response from AI")
		return
	}

	// Extract text from response
	aiText := ""
	for _, p := range result.Candidates[0].Content.Parts {
		if p.Text != "" {
			aiText += p.Text
		}
	}

	if aiText == "" {
		s.sendError("Empty response from AI")
		return
	}

	// Add AI response to chat history
	s.chatHistory = append(s.chatHistory, &genai.Content{
		Role: "model",
		Parts: []*genai.Part{
			genai.NewPartFromText(aiText),
		},
	})

	// Send response in the format expected by frontend
	response := wsResponse{
		ServerContent: &serverContent{
			ModelTurn: &modelTurn{
				Parts: []part{
					{Text: aiText},
				},
			},
		},
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		log.Printf("JSON marshal error: %v", err)
		return
	}

	if err := s.conn.WriteMessage(websocket.TextMessage, jsonData); err != nil {
		log.Printf("WebSocket write error: %v", err)
	}
}

// sendError sends an error message to the frontend
func (s *liveInterviewSession) sendError(message string) {
	response := wsResponse{
		ServerContent: &serverContent{
			ModelTurn: &modelTurn{
				Parts: []part{
					{Text: "[ERROR] " + message},
				},
			},
		},
	}

	jsonData, _ := json.Marshal(response)
	s.conn.WriteMessage(websocket.TextMessage, jsonData)
}
