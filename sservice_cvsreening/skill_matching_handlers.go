package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// SKILL MATCHING HANDLERS
// =====================================================

// SkillMatchRequest represents the skill matching request
type SkillMatchRequest struct {
	JobID    int      `json:"jobId"`
	Skills   []string `json:"skills"`
	MinScore int      `json:"minScore"`
	Limit    int      `json:"limit"`
}

// SkillMatchCandidate represents a candidate in skill matching results
type SkillMatchCandidate struct {
	ID              int    `json:"id"`
	FullName        string `json:"fullName"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	CurrentCompany  string `json:"currentCompany"`
	CurrentPosition string `json:"currentPosition"`
	ExperienceYears int    `json:"experienceYears"`
	Status          string `json:"status"`
}

// SkillMatchResult represents a single match result
type SkillMatchResult struct {
	Candidate      SkillMatchCandidate `json:"candidate"`
	MatchedSkills  []string            `json:"matchedSkills"`
	MissingSkills  []string            `json:"missingSkills"`
	MatchScore     float64             `json:"matchScore"`
	ScreeningScore *int                `json:"screeningScore"`
}

func skillMatchingHandler(c *gin.Context) {
	var req SkillMatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Skills) == 0 && req.JobID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Either jobId or skills required"})
		return
	}

	if req.Limit <= 0 {
		req.Limit = 20
	}

	ctx := c.Request.Context()
	db := repository.GetDB()

	if !repository.IsDBConnected() {
		c.JSON(http.StatusOK, gin.H{"results": []SkillMatchResult{}, "total": 0})
		return
	}

	// If jobID provided, get skills from job requirements
	requiredSkills := req.Skills
	if req.JobID > 0 && len(requiredSkills) == 0 {
		job, err := repository.GetJobByID(ctx, req.JobID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		requiredSkills = extractSkillsFromText(job.Requirements)
	}

	if len(requiredSkills) == 0 {
		c.JSON(http.StatusOK, gin.H{"results": []SkillMatchResult{}, "total": 0})
		return
	}

	// Get all candidates with their skills
	rows, err := db.Query(ctx, `
		SELECT c.id, c.full_name, COALESCE(c.email, ''), COALESCE(c.phone, ''),
		       c.skills, COALESCE(c.current_company, ''), COALESCE(c.current_position, ''),
		       COALESCE(c.experience_years, 0), COALESCE(c.status, 'new')
		FROM candidates c
		WHERE c.deleted_at IS NULL
		ORDER BY c.created_at DESC
		LIMIT 200
	`)
	if err != nil {
		log.Printf("Failed to fetch candidates for skill matching: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch candidates"})
		return
	}
	defer rows.Close()

	var results []SkillMatchResult
	for rows.Next() {
		var candidate SkillMatchCandidate
		var skillsJSON []byte

		err := rows.Scan(&candidate.ID, &candidate.FullName, &candidate.Email, &candidate.Phone,
			&skillsJSON, &candidate.CurrentCompany, &candidate.CurrentPosition,
			&candidate.ExperienceYears, &candidate.Status)
		if err != nil {
			continue
		}

		var candidateSkills []string
		if skillsJSON != nil {
			if jsonErr := json.Unmarshal(skillsJSON, &candidateSkills); jsonErr != nil {
				continue
			}
		}

		// Calculate match
		matched, missing := matchSkills(requiredSkills, candidateSkills)
		if len(matched) == 0 {
			continue
		}

		matchScore := float64(len(matched)) / float64(len(requiredSkills)) * 100
		if req.MinScore > 0 && matchScore < float64(req.MinScore) {
			continue
		}

		result := SkillMatchResult{
			Candidate:     candidate,
			MatchedSkills: matched,
			MissingSkills: missing,
			MatchScore:    matchScore,
		}

		// Get screening score if available
		if req.JobID > 0 {
			var score int
			scanErr := db.QueryRow(ctx,
				"SELECT score FROM screenings WHERE candidate_id = $1 AND job_id = $2 ORDER BY created_at DESC LIMIT 1",
				candidate.ID, req.JobID).Scan(&score)
			if scanErr == nil {
				result.ScreeningScore = &score
			}
		}

		results = append(results, result)
	}

	// Sort by match score descending
	sort.Slice(results, func(i, j int) bool {
		if results[i].MatchScore == results[j].MatchScore {
			// Tie-break with experience years
			return results[i].Candidate.ExperienceYears > results[j].Candidate.ExperienceYears
		}
		return results[i].MatchScore > results[j].MatchScore
	})

	// Limit results
	if len(results) > req.Limit {
		results = results[:req.Limit]
	}

	if results == nil {
		results = []SkillMatchResult{}
	}

	c.JSON(http.StatusOK, gin.H{"results": results, "total": len(results)})
}

func matchSkills(required, candidate []string) (matched, missing []string) {
	candidateSet := make(map[string]bool)
	for _, s := range candidate {
		candidateSet[normalizeSkill(s)] = true
	}

	for _, s := range required {
		normalized := normalizeSkill(s)
		if candidateSet[normalized] {
			matched = append(matched, s)
		} else {
			missing = append(missing, s)
		}
	}
	return
}

func normalizeSkill(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	// Synonym mapping
	synonyms := map[string]string{
		"golang":     "go",
		"nodejs":     "node.js",
		"javascript": "js",
		"typescript": "ts",
		"reactjs":    "react",
		"vuejs":      "vue",
		"nextjs":     "next.js",
		"postgresql": "postgres",
		"mongodb":    "mongo",
		"docker":     "container",
		"k8s":        "kubernetes",
	}

	if canon, ok := synonyms[s]; ok {
		return canon
	}
	return s
}

func extractSkillsFromText(text string) []string {
	commonSkills := []string{
		"python", "java", "javascript", "typescript", "go", "golang", "react", "vue",
		"angular", "node.js", "nodejs", "sql", "postgresql", "mysql", "mongodb",
		"docker", "kubernetes", "aws", "gcp", "azure", "git", "rest", "graphql",
		"html", "css", "linux", "redis", "kafka", "rabbitmq", "elasticsearch",
		"machine learning", "deep learning", "data science", "devops", "ci/cd",
		"agile", "scrum", "microservices", "terraform", "jenkins", "rust", "elixir",
		"php", "laravel", "symfony", "django", "flask", "fastapi", "spring", "spring boot",
		"flutter", "dart", "react native", "swift", "kotlin", "ios", "android",
		"firebase", "supbase", "graphql", "apollo", "snowflake", "databricks",
	}

	textLower := strings.ToLower(text)
	var found []string
	seen := make(map[string]bool)

	for _, skill := range commonSkills {
		if containsSkill(textLower, skill) {
			norm := normalizeSkill(skill)
			if !seen[norm] {
				found = append(found, skill)
				seen[norm] = true
			}
		}
	}
	return found
}

func containsSkill(text, skill string) bool {
	for i := 0; i <= len(text)-len(skill); i++ {
		if text[i:i+len(skill)] == skill {
			return true
		}
	}
	return false
}

// DEPRECATED: Use sort.Slice instead
func sortByMatchScore(results []SkillMatchResult) {}

// Suppress unused import warning
var _ = fmt.Sprintf
