package main

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== LEAVE TYPE HANDLERS ====================

func getLeaveTypesHandler(c *gin.Context) {
	types, err := repository.GetLeaveTypes(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getLeaveTypesHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leave types", err.Error())
		return
	}

	c.JSON(http.StatusOK, types)
}

// ==================== LEAVE BALANCE HANDLERS ====================

func getLeaveBalancesHandler(c *gin.Context) {
	empIdStr := c.Query("employeeId")
	if empIdStr == "" {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "employeeId required", nil)
		return
	}
	empId, err := strconv.Atoi(empIdStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid employeeId", nil)
		return
	}

	// Default to current year
	year := time.Now().Year()
	if yearStr := c.Query("year"); yearStr != "" {
		if parsedYear, err := strconv.Atoi(yearStr); err == nil {
			year = parsedYear
		}
	}

	balances, err := repository.GetEmployeeLeaveBalances(c.Request.Context(), empId, year)
	if err != nil {
		log.Printf("ERROR in getLeaveBalancesHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leave balances", err.Error())
		return
	}

	c.JSON(http.StatusOK, balances)
}

// ==================== LEAVE REQUEST HANDLERS ====================

func createLeaveRequestHandler(c *gin.Context) {
	var req struct {
		EmployeeID     int    `json:"employeeId" binding:"required"`
		LeaveTypeID    int    `json:"leaveTypeId" binding:"required"`
		StartDate      string `json:"startDate" binding:"required"`
		EndDate        string `json:"endDate" binding:"required"`
		TotalDays      int    `json:"totalDays" binding:"required"`
		Reason         string `json:"reason"`
		AttachmentPath string `json:"attachmentPath"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid startDate format (use YYYY-MM-DD)", nil)
		return
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid endDate format (use YYYY-MM-DD)", nil)
		return
	}

	// Validate dates
	if endDate.Before(startDate) {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "End date must be after start date", nil)
		return
	}

	// Check leave balance before creating request
	year := startDate.Year()
	balances, err := repository.GetEmployeeLeaveBalances(c.Request.Context(), req.EmployeeID, year)
	if err != nil {
		log.Printf("ERROR checking leave balance: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to check leave balance", err.Error())
		return
	}

	// Find the specific leave type balance
	var hasBalance bool
	var remainingDays int
	for _, bal := range balances {
		if bal.LeaveTypeID == req.LeaveTypeID {
			hasBalance = true
			if bal.RemainingDays != nil {
				remainingDays = *bal.RemainingDays
			}
			break
		}
	}

	if !hasBalance {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "No leave balance found for this leave type", nil)
		return
	}

	if remainingDays < req.TotalDays {
		RespondWithError(c, http.StatusBadRequest, "insufficient_balance", 
			"Insufficient leave balance", 
			map[string]interface{}{
				"requested": req.TotalDays,
				"available": remainingDays,
			})
		return
	}

	// Create the leave request
	leaveReq := models.LeaveRequest{
		EmployeeID:     req.EmployeeID,
		LeaveTypeID:    req.LeaveTypeID,
		StartDate:      startDate,
		EndDate:        endDate,
		TotalDays:      req.TotalDays,
		Reason:         req.Reason,
		AttachmentPath: req.AttachmentPath,
		Status:         "pending",
	}

	id, err := repository.CreateLeaveRequest(c.Request.Context(), &leaveReq)
	if err != nil {
		log.Printf("ERROR in createLeaveRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create leave request", err.Error())
		return
	}

	// Notify the requester's manager, if resolvable — best-effort, doesn't fail the request.
	go func() {
		employee, err := repository.GetEmployeeByID(context.Background(), req.EmployeeID)
		if err != nil || employee.ManagerID == nil {
			return
		}
		manager, err := repository.GetEmployeeByID(context.Background(), *employee.ManagerID)
		if err != nil || manager.UserID == nil {
			return
		}
		if sendErr := notificationEngine.Send(context.Background(), NotificationRequest{
			TemplateCode: "LEAVE_NEW_REQUEST",
			RecipientID:  manager.UserID,
			Variables: map[string]string{
				"employee_name": employee.FullName,
				"days":          strconv.Itoa(req.TotalDays),
				"start_date":    startDate.Format("2006-01-02"),
			},
		}); sendErr != nil {
			log.Printf("Warning: failed to notify manager of new leave request: %v", sendErr)
		}
	}()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Leave request submitted successfully",
		"id":      id,
	})
}

func getLeaveRequestsHandler(c *gin.Context) {
	empIdStr := c.Query("employeeId")
	status := c.Query("status")

	// If employeeId is provided, get requests for that employee
	if empIdStr != "" {
		empId, err := strconv.Atoi(empIdStr)
		if err != nil {
			RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid employeeId", nil)
			return
		}

		requests, err := repository.GetLeaveHistory(c.Request.Context(), empId)
		if err != nil {
			log.Printf("ERROR in getLeaveRequestsHandler: %v", err)
			RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leave requests", err.Error())
			return
		}

		c.JSON(http.StatusOK, requests)
		return
	}

	// Otherwise, get all requests (for admin/manager view)
	requests, err := repository.GetAllLeaveRequests(c.Request.Context(), status)
	if err != nil {
		log.Printf("ERROR in getLeaveRequestsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leave requests", err.Error())
		return
	}

	c.JSON(http.StatusOK, requests)
}

func getLeaveRequestByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request ID", nil)
		return
	}

	request, err := repository.GetLeaveRequestByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in getLeaveRequestByIDHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leave request", err.Error())
		return
	}

	c.JSON(http.StatusOK, request)
}

func approveLeaveRequestHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request ID", nil)
		return
	}

	var req struct {
		ApproverID int `json:"approverId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	err = repository.UpdateLeaveRequestStatus(c.Request.Context(), id, "approved", req.ApproverID, "")
	if err != nil {
		log.Printf("ERROR in approveLeaveRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to approve leave request", err.Error())
		return
	}

	notifyLeaveDecision(id, "LEAVE_APPROVED", "")

	c.JSON(http.StatusOK, gin.H{
		"message": "Leave request approved successfully",
	})
}

// notifyLeaveDecision sends the employee an approved/rejected leave notification.
// Best-effort and async — a notification failure must never block the approval
// action itself, which has already been committed by the time this runs.
func notifyLeaveDecision(requestID int, templateCode, rejectionReason string) {
	go func() {
		reqDetails, err := repository.GetLeaveRequestByID(context.Background(), requestID)
		if err != nil {
			log.Printf("Warning: could not load leave request %d for notification: %v", requestID, err)
			return
		}
		employee, err := repository.GetEmployeeByID(context.Background(), reqDetails.EmployeeID)
		if err != nil || employee.UserID == nil {
			return
		}
		if sendErr := notificationEngine.Send(context.Background(), NotificationRequest{
			TemplateCode: templateCode,
			RecipientID:  employee.UserID,
			Variables: map[string]string{
				"days":       strconv.Itoa(reqDetails.TotalDays),
				"start_date": reqDetails.StartDate.Format("2006-01-02"),
				"reason":     rejectionReason,
			},
		}); sendErr != nil {
			log.Printf("Warning: failed to notify employee of leave decision: %v", sendErr)
		}
	}()
}

func rejectLeaveRequestHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request ID", nil)
		return
	}

	var req struct {
		ApproverID      int    `json:"approverId" binding:"required"`
		RejectionReason string `json:"rejectionReason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	err = repository.UpdateLeaveRequestStatus(c.Request.Context(), id, "rejected", req.ApproverID, req.RejectionReason)
	if err != nil {
		log.Printf("ERROR in rejectLeaveRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to reject leave request", err.Error())
		return
	}

	notifyLeaveDecision(id, "LEAVE_REJECTED", req.RejectionReason)

	c.JSON(http.StatusOK, gin.H{
		"message": "Leave request rejected",
	})
}

func cancelLeaveRequestHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request ID", nil)
		return
	}

	var req struct {
		EmployeeID int `json:"employeeId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	// Verify the request belongs to the employee
	leaveReq, err := repository.GetLeaveRequestByID(c.Request.Context(), id)
	if err != nil {
		log.Printf("ERROR in cancelLeaveRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch leave request", err.Error())
		return
	}

	if leaveReq.EmployeeID != req.EmployeeID {
		RespondWithError(c, http.StatusForbidden, "forbidden", "You can only cancel your own leave requests", nil)
		return
	}

	if leaveReq.Status != "pending" {
		RespondWithError(c, http.StatusBadRequest, "invalid_status", "Only pending requests can be cancelled", nil)
		return
	}

	err = repository.UpdateLeaveRequestStatus(c.Request.Context(), id, "cancelled", req.EmployeeID, "Cancelled by employee")
	if err != nil {
		log.Printf("ERROR in cancelLeaveRequestHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to cancel leave request", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Leave request cancelled successfully",
	})
}

// ==================== HOLIDAY HANDLERS ====================

func getHolidaysHandler(c *gin.Context) {
	// Default to current year
	year := time.Now().Year()
	if yearStr := c.Query("year"); yearStr != "" {
		if parsedYear, err := strconv.Atoi(yearStr); err == nil {
			year = parsedYear
		}
	}

	holidays, err := repository.GetHolidays(c.Request.Context(), year)
	if err != nil {
		log.Printf("ERROR in getHolidaysHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch holidays", err.Error())
		return
	}

	c.JSON(http.StatusOK, holidays)
}
