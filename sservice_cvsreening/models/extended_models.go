package models

import "time"

// ==================== PERFORMANCE MANAGEMENT ====================

// PerformanceReview represents an employee performance review cycle
type PerformanceReview struct {
	ID                 int        `json:"id"`
	EmployeeID         int        `json:"employeeId"`
	ReviewerID         *int       `json:"reviewerId,omitempty"`
	ReviewPeriod       string     `json:"reviewPeriod"` // e.g. "2026-H1"
	ReviewType         string     `json:"reviewType"`   // mid_year, annual, probation
	Status             string     `json:"status"`       // draft, self_assessment, manager_review, calibration, approved, completed
	OverallRating      float64    `json:"overallRating"`
	OverallRatingLabel string     `json:"overallRatingLabel"`
	QuantitativeScore  float64    `json:"quantitativeScore"`
	QualitativeScore   float64    `json:"qualitativeScore"`
	Achievements       string     `json:"achievements"`
	Challenges         string     `json:"challenges"`
	DevelopmentPlan    string     `json:"developmentPlan"`
	ManagerComments    string     `json:"managerComments"`
	EmployeeComments   string     `json:"employeeComments"`
	AISentimentScore   string     `json:"aiSentimentScore,omitempty"`
	AISummary          string     `json:"aiSummary,omitempty"`
	DueDate            *time.Time `json:"dueDate,omitempty"`
	SubmittedAt        *time.Time `json:"submittedAt,omitempty"`
	ApprovedAt         *time.Time `json:"approvedAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`

	// Joined
	EmployeeName string             `json:"employeeName,omitempty"`
	ReviewerName string             `json:"reviewerName,omitempty"`
	Goals        []PerformanceGoal  `json:"goals,omitempty"`
}

// PerformanceGoal represents an employee's OKR/goal
type PerformanceGoal struct {
	ID          int        `json:"id"`
	EmployeeID  int        `json:"employeeId"`
	ReviewID    *int       `json:"reviewId,omitempty"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"` // individual, team, company
	Weight      int        `json:"weight"`   // percentage weight (0-100)
	Target      string     `json:"target"`
	Current     string     `json:"current"`
	Status      string     `json:"status"` // not_started, in_progress, completed, overdue
	StartDate   time.Time  `json:"startDate"`
	DueDate     time.Time  `json:"dueDate"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// PerformanceReviewFilter for list queries
type PerformanceReviewFilter struct {
	EmployeeID int    `form:"employeeId"`
	ReviewerID int    `form:"reviewerId"`
	Status     string `form:"status"`
	Period     string `form:"period"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

// ==================== TRAINING & DEVELOPMENT ====================

// TrainingProgram represents a training course or program
type TrainingProgram struct {
	ID          int        `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Category    string     `json:"category"` // technical, soft_skill, leadership, compliance
	Format      string     `json:"format"`   // online, offline, hybrid
	Provider    string     `json:"provider"`
	Duration    int        `json:"duration"` // hours
	MaxSlots    int        `json:"maxSlots"`
	FilledSlots int        `json:"filledSlots"`
	StartDate   *time.Time `json:"startDate,omitempty"`
	EndDate     *time.Time `json:"endDate,omitempty"`
	Status      string     `json:"status"` // planned, ongoing, completed, cancelled
	Cost        float64    `json:"cost"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// TrainingEnrollment represents an employee enrolled in a training
type TrainingEnrollment struct {
	ID         int        `json:"id"`
	ProgramID  int        `json:"programId"`
	EmployeeID int        `json:"employeeId"`
	Status     string     `json:"status"` // enrolled, completed, cancelled, no_show
	Score      *float64   `json:"score,omitempty"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`

	// Joined
	EmployeeName  string `json:"employeeName,omitempty"`
	ProgramTitle  string `json:"programTitle,omitempty"`
}

// ==================== BENEFITS ====================

// BenefitPlan represents a company benefit plan (health, life insurance, etc.)
type BenefitPlan struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"` // health, life, dental, vision, pension, other
	Provider    string  `json:"provider"`
	Description string  `json:"description"`
	CoverageAmount float64 `json:"coverageAmount"`
	EmployeeContribution float64 `json:"employeeContribution"`
	EmployerContribution float64 `json:"employerContribution"`
	IsActive    bool    `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// EmployeeBenefit represents an employee's enrollment in a benefit plan
type EmployeeBenefit struct {
	ID          int        `json:"id"`
	EmployeeID  int        `json:"employeeId"`
	PlanID      int        `json:"planId"`
	StartDate   time.Time  `json:"startDate"`
	EndDate     *time.Time `json:"endDate,omitempty"`
	Status      string     `json:"status"` // active, inactive
	CreatedAt   time.Time  `json:"createdAt"`

	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
	PlanName     string `json:"planName,omitempty"`
	PlanCategory string `json:"planCategory,omitempty"`
}

// ==================== COMPENSATION ====================

// CompensationBand represents salary bands for positions
type CompensationBand struct {
	ID         int     `json:"id"`
	PositionID int     `json:"positionId"`
	Level      string  `json:"level"` // junior, mid, senior, lead, manager
	MinSalary  float64 `json:"minSalary"`
	MaxSalary  float64 `json:"maxSalary"`
	Currency   string  `json:"currency"`
	Year       int     `json:"year"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	// Joined
	PositionName string `json:"positionName,omitempty"`
}

// ==================== SUCCESSION PLANNING ====================

// SuccessionPlan represents a succession plan for a key position
type SuccessionPlan struct {
	ID            int    `json:"id"`
	PositionID    int    `json:"positionId"`
	IncumbentID   *int   `json:"incumbentId,omitempty"`
	Priority      string `json:"priority"` // critical, high, medium, low
	Notes         string `json:"notes"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`

	// Joined
	PositionName   string              `json:"positionName,omitempty"`
	IncumbentName  string              `json:"incumbentName,omitempty"`
	Candidates     []SuccessionCandidate `json:"candidates,omitempty"`
}

// SuccessionCandidate represents a potential successor for a position
type SuccessionCandidate struct {
	ID         int    `json:"id"`
	PlanID     int    `json:"planId"`
	EmployeeID int    `json:"employeeId"`
	Readiness  string `json:"readiness"` // ready_now, 1_2_years, 2_5_years
	Notes      string `json:"notes"`
	CreatedAt  time.Time `json:"createdAt"`

	// Joined
	EmployeeName     string  `json:"employeeName,omitempty"`
	EmployeePosition string  `json:"employeePosition,omitempty"`
	PerformanceScore float64 `json:"performanceScore,omitempty"`
}

// ==================== DOCUMENT MANAGEMENT ====================

// CompanyDocument represents a policy, SOP, or template document
type CompanyDocument struct {
	ID           int        `json:"id"`
	Title        string     `json:"title"`
	Category     string     `json:"category"` // policy, sop, template, announcement, other
	Description  string     `json:"description"`
	FilePath     string     `json:"filePath"`
	FileSize     int64      `json:"fileSize"`
	MimeType     string     `json:"mimeType"`
	Version      string     `json:"version"`
	IsPublic     bool       `json:"isPublic"`
	UploadedBy   *int       `json:"uploadedBy,omitempty"`
	EffectiveDate *time.Time `json:"effectiveDate,omitempty"`
	ExpiryDate   *time.Time `json:"expiryDate,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`

	// Joined
	UploaderName string `json:"uploaderName,omitempty"`
}
