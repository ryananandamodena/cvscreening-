package models

import (
	"encoding/json"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ScreeningRequest represents the input payload
type ScreeningRequest struct {
	JD string `json:"jd"`
	CV string `json:"cv"`
}

// ScreeningResult matches the frontend interface with comprehensive scoring
type ScreeningResult struct {
	Score              int      `json:"score"`
	Recommendation     string   `json:"recommendation"`
	Confidence         float64  `json:"confidence"`
	Explanation        string   `json:"explanation"`
	MatchedSkills      []string `json:"matchedSkills"`
	MissingSkills      []string `json:"missingSkills"`
	Reasoning          string   `json:"reasoning"`
	BiasCorrection     string   `json:"biasCorrection"`
	WeightedScore      float64  `json:"weightedScore"`
	TechnicalScore     int      `json:"technicalScore"`
	CommunicationScore int      `json:"communicationScore"`
	CultureFitScore    int      `json:"cultureFitScore"`
	ExperienceScore    int      `json:"experienceScore"`
	ExperienceYears    int      `json:"experienceYears"`
	CandidateName      string   `json:"candidateName"`
	Email              string   `json:"email"`
	Phone              string   `json:"phone"`
	Skills             []string `json:"skills"`
	Education          []string `json:"education"`
	CurrentCompany     string   `json:"currentCompany"`
	CurrentPosition    string   `json:"currentPosition"`
}

// User represents a system user
type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"fullName"`
	Role         string    `json:"role"`
	Department   string    `json:"department"`
	IsActive     bool      `json:"isActive"`
	LastLogin    time.Time `json:"lastLogin"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// JobDescription represents a job opening
type JobDescription struct {
	ID             int       `json:"id"`
	Title          string    `json:"title"`
	Department     string    `json:"department"`
	Description    string    `json:"description"`
	Requirements   string    `json:"requirements"`
	Location       string    `json:"location"`
	EmploymentType string    `json:"employmentType"`
	SalaryMin      float64   `json:"salaryMin"`
	SalaryMax      float64   `json:"salaryMax"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// PaginatedResponse represents a paginated result
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"totalPages"`
}

// Candidate represents a job applicant
type Candidate struct {
	ID              int       `json:"id"`
	FullName        string    `json:"fullName"`
	Email           string    `json:"email"`
	Phone           string    `json:"phone"`
	CVContent       string    `json:"cvContent"` // Matches repository
	Status          string    `json:"status"`    // new, screening, interview, offer, hired, rejected
	ExperienceYears int       `json:"experienceYears"`
	Skills          []string  `json:"skills"`
	Education       []string  `json:"education"`
	CurrentCompany  string    `json:"currentCompany"`
	CurrentPosition string    `json:"currentPosition"`
	City            string    `json:"city,omitempty"`
	Province        string    `json:"province,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// Screening represents a screening record
type Screening struct {
	ID             int             `json:"id"`
	JobID          int             `json:"jobId"`
	CandidateID    int             `json:"candidateId"`
	Score          int             `json:"score"`
	Result         ScreeningResult `json:"result"` // Stored as JSONB
	Status         string          `json:"status"` // pending, completed, failed
	CreatedAt      time.Time       `json:"createdAt"`
	JobTitle       string          `json:"jobTitle,omitempty"`
	CandidateName  string          `json:"candidateName,omitempty"`
	CandidateEmail string          `json:"candidateEmail,omitempty"`
}

// Interview represents an interview record
type Interview struct {
	ID            int       `json:"id"`
	CandidateID   int       `json:"candidateId"`
	JobID         int       `json:"jobId"`
	JobTitle      string    `json:"jobTitle"`      // Join
	InterviewType string    `json:"interviewType"` // DB column: interview_type
	ScheduledAt   time.Time `json:"scheduledAt"`
	Interviewer   string    `json:"interviewer"` // DB column: interviewer
	Status        string    `json:"status"`
	Rating        int       `json:"rating"`
	Notes         string    `json:"notes"`
	RecordingPath string    `json:"recordingPath"`
	Transcript    string    `json:"transcript"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`

	// Included for response convenience (from Joins)
	CandidateName string `json:"candidateName,omitempty"`
}

// Question represents a question in the question bank
// InterviewQuestion represents a question in the question bank or for an interview
type InterviewQuestion struct {
	ID             int       `json:"id"`
	JobID          int       `json:"jobId"`
	Question       string    `json:"question"`
	ExpectedAnswer string    `json:"expectedAnswer,omitempty"`
	Category       string    `json:"category"`
	Difficulty     string    `json:"difficulty"`
	IsRequired     bool      `json:"isRequired"`
	OrderNum       int       `json:"orderNum"`
	CreatedAt      time.Time `json:"createdAt"`
}

// InterviewResponse represents a candidate's answer to an interview question
type InterviewResponse struct {
	ID          int       `json:"id"`
	InterviewID int       `json:"interviewId"`
	QuestionID  int       `json:"questionId"`
	Response    string    `json:"response"`
	Score       int       `json:"score"`
	Feedback    string    `json:"feedback"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Settings represents application settings
type Settings struct {
	ID          int    `json:"id"`
	Key         string `json:"key"`
	Value       string `json:"value"`
	Description string `json:"description"`
	Category    string `json:"category"`
	IsPublic    bool   `json:"isPublic"`
}

// Claims for JWT (Moved from auth.go)
type Claims struct {
	UserID int    `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// InterviewQuestionResponse represents a saved answer for a specific question
type InterviewQuestionResponse struct {
	ID                       int             `json:"id"`
	InterviewID              int             `json:"interviewId"`
	QuestionID               *int            `json:"questionId,omitempty"`
	QuestionText             string          `json:"questionText"`
	QuestionOrder            int             `json:"questionOrder"`
	AnswerText               string          `json:"answerText,omitempty"`
	RecordingPath            string          `json:"recordingPath,omitempty"`
	RecordingDurationSeconds int             `json:"recordingDurationSeconds,omitempty"`
	SentimentScore           float64         `json:"sentimentScore,omitempty"`
	AIAnalysis               json.RawMessage `json:"aiAnalysis,omitempty"` // stored as JSONB
	CreatedAt                time.Time       `json:"createdAt"`
	UpdatedAt                time.Time       `json:"updatedAt"`
}

// InterviewDetail is a view model for interview details
type InterviewDetail struct {
	ID            int        `json:"id"`
	CandidateID   int        `json:"candidateId"`
	JobID         int        `json:"jobId"`
	CandidateName string     `json:"candidateName"`
	JobTitle      string     `json:"jobTitle"`
	InterviewType string     `json:"interviewType"`
	ScheduledAt   *time.Time `json:"scheduledAt"`
	Status        string     `json:"status"`
	Transcript    string     `json:"transcript"`
	RecordingPath string     `json:"recordingPath"`
	Rating        int        `json:"rating"`
	Notes         string     `json:"notes"`
	AIEvaluation  string     `json:"aiEvaluation"`
	CreatedAt     time.Time  `json:"createdAt"`
}

// Assessment represents an online test
type Assessment struct {
	ID                     int       `json:"id"`
	Title                  string    `json:"title"`
	Description            string    `json:"description"`
	AssessmentType         string    `json:"assessmentType"`
	DurationMinutes        int       `json:"durationMinutes"`
	PassingScore           int       `json:"passingScore"`
	MaxAttempts            int       `json:"maxAttempts"`
	ShuffleQuestions       bool      `json:"shuffleQuestions"`
	ShowResultsImmediately bool      `json:"showResultsImmediately"`
	Status                 string    `json:"status"`
	JobID                  int       `json:"jobId"`
	CreatedBy              int       `json:"createdBy"`
	CreatedAt              time.Time `json:"createdAt"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

// AssessmentQuestion represents a question in an assessment
type AssessmentQuestion struct {
	ID            int             `json:"id"`
	AssessmentID  int             `json:"assessmentId"`
	QuestionText  string          `json:"questionText"`
	QuestionType  string          `json:"questionType"`
	Options       json.RawMessage `json:"options"`
	CorrectAnswer json.RawMessage `json:"correctAnswer"`
	Points        int             `json:"points"`
	Difficulty    string          `json:"difficulty"`
	Category      string          `json:"category"`
	Explanation   string          `json:"explanation"`
	OrderNum      int             `json:"orderNum"`
	ImageURL      string          `json:"imageUrl"`
	CodeTemplate  string          `json:"codeTemplate"`
	CreatedAt     time.Time       `json:"createdAt"`
}

// AssessmentAttempt represents a candidate's attempt at an assessment
type AssessmentAttempt struct {
	ID               int             `json:"id"`
	AssessmentID     int             `json:"assessmentId"`
	CandidateID      int             `json:"candidateId"`
	JobID            int             `json:"jobId"`
	ApplicationID    int             `json:"applicationId"`
	Status           string          `json:"status"`
	StartedAt        *time.Time      `json:"startedAt"`
	SubmittedAt      *time.Time      `json:"submittedAt"`
	TimeSpentSeconds int             `json:"timeSpentSeconds"`
	TotalScore       float64         `json:"totalScore"`
	Passed           bool            `json:"passed"`
	ProctoringData   json.RawMessage `json:"proctoringData"`
	IPAddress        string          `json:"ipAddress"`
	UserAgent        string          `json:"userAgent"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

// AssessmentAnswer represents a candidate's answer to a specific question
type AssessmentAnswer struct {
	ID               int             `json:"id"`
	AttemptID        int             `json:"attemptId"`
	QuestionID       int             `json:"questionId"`
	Answer           json.RawMessage `json:"answer"`
	IsCorrect        bool            `json:"isCorrect"`
	PointsEarned     int             `json:"pointsEarned"`
	TimeSpentSeconds int             `json:"timeSpentSeconds"`
	AIEvaluation     json.RawMessage `json:"aiEvaluation"`
	CreatedAt        time.Time       `json:"createdAt"`
}

// SearchFilters defines criteria for searching candidates
type SearchFilters struct {
	Query           string   `json:"query"`
	Role            string   `json:"role"`
	ExperienceYears int      `json:"experienceYears"`
	Location        string   `json:"location"`
	Education       string   `json:"education"`
	Skills          []string `json:"skills"`
}

// OfferLetter represents an offer letter record
type OfferLetter struct {
	ID             int        `json:"id"`
	CandidateID    int        `json:"candidateId"`
	JobID          int        `json:"jobId"`
	ApplicationID  *int       `json:"applicationId,omitempty"`
	Status         string     `json:"status"` // draft, sent, accepted, declined, expired
	TemplateType   string     `json:"templateType"`
	SalaryAmount   float64    `json:"salaryAmount"`
	SalaryCurrency string     `json:"salaryCurrency"`
	PositionTitle  string     `json:"positionTitle"`
	StartDate      *time.Time `json:"startDate,omitempty"`
	OfferExpiry    *time.Time `json:"offerExpiry,omitempty"`
	Notes          string     `json:"notes"`
	SentAt         *time.Time `json:"sentAt,omitempty"`
	RespondedAt    *time.Time `json:"respondedAt,omitempty"`
	CreatedBy      *int       `json:"createdBy,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	// Joined fields
	CandidateName  string `json:"candidateName"`
	CandidateEmail string `json:"candidateEmail"`
	JobTitle       string `json:"jobTitle"`
}
