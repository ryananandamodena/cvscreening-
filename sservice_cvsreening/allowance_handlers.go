package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func getAllowancesHandler(c *gin.Context) {
	list, err := repository.GetAllowances(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getAllowancesHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch allowances", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

func createAllowanceHandler(c *gin.Context) {
	var a models.Allowance
	if err := c.ShouldBindJSON(&a); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateAllowance(c.Request.Context(), &a)
	if err != nil {
		log.Printf("Failed to create allowance: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create allowance", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Allowance created successfully"})
}

func updateAllowanceHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid allowance ID", nil)
		return
	}
	var a models.Allowance
	if err := c.ShouldBindJSON(&a); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	a.ID = id
	if err := repository.UpdateAllowance(c.Request.Context(), &a); err != nil {
		log.Printf("Failed to update allowance: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update allowance", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Allowance updated successfully"})
}

func deleteAllowanceHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid allowance ID", nil)
		return
	}
	if err := repository.DeleteAllowance(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete allowance: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete allowance", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Allowance deactivated successfully"})
}

func assignAllowanceHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	allowanceID, err := strconv.Atoi(c.Param("allowanceId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid allowance ID", nil)
		return
	}
	var payload struct {
		Amount        float64 `json:"amount"`
		EffectiveDate string  `json:"effectiveDate"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.AssignAllowanceToEmployee(c.Request.Context(), employeeID, allowanceID, payload.Amount, payload.EffectiveDate)
	if err != nil {
		log.Printf("Failed to assign allowance: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to assign allowance", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Allowance assigned successfully"})
}
