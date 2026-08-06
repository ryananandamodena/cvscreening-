package models

import "time"

// ApprovalFlowLevel is one ordered step within an ApprovalFlow
type ApprovalFlowLevel struct {
	ID                  int    `json:"id"`
	FlowID              int    `json:"flowId"`
	LevelOrder          int    `json:"levelOrder"`
	LevelName           string `json:"levelName"`
	ApproverType        string `json:"approverType"` // manager_of_requester, role, specific_user
	ApproverRole        string `json:"approverRole,omitempty"`
	ApproverEmployeeID  *int   `json:"approverEmployeeId,omitempty"`
	ApproverEmployeeName string `json:"approverEmployeeName,omitempty"`
}

// ApprovalFlow is a configurable, reusable approval pipeline for one module
type ApprovalFlow struct {
	ID             int                 `json:"id"`
	ModuleName     string              `json:"moduleName"`
	FlowName       string              `json:"flowName"`
	DepartmentID   *int                `json:"departmentId,omitempty"`
	EmploymentType string              `json:"employmentType,omitempty"`
	IsActive       bool                `json:"isActive"`
	EffectiveDate  time.Time           `json:"effectiveDate"`
	CreatedAt      time.Time           `json:"createdAt"`
	UpdatedAt      time.Time           `json:"updatedAt"`
	Levels         []ApprovalFlowLevel `json:"levels"`
}

// ApprovalHistoryEntry records one action taken on an ApprovalRequest (immutable audit trail)
type ApprovalHistoryEntry struct {
	ID                     int       `json:"id"`
	RequestID              int       `json:"requestId"`
	LevelOrder             int       `json:"levelOrder"`
	ActorEmployeeID        int       `json:"actorEmployeeId"`
	ActorEmployeeName      string    `json:"actorEmployeeName,omitempty"`
	Action                 string    `json:"action"` // approve, reject, return, cancel, delegate
	Comment                string    `json:"comment"`
	DelegatedToEmployeeID  *int      `json:"delegatedToEmployeeId,omitempty"`
	CreatedAt              time.Time `json:"createdAt"`
}

// ApprovalRequest represents one module record moving through its approval flow
type ApprovalRequest struct {
	ID                         int                    `json:"id"`
	ModuleName                 string                 `json:"moduleName"`
	ReferenceID                int                    `json:"referenceId"`
	FlowID                     int                    `json:"flowId"`
	RequesterEmployeeID        int                    `json:"requesterEmployeeId"`
	RequesterEmployeeName      string                 `json:"requesterEmployeeName,omitempty"`
	CurrentLevel               int                    `json:"currentLevel"`
	Status                     string                 `json:"status"`
	Summary                    string                 `json:"summary"`
	OverrideApproverEmployeeID *int                   `json:"overrideApproverEmployeeId,omitempty"`
	CreatedAt                  time.Time              `json:"createdAt"`
	UpdatedAt                  time.Time              `json:"updatedAt"`
	Levels                     []ApprovalFlowLevel    `json:"levels,omitempty"`
	History                    []ApprovalHistoryEntry `json:"history,omitempty"`
}
