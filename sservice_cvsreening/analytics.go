package main

import (
	"context"
	"log"
	"math"
	"strings"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// AnalyticsData matches the frontend interface
type AnalyticsData struct {
	Overview             OverviewStats          `json:"overview"`
	Pipeline             []PipelineStage        `json:"pipeline"`
	Sources              []SourceStat           `json:"sources"`
	Departments          []DepartmentStat       `json:"departments"`
	SkillsGap            []SkillGapStat         `json:"skillsGap"`
	TimeToHireTrend      []TimeToHireStat       `json:"timeToHireTrend"`
	GeographicData       []GeographicStat       `json:"geographicData"`
	InterviewPerformance []InterviewPerformance `json:"interviewPerformance"`
}

type OverviewStats struct {
	TotalCandidates int     `json:"totalCandidates"`
	TotalHired      int     `json:"totalHired"`
	TotalRejected   int     `json:"totalRejected"`
	AvgTimeToHire   float64 `json:"avgTimeToHire"`
	AvgMatchScore   float64 `json:"avgMatchScore"`
	HiringRate      float64 `json:"hiringRate"`
	TrendData       Trend   `json:"trendData"`
}

type Trend struct {
	Candidates float64 `json:"candidates"`
	Hired      float64 `json:"hired"`
	TimeToHire float64 `json:"timeToHire"`
}

type PipelineStage struct {
	Name      string `json:"name"`
	Screen    int    `json:"screen"`
	Interview int    `json:"interview"`
	Hire      int    `json:"hire"`
	Rejected  int    `json:"rejected"`
}

type SourceStat struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
	Color string `json:"color"`
}

type DepartmentStat struct {
	Department      string  `json:"department"`
	MatchRate       float64 `json:"matchRate"`
	TrendPercent    string  `json:"trendPercent"`
	OpenPositions   int     `json:"openPositions"`
	HiredThisMonth  int     `json:"hiredThisMonth"`
	TotalCandidates int     `json:"-"`
	AvgScore        float64 `json:"-"`
}

type SkillGapStat struct {
	Skill  string `json:"skill"`
	Demand int    `json:"demand"`
	Supply int    `json:"supply"`
	Gap    int    `json:"gap"`
}

type TimeToHireStat struct {
	Month    string  `json:"month"`
	Days     float64 `json:"days"`
	Industry float64 `json:"industry"`
}

type GeographicStat struct {
	Location   string  `json:"location"`
	Candidates int     `json:"candidates"`
	Hired      int     `json:"hired"`
	AvgScore   float64 `json:"avgScore"`
}

type InterviewPerformance struct {
	Name       string  `json:"name"`
	Score      float64 `json:"score"`
	Completion float64 `json:"completion"`
}

// getAnalyticsHandler returns dashboard analytics
func getAnalyticsHandler(c *gin.Context) {
	ctx := c.Request.Context()

	if !repository.IsDBConnected() {
		// Return mock data for dev without DB
		c.JSON(http.StatusOK, getMockAnalyticsData())
		return
	}

	data := AnalyticsData{}
	var err error

	// 1. Overview
	data.Overview, err = GetOverviewStats(ctx)
	if err != nil {
		log.Printf("Error getting overview: %v", err)
	}

	// 2. Pipeline
	data.Pipeline, err = GetPipelineStats(ctx)
	if err != nil {
		log.Printf("Error getting pipeline: %v", err)
	}

	// 3. Departments
	data.Departments, err = GetDepartmentAnalytics(ctx)
	if err != nil {
		log.Printf("Error getting departments: %v", err)
	}

	// 4. Sources
	data.Sources, err = GetCandidateSources(ctx)
	if err != nil {
		log.Printf("Error getting sources: %v", err)
	}

	// 5. Skills Gap
	data.SkillsGap, err = GetSkillsGap(ctx)
	if err != nil {
		log.Printf("Error getting skills gap: %v", err)
	}

	// 6. Time To Hire
	data.TimeToHireTrend, err = GetTimeToHireTrend(ctx)
	if err != nil {
		log.Printf("Error getting time to hire: %v", err)
	}

	// 7. Geographic (Mock/Default)
	data.GeographicData = GetGeographicAnalytics() // No location data yet

	// 8. Interview Performance
	data.InterviewPerformance, err = GetInterviewPerformance(ctx)
	if err != nil {
		log.Printf("Error getting interview performance: %v", err)
	}

	c.JSON(http.StatusOK, data)
}

func GetOverviewStats(ctx context.Context) (OverviewStats, error) {
	stats := OverviewStats{}
	db := repository.GetDB()

	// Total Candidates
	err := db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE deleted_at IS NULL").Scan(&stats.TotalCandidates)
	if err != nil {
		return stats, err
	}

	// Total Hired
	err = db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE status = 'hired' AND deleted_at IS NULL").Scan(&stats.TotalHired)
	if err != nil {
		return stats, err
	}

	// Total Rejected
	err = db.QueryRow(ctx, "SELECT COUNT(*) FROM candidates WHERE status = 'rejected' AND deleted_at IS NULL").Scan(&stats.TotalRejected)
	if err != nil {
		return stats, err
	}

	// Avg Match Score from Screenings
	err = db.QueryRow(ctx, "SELECT COALESCE(AVG(score), 0) FROM screenings").Scan(&stats.AvgMatchScore)
	if err != nil {
		return stats, err
	}
	stats.AvgMatchScore = math.Round(stats.AvgMatchScore*10) / 10

	// Hiring Rate
	if stats.TotalCandidates > 0 {
		stats.HiringRate = float64(stats.TotalHired) / float64(stats.TotalCandidates) * 100
		stats.HiringRate = math.Round(stats.HiringRate*10) / 10
	}

	// Avg Time to Hire (days from created_at to hired_at)
	err = db.QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (hired_at - created_at))/86400), 0)
		FROM candidates 
		WHERE status = 'hired' AND hired_at IS NOT NULL
	`).Scan(&stats.AvgTimeToHire)
	stats.AvgTimeToHire = math.Round(stats.AvgTimeToHire*10) / 10

	// Trends (Mock/Calculated)
	// For real trends we'd compare with previous month. Approximating for now.
	stats.TrendData = Trend{
		Candidates: 12.5,  // +12.5%
		Hired:      8.2,   // +8.2%
		TimeToHire: -14.0, // -14% (faster)
	}

	return stats, nil
}

func GetPipelineStats(ctx context.Context) ([]PipelineStage, error) {
	// Monthly data for last 6 months
	query := `
		WITH months AS (
			SELECT generate_series(
				date_trunc('month', CURRENT_DATE) - interval '5 months',
				date_trunc('month', CURRENT_DATE),
				interval '1 month'
			) as month_start
		)
		SELECT 
			TO_CHAR(m.month_start, 'Mon') as name,
			(SELECT COUNT(*) FROM screenings s WHERE date_trunc('month', s.created_at) = m.month_start) as screen,
			(SELECT COUNT(*) FROM interviews i WHERE date_trunc('month', i.scheduled_at) = m.month_start) as interview,
			(SELECT COUNT(*) FROM candidates c WHERE c.status = 'hired' AND date_trunc('month', c.hired_at) = m.month_start) as hire,
			(SELECT COUNT(*) FROM candidates c WHERE c.status = 'rejected' AND date_trunc('month', c.updated_at) = m.month_start) as rejected
		FROM months m
		ORDER BY m.month_start
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stages []PipelineStage
	for rows.Next() {
		var s PipelineStage
		if err := rows.Scan(&s.Name, &s.Screen, &s.Interview, &s.Hire, &s.Rejected); err != nil {
			continue
		}
		stages = append(stages, s)
	}
	return stages, nil
}

func GetCandidateSources(ctx context.Context) ([]SourceStat, error) {
	// Infer source: LinkedIn URL exists -> LinkedIn, else Direct
	query := `
		SELECT 
			CASE 
				WHEN linkedin_url IS NOT NULL AND linkedin_url != '' THEN 'LinkedIn'
				ELSE 'Direct' 
			END as source_name,
			COUNT(*) as count
		FROM candidates
		WHERE deleted_at IS NULL
		GROUP BY source_name
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []SourceStat
	total := 0
	for rows.Next() {
		var s SourceStat
		if err := rows.Scan(&s.Name, &s.Value); err != nil {
			continue
		}
		if s.Name == "LinkedIn" {
			s.Color = "#0077B5"
		} else {
			s.Color = "#f59e0b" // Amber for Direct
		}
		stats = append(stats, s)
		total += s.Value
	}

	// Calculate percentages
	for i := range stats {
		if total > 0 {
			stats[i].Value = int(math.Round(float64(stats[i].Value) / float64(total) * 100))
		}
	}
	return stats, nil
}

func GetDepartmentAnalytics(ctx context.Context) ([]DepartmentStat, error) {
	query := `
		SELECT 
			COALESCE(j.department, 'General') as dept,
			COUNT(DISTINCT c.id) as total,
			COALESCE(AVG(s.score), 0) as avg_score,
			COALESCE(100.0 * COUNT(CASE WHEN s.score >= 70 THEN 1 END) / NULLIF(COUNT(s.id), 0), 0) as match_rate,
			COUNT(DISTINCT CASE WHEN j.status = 'active' THEN j.id END) as open_pos,
			COUNT(DISTINCT CASE WHEN c.status = 'hired' AND date_trunc('month', c.hired_at) = date_trunc('month', CURRENT_DATE) THEN c.id END) as hired_month
		FROM job_descriptions j
		LEFT JOIN screenings s ON s.job_id = j.id
		LEFT JOIN candidates c ON c.id = s.candidate_id
		WHERE j.deleted_at IS NULL
		GROUP BY j.department
		LIMIT 5
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []DepartmentStat
	for rows.Next() {
		var s DepartmentStat
		if err := rows.Scan(&s.Department, &s.TotalCandidates, &s.AvgScore, &s.MatchRate, &s.OpenPositions, &s.HiredThisMonth); err != nil {
			continue
		}
		s.MatchRate = math.Round(s.MatchRate)
		// Mock trend
		s.TrendPercent = "+2%"
		stats = append(stats, s)
	}
	return stats, nil
}

func GetSkillsGap(ctx context.Context) ([]SkillGapStat, error) {
	// Parse missing skills from screenings to find high demand gaps
	// Requires Postgres 9.3+ for lateral join or func
	// Simplified: Get top missing skills
	query := `
		SELECT 
			skill, COUNT(*) as demand
		FROM screenings,
		jsonb_array_elements_text(missing_skills) as skill
		GROUP BY skill
		ORDER BY demand DESC
		LIMIT 6
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		// Fallback if JSONB query fails or is empty
		return []SkillGapStat{}, nil
	}
	defer rows.Close()

	var stats []SkillGapStat
	for rows.Next() {
		var s SkillGapStat
		if err := rows.Scan(&s.Skill, &s.Demand); err != nil {
			continue
		}
		// Supply = those who have it (matched)
		// We can query matched_skills similarly, or just mock supply relative to demand to show a gap
		// Mocking supply for visual variety:
		s.Supply = int(float64(s.Demand) * 0.6)
		s.Gap = -(s.Demand - s.Supply)
		stats = append(stats, s)
	}
	return stats, nil
}

func GetTimeToHireTrend(ctx context.Context) ([]TimeToHireStat, error) {
	// Last 6 months
	query := `
		WITH months AS (
			SELECT generate_series(
				date_trunc('month', CURRENT_DATE) - interval '5 months',
				date_trunc('month', CURRENT_DATE),
				interval '1 month'
			) as month_start
		)
		SELECT 
			TO_CHAR(m.month_start, 'Mon') as month,
			COALESCE(AVG(EXTRACT(EPOCH FROM (c.hired_at - c.created_at))/86400), 0) as days
		FROM months m
		LEFT JOIN candidates c ON c.status = 'hired' AND date_trunc('month', c.hired_at) = m.month_start
		GROUP BY m.month_start
		ORDER BY m.month_start
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []TimeToHireStat
	for rows.Next() {
		var s TimeToHireStat
		if err := rows.Scan(&s.Month, &s.Days); err != nil {
			continue
		}
		s.Days = math.Round(s.Days*10) / 10
		s.Industry = 24.0 // Benchmark
		if s.Days == 0 {
			s.Days = 15.0 // Default if no data
		}
		stats = append(stats, s)
	}
	return stats, nil
}

func GetInterviewPerformance(ctx context.Context) ([]InterviewPerformance, error) {
	// Group by category/type. In DB we have 'interview_type' (ai, phone, video).
	// We can map these to categories.
	query := `
		SELECT 
			interview_type,
			COALESCE(AVG(rating), 0) as avg_rating,
			COUNT(*) as count
		FROM interviews
		WHERE status = 'completed'
		GROUP BY interview_type
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []InterviewPerformance
	for rows.Next() {
		var itype string
		var rating float64
		var count int
		if err := rows.Scan(&itype, &rating, &count); err != nil {
			continue
		}

		name := strings.Title(itype)
		if name == "Ai" {
			name = "AI Analysis"
		}

		score := (rating / 5.0) * 100 // Convert 5 star to 100 scale

		stats = append(stats, InterviewPerformance{
			Name:       name,
			Score:      math.Round(score),
			Completion: 90.0, // Mock completion rate
		})
	}

	if len(stats) == 0 {
		// Mock if empty
		stats = []InterviewPerformance{
			{Name: "Technical", Score: 82, Completion: 95},
			{Name: "Behavioral", Score: 78, Completion: 90},
		}
	}

	return stats, nil
}

func GetGeographicAnalytics() []GeographicStat {
	// Mock data since we don't have location in candidates table yet
	return []GeographicStat{
		{Location: "Jakarta", Candidates: 120, Hired: 12, AvgScore: 78.5},
		{Location: "Remote", Candidates: 85, Hired: 8, AvgScore: 82.0},
		{Location: "Bandung", Candidates: 45, Hired: 3, AvgScore: 76.0},
		{Location: "Surabaya", Candidates: 30, Hired: 2, AvgScore: 75.0},
	}
}

func getMockAnalyticsData() AnalyticsData {
	// Returns generic mock data
	return AnalyticsData{
		Overview: OverviewStats{
			TotalCandidates: 100, TotalHired: 5, TotalRejected: 20,
			AvgTimeToHire: 12, AvgMatchScore: 75, HiringRate: 5,
		},
	}
}
