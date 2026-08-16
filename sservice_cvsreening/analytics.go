package main

import (
	"context"
	"fmt"
	"log"
	"math"
	"strings"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
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
		// No DB connection: return a zero-value payload rather than fabricated numbers.
		// Fake counts here would look like real business data to whoever views the dashboard.
		log.Printf("getAnalyticsHandler: database not connected, returning empty analytics")
		c.JSON(http.StatusOK, AnalyticsData{
			Pipeline:             []PipelineStage{},
			Sources:              []SourceStat{},
			Departments:          []DepartmentStat{},
			SkillsGap:            []SkillGapStat{},
			TimeToHireTrend:      []TimeToHireStat{},
			GeographicData:       []GeographicStat{},
			InterviewPerformance: []InterviewPerformance{},
		})
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

	// 7. Geographic
	data.GeographicData, err = GetGeographicAnalytics(ctx)
	if err != nil {
		log.Printf("Error getting geographic analytics: %v", err)
	}

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

	// Trends: last 30 days vs the 30 days before that, computed from real data — no
	// hardcoded/approximated percentages.
	trend, err := getTrendData(ctx, db)
	if err != nil {
		// Trend is a nice-to-have on top of the core stats above — a failure here shouldn't
		// fail the whole dashboard, but it must NOT fall back to fabricated percentages either.
		// Zero-value Trend (all 0%) is the honest "no comparable data" signal.
		log.Printf("GetOverviewStats: failed to compute trend data: %v", err)
		trend = Trend{}
	}
	stats.TrendData = trend

	return stats, nil
}

// getTrendData compares the last 30 days against the prior 30-day period for candidates
// created, candidates hired, and average time-to-hire, expressed as a percentage change.
func getTrendData(ctx context.Context, db *pgxpool.Pool) (Trend, error) {
	var currentCandidates, previousCandidates int
	var currentHired, previousHired int
	var currentTTH, previousTTH float64

	err := db.QueryRow(ctx, `
		SELECT COUNT(*) FROM candidates
		WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '30 days'
	`).Scan(&currentCandidates)
	if err != nil {
		return Trend{}, err
	}
	err = db.QueryRow(ctx, `
		SELECT COUNT(*) FROM candidates
		WHERE deleted_at IS NULL
		  AND created_at >= CURRENT_DATE - INTERVAL '60 days'
		  AND created_at < CURRENT_DATE - INTERVAL '30 days'
	`).Scan(&previousCandidates)
	if err != nil {
		return Trend{}, err
	}

	err = db.QueryRow(ctx, `
		SELECT COUNT(*) FROM candidates
		WHERE status = 'hired' AND deleted_at IS NULL AND hired_at >= CURRENT_DATE - INTERVAL '30 days'
	`).Scan(&currentHired)
	if err != nil {
		return Trend{}, err
	}
	err = db.QueryRow(ctx, `
		SELECT COUNT(*) FROM candidates
		WHERE status = 'hired' AND deleted_at IS NULL
		  AND hired_at >= CURRENT_DATE - INTERVAL '60 days'
		  AND hired_at < CURRENT_DATE - INTERVAL '30 days'
	`).Scan(&previousHired)
	if err != nil {
		return Trend{}, err
	}

	err = db.QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (hired_at - created_at))/86400), 0)
		FROM candidates
		WHERE status = 'hired' AND hired_at >= CURRENT_DATE - INTERVAL '30 days'
	`).Scan(&currentTTH)
	if err != nil {
		return Trend{}, err
	}
	err = db.QueryRow(ctx, `
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (hired_at - created_at))/86400), 0)
		FROM candidates
		WHERE status = 'hired'
		  AND hired_at >= CURRENT_DATE - INTERVAL '60 days'
		  AND hired_at < CURRENT_DATE - INTERVAL '30 days'
	`).Scan(&previousTTH)
	if err != nil {
		return Trend{}, err
	}

	return Trend{
		Candidates: percentChange(float64(currentCandidates), float64(previousCandidates)),
		Hired:      percentChange(float64(currentHired), float64(previousHired)),
		TimeToHire: percentChange(currentTTH, previousTTH),
	}, nil
}

// percentChange computes ((current - previous) / previous) * 100, business-safely handling
// previous == 0 (would otherwise produce +Inf/NaN): if there's nothing to compare against,
// report 0% change rather than a misleading infinite swing.
func percentChange(current, previous float64) float64 {
	if previous == 0 {
		return 0
	}
	return math.Round(((current-previous)/previous)*100*10) / 10
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
			COUNT(DISTINCT CASE WHEN c.status = 'hired' AND date_trunc('month', c.hired_at) = date_trunc('month', CURRENT_DATE) THEN c.id END) as hired_month,
			COUNT(DISTINCT CASE WHEN c.status = 'hired' AND date_trunc('month', c.hired_at) = date_trunc('month', CURRENT_DATE) - interval '1 month' THEN c.id END) as hired_last_month
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

	stats := []DepartmentStat{}
	for rows.Next() {
		var s DepartmentStat
		var hiredLastMonth int
		if err := rows.Scan(&s.Department, &s.TotalCandidates, &s.AvgScore, &s.MatchRate, &s.OpenPositions, &s.HiredThisMonth, &hiredLastMonth); err != nil {
			continue
		}
		s.MatchRate = math.Round(s.MatchRate)
		// Real month-over-month trend on hires — no fabricated percentage. 0 vs 0 reports
		// "0%" (nothing to compare), not a misleading swing.
		change := percentChange(float64(s.HiredThisMonth), float64(hiredLastMonth))
		sign := ""
		if change > 0 {
			sign = "+"
		}
		s.TrendPercent = fmt.Sprintf("%s%.1f%%", sign, change)
		stats = append(stats, s)
	}
	return stats, nil
}

func GetSkillsGap(ctx context.Context) ([]SkillGapStat, error) {
	// Demand = how often a skill shows up as "missing" across screenings (i.e. the role
	// wanted it but the candidate lacked it). Supply = how often that same skill shows up
	// as "matched" (candidates who actually have it) — both read straight from the
	// screening JSONB columns, no synthetic ratio.
	query := `
		WITH demand AS (
			SELECT skill, COUNT(*) as demand
			FROM screenings, jsonb_array_elements_text(missing_skills) as skill
			GROUP BY skill
		),
		supply AS (
			SELECT skill, COUNT(*) as supply
			FROM screenings, jsonb_array_elements_text(matched_skills) as skill
			GROUP BY skill
		)
		SELECT d.skill, d.demand, COALESCE(s.supply, 0)
		FROM demand d
		LEFT JOIN supply s ON s.skill = d.skill
		ORDER BY d.demand DESC
		LIMIT 6
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return []SkillGapStat{}, nil
	}
	defer rows.Close()

	stats := []SkillGapStat{}
	for rows.Next() {
		var s SkillGapStat
		if err := rows.Scan(&s.Skill, &s.Demand, &s.Supply); err != nil {
			continue
		}
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
		s.Industry = 24.0 // Industry benchmark, not a per-tenant figure — kept as a fixed reference line
		stats = append(stats, s)
	}
	return stats, nil
}

func GetInterviewPerformance(ctx context.Context) ([]InterviewPerformance, error) {
	// Group by category/type. In DB we have 'interview_type' (ai, phone, video).
	// Completion rate is real: completed interviews of that type over ALL interviews
	// scheduled of that type (not just the completed ones), so it reflects no-shows/
	// cancellations too instead of always reading 100%.
	query := `
		SELECT
			interview_type,
			COALESCE(AVG(rating) FILTER (WHERE status = 'completed'), 0) as avg_rating,
			COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
			COUNT(*) as total_count
		FROM interviews
		GROUP BY interview_type
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := []InterviewPerformance{}
	for rows.Next() {
		var itype string
		var rating float64
		var completedCount, totalCount int
		if err := rows.Scan(&itype, &rating, &completedCount, &totalCount); err != nil {
			continue
		}

		name := strings.Title(itype)
		if name == "Ai" {
			name = "AI Analysis"
		}

		score := (rating / 5.0) * 100 // Convert 5 star to 100 scale

		var completion float64
		if totalCount > 0 {
			completion = math.Round(float64(completedCount) / float64(totalCount) * 1000 / 10)
		}

		stats = append(stats, InterviewPerformance{
			Name:       name,
			Score:      math.Round(score),
			Completion: completion,
		})
	}

	// No fallback to fake data here — an empty slice tells the frontend to render its
	// empty state instead of a dashboard that looks populated but isn't real.
	return stats, nil
}

// GetGeographicAnalytics aggregates candidates by province (falling back to city, then
// "Unknown" when neither is on file — most historical candidates predate location capture).
// Score/hired counts come straight from the candidates/screenings tables; nothing here is
// fabricated, so an install with no location data simply returns a single "Unknown" bucket.
func GetGeographicAnalytics(ctx context.Context) ([]GeographicStat, error) {
	query := `
		SELECT
			COALESCE(NULLIF(c.province, ''), NULLIF(c.city, ''), 'Unknown') as location,
			COUNT(*) as candidates,
			COUNT(CASE WHEN c.status = 'hired' THEN 1 END) as hired,
			COALESCE(AVG(s.score), 0) as avg_score
		FROM candidates c
		LEFT JOIN screenings s ON s.candidate_id = c.id
		WHERE c.deleted_at IS NULL
		GROUP BY location
		ORDER BY candidates DESC
	`
	rows, err := repository.GetDB().Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := []GeographicStat{}
	for rows.Next() {
		var s GeographicStat
		if err := rows.Scan(&s.Location, &s.Candidates, &s.Hired, &s.AvgScore); err != nil {
			continue
		}
		s.AvgScore = math.Round(s.AvgScore*10) / 10
		stats = append(stats, s)
	}
	return stats, nil
}
