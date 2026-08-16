package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// initiateInsuranceContinuationHandler starts a self-paid insurance continuation
// for a resigned/terminated employee.
func initiateInsuranceContinuationHandler(c *gin.Context) {
	var payload struct {
		EmployeeID           int     `json:"employeeId" binding:"required"`
		OriginalEnrollmentID *int    `json:"originalEnrollmentId"`
		TerminationDate      string  `json:"terminationDate" binding:"required"`
		MonthlyPremium       float64 `json:"monthlyPremium"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.InitiateInsuranceContinuation(c.Request.Context(), payload.EmployeeID,
		payload.OriginalEnrollmentID, payload.TerminationDate, payload.MonthlyPremium)
	if err != nil {
		log.Printf("Failed to initiate insurance continuation: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to initiate insurance continuation", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Insurance continuation initiated successfully"})
}

// getInsuranceContinuationsHandler lists continuations, scoped via ?employeeId=. This route
// carries no role middleware and previously trusted employeeId with no ownership check —
// omitting it entirely returned every employee's insurance-continuation records to any
// authenticated user (Module 14 IDOR fix). authorizeEmployeeTarget resolves it to the caller's
// own record unless the caller is admin/that employee's manager.
func getInsuranceContinuationsHandler(c *gin.Context) {
	requestedID, _ := strconv.Atoi(c.Query("employeeId"))
	employeeID, ok := authorizeEmployeeTarget(c, requestedID)
	if !ok {
		return
	}
	list, err := repository.GetInsuranceContinuations(c.Request.Context(), employeeID)
	if err != nil {
		log.Printf("ERROR in getInsuranceContinuationsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch insurance continuations", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

// recordInsuranceContinuationPaymentHandler logs a premium payment
func recordInsuranceContinuationPaymentHandler(c *gin.Context) {
	continuationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid continuation ID", nil)
		return
	}
	var payload struct {
		Amount      float64 `json:"amount" binding:"required"`
		PaymentDate string  `json:"paymentDate"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.RecordInsuranceContinuationPayment(c.Request.Context(), continuationID, payload.Amount, payload.PaymentDate)
	if err != nil {
		log.Printf("Failed to record insurance continuation payment: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to record payment", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Payment recorded successfully"})
}
