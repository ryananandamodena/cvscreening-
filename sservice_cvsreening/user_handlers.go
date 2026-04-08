package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== USER MANAGEMENT HANDLERS ====================

// requireAdmin checks if the current user has admin role
func requireAdmin(c *gin.Context) bool {
	role, exists := c.Get("role")
	if !exists || role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return false
	}
	return true
}

func getUsersHandler(c *gin.Context) {
	// Admin only check
	if !requireAdmin(c) {
		return
	}

	users, err := repository.GetUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	if users == nil {
		c.JSON(http.StatusOK, []models.User{})
		return
	}
	c.JSON(http.StatusOK, users)
}

func getUserByIDHandler(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	user, err := repository.GetUserByID(c.Request.Context(), id)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "models.User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func createUserHandler(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	var payload struct {
		Email      string `json:"email" binding:"required"`
		Password   string `json:"password" binding:"required"`
		FullName   string `json:"fullName" binding:"required"`
		Department string `json:"department"`
		Role       string `json:"role"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash password
	hashedPwd, err := HashPassword(payload.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	user := &models.User{
		Email:        payload.Email,
		PasswordHash: hashedPwd,
		FullName:     payload.FullName,
		Department:   payload.Department,
		Role:         payload.Role,
	}
	if user.Role == "" {
		user.Role = "recruiter"
	}

	id, err := repository.CreateUser(c.Request.Context(), user)
	if err != nil {
		log.Printf("models.User creation error: %v", err)
		c.JSON(http.StatusConflict, gin.H{"error": "models.User could not be created (email might exist)"})
		return
	}

	// Log Activity
	repository.LogActivity(c.Request.Context(), 1, "create_user", "user", id, "Created user: "+payload.Email, c.ClientIP())
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "models.User created successfully"})
}

func updateUserHandler(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		FullName   string `json:"fullName"`
		Department string `json:"department"`
		Role       string `json:"role"`
		Password   string `json:"password"` // Optional password update
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update basic info
	user := &models.User{
		ID:         id,
		FullName:   payload.FullName,
		Department: payload.Department,
		Role:       payload.Role,
	}

	if err := repository.UpdateUser(c.Request.Context(), user); err != nil {
		log.Printf("Failed to update user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// If password was provided, update it separately
	if payload.Password != "" {
		hashedPwd, err := HashPassword(payload.Password)
		if err == nil {
			repository.UpdateUserPassword(c.Request.Context(), id, hashedPwd)
		}
	}

	repository.LogActivity(c.Request.Context(), 1, "update_user", "user", id, "Updated user ID: "+idStr, c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"message": "models.User updated successfully"})
}

func deleteUserHandler(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Prevent self-deletion
	currentUserID, _ := c.Get("userID")
	if currentUserID == id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	if err := repository.DeleteUser(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	repository.LogActivity(c.Request.Context(), 1, "delete_user", "user", id, "Deleted user ID: "+idStr, c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"message": "models.User deleted successfully"})
}

func toggleUserStatusHandler(c *gin.Context) {
	if !requireAdmin(c) {
		return
	}

	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		IsActive bool `json:"isActive"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Prevent self-deactivation
	currentUserID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	if currentUserID.(int) == id && !payload.IsActive {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot deactivate your own account"})
		return
	}

	if err := repository.ToggleUserStatus(c.Request.Context(), id, payload.IsActive); err != nil {
		log.Printf("Failed to toggle user status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
		return
	}

	status := "deactivated"
	if payload.IsActive {
		status = "activated"
	}
	repository.LogActivity(c.Request.Context(), 1, "toggle_user_status", "user", id, "User "+status, c.ClientIP())
	c.JSON(http.StatusOK, gin.H{"message": "models.User status updated successfully"})
}
