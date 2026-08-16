package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret []byte

func getJWTSecret() []byte {
	if jwtSecret == nil {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			log.Fatal("JWT_SECRET environment variable is required. Please set it in your .env file or environment.")
		}
		jwtSecret = []byte(secret)
	}
	return jwtSecret
}

// HashPassword hashes a plain text password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPassword checks if provided password matches hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateJWT creates a new token for a user
func GenerateJWT(user *models.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &models.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(getJWTSecret())
	return tokenString, err
}

// AuthMiddleware protects routes
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			repository.LogActivity(context.Background(), 0, "unauthorized_access", "system", 0, "Missing info", c.ClientIP())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Bearer <token>
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			repository.LogActivity(context.Background(), 0, "unauthorized_access", "system", 0, "Invalid auth scheme", c.ClientIP())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		claims := &models.Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return getJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			repository.LogActivity(context.Background(), 0, "unauthorized_access", "system", 0, "Invalid/Expired token", c.ClientIP())
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// GetUserIDFromContext retrieves the user ID from the Gin context
func GetUserIDFromContext(c *gin.Context) int {
	if uid, exists := c.Get("userID"); exists {
		if id, ok := uid.(int); ok {
			return id
		}
	}
	return 0
}

// GetUserEmailFromContext retrieves the user email from the Gin context
func GetUserEmailFromContext(c *gin.Context) string {
	if email, exists := c.Get("email"); exists {
		if val, ok := email.(string); ok {
			return val
		}
	}
	return ""
}

// resolveOwnEmployeeID resolves the caller's own employee record from their JWT. Every
// self-service handler should call this instead of reading an employeeId off the request —
// client input must never determine whose data is read/written.
func resolveOwnEmployeeID(c *gin.Context) (int, bool) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusNotFound, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return 0, false
	}
	return employeeID, true
}

// authorizeEmployeeTarget resolves the caller's own employeeID, and — only if the caller
// explicitly asked to act on a *different* employee (targetEmployeeID > 0 and != own) —
// verifies the caller is either an admin or that employee's direct manager before allowing it.
// Returns the employeeID whose data should actually be used, and false if an error response
// was already written (caller must return immediately in that case).
//
// This is the shared self-service ownership pattern used across Leave, Attendance, and other
// "view/act on my own record, or my subordinate's if I'm their manager" endpoints.
func authorizeEmployeeTarget(c *gin.Context, targetEmployeeID int) (int, bool) {
	ownEmployeeID, ok := resolveOwnEmployeeID(c)
	if !ok {
		return 0, false
	}
	if targetEmployeeID == 0 || targetEmployeeID == ownEmployeeID {
		return ownEmployeeID, true
	}

	if GetUserRoleFromContext(c) == "admin" {
		return targetEmployeeID, true
	}
	target, err := repository.GetEmployeeByID(c.Request.Context(), targetEmployeeID)
	if err != nil || target == nil {
		RespondWithError(c, http.StatusNotFound, "employee_not_found", "Employee not found", nil)
		return 0, false
	}
	if target.ManagerID != nil && *target.ManagerID == ownEmployeeID {
		return targetEmployeeID, true
	}
	RespondWithError(c, http.StatusForbidden, "forbidden", "You are not authorized to access this employee's data", nil)
	return 0, false
}
