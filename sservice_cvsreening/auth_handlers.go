package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func registerHandler(c *gin.Context) {
	var payload struct {
		Email      string `json:"email" binding:"required"`
		Password   string `json:"password" binding:"required"`
		FullName   string `json:"fullName" binding:"required"`
		Department string `json:"department"`
		Role       string `json:"role"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// Validate email
	if err := ValidateEmail(payload.Email); err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_email", err.Error(), nil)
		return
	}

	// Validate password strength
	if err := ValidatePassword(payload.Password); err != nil {
		RespondWithError(c, http.StatusBadRequest, "weak_password", err.Error(), nil)
		return
	}

	// Set default role if not provided
	if payload.Role == "" {
		payload.Role = "viewer"
	}

	// Validate user data
	if validationErrors := ValidateUserData(payload.Email, payload.FullName, payload.Role); len(validationErrors) > 0 {
		RespondWithError(c, http.StatusBadRequest, "validation_failed", "models.User data validation failed", validationErrors)
		return
	}

	hash, err := HashPassword(payload.Password)
	if err != nil {
		log.Printf("Password hashing error: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to process password", nil)
		return
	}

	user := &models.User{
		Email:        payload.Email,
		PasswordHash: hash,
		FullName:     payload.FullName,
		Department:   payload.Department,
		Role:         payload.Role,
	}

	id, err := repository.CreateUser(c.Request.Context(), user)
	if err != nil {
		log.Printf("Registration error: %v", err)
		RespondWithError(c, http.StatusConflict, "user_exists", "models.User could not be created (email might already exist)", nil)
		return
	}

	// Send Welcome Email
	go emailService.SendWelcomeEmail(user.Email, user.FullName)

	c.JSON(http.StatusCreated, gin.H{
		"id":      id,
		"message": "models.User registered successfully",
	})
}

// logLoginFailure safely records a failed login attempt without risking
// JSON/log injection from user-supplied input (e.g. an email containing
// quote characters).
func logLoginFailure(c *gin.Context, reason, email string) {
	payload, err := json.Marshal(gin.H{"error": reason, "email": email})
	if err != nil {
		log.Printf("Failed to marshal login failure log: %v", err)
		return
	}
	repository.LogActivity(c.Request.Context(), 0, "login_failed", "user", 0, string(payload), c.ClientIP())
}

func loginHandler(c *gin.Context) {
	var payload struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := repository.GetUserByEmail(c.Request.Context(), payload.Email)
	if err != nil || user == nil {
		logLoginFailure(c, "User not found", payload.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check password
	if !CheckPassword(payload.Password, user.PasswordHash) {
		logLoginFailure(c, "Invalid password", payload.Email)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate access token (24 hours)
	token, err := GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Generate refresh token (7 days)
	refreshToken, err := GenerateRefreshToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":        token,
		"refreshToken": refreshToken,
		"expires_in":   86400, // 24 hours in seconds
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.FullName,
			"role":  user.Role,
		},
	})
}

func refreshTokenHandler(c *gin.Context) {
	var payload struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token is required"})
		return
	}

	// Validate refresh token
	claims, err := ValidateRefreshToken(payload.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	// Get user from database
	user, err := repository.GetUserByID(c.Request.Context(), claims.UserID)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "models.User not found"})
		return
	}

	// Generate new access token
	newToken, err := GenerateJWT(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new token"})
		return
	}

	// Generate new refresh token (rotate refresh tokens)
	newRefreshToken, err := GenerateRefreshToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate new refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":        newToken,
		"refreshToken": newRefreshToken,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"name":  user.FullName,
			"role":  user.Role,
		},
	})
}
