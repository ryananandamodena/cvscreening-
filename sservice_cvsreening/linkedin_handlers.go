package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// LINKEDIN IMPORT HANDLERS
// =====================================================

func importCandidateHandler(c *gin.Context) {
	var payload struct {
		Source  string                 `json:"source"`
		Profile map[string]interface{} `json:"profile"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if payload.Profile == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Profile data is required"})
		return
	}

	// Extract data from generic map
	profile := payload.Profile
	firstName, _ := profile["firstName"].(string)
	lastName, _ := profile["lastName"].(string)
	name := fmt.Sprintf("%s %s", firstName, lastName)
	email, _ := profile["email"].(string)
	headline, _ := profile["headline"].(string)
	summary, _ := profile["summary"].(string)
	location, _ := profile["location"].(string)
	phone := "" // Not usually available via LinkedIn import

	// If email is missing, generate a placeholder based on LinkedIn ID or Name
	if email == "" {
		id, _ := profile["id"].(string)
		if id != "" {
			email = fmt.Sprintf("linkedin-%s@placeholder.com", id)
		} else {
			// Fallback unique email
			email = fmt.Sprintf("linkedin-%d@placeholder.com", time.Now().UnixNano())
		}
	}

	// Skills
	var skills []string
	if s, ok := profile["skills"].([]interface{}); ok {
		for _, v := range s {
			if str, ok := v.(string); ok {
				skills = append(skills, str)
			}
		}
	}

	// Education
	var eduStrings []string
	if edus, ok := profile["educations"].([]interface{}); ok {
		for _, e := range edus {
			if eduMap, ok := e.(map[string]interface{}); ok {
				school, _ := eduMap["school"].(string)
				degree, _ := eduMap["degree"].(string)
				eduStrings = append(eduStrings, fmt.Sprintf("%s - %s", school, degree))
			}
		}
	}

	// Positions & Experience
	var experienceYears int
	var currentCompany, currentPosition string

	// Create CV Text representation
	var cvBuilder strings.Builder
	cvBuilder.WriteString(fmt.Sprintf("Name: %s\n", name))
	cvBuilder.WriteString(fmt.Sprintf("Email: %s\n", email))
	cvBuilder.WriteString(fmt.Sprintf("Headline: %s\n", headline))
	cvBuilder.WriteString(fmt.Sprintf("Location: %s\n", location))
	cvBuilder.WriteString(fmt.Sprintf("Summary: %s\n\n", summary))

	cvBuilder.WriteString("Experience:\n")
	if positions, ok := profile["positions"].([]interface{}); ok {
		experienceYears = calculateLinkedInExperience(positions)

		for i, p := range positions {
			if posMap, ok := p.(map[string]interface{}); ok {
				title, _ := posMap["title"].(string)
				company, _ := posMap["company"].(string)
				desc, _ := posMap["summary"].(string)

				isCurrent, _ := posMap["isCurrent"].(bool)
				if isCurrent && currentCompany == "" {
					currentCompany = company
					currentPosition = title
				}

				cvBuilder.WriteString(fmt.Sprintf("- %s at %s\n%s\n", title, company, desc))
			}
			if i == 0 && currentCompany == "" {
				// Fallback to first position if no current marked
				if posMap, ok := positions[0].(map[string]interface{}); ok {
					currentCompany, _ = posMap["company"].(string)
					currentPosition, _ = posMap["title"].(string)
				}
			}
		}
	}
	cvBuilder.WriteString("\nEducation:\n")
	for _, edu := range eduStrings {
		cvBuilder.WriteString(fmt.Sprintf("- %s\n", edu))
	}
	cvBuilder.WriteString("\nSkills:\n")
	cvBuilder.WriteString(strings.Join(skills, ", "))

	cvText := cvBuilder.String()

	id, err := repository.CreateOrUpdateCandidate(c.Request.Context(), name, email, phone, cvText, experienceYears, skills, eduStrings, currentCompany, currentPosition)
	if err != nil {
		log.Printf("Failed to import candidate: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save candidate"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "id": id, "message": "Candidate imported successfully"})
}

// searchLinkedInHandler simulates LinkedIn search (mock proxy)
func searchLinkedInHandler(c *gin.Context) {
	// For now, return empty or mock. The frontend handles mock if enabled.
	// If frontend calls this, it expects real data or a backend-side mock.
	// Let's return the simplified mock data structure to ensure it works even if frontend mock is disabled.

	var payload map[string]interface{}
	c.ShouldBindJSON(&payload) // Read body but ignore for basic mock

	c.JSON(http.StatusOK, gin.H{"candidates": []interface{}{}})
}

func calculateLinkedInExperience(positions []interface{}) int {
	totalMonths := 0
	now := time.Now()

	for _, p := range positions {
		posMap, ok := p.(map[string]interface{})
		if !ok {
			continue
		}

		startDateStr, _ := posMap["startDate"].(string) // "YYYY-MM"
		if startDateStr == "" {
			continue
		}

		start, err := time.Parse("2006-01", startDateStr)
		if err != nil {
			// Try YYYY only
			start, err = time.Parse("2006", startDateStr)
			if err != nil {
				continue
			}
		}

		var end time.Time
		isCurrent, _ := posMap["isCurrent"].(bool)
		endDateStr, _ := posMap["endDate"].(string)

		if isCurrent || endDateStr == "" {
			end = now
		} else {
			end, err = time.Parse("2006-01", endDateStr)
			if err != nil {
				end, err = time.Parse("2006", endDateStr)
				if err != nil {
					end = now // Fallback
				}
			}
		}

		// Calculate months
		months := int(end.Sub(start).Hours() / 24 / 30)
		if months < 0 {
			months = 0
		}
		totalMonths += months
	}

	return totalMonths / 12
}
