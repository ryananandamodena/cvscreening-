package models

import (
	"encoding/json"
	"time"
)

// ==================== CORE HR MODELS ====================

// Employee represents a company employee
type Employee struct {
	ID                    int        `json:"id"`
	EmployeeID            string     `json:"employeeId"`
	UserID                *int       `json:"userId,omitempty"`
	CandidateID           *int       `json:"candidateId,omitempty"`
	FullName              string     `json:"fullName"`
	Email                 string     `json:"email"`
	Phone                 string     `json:"phone"`
	BirthDate             *time.Time `json:"birthDate,omitempty"`
	BirthPlace            string     `json:"birthPlace"`
	Gender                string     `json:"gender"`
	MaritalStatus         string     `json:"maritalStatus"`
	Religion              string     `json:"religion"`
	BloodType             string     `json:"bloodType"`
	NationalID            string     `json:"nationalId"`
	TaxID                 string     `json:"taxId"`
	TaxStatus             string     `json:"taxStatus"`
	BpjsKesehatan         string     `json:"bpjsKesehatan"`
	BpjsKetenagakerjaan   string     `json:"bpjsKetenagakerjaan"`
	PhotoURL              string     `json:"photoUrl"`
	Address               string     `json:"address"`
	City                  string     `json:"city"`
	Province              string     `json:"province"`
	PostalCode            string     `json:"postalCode"`
	DepartmentID          *int       `json:"departmentId,omitempty"`
	PositionID            *int       `json:"positionId,omitempty"`
	ManagerID             *int       `json:"managerId,omitempty"`
	EmploymentType        string     `json:"employmentType"`
	EmploymentStatus      string     `json:"employmentStatus"`
	JoinDate              time.Time  `json:"joinDate"`
	EndDate               *time.Time `json:"endDate,omitempty"`
	ProbationEndDate      *time.Time `json:"probationEndDate,omitempty"`
	ResignationDate       *time.Time `json:"resignationDate,omitempty"`
	BankName              string     `json:"bankName"`
	BankAccount           string     `json:"bankAccount"`
	BankAccountName       string     `json:"bankAccountName"`
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`

	// Joined fields (populated by queries)
	DepartmentName string `json:"departmentName,omitempty"`
	PositionName   string `json:"positionName,omitempty"`
	ManagerName    string `json:"managerName,omitempty"`
}

// Department represents an organizational department
type Department struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Code        string    `json:"code"`
	ParentID    *int      `json:"parentId,omitempty"`
	HeadID      *int      `json:"headId,omitempty"`
	Description string    `json:"description"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Joined / computed fields
	HeadName       string `json:"headName,omitempty"`
	ParentName     string `json:"parentName,omitempty"`
	EmployeeCount  int    `json:"employeeCount"`
	ChildDeptCount int    `json:"childDeptCount"`
}

// Position represents a job position/title
type Position struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Code         string    `json:"code"`
	DepartmentID *int      `json:"departmentId,omitempty"`
	Level        int       `json:"level"`
	Description  string    `json:"description"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`

	// Joined fields
	DepartmentName string `json:"departmentName,omitempty"`
	EmployeeCount  int    `json:"employeeCount"`
}

// EmployeeDocument represents a document uploaded for an employee
type EmployeeDocument struct {
	ID           int        `json:"id"`
	EmployeeID   int        `json:"employeeId"`
	DocumentType string     `json:"documentType"`
	DocumentName string     `json:"documentName"`
	FilePath     string     `json:"filePath"`
	ExpiryDate   *time.Time `json:"expiryDate,omitempty"`
	IsVerified   bool       `json:"isVerified"`
	VerifiedBy   *int       `json:"verifiedBy,omitempty"`
	VerifiedAt   *time.Time `json:"verifiedAt,omitempty"`
	UploadedAt   time.Time  `json:"uploadedAt"`
}

// EmployeeContract represents an employment contract
type EmployeeContract struct {
	ID                 int        `json:"id"`
	EmployeeID         int        `json:"employeeId"`
	ContractType       string     `json:"contractType"`
	ContractNumber     string     `json:"contractNumber"`
	StartDate          time.Time  `json:"startDate"`
	EndDate            *time.Time `json:"endDate,omitempty"`
	DocumentPath       string     `json:"documentPath"`
	Status             string     `json:"status"`
	RenewalCount       int        `json:"renewalCount"`
	PreviousContractID *int       `json:"previousContractId,omitempty"`
	Notes              string     `json:"notes"`
	SignatureURL       string     `json:"signatureUrl"`
	SignedAt           *time.Time `json:"signedAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`

	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
	DaysToExpiry *int   `json:"daysToExpiry,omitempty"`
}

// EmployeeFamily represents a family member (for BPJS dependents)
type EmployeeFamily struct {
	ID              int        `json:"id"`
	EmployeeID      int        `json:"employeeId"`
	Relationship    string     `json:"relationship"`
	FullName        string     `json:"fullName"`
	BirthDate       *time.Time `json:"birthDate,omitempty"`
	Gender          string     `json:"gender"`
	NationalID      string     `json:"nationalId"`
	IsBpjsDependent bool       `json:"isBpjsDependent"`
	CreatedAt       time.Time  `json:"createdAt"`
}

// ==================== AUDIT TRAIL ====================

// AuditTrail represents an audit log entry
type AuditTrail struct {
	ID         int             `json:"id"`
	UserID     *int            `json:"userId,omitempty"`
	UserEmail  string          `json:"userEmail"`
	Action     string          `json:"action"`
	Module     string          `json:"module"`
	EntityType string          `json:"entityType"`
	EntityID   *int            `json:"entityId,omitempty"`
	OldValue   json.RawMessage `json:"oldValue,omitempty"`
	NewValue   json.RawMessage `json:"newValue,omitempty"`
	IPAddress  string          `json:"ipAddress"`
	UserAgent  string          `json:"userAgent"`
	Severity   string          `json:"severity"`
	CreatedAt  time.Time       `json:"createdAt"`
}

// ==================== ONBOARDING ====================

// OnboardingTemplate represents a reusable onboarding checklist template
type OnboardingTemplate struct {
	ID           int             `json:"id"`
	Name         string          `json:"name"`
	DepartmentID *int            `json:"departmentId,omitempty"`
	Tasks        json.RawMessage `json:"tasks"`
	IsActive     bool            `json:"isActive"`
	CreatedBy    *int            `json:"createdBy,omitempty"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`

	// Joined
	DepartmentName string `json:"departmentName,omitempty"`
}

// OnboardingSession represents an active onboarding process for an employee
type OnboardingSession struct {
	ID          int        `json:"id"`
	EmployeeID  int        `json:"employeeId"`
	TemplateID  *int       `json:"templateId,omitempty"`
	StartDate   time.Time  `json:"startDate"`
	DueDate     *time.Time `json:"dueDate,omitempty"`
	Status      string     `json:"status"`
	Progress    int        `json:"progress"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Joined
	EmployeeName string           `json:"employeeName,omitempty"`
	Tasks        []OnboardingTask `json:"tasks,omitempty"`
}

// OnboardingTask represents a single task in an onboarding session
type OnboardingTask struct {
	ID           int        `json:"id"`
	SessionID    int        `json:"sessionId"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	Category     string     `json:"category"`
	AssignedTo   *int       `json:"assignedTo,omitempty"`
	AssignedRole string     `json:"assignedRole"`
	DueDate      *time.Time `json:"dueDate,omitempty"`
	Status       string     `json:"status"`
	CompletedAt  *time.Time `json:"completedAt,omitempty"`
	Notes        string     `json:"notes"`
	SortOrder    int        `json:"sortOrder"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`

	// Joined
	AssignedToName string `json:"assignedToName,omitempty"`
}

// ContractNotification represents a notification about contract expiry
type ContractNotification struct {
	ID               int             `json:"id"`
	ContractID       int             `json:"contractId"`
	EmployeeID       int             `json:"employeeId"`
	NotificationType string          `json:"notificationType"`
	ScheduledDate    time.Time       `json:"scheduledDate"`
	SentAt           *time.Time      `json:"sentAt,omitempty"`
	SentTo           json.RawMessage `json:"sentTo"`
	Status           string          `json:"status"`
	CreatedAt        time.Time       `json:"createdAt"`

	// Joined
	EmployeeName   string `json:"employeeName,omitempty"`
	ContractNumber string `json:"contractNumber,omitempty"`
}

// ==================== ATTENDANCE & SHIFT (PHASE 2) ====================

// Shift represents a working time slot
type Shift struct {
	ID               int       `json:"id"`
	Name             string    `json:"name"`
	StartTime        string    `json:"startTime"` // Storing as string representation of time (e.g. "09:00:00")
	EndTime          string    `json:"endTime"`
	BreakStart       string    `json:"breakStart,omitempty"`
	BreakEnd         string    `json:"breakEnd,omitempty"`
	IsNightShift     bool      `json:"isNightShift"`
	ToleranceMinutes int       `json:"toleranceMinutes"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// EmployeeShift represents an employee's assigned shift
type EmployeeShift struct {
	ID            int        `json:"id"`
	EmployeeID    int        `json:"employeeId"`
	ShiftID       int        `json:"shiftId"`
	EffectiveDate time.Time  `json:"effectiveDate"`
	EndDate       *time.Time `json:"endDate,omitempty"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`

	// Joined fields
	ShiftName string `json:"shiftName,omitempty"`
}

// EmployeeShiftView represents a shift assignment with joined employee and shift info
type EmployeeShiftView struct {
	ID             int        `json:"id"`
	EmployeeID     int        `json:"employeeId"`
	ShiftID        int        `json:"shiftId"`
	EffectiveDate  time.Time  `json:"effectiveDate"`
	EndDate        *time.Time `json:"endDate,omitempty"`
	EmployeeName   string     `json:"employeeName"`
	ShiftName      string     `json:"shiftName"`
	ShiftStartTime string     `json:"shiftStartTime"`
	ShiftEndTime   string     `json:"shiftEndTime"`
}

// Attendance represents a single day's attendance record
type Attendance struct {
	ID               int             `json:"id"`
	EmployeeID       int             `json:"employeeId"`
	Date             time.Time       `json:"date"`
	ClockIn          *time.Time      `json:"clockIn,omitempty"`
	ClockOut         *time.Time      `json:"clockOut,omitempty"`
	ClockInLocation  json.RawMessage `json:"clockInLocation,omitempty"`
	ClockOutLocation json.RawMessage `json:"clockOutLocation,omitempty"`
	ClockInPhoto     string          `json:"clockInPhoto,omitempty"`
	ClockOutPhoto    string          `json:"clockOutPhoto,omitempty"`
	Status           string          `json:"status"`
	OvertimeHours    float64         `json:"overtimeHours"`
	LateMinutes      int             `json:"lateMinutes"`
	EarlyLeaveMinutes int            `json:"earlyLeaveMinutes"`
	BreakMinutes     int             `json:"breakMinutes"`
	Notes            string          `json:"notes,omitempty"`
	ApprovedOvertime bool            `json:"approvedOvertime"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`

	// Joined fields
	EmployeeName   string `json:"employeeName,omitempty"`
	DepartmentName string `json:"departmentName,omitempty"`
}

// ==================== LEAVE (PHASE 2) ====================

// LeaveType represents a category of leave (annual, sick, etc.)
type LeaveType struct {
	ID                 int       `json:"id"`
	Name               string    `json:"name"`
	Code               string    `json:"code"`
	MaxDays            int       `json:"maxDays"`
	IsPaid             bool      `json:"isPaid"`
	IsCarryForward     bool      `json:"isCarryForward"`
	CarryForwardMax    int       `json:"carryForwardMax"`
	RequiresAttachment bool      `json:"requiresAttachment"`
	GenderSpecific     string    `json:"genderSpecific,omitempty"`
	Description        string    `json:"description,omitempty"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// LeaveBalance represents an employee's leave entitlement for a specific year
type LeaveBalance struct {
	ID             int       `json:"id"`
	EmployeeID     int       `json:"employeeId"`
	LeaveTypeID    int       `json:"leaveTypeId"`
	Year           int       `json:"year"`
	TotalDays      int       `json:"totalDays"`
	UsedDays       int       `json:"usedDays"`
	CarriedForward int       `json:"carriedForward"`
	RemainingDays  *int      `json:"remainingDays,omitempty"` // populated from view
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`

	// Joined
	LeaveTypeName string `json:"leaveTypeName,omitempty"`
	LeaveTypeCode string `json:"leaveTypeCode,omitempty"`
}

// LeaveRequest represents a formal application for time off
type LeaveRequest struct {
	ID              int        `json:"id"`
	EmployeeID      int        `json:"employeeId"`
	LeaveTypeID     int        `json:"leaveTypeId"`
	StartDate       time.Time  `json:"startDate"`
	EndDate         time.Time  `json:"endDate"`
	TotalDays       int        `json:"totalDays"`
	Reason          string     `json:"reason"`
	AttachmentPath  string     `json:"attachmentPath,omitempty"`
	Status          string     `json:"status"` // pending, approved, rejected, cancelled
	ApprovedBy      *int       `json:"approvedBy,omitempty"`
	ApprovedAt      *time.Time `json:"approvedAt,omitempty"`
	RejectionReason string     `json:"rejectionReason,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`

	// Joined
	EmployeeName  string `json:"employeeName,omitempty"`
	LeaveTypeName string `json:"leaveTypeName,omitempty"`
	LeaveTypeCode string `json:"leaveTypeCode,omitempty"`
	ApproverName  string `json:"approverName,omitempty"`
}

// Holiday represents a public or company holiday
type Holiday struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Date      time.Time `json:"date"`
	Type      string    `json:"type"` // national, company, optional
	Year      int       `json:"year"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ==================== NOTIFICATION ENGINE (PHASE 2) ====================

// NotificationTemplate defines how notifications are structured
type NotificationTemplate struct {
	ID            int             `json:"id"`
	Code          string          `json:"code"`
	TitleTemplate string          `json:"titleTemplate"`
	BodyTemplate  string          `json:"bodyTemplate"`
	Channels      json.RawMessage `json:"channels"`
	Module        string          `json:"module,omitempty"`
	IsActive      bool            `json:"isActive"`
	CreatedAt     time.Time       `json:"createdAt"`
	UpdatedAt     time.Time       `json:"updatedAt"`
}

// Notification represents a sent or pending alert
type Notification struct {
	ID             int             `json:"id"`
	TemplateID     *int            `json:"templateId,omitempty"`
	RecipientID    *int            `json:"recipientId,omitempty"`
	RecipientEmail string          `json:"recipientEmail,omitempty"`
	Title          string          `json:"title"`
	Body           string          `json:"body"`
	Channel        string          `json:"channel"`
	Status         string          `json:"status"`
	ReadAt         *time.Time      `json:"readAt,omitempty"`
	SentAt         *time.Time      `json:"sentAt,omitempty"`
	Metadata       json.RawMessage `json:"metadata,omitempty"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}


// ==================== REQUEST / RESPONSE MODELS ====================

// ConvertCandidateRequest request body for converting candidate to employee
type ConvertCandidateRequest struct {
	CandidateID  int    `json:"candidateId" binding:"required"`
	JobID        int    `json:"jobId"`
	OfferID      int    `json:"offerId"`
	EmployeeID   string `json:"employeeId" binding:"required"`
	DepartmentID int    `json:"departmentId" binding:"required"`
	PositionID   int    `json:"positionId" binding:"required"`
	JoinDate     string `json:"joinDate" binding:"required"`
	EmploymentType string `json:"employmentType"`
	ManagerID    *int   `json:"managerId,omitempty"`
}

// EmployeeFilter represents filter criteria for employee listing
type EmployeeFilter struct {
	Search           string `form:"search"`
	DepartmentID     int    `form:"departmentId"`
	PositionID       int    `form:"positionId"`
	EmploymentType   string `form:"employmentType"`
	EmploymentStatus string `form:"employmentStatus"`
	Page             int    `form:"page"`
	Limit            int    `form:"limit"`
}

// AuditTrailFilter filter for audit log queries
type AuditTrailFilter struct {
	Module     string `form:"module"`
	Action     string `form:"action"`
	EntityType string `form:"entityType"`
	UserID     int    `form:"userId"`
	Severity   string `form:"severity"`
	StartDate  string `form:"startDate"`
	EndDate    string `form:"endDate"`
	Page       int    `form:"page"`
	Limit      int    `form:"limit"`
}

// ClockInRequest payload for clocking in
type ClockInRequest struct {
	EmployeeID int             `json:"employeeId" binding:"required"`
	Location   json.RawMessage `json:"location"`
	Photo      string          `json:"photo"`
	Latitude   float64         `json:"latitude"`
	Longitude  float64         `json:"longitude"`
	QRToken    string          `json:"qrToken"`
	FaceDescriptor []float64   `json:"faceDescriptor,omitempty"`
}

// ClockOutRequest payload for clocking out
type ClockOutRequest struct {
	EmployeeID int             `json:"employeeId" binding:"required"`
	Location   json.RawMessage `json:"location"`
	Photo      string          `json:"photo"`
	Notes      string          `json:"notes"`
	Latitude   float64         `json:"latitude"`
	Longitude  float64         `json:"longitude"`
	QRToken    string          `json:"qrToken"`
}

// ==================== PAYROLL (PHASE 3) ====================

// PayrollPeriod represents a monthly payroll cycle
type PayrollPeriod struct {
	ID                int        `json:"id"`
	Name              string     `json:"name"`
	StartDate         time.Time  `json:"startDate"`
	EndDate           time.Time  `json:"endDate"`
	PaymentDate       *time.Time `json:"paymentDate,omitempty"`
	Status            string     `json:"status"` // draft, processing, closed, cancelled
	TotalDisbursement float64    `json:"totalDisbursement"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// SalaryConfiguration represents an employee's recurring salary settings
type SalaryConfiguration struct {
	ID                     int     `json:"id"`
	EmployeeID             int     `json:"employeeId"`
	BaseSalary             float64 `json:"baseSalary"`
	TransportAllowance     float64 `json:"transportAllowance"`
	MealAllowance          float64 `json:"mealAllowance"`
	PositionAllowance      float64 `json:"positionAllowance"`
	BpjsKesehatanType      string  `json:"bpjsKesehatanType"`
	BpjsKetenagakerjaanType string  `json:"bpjsKetenagakerjaanType"`
	UpdatedAt              time.Time `json:"updatedAt"`

	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
	GradeLevel   int    `json:"gradeLevel,omitempty"`
	GradeName    string `json:"gradeName,omitempty"`
}

// Payslip represents an individual salary record for an employee in a period
type Payslip struct {
	ID             int       `json:"id"`
	PeriodID       int       `json:"periodId"`
	EmployeeID     int       `json:"employeeId"`
	BasicSalary    float64   `json:"basicSalary"`
	TotalAllowance float64   `json:"totalAllowance"`
	TotalDeduction float64   `json:"totalDeduction"`
	NetSalary      float64   `json:"netSalary"`
	Status         string    `json:"status"` // draft, released, paid
	PaidAt         *time.Time `json:"paidAt,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`

	// Joined
	EmployeeName string            `json:"employeeName,omitempty"`
	EmployeeID_Str string          `json:"employeeIdStr,omitempty"` // e.g. EMP-2026-0001
	DepartmentName string          `json:"departmentName,omitempty"`
	Components     []SalaryComponent `json:"components,omitempty"`
}

// SalaryGrade represents pay-band and policy defaults for one organizational level
// (1=Staff up to 6=C-Level/CEO), tying payroll into positions.level.
type PayGrade struct {
	ID                        int       `json:"id"`
	Level                     int       `json:"level"`
	Name                      string    `json:"name"`
	MinSalary                 float64   `json:"minSalary"`
	MaxSalary                 float64   `json:"maxSalary"`
	DefaultTransportAllowance float64   `json:"defaultTransportAllowance"`
	DefaultMealAllowance      float64   `json:"defaultMealAllowance"`
	DefaultPositionAllowance  float64   `json:"defaultPositionAllowance"`
	IsOvertimeEligible        bool      `json:"isOvertimeEligible"`
	RequiresApprovalForChange bool      `json:"requiresApprovalForChange"`
	UpdatedAt                 time.Time `json:"updatedAt"`
}

// SalaryChangeRequest is the staging record for a salary change on a grade that
// requires approval (e.g. Director+) before it's applied to salary_configurations.
type SalaryChangeRequest struct {
	ID                 int       `json:"id"`
	EmployeeID         int       `json:"employeeId"`
	BaseSalary         float64   `json:"baseSalary"`
	TransportAllowance float64   `json:"transportAllowance"`
	MealAllowance      float64   `json:"mealAllowance"`
	PositionAllowance  float64   `json:"positionAllowance"`
	RequestedBy        int       `json:"requestedBy"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"createdAt"`

	EmployeeName string `json:"employeeName,omitempty"`
}

// BPJSRateConfig holds the employee-side BPJS contribution rates/caps, editable by Finance
// without a redeploy (previously hardcoded Go constants).
type BPJSRateConfig struct {
	KesehatanRateEmployee float64   `json:"kesehatanRateEmployee"`
	KesehatanSalaryCap    float64   `json:"kesehatanSalaryCap"`
	JHTRateEmployee       float64   `json:"jhtRateEmployee"`
	JPRateEmployee        float64   `json:"jpRateEmployee"`
	JPSalaryCap           float64   `json:"jpSalaryCap"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// PPh21TERBracket is one row of the TER (Tarif Efektif Rata-rata, PMK 168/2023) table for a
// PTKP category (A/B/C), editable by Finance without a redeploy.
type PPh21TERBracket struct {
	ID           int      `json:"id"`
	Category     string   `json:"category"`
	BracketOrder int      `json:"bracketOrder"`
	UpTo         *float64 `json:"upTo"` // nil = unbounded (highest bracket)
	Rate         float64  `json:"rate"`
}

// DeductionType is a reusable catalog entry for "other deductions" beyond BPJS/PPh21
// (loan installments, cooperative dues, penalties, ...), editable by Finance.
type DeductionType struct {
	ID              int       `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	CalculationType string    `json:"calculationType"` // fixed, percentage_of_base
	DefaultAmount   float64   `json:"defaultAmount"`
	DefaultRate     float64   `json:"defaultRate"`
	IsActive        bool      `json:"isActive"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

// EmployeeDeduction assigns a DeductionType to a specific employee as a recurring
// monthly deduction. GeneratePayroll applies every active row each period, and
// auto-deactivates installment-style ones once remaining_balance reaches zero.
type EmployeeDeduction struct {
	ID               int      `json:"id"`
	EmployeeID       int      `json:"employeeId"`
	DeductionTypeID  int      `json:"deductionTypeId"`
	Amount           *float64 `json:"amount,omitempty"`
	Rate             *float64 `json:"rate,omitempty"`
	RemainingBalance *float64 `json:"remainingBalance,omitempty"`
	Notes            string   `json:"notes,omitempty"`
	IsActive         bool     `json:"isActive"`

	// Joined
	EmployeeName    string `json:"employeeName,omitempty"`
	DeductionName   string `json:"deductionName,omitempty"`
	CalculationType string `json:"calculationType,omitempty"`
}

// SalaryComponent represents a detailed item in a payslip (allowance or deduction)
type SalaryComponent struct {
	ID          int     `json:"id"`
	PayslipID   int     `json:"payslipId"`
	Name        string  `json:"name"`
	Type        string  `json:"type"` // allowance, deduction
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

// ==================== ATTENDANCE CORRECTION ====================

// AttendanceCorrection represents an employee-submitted attendance correction request
type AttendanceCorrection struct {
	ID                 int        `json:"id"`
	EmployeeID         int        `json:"employeeId"`
	AttendanceDate     time.Time  `json:"attendanceDate"`
	CorrectionType     string     `json:"correctionType"`
	RequestedClockIn   *string    `json:"requestedClockIn,omitempty"`
	RequestedClockOut  *string    `json:"requestedClockOut,omitempty"`
	Reason             string     `json:"reason"`
	EvidenceURL        string     `json:"evidenceUrl,omitempty"`
	Notes              string     `json:"notes,omitempty"`
	Status             string     `json:"status"`
	ManagerID          *int       `json:"managerId,omitempty"`
	ManagerComment     string     `json:"managerComment,omitempty"`
	ManagerDecidedAt   *time.Time `json:"managerDecidedAt,omitempty"`
	HRID               *int       `json:"hrId,omitempty"`
	HRComment          string     `json:"hrComment,omitempty"`
	HRDecidedAt        *time.Time `json:"hrDecidedAt,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`

	// Joined
	EmployeeName string `json:"employeeName,omitempty"`
	ManagerName  string `json:"managerName,omitempty"`
}
