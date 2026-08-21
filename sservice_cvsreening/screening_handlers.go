package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func screeningHandler(c *gin.Context) {
	// Parse multipart form
	// 10MB max memory
	if err := c.Request.ParseMultipartForm(10 << 20); err != nil {
		// try parsing as JSON if multipart fails, for backward compatibility
		var req models.ScreeningRequest
		if errJSON := c.ShouldBindJSON(&req); errJSON == nil {
			if req.JD == "" || req.CV == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Both JD and CV are required"})
				return
			}
			processScreening(c, 0, req.JD, req.CV)
			return
		}

		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data or JSON"})
		return
	}

	jd := c.Request.FormValue("jd")
	jobIDStr := c.Request.FormValue("job_id")
	var jobID int
	if jobIDStr != "" {
		fmt.Sscanf(jobIDStr, "%d", &jobID)
	}

	if jd == "" || len(strings.TrimSpace(jd)) < 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Job Description (jd) is too short or empty",
			"details": "A valid job description is required for the AI to perform matching analysis.",
		})
		return
	}

	var cvText string
	var isPDF bool

	// Check if a file is uploaded
	file, header, err := c.Request.FormFile("cv_file")
	if err == nil {
		defer file.Close()

		// Check file type (basic check)
		contentType := header.Header.Get("Content-Type")
		filename := header.Filename
		size := header.Size
		log.Printf("Received file: %s, Content-Type: %s, Size: %d bytes", filename, contentType, size)

		// Check file size (5MB limit)
		if err := ValidateFileSize(size, 5); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Normalize Content-Type based on extension if generic
		if contentType == "application/octet-stream" || contentType == "" {
			if strings.HasSuffix(strings.ToLower(filename), ".pdf") {
				contentType = "application/pdf"
				log.Println("Detected PDF by extension, treating as application/pdf")
			}
		}

		// Validate file type (PDF only)
		if err := ValidateFileType(contentType, []string{"application/pdf"}); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Hanya file PDF yang diperbolehkan."})
			return
		}

		if contentType == "application/pdf" {
			// Read the file entirely into memory first
			fileBytes, readErr := io.ReadAll(file)
			if readErr != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca isi file", "details": readErr.Error()})
				return
			}

			// Extract text from PDF locally first
			content, _ := ReadPdf(bytes.NewReader(fileBytes), size) // Ignored err to fix unused variable
			cvText = content

			// Validate PDF extraction result
			cleanedText := strings.TrimSpace(cvText)
			log.Printf("Local PDF Extracted Text Length: %d chars", len(cleanedText))

			if len(cleanedText) < 50 {
				log.Printf("Local extraction returned insufficient content: %d chars. Attempting Gemini OCR Fallback...", len(cleanedText))
				
				geminiText, geminiErr := ExtractTextWithGemini(fileBytes, contentType)
				if geminiErr == nil && len(strings.TrimSpace(geminiText)) >= 50 {
					log.Printf("Gemini OCR Fallback succeeded: %d chars extracted", len(strings.TrimSpace(geminiText)))
					cvText = geminiText
					isPDF = true // keep it true
				} else {
					if geminiErr != nil {
						log.Printf("Gemini OCR Fallback failed: %v", geminiErr)
					} else {
						log.Printf("Gemini OCR Fallback returned insufficient text: %d chars", len(strings.TrimSpace(geminiText)))
					}

					c.JSON(http.StatusBadRequest, gin.H{
						"error":   "PDF tidak dapat diekstrak dengan baik. Teks yang ditemukan terlalu sedikit.",
						"details": fmt.Sprintf("Hanya %d karakter yang berhasil diekstrak melalui OCR. PDF mungkin gambar buram/rusak. Gunakan PDF berbasis teks.", len(strings.TrimSpace(cvText))),
					})
					return
				}
			} else {
				isPDF = true
			}
		} else {
			// Assume text file or try to read it
			buf := new(bytes.Buffer)
			
			// We might have already read it if we implemented it like above, but here we haven't
			// Just to be safe, since io.Copy might have drained the reader, let's reset to start
			if _, ok := file.(io.Seeker); ok {
				file.(io.Seeker).Seek(0, 0)
			}
			_, err := buf.ReadFrom(file)
			if err != nil {
				log.Printf("Failed to read file buffer: %v", err)
			}
			cvText = buf.String()
			log.Printf("Read non-PDF file. Content length: %d chars", len(cvText))
		}
	} else {
		// Fallback to "cv" text field
		cvText = c.Request.FormValue("cv")
		if cvText == "" {
			// Debug: Log all keys to see what we received
			log.Println("DEBUG: 'cv_file' missing and 'cv' text missing. Available keys:")
			if c.Request.MultipartForm != nil {
				for key := range c.Request.MultipartForm.Value {
					log.Printf("- Key (Value): %s", key)
				}
				for key := range c.Request.MultipartForm.File {
					log.Printf("- Key (File): %s", key)
				}
			} else {
				log.Println("DEBUG: MultipartForm is nil")
			}
		}
	}

	if cvText == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CV is required (upload 'cv_file' or provide 'cv' text)"})
		return
	}

	// Additional validation for minimum content
	if len(strings.TrimSpace(cvText)) < 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Konten CV terlalu pendek untuk dianalisis",
			"details": "CV harus memiliki setidaknya 100 karakter untuk dapat dianalisis dengan baik.",
		})
		return
	}

	log.Printf("CV extraction successful: %d total chars, isPDF: %v", len(cvText), isPDF)
	processScreening(c, jobID, jd, cvText)
}

func processScreening(c *gin.Context, jobID int, jd, cvText string) {
	// Log extracted CV text (first 500 chars) for debugging
	cvPreview := cvText
	if len(cvPreview) > 500 {
		cvPreview = cvPreview[:500]
	}
	log.Printf("Extracted CV text preview (first 500 chars):\n%s\n--- END PREVIEW ---", cvPreview)

	// Use AI Service to analyze CV
	result, err := aiService.AnalyzeCV(c.Request.Context(), jd, cvText)
	if err != nil {
		log.Printf("AI analysis error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to analyze CV"})
		return
	}

	// Manage models.Candidate
	var candidateID int

	// Extract name from CV text if AI didn't get it right
	extractedName := extractCandidateName(cvText, result.Email)
	if result.CandidateName == "" || result.CandidateName == "John Doe" || result.CandidateName == "Jane Doe" || result.CandidateName == "Unknown" || result.CandidateName == "N/A" {
		result.CandidateName = extractedName
		log.Printf("Used extracted name from CV text: %s", result.CandidateName)
	}
	if result.Email != "" {
		// We have an email, we can create or update the candidate
		id, err := repository.CreateOrUpdateCandidate(c.Request.Context(), result.CandidateName, result.Email, result.Phone, cvText, result.ExperienceYears, result.Skills, result.Education, result.CurrentCompany, result.CurrentPosition)
		if err != nil {
			log.Printf("Warning: Failed to create/update candidate: %v", err)
		} else {
			candidateID = id
		}
	} else {
		log.Println("Warning: AI could not extract email, skipping candidate creation")
	}

	// Save to database
	record, err := repository.SaveScreeningResult(c.Request.Context(), candidateID, jobID, jd, cvText, result)
	if err != nil {
		log.Printf("Warning: Failed to save to database: %v", err)
	}

	// Return response with ID if saved
	response := gin.H{
		"score":          result.Score,
		"matchedSkills":  result.MatchedSkills,
		"missingSkills":  result.MissingSkills,
		"reasoning":      result.Reasoning,
		"biasCorrection": result.BiasCorrection,
		"confidence":     result.Confidence,
	}
	if record != nil {
		response["id"] = record.ID
		response["createdAt"] = record.CreatedAt
	}
	c.JSON(http.StatusOK, response)
}

// extractCandidateName attempts to extract candidate name from CV text
func extractCandidateName(cvText, email string) string {
	// Split CV text into lines
	lines := strings.Split(cvText, "\n")

	// Common patterns to skip
	skipPatterns := []string{
		"curriculum vitae", "cv", "resume", "profile", "about",
		"personal", "contact", "information", "summary", "objective",
		"address", "email", "phone", "tel", "mobile",
		"http", "www", "@", "linkedin", "github",
	}

	// Try to find name in first 10 lines
	for i := 0; i < len(lines) && i < 10; i++ {
		line := strings.TrimSpace(lines[i])

		// Skip empty lines
		if len(line) < 2 {
			continue
		}

		// Skip lines that are too long (probably not a name)
		if len(line) > 50 {
			continue
		}

		// Check if line contains skip patterns
		lineLower := strings.ToLower(line)
		shouldSkip := false
		for _, pattern := range skipPatterns {
			if strings.Contains(lineLower, pattern) {
				shouldSkip = true
				break
			}
		}
		if shouldSkip {
			continue
		}

		// Check if line looks like a name (2-4 words, mostly letters)
		words := strings.Fields(line)
		if len(words) >= 1 && len(words) <= 4 {
			// Check if mostly letters
			letterCount := 0
			totalCount := 0
			for _, r := range line {
				if r != ' ' {
					totalCount++
					if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
						letterCount++
					}
				}
			}

			// If more than 80% letters, it's likely a name
			if totalCount > 0 && float64(letterCount)/float64(totalCount) > 0.8 {
				// Clean up the name
				name := strings.TrimSpace(line)
				// Remove any trailing punctuation
				name = strings.TrimRight(name, ".,;:")
				log.Printf("Extracted name from CV line %d: %s", i+1, name)
				return name
			}
		}
	}

	// Fallback: try to get name from email
	if email != "" {
		parts := strings.Split(email, "@")
		if len(parts) > 0 {
			namePart := parts[0]
			// Replace common separators with space
			namePart = strings.ReplaceAll(namePart, ".", " ")
			namePart = strings.ReplaceAll(namePart, "_", " ")
			namePart = strings.ReplaceAll(namePart, "-", " ")
			// Title case
			namePart = strings.Title(strings.ToLower(namePart))
			log.Printf("Extracted name from email: %s", namePart)
			return namePart
		}
	}

	return "Unknown Candidate"
}

func getScreeningsHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	records, total, err := repository.GetScreenings(c.Request.Context(), page, limit)
	if err != nil {
		log.Printf("ERROR in getScreeningsHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get screening history", "details": err.Error()})
		return
	}

	totalPages := int(total) / limit
	if int(total)%limit != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, models.PaginatedResponse{
		Data:       records,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func getScreeningByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	record, err := repository.GetScreeningByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Screening not found"})
		return
	}
	c.JSON(http.StatusOK, record)
}

func updateScreeningStatusHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var payload struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Reviewer identity comes from the authenticated JWT (email — the JWT carries no display
	// name), never a hardcoded literal and never anything the client could pass in the body.
	reviewer := GetUserEmailFromContext(c)
	if reviewer == "" {
		reviewer = "unknown"
	}

	if err := repository.UpdateScreeningStatus(c.Request.Context(), id, payload.Status, reviewer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// Log Activity — actor is the authenticated user, not a hardcoded ID.
	repository.LogActivity(c.Request.Context(), GetUserIDFromContext(c), "update_screening_status", "screening", id, "Updated status to "+payload.Status, c.ClientIP())

	// === AUTO-CREATE INTERVIEW when screening is approved/passed ===
	status := strings.ToLower(payload.Status)
	if status == "passed" || status == "approved" {
		// Get screening details to find candidate and job
		screening, err := repository.GetScreeningByID(c.Request.Context(), id)
		if err != nil || screening == nil {
			log.Printf("Warning: Could not fetch screening %d for auto-interview: %v", id, err)
			c.JSON(http.StatusOK, gin.H{"message": "Screening status updated, but failed to auto-create interview"})
			return
		}

		// Schedule interview 7 days from now at 10:00 AM
		scheduledAt := time.Now().AddDate(0, 0, 7)
		scheduledAt = time.Date(scheduledAt.Year(), scheduledAt.Month(), scheduledAt.Day(), 10, 0, 0, 0, scheduledAt.Location())

		interview := &models.Interview{
			CandidateID:   screening.CandidateID,
			JobID:         screening.JobID,
			InterviewType: "ai_video",
			ScheduledAt:   scheduledAt,
			Interviewer:   "AI Interviewer",
		}

		interviewID, err := repository.CreateInterview(c.Request.Context(), interview)
		if err != nil {
			log.Printf("Warning: Failed to auto-create interview for screening %d: %v", id, err)
			c.JSON(http.StatusOK, gin.H{"message": "Screening approved, but failed to schedule interview"})
			return
		}

		// Generate interview link
		interviewLink := fmt.Sprintf("/live/%d", interviewID)

		// Send notifications in background
		go func() {
			if screening.Email != "" {
				// Send screening result notification
				emailService.SendScreeningResult(screening.Email, screening.CandidateName, "Approved")

				// Send interview invitation
				emailService.SendInterviewInvite(
					screening.Email,
					screening.CandidateName,
					scheduledAt.Format("Monday, 02 Jan 2006 at 15:04"),
					interviewLink,
				)
			} else {
				log.Printf("Warning: No email for candidate %d, skipping notifications", screening.CandidateID)
			}
		}()

		log.Printf("✅ Auto-created interview %d for approved screening %d (candidate: %s)", interviewID, id, screening.CandidateName)

		c.JSON(http.StatusOK, gin.H{
			"message":       "Screening approved & interview scheduled",
			"interviewId":   interviewID,
			"interviewLink": interviewLink,
			"scheduledAt":   scheduledAt,
		})
		return
	}

	// For non-approved statuses (rejected, etc), send notification
	if status == "rejected" || status == "failed" {
		go func() {
			screening, err := repository.GetScreeningByID(context.Background(), id)
			if err == nil && screening != nil && screening.Email != "" {
				emailService.SendScreeningResult(screening.Email, screening.CandidateName, payload.Status)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Screening status updated"})
}

// BulkScreeningResult represents the result of a single CV in bulk processing
type BulkScreeningResult struct {
	FileName       string   `json:"fileName"`
	Status         string   `json:"status"` // "success" or "error"
	Error          string   `json:"error,omitempty"`
	Score          int      `json:"score,omitempty"`
	MatchedSkills  []string `json:"matchedSkills,omitempty"`
	MissingSkills  []string `json:"missingSkills,omitempty"`
	Reasoning      string   `json:"reasoning,omitempty"`
	BiasCorrection string   `json:"biasCorrection,omitempty"`
	Confidence     float64  `json:"confidence,omitempty"`
	CandidateName  string   `json:"candidateName,omitempty"`
	Email          string   `json:"email,omitempty"`
	ScreeningID    int      `json:"screeningId,omitempty"`
}

// bulkScreeningHandler handles multiple CV uploads
func bulkScreeningHandler(c *gin.Context) {
	// Parse multipart form with 50MB max memory for bulk uploads
	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	jd := c.Request.FormValue("jd")
	jobIDStr := c.Request.FormValue("job_id")
	var jobID int
	if jobIDStr != "" {
		fmt.Sscanf(jobIDStr, "%d", &jobID)
	}

	if jd == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Job Description (jd) is required"})
		return
	}

	// Get multiple files
	form := c.Request.MultipartForm
	files := form.File["cv_files"]

	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No CV files uploaded. Use 'cv_files' field for multiple files"})
		return
	}

	// Previously the file count here was capped by nothing but the 50MB total request size —
	// with small PDFs that still allows hundreds of files in one request. Every file below
	// spawns its own goroutine that calls the OpenAI API (and sometimes Gemini too, for OCR
	// fallback), with no concurrency limit either, so a large batch meant hundreds of AI API
	// calls fired at once: real cost risk, real risk of tripping OpenAI/Gemini rate limits, and
	// real risk of exhausting this service's own goroutines/outbound connections. Cap the batch
	// size explicitly instead of relying on total-bytes as an indirect (and easily bypassed) limit.
	const maxBulkFiles = 20
	if len(files) > maxBulkFiles {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Too many files: %d uploaded, max %d per bulk screening request. Split into smaller batches.", len(files), maxBulkFiles),
		})
		return
	}

	log.Printf("Processing %d CV files for bulk screening", len(files))

	results := make([]BulkScreeningResult, len(files))

	// Create a channel to collect results and a WaitGroup to wait for goroutines
	type internalResult struct {
		index int
		res   BulkScreeningResult
	}
	resultChan := make(chan internalResult, len(files))
	var wg sync.WaitGroup

	// Bound how many files are actively being AI-analyzed at once, independent of how many
	// files are in the batch (still capped at maxBulkFiles above, but this also protects against
	// that cap being raised later without anyone revisiting the concurrency question).
	const maxConcurrentAICalls = 5
	sem := make(chan struct{}, maxConcurrentAICalls)

	log.Printf("Starting parallel processing for %d CV files (max %d concurrent AI calls)", len(files), maxConcurrentAICalls)

	// Process each file in a goroutine, bounded by sem
	for i, fileHeader := range files {
		wg.Add(1)
		go func(idx int, fh *multipart.FileHeader) {
			defer wg.Done()

			sem <- struct{}{}        // acquire a slot — blocks once maxConcurrentAICalls are in flight
			defer func() { <-sem }() // release the slot when this file is done

			res := BulkScreeningResult{
				FileName: fh.Filename,
				Status:   "processing",
			}

			// Open file
			file, err := fh.Open()
			if err != nil {
				res.Status = "error"
				res.Error = "Failed to open file"
				resultChan <- internalResult{idx, res}
				return
			}
			defer file.Close()

			// Check file size (5MB limit)
			if err := ValidateFileSize(fh.Size, 5); err != nil {
				res.Status = "error"
				res.Error = err.Error()
				resultChan <- internalResult{idx, res}
				return
			}

			// Validate file type
			contentType := fh.Header.Get("Content-Type")
			if contentType == "application/octet-stream" || contentType == "" {
				if strings.HasSuffix(strings.ToLower(fh.Filename), ".pdf") {
					contentType = "application/pdf"
				}
			}

			if err := ValidateFileType(contentType, []string{"application/pdf"}); err != nil {
				res.Status = "error"
				res.Error = "Only PDF files are allowed"
				resultChan <- internalResult{idx, res}
				return
			}

			// Extract text from file
			var cvText string

			if contentType == "application/pdf" {
				// Read into memory first
				fileBytes, readErr := io.ReadAll(file)
				if readErr != nil {
					log.Printf("Failed to read PDF %s: %v", fh.Filename, readErr)
					res.Status = "error"
					res.Error = "Failed to read PDF file"
					resultChan <- internalResult{idx, res}
					return
				}

				content, _ := ReadPdf(bytes.NewReader(fileBytes), fh.Size)
				cvText = content

				if len(strings.TrimSpace(cvText)) < 50 {
					log.Printf("[Bulk] PDF extraction returned insufficient content for %s: %d chars. Attempting Gemini OCR...", fh.Filename, len(strings.TrimSpace(cvText)))
					
					geminiText, geminiErr := ExtractTextWithGemini(fileBytes, contentType)
					if geminiErr == nil && len(strings.TrimSpace(geminiText)) >= 50 {
						log.Printf("[Bulk] Gemini OCR Fallback succeeded for %s: %d chars", fh.Filename, len(strings.TrimSpace(geminiText)))
						cvText = geminiText
					} else {
						if geminiErr != nil {
							log.Printf("[Bulk] Gemini OCR Fallback failed for %s: %v", fh.Filename, geminiErr)
						} else {
							log.Printf("[Bulk] Gemini OCR Fallback returned insufficient text for %s: %d chars", fh.Filename, len(strings.TrimSpace(geminiText)))
						}
						
						res.Status = "error"
						res.Error = "PDF image/scan not readable even after OCR"
						resultChan <- internalResult{idx, res}
						return
					}
				}

			} else {
				// Assume text file
				buf := new(bytes.Buffer)
				buf.ReadFrom(file)
				cvText = buf.String()
			}

			if cvText == "" {
				res.Status = "error"
				res.Error = "Empty CV content"
				resultChan <- internalResult{idx, res}
				return
			}

			// Analyze CV with AI
			aiResult, err := aiService.AnalyzeCV(context.Background(), jd, cvText)
			if err != nil {
				log.Printf("AI analysis error for %s: %v", fh.Filename, err)
				res.Status = "error"
				res.Error = "AI analysis failed"
				resultChan <- internalResult{idx, res}
				return
			}

			// Create or update candidate
			var candidateID int
			if aiResult.Email != "" {
				id, err := repository.CreateOrUpdateCandidate(context.Background(), aiResult.CandidateName, aiResult.Email, aiResult.Phone, cvText, aiResult.ExperienceYears, aiResult.Skills, aiResult.Education, aiResult.CurrentCompany, aiResult.CurrentPosition)
				if err != nil {
					log.Printf("Warning: Failed to create/update candidate for %s: %v", fh.Filename, err)
				} else {
					candidateID = id
				}
			}

			// Save screening result
			record, err := repository.SaveScreeningResult(context.Background(), candidateID, jobID, jd, cvText, aiResult)
			if err != nil {
				log.Printf("Warning: Failed to save screening for %s: %v", fh.Filename, err)
			}

			// Build success result
			res.Status = "success"
			res.Score = aiResult.Score
			res.MatchedSkills = aiResult.MatchedSkills
			res.MissingSkills = aiResult.MissingSkills
			res.Reasoning = aiResult.Reasoning
			res.BiasCorrection = aiResult.BiasCorrection
			res.Confidence = aiResult.Confidence
			res.CandidateName = aiResult.CandidateName
			res.Email = aiResult.Email
			if record != nil {
				res.ScreeningID = record.ID
			}

			log.Printf("✅ Successfully processed CV: %s (Score: %d)", fh.Filename, aiResult.Score)
			resultChan <- internalResult{idx, res}
		}(i, fileHeader)
	}

	// Close channel once all goroutines are done
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results from channel
	for item := range resultChan {
		results[item.index] = item.res
	}

	// Return all results
	c.JSON(http.StatusOK, gin.H{
		"total":     len(files),
		"processed": len(results),
		"results":   results,
	})
}

// allowedRecordingExtensions whitelists the file extensions recording uploads may be saved
// with — anything else (including a crafted filename with embedded path separators, used to
// attempt directory traversal) falls back to the safe default.
var allowedRecordingExtensions = map[string]bool{
	".webm": true, ".mp4": true, ".mov": true, ".ogg": true, ".wav": true, ".m4a": true,
}

// getExtension returns a safe, whitelisted file extension for the given client-supplied
// filename. It previously returned everything from the last "." to the end of the filename
// verbatim, which let an attacker embed path separators (e.g. "a.png/../../../tmp/evil") into
// the extension and, via the caller's fmt.Sprintf+os.Create, write outside the upload directory
// — this is reachable from unauthenticated candidate-facing endpoints (Module 13 fix).
func getExtension(filename string) string {
	ext := ".webm"
	if idx := strings.LastIndex(filename, "."); idx != -1 {
		candidate := strings.ToLower(filename[idx:])
		if allowedRecordingExtensions[candidate] {
			ext = candidate
		}
	}
	return ext
}

// getLeaderboardHandler retrieves the top candidates for a specific job
func getLeaderboardHandler(c *gin.Context) {
	jobIDStr := c.Param("id")
	limitStr := c.DefaultQuery("limit", "50")

	var jobID, limit int
	if _, err := fmt.Sscanf(jobIDStr, "%d", &jobID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Job ID"})
		return
	}
	if _, err := fmt.Sscanf(limitStr, "%d", &limit); err != nil {
		limit = 50
	}

	records, err := repository.GetLeaderboardByJob(c.Request.Context(), jobID, limit)
	if err != nil {
		log.Printf("ERROR in getLeaderboardHandler: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get leaderboard", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"jobId":   jobID,
		"records": records,
		"count":   len(records),
	})
}
