package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/utils"
)

type ChatbotRequest struct {
	Message string `json:"message" binding:"required"`
}

func aiChatbotHandler(c *gin.Context) {
	var req ChatbotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_request", "Missing message field", nil)
		return
	}

	aiService := utils.NewGeminiAIService()
	reply, err := aiService.ChatbotResponse(c.Request.Context(), req.Message)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "ai_error", "Failed to get AI response", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"reply": reply})
}
