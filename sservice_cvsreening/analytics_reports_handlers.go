package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// =====================================================
// ADVANCED ANALYTICS HANDLERS
// =====================================================

// AdvancedAnalytics contains comprehensive analytics data
type AdvancedAnalytics struct {
	// Basic stats
	TotalCandidates   int     `json:"totalCandidates"`
	TotalJobs         int     `json:"totalJobs"`
	TotalScreenings   int     `json:"totalScreenings"`
	TotalInterviews   int     `json:"totalInterviews"`
	AverageScore      float64 `json:"averageScore"`
	AverageTimeToHire float64 `json:"averageTimeToHire"`

	// Pipeline funnel
	Pipeline PipelineFunnel `json:"pipeline"`

	// Trends
	MonthlyTrends []MonthlyTrend `json:"monthlyTrends"`

	// Source stats
	SourceStats []AdvSourceStat `json:"sourceStats"`

	// Department stats
	DepartmentStats []AdvDepartmentStat `json:"departmentStats"`

	// Screening status breakdown
	ScreeningBreakdown StatusBreakdown `json:"screeningBreakdown"`

	// Interview status breakdown
	InterviewBreakdown StatusBreakdown `json:"interviewBreakdown"`

	// Top jobs
	TopJobs []TopJob `json:"topJobs"`
}

type PipelineFunnel struct {
	Applied     int `json:"applied"`
	Screened    int `json:"screened"`
	Interviewed int `json:"interviewed"`
	Offered     int `json:"offered"`
	Hired       int `json:"hired"`
}

type MonthlyTrend struct {
	Month      string `json:"month"`
	Candidates int    `json:"candidates"`
	Screenings int    `json:"screenings"`
	Interviews int    `json:"interviews"`
	Offers     int    `json:"offers"`
}

type AdvSourceStat struct {
	Source     string  `json:"source"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

type AdvDepartmentStat struct {
	Department string  `json:"department"`
	OpenJobs   int     `json:"openJobs"`
	Candidates int     `json:"candidates"`
	AvgScore   float64 `json:"avgScore"`
}

type StatusBreakdown struct {
	Pending int `json:"pending"`
	Passed  int `json:"passed"`
	Failed  int `json:"failed"`
	Review  int `json:"review"`
}

type TopJob struct {
	ID         int     `json:"id"`
	Title      string  `json:"title"`
	Department string  `json:"department"`
	Applicants int     `json:"applicants"`
	AvgScore   float64 `json:"avgScore"`
}

func getAdvancedAnalyticsHandler(c *gin.Context) {
	ctx := c.Request.Context()
	db := repository.GetDB()

	if !repository.IsDBConnected() {
		c.JSON(http.StatusOK, AdvancedAnalytics{})
		return
	}

	analytics := AdvancedAnalytics{}

	// Basic counts
	db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL").Scan(&analytics.TotalCandidates)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM job_descriptions WHERE deleted_at IS NULL AND (status = 'active' OR status IS NULL)").Scan(&analytics.TotalJobs)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings").Scan(&analytics.TotalScreenings)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews").Scan(&analytics.TotalInterviews)
	db.QueryRow(ctx, "SELECT COALESCE(AVG(score), 0) FROM screenings").Scan(&analytics.AverageScore)

	// Average time to hire (days from candidate creation to hired_at)
	db.QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (hired_at - created_at)) / 86400), 0)
		FROM candidates 
		WHERE hired_at IS NOT NULL AND deleted_at IS NULL
	`).Scan(&analytics.AverageTimeToHire)

	// Pipeline funnel
	db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL").Scan(&analytics.Pipeline.Applied)
	db.QueryRow(ctx, "SELECT COUNT(DISTINCT candidate_id) FROM screenings WHERE candidate_id IS NOT NULL").Scan(&analytics.Pipeline.Screened)
	db.QueryRow(ctx, "SELECT COUNT(DISTINCT candidate_id) FROM interviews WHERE candidate_id IS NOT NULL").Scan(&analytics.Pipeline.Interviewed)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM offer_letters").Scan(&analytics.Pipeline.Offered)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM offer_letters WHERE status = 'accepted'").Scan(&analytics.Pipeline.Hired)

	// Monthly trends (last 6 months)
	now := time.Now()
	for i := 5; i >= 0; i-- {
		month := now.AddDate(0, -i, 0)
		monthStr := month.Format("2006-01")
		startDate := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
		endDate := startDate.AddDate(0, 1, 0)

		trend := MonthlyTrend{Month: monthStr}
		db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE created_at >= $1 AND created_at < $2 AND deleted_at IS NULL", startDate, endDate).Scan(&trend.Candidates)
		db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings WHERE created_at >= $1 AND created_at < $2", startDate, endDate).Scan(&trend.Screenings)
		db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews WHERE created_at >= $1 AND created_at < $2", startDate, endDate).Scan(&trend.Interviews)
		db.QueryRow(ctx, "SELECT COUNT(*) FROM offer_letters WHERE created_at >= $1 AND created_at < $2", startDate, endDate).Scan(&trend.Offers)
		analytics.MonthlyTrends = append(analytics.MonthlyTrends, trend)
	}

	// Screening status breakdown
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings WHERE status = 'pending' OR status IS NULL").Scan(&analytics.ScreeningBreakdown.Pending)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings WHERE status = 'passed'").Scan(&analytics.ScreeningBreakdown.Passed)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings WHERE status = 'failed'").Scan(&analytics.ScreeningBreakdown.Failed)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings WHERE status = 'review'").Scan(&analytics.ScreeningBreakdown.Review)

	// Interview status breakdown
	db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews WHERE status = 'scheduled'").Scan(&analytics.InterviewBreakdown.Pending)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews WHERE status = 'completed'").Scan(&analytics.InterviewBreakdown.Passed)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews WHERE status = 'cancelled'").Scan(&analytics.InterviewBreakdown.Failed)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews WHERE status = 'in_progress'").Scan(&analytics.InterviewBreakdown.Review)

	// Department stats
	deptRows, err := db.Query(ctx, `
		SELECT COALESCE(j.department, 'Unassigned'), 
		       COUNT(DISTINCT j.id) as open_jobs,
		       COUNT(DISTINCT s.candidate_id) as candidates,
		       COALESCE(AVG(s.score), 0) as avg_score
		FROM job_descriptions j
		LEFT JOIN screenings s ON j.id = s.job_id
		WHERE j.deleted_at IS NULL AND (j.status = 'active' OR j.status IS NULL)
		GROUP BY j.department
		ORDER BY open_jobs DESC
		LIMIT 10
	`)
	if err == nil {
		defer deptRows.Close()
		for deptRows.Next() {
			var ds AdvDepartmentStat
			deptRows.Scan(&ds.Department, &ds.OpenJobs, &ds.Candidates, &ds.AvgScore)
			analytics.DepartmentStats = append(analytics.DepartmentStats, ds)
		}
	}

	// Top jobs by applicants
	topRows, err := db.Query(ctx, `
		SELECT j.id, COALESCE(j.title, ''), COALESCE(j.department, ''),
		       COUNT(s.id) as applicants,
		       COALESCE(AVG(s.score), 0) as avg_score
		FROM job_descriptions j
		LEFT JOIN screenings s ON j.id = s.job_id
		WHERE j.deleted_at IS NULL
		GROUP BY j.id, j.title, j.department
		ORDER BY applicants DESC
		LIMIT 5
	`)
	if err == nil {
		defer topRows.Close()
		for topRows.Next() {
			var tj TopJob
			topRows.Scan(&tj.ID, &tj.Title, &tj.Department, &tj.Applicants, &tj.AvgScore)
			analytics.TopJobs = append(analytics.TopJobs, tj)
		}
	}

	// Source stats (based on how candidates entered the system)
	analytics.SourceStats = []AdvSourceStat{
		{Source: "Direct Application", Count: analytics.TotalCandidates, Percentage: 100},
	}

	// Try to get LinkedIn import count
	var linkedinCount int
	if err := db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE linkedin_url IS NOT NULL AND linkedin_url != '' AND deleted_at IS NULL").Scan(&linkedinCount); err == nil && linkedinCount > 0 {
		directCount := analytics.TotalCandidates - linkedinCount
		total := float64(analytics.TotalCandidates)
		if total > 0 {
			analytics.SourceStats = []AdvSourceStat{
				{Source: "Direct Application", Count: directCount, Percentage: float64(directCount) / total * 100},
				{Source: "LinkedIn", Count: linkedinCount, Percentage: float64(linkedinCount) / total * 100},
			}
		}
	}

	c.JSON(http.StatusOK, analytics)
}

// =====================================================
// REPORTS HANDLERS
// =====================================================

// ReportSummary contains summary data for report generation
type ReportSummary struct {
	Screenings []ReportScreening  `json:"screenings"`
	Interviews []ReportInterview  `json:"interviews"`
	Analytics  ReportAnalyticData `json:"analytics"`
}

type ReportScreening struct {
	ID            int    `json:"id"`
	CandidateName string `json:"candidateName"`
	Email         string `json:"email"`
	JobTitle      string `json:"jobTitle"`
	Score         int    `json:"score"`
	Status        string `json:"status"`
	CreatedAt     string `json:"createdAt"`
}

type ReportInterview struct {
	ID            int     `json:"id"`
	CandidateName string  `json:"candidateName"`
	JobTitle      string  `json:"jobTitle"`
	InterviewDate string  `json:"interviewDate"`
	Status        string  `json:"status"`
	OverallScore  float64 `json:"overallScore"`
}

type ReportAnalyticData struct {
	TotalCandidates int     `json:"totalCandidates"`
	TotalJobs       int     `json:"totalJobs"`
	TotalScreenings int     `json:"totalScreenings"`
	TotalInterviews int     `json:"totalInterviews"`
	AverageScore    float64 `json:"averageScore"`
	PassRate        float64 `json:"passRate"`
}

func getReportsDataHandler(c *gin.Context) {
	ctx := c.Request.Context()
	db := repository.GetDB()

	if !repository.IsDBConnected() {
		c.JSON(http.StatusOK, ReportSummary{})
		return
	}

	report := ReportSummary{}

	// Get recent screenings for reports
	sRows, err := db.Query(ctx, `
		SELECT s.id, COALESCE(c.full_name, 'Unknown'), COALESCE(c.email, ''),
		       COALESCE(j.title, 'N/A'), s.score, COALESCE(s.status, 'pending'), s.created_at
		FROM screenings s
		LEFT JOIN candidates c ON s.candidate_id = c.id
		LEFT JOIN job_descriptions j ON s.job_id = j.id
		ORDER BY s.created_at DESC
		LIMIT 100
	`)
	if err == nil {
		defer sRows.Close()
		for sRows.Next() {
			var rs ReportScreening
			var createdAt time.Time
			sRows.Scan(&rs.ID, &rs.CandidateName, &rs.Email, &rs.JobTitle, &rs.Score, &rs.Status, &createdAt)
			rs.CreatedAt = createdAt.Format(time.RFC3339)
			report.Screenings = append(report.Screenings, rs)
		}
	}

	// Get recent interviews for reports
	iRows, err := db.Query(ctx, `
		SELECT i.id, COALESCE(c.full_name, 'Unknown'), COALESCE(j.title, 'N/A'),
		       COALESCE(i.scheduled_at::text, i.created_at::text), COALESCE(i.status, 'scheduled'),
		       COALESCE(i.rating, 0)
		FROM interviews i
		LEFT JOIN candidates c ON i.candidate_id = c.id
		LEFT JOIN job_descriptions j ON i.job_id = j.id
		ORDER BY i.created_at DESC
		LIMIT 100
	`)
	if err == nil {
		defer iRows.Close()
		for iRows.Next() {
			var ri ReportInterview
			iRows.Scan(&ri.ID, &ri.CandidateName, &ri.JobTitle, &ri.InterviewDate, &ri.Status, &ri.OverallScore)
			report.Interviews = append(report.Interviews, ri)
		}
	}

	// Analytics summary
	db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL").Scan(&report.Analytics.TotalCandidates)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM job_descriptions WHERE deleted_at IS NULL AND (status = 'active' OR status IS NULL)").Scan(&report.Analytics.TotalJobs)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings").Scan(&report.Analytics.TotalScreenings)
	db.QueryRow(ctx, "SELECT COUNT(*) FROM interviews").Scan(&report.Analytics.TotalInterviews)
	db.QueryRow(ctx, "SELECT COALESCE(AVG(score), 0) FROM screenings").Scan(&report.Analytics.AverageScore)

	// Pass rate
	var passed int
	db.QueryRow(ctx, "SELECT COUNT(*) FROM screenings WHERE status = 'passed'").Scan(&passed)
	if report.Analytics.TotalScreenings > 0 {
		report.Analytics.PassRate = float64(passed) / float64(report.Analytics.TotalScreenings) * 100
	}

	if report.Screenings == nil {
		report.Screenings = []ReportScreening{}
	}
	if report.Interviews == nil {
		report.Interviews = []ReportInterview{}
	}

	c.JSON(http.StatusOK, report)
}

func getScreeningReportHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	screening, err := repository.GetScreeningByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Screening not found"})
		return
	}

	c.JSON(http.StatusOK, screening)
}

func getInterviewReportHandler(c *gin.Context) {
	idStr := c.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	interview, err := repository.GetInterviewByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Interview not found"})
		return
	}

	// Also get scorecard if available
	scorecard, _ := repository.GetScorecardByInterviewID(c.Request.Context(), id)

	c.JSON(http.StatusOK, gin.H{
		"interview": interview,
		"scorecard": scorecard,
	})
}
