package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ryantriananda/sservice_cvsreening/models"
)

// RefreshTokenClaims for refresh tokens
type RefreshTokenClaims struct {
	UserID int    `json:"userId"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateRefreshToken creates a refresh token (valid for 7 days)
func GenerateRefreshToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days
	claims := &RefreshTokenClaims{
		UserID: user.ID,
		Email:  user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	return tokenString, err
}

// ValidateRefreshToken validates a refresh token
func ValidateRefreshToken(tokenString string) (*RefreshTokenClaims, error) {
	claims := &RefreshTokenClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// RoleMiddleware checks if user has required role
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		role := userRole.(string)

		// Check if user's role is in allowed roles
		allowed := false
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Access denied",
				"message": fmt.Sprintf("This action requires one of the following roles: %s", strings.Join(allowedRoles, ", ")),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminOnly middleware - only admins can access
func AdminOnly() gin.HandlerFunc {
	return RoleMiddleware("admin")
}

// FinanceOrAdmin middleware - finance and admins can access
func FinanceOrAdmin() gin.HandlerFunc {
	return RoleMiddleware("admin", "finance")
}

// RecruiterOrAdmin middleware - recruiters and admins can access
func RecruiterOrAdmin() gin.HandlerFunc {
	return RoleMiddleware("admin", "recruiter")
}

// HiringManagerOrAdmin middleware - hiring managers and admins can access
func HiringManagerOrAdmin() gin.HandlerFunc {
	return RoleMiddleware("admin", "hiring_manager", "recruiter")
}

// ErrorResponse represents a structured error response
type ErrorResponse struct {
	Error   string      `json:"error"`
	Message string      `json:"message,omitempty"`
	Details interface{} `json:"details,omitempty"`
}

// RespondWithError sends a structured error response
func RespondWithError(c *gin.Context, statusCode int, error string, message string, details interface{}) {
	c.JSON(statusCode, ErrorResponse{
		Error:   error,
		Message: message,
		Details: details,
	})
}

// RequestLogger middleware logs all requests
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		duration := time.Since(start)
		statusCode := c.Writer.Status()

		// Log request details
		fmt.Printf("[%s] %s %s - Status: %d - Duration: %v\n",
			time.Now().Format("2006-01-02 15:04:05"),
			method,
			path,
			statusCode,
			duration,
		)
	}
}

// getAllowedOrigins returns the list of allowed CORS origins from environment
func getAllowedOrigins() []string {
	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		// Silently falling back here in production means the real frontend origin
		// is never allowed and every browser request gets blocked by CORS with no
		// obvious cause in the logs — warn loudly instead of failing quietly.
		if os.Getenv("APP_ENV") == "production" {
			log.Println("WARNING: ALLOWED_ORIGINS is not set in a production environment — " +
				"falling back to localhost-only CORS origins, which will block your real frontend. " +
				"Set ALLOWED_ORIGINS explicitly (comma-separated) in production.")
		}
		// Default development origins
		return []string{"http://localhost:3000", "http://localhost:5173"}
	}
	return strings.Split(origins, ",")
}

// isOriginAllowed checks if an origin is in the allowed list
func isOriginAllowed(origin string, allowedOrigins []string) bool {
	for _, allowed := range allowedOrigins {
		if strings.TrimSpace(allowed) == origin {
			return true
		}
	}
	return false
}

// CORSMiddleware handles CORS with configurable origins
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := getAllowedOrigins()
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if isOriginAllowed(origin, allowedOrigins) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		c.Writer.Header().Set("Vary", "Origin")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
