package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
	"golang.org/x/crypto/bcrypt"
)

// CandidateUser represents a candidate user account
type CandidateUser struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	FullName  string    `json:"fullName"`
	Phone     string    `json:"phone"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// CandidateApplication represents a job application
type CandidateApplication struct {
	ID            int       `json:"id"`
	CandidateID   int       `json:"candidateId"`
	JobID         int       `json:"jobId"`
	JobTitle      string    `json:"jobTitle"`
	JobDepartment string    `json:"jobDepartment"`
	CVFileName    string    `json:"cvFileName"`
	CoverLetter   string    `json:"coverLetter"`
	Status        string    `json:"status"`
	AppliedAt     time.Time `json:"appliedAt"`
}

// ApplicationRequest represents application submission request
type ApplicationRequest struct {
	JobID       int    `form:"job_id" binding:"required"`
	CoverLetter string `form:"cover_letter"`
}

// candidatePortalRegisterHandler handles candidate self-registration
func candidatePortalRegisterHandler(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=6"`
		FullName string `json:"fullName" binding:"required"`
		Phone    string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()

	// Check if email already exists
	var existingID int
	err := repository.GetDB().QueryRow(ctx, "SELECT id FROM candidate_users WHERE email = $1", req.Email).Scan(&existingID)
	if err == nil && existingID > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Link to an existing recruitment-pipeline candidate record with the same
	// email, if one exists — a one-time match at registration, not a repeated
	// heuristic lookup. Leaves linked_candidate_id NULL if no match (most
	// candidate-portal signups won't have a prior CV screening on file).
	var linkedCandidateID *int
	var matchedID int
	if err := repository.GetDB().QueryRow(ctx, `SELECT id FROM candidates WHERE email = $1`, req.Email).Scan(&matchedID); err == nil {
		linkedCandidateID = &matchedID
	}

	// Create candidate user
	var candidateID int
	err = repository.GetDB().QueryRow(ctx, `
		INSERT INTO candidate_users (email, password, full_name, phone, status, linked_candidate_id)
		VALUES ($1, $2, $3, $4, 'active', $5)
		RETURNING id
	`, req.Email, string(hashedPassword), req.FullName, req.Phone, linkedCandidateID).Scan(&candidateID)

	if err != nil {
		log.Printf("Failed to create candidate user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	log.Printf("✅ New candidate registered: ID=%d, Email=%s", candidateID, req.Email)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registration successful",
		"userId":  candidateID,
		"email":   req.Email,
	})
}

// candidatePortalLoginHandler handles candidate login
func candidatePortalLoginHandler(c *gin.Context) {
	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()

	// Find candidate by email
	var candidate CandidateUser
	var hashedPassword string
	err := repository.GetDB().QueryRow(ctx, `
		SELECT id, email, password, full_name, phone, status, created_at
		FROM candidate_users WHERE email = $1
	`, req.Email).Scan(&candidate.ID, &candidate.Email, &hashedPassword, &candidate.FullName, &candidate.Phone, &candidate.Status, &candidate.CreatedAt)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check status
	if candidate.Status != "active" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is not active"})
		return
	}

	// Generate simple token (in production, use JWT)
	token := generateSimpleToken(candidate.ID, candidate.Email)

	log.Printf("✅ Candidate logged in: ID=%d, Email=%s", candidate.ID, candidate.Email)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Login successful",
		"userId":    candidate.ID,
		"email":     candidate.Email,
		"fullName":  candidate.FullName,
		"token":     token,
		"expiresIn": 86400,
	})
}

// getPublicJobsHandler returns published jobs for candidates
func getPublicJobsHandler(c *gin.Context) {
	ctx := context.Context(nil)
	if repository.IsDBConnected() {
		ctx = c.Request.Context()
	}

	var jobs []models.JobDescription
	rows, err := repository.GetDB().Query(ctx, `
		SELECT id, title, department, description, requirements, location, 
		       employment_type, salary_min, salary_max, created_at
		FROM jobs 
		WHERE status = 'published' AND deleted_at IS NULL
		ORDER BY created_at DESC
	`)
	if err != nil {
		// Return mock data if DB not available
		c.JSON(http.StatusOK, gin.H{
			"jobs": []gin.H{
				{
					"id":             1,
					"title":          "Software Engineer",
					"department":     "Engineering",
					"description":    "We are looking for a skilled Software Engineer to join our team.",
					"location":       "Jakarta",
					"employmentType": "Full-time",
					"salaryMin":      10000000,
					"salaryMax":      20000000,
				},
				{
					"id":             2,
					"title":          "Product Manager",
					"department":     "Product",
					"description":    "Join our product team to build amazing products.",
					"location":       "Jakarta",
					"employmentType": "Full-time",
					"salaryMin":      15000000,
					"salaryMax":      25000000,
				},
				{
					"id":             3,
					"title":          "UX Designer",
					"department":     "Design",
					"description":    "Create beautiful and intuitive user experiences.",
					"location":       "Remote",
					"employmentType": "Full-time",
					"salaryMin":      8000000,
					"salaryMax":      15000000,
				},
			},
			"total": 3,
		})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var j models.JobDescription
		err := rows.Scan(&j.ID, &j.Title, &j.Department, &j.Description, &j.Requirements,
			&j.Location, &j.EmploymentType, &j.SalaryMin, &j.SalaryMax, &j.CreatedAt)
		if err != nil {
			log.Printf("Error scanning job: %v", err)
			continue
		}
		jobs = append(jobs, j)
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":  jobs,
		"total": len(jobs),
	})
}

// submitApplicationHandler handles job application submission
func submitApplicationHandler(c *gin.Context) {
	// Get candidate ID from context (set by auth middleware)
	candidateID, exists := c.Get("candidateId")
	if !exists {
		// For development, use a default ID or require auth
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	jobIDStr := c.Request.FormValue("job_id")
	coverLetter := c.Request.FormValue("cover_letter")

	if jobIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Job ID is required"})
		return
	}

	var jobID int
	fmt.Sscanf(jobIDStr, "%d", &jobID)

	// Get job details
	var jobTitle, jobDepartment string
	ctx := c.Request.Context()
	err := repository.GetDB().QueryRow(ctx, "SELECT title, department FROM jobs WHERE id = $1 AND status = 'published'", jobID).Scan(&jobTitle, &jobDepartment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	// Handle file upload
	var cvFileName string
	file, header, err := c.Request.FormFile("cv_file")
	if err == nil {
		defer file.Close()
		cvFileName = header.Filename
		log.Printf("📄 CV uploaded: %s for job ID: %d", cvFileName, jobID)
	}

	// Save application
	var appID int
	err = repository.GetDB().QueryRow(ctx, `
		INSERT INTO candidate_applications (candidate_id, job_id, job_title, job_department, cv_file_name, cover_letter, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'submitted')
		RETURNING id
	`, candidateID, jobID, jobTitle, jobDepartment, cvFileName, coverLetter).Scan(&appID)

	if err != nil {
		log.Printf("Failed to save application: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit application"})
		return
	}

	log.Printf("✅ Application submitted: ID=%d, Candidate=%d, Job=%d", appID, candidateID, jobID)

	c.JSON(http.StatusCreated, gin.H{
		"message":       "Application submitted successfully",
		"applicationId": appID,
		"jobTitle":      jobTitle,
		"status":        "submitted",
		"appliedAt":     time.Now().Format(time.RFC3339),
	})
}

// getCandidateApplicationsHandler returns applications for a candidate
func getCandidateApplicationsHandler(c *gin.Context) {
	candidateID, exists := c.Get("candidateId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	ctx := c.Request.Context()

	var applications []CandidateApplication
	rows, err := repository.GetDB().Query(ctx, `
		SELECT id, job_id, job_title, job_department, cv_file_name, cover_letter, status, created_at
		FROM candidate_applications
		WHERE candidate_id = $1
		ORDER BY created_at DESC
	`, candidateID)
	if err != nil {
		log.Printf("Failed to fetch applications: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applications"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var a CandidateApplication
		err := rows.Scan(&a.ID, &a.JobID, &a.JobTitle, &a.JobDepartment, &a.CVFileName, &a.CoverLetter, &a.Status, &a.AppliedAt)
		if err != nil {
			log.Printf("Error scanning application: %v", err)
			continue
		}
		applications = append(applications, a)
	}

	c.JSON(http.StatusOK, gin.H{
		"applications": applications,
		"total":        len(applications),
	})
}

// getApplicationByIDHandler returns a specific application
func getApplicationByIDHandler(c *gin.Context) {
	candidateID, exists := c.Get("candidateId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	appID := c.Param("id")
	ctx := c.Request.Context()

	var application CandidateApplication
	err := repository.GetDB().QueryRow(ctx, `
		SELECT id, candidate_id, job_id, job_title, job_department, cv_file_name, cover_letter, status, created_at
		FROM candidate_applications
		WHERE id = $1 AND candidate_id = $2
	`, appID, candidateID).Scan(&application.ID, &application.CandidateID, &application.JobID, &application.JobTitle,
		&application.JobDepartment, &application.CVFileName, &application.CoverLetter, &application.Status, &application.AppliedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	c.JSON(http.StatusOK, application)
}

// generateSimpleToken generates a simple token for development
func generateSimpleToken(userID int, email string) string {
	return fmt.Sprintf("candidate_%d_%s_%d", userID, email, time.Now().Unix())
}

// CandidateAuthMiddleware validates candidate authentication token
func CandidateAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		// Parse token (format: candidate_{id}_{email}_{timestamp})
		if !strings.HasPrefix(token, "candidate_") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		parts := strings.Split(token, "_")
		if len(parts) < 4 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract candidate ID
		candidateIDStr := parts[1]
		candidateID, err := strconv.Atoi(candidateIDStr)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid candidate ID"})
			c.Abort()
			return
		}

		// Verify candidate exists
		ctx := c.Request.Context()
		var email string
		err = repository.GetDB().QueryRow(ctx, "SELECT email FROM candidate_users WHERE id = $1 AND status = 'active'", candidateID).Scan(&email)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Candidate not found or inactive"})
			c.Abort()
			return
		}

		// Set candidate ID in context
		c.Set("candidateId", candidateID)
		c.Set("candidateEmail", email)
		c.Next()
	}
}
