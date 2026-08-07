package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== INSURANCE PLANS ====================

// getInsurancePlansHandler lists active insurance plans, optionally filtered by ?type=
func getInsurancePlansHandler(c *gin.Context) {
	plans, err := repository.GetInsurancePlans(c.Request.Context(), c.Query("type"))
	if err != nil {
		log.Printf("ERROR in getInsurancePlansHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch insurance plans", err.Error())
		return
	}
	c.JSON(http.StatusOK, plans)
}

// createInsurancePlanHandler creates a new insurance plan
func createInsurancePlanHandler(c *gin.Context) {
	var plan models.InsurancePlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateInsurancePlan(c.Request.Context(), &plan)
	if err != nil {
		log.Printf("Failed to create insurance plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create insurance plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Insurance plan created successfully"})
}

// updateInsurancePlanHandler updates an existing insurance plan
func updateInsurancePlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid insurance plan ID", nil)
		return
	}
	var plan models.InsurancePlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	plan.ID = id
	if err := repository.UpdateInsurancePlan(c.Request.Context(), &plan); err != nil {
		log.Printf("Failed to update insurance plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update insurance plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Insurance plan updated successfully"})
}

// deleteInsurancePlanHandler soft-deletes (deactivates) an insurance plan
func deleteInsurancePlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid insurance plan ID", nil)
		return
	}
	if err := repository.DeleteInsurancePlan(c.Request.Context(), id); err != nil {
		log.Printf("Failed to delete insurance plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete insurance plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Insurance plan deactivated successfully"})
}

// enrollInsurancePlanHandler enrolls an employee into an insurance plan (plan id from URL)
func enrollInsurancePlanHandler(c *gin.Context) {
	planID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid insurance plan ID", nil)
		return
	}
	var payload struct {
		EmployeeID    int    `json:"employeeId" binding:"required"`
		EffectiveDate string `json:"effectiveDate"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.EnrollEmployeeInsurance(c.Request.Context(), payload.EmployeeID, planID, payload.EffectiveDate)
	if err != nil {
		log.Printf("Failed to enroll employee insurance: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to enroll employee in insurance plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Employee enrolled successfully"})
}

// getEmployeeInsuranceEnrollmentsHandler lists insurance enrollments, optionally
// scoped to one employee via ?employeeId=
func getEmployeeInsuranceEnrollmentsHandler(c *gin.Context) {
	employeeID, _ := strconv.Atoi(c.Query("employeeId"))
	enrollments, err := repository.GetEmployeeInsuranceEnrollments(c.Request.Context(), employeeID)
	if err != nil {
		log.Printf("ERROR in getEmployeeInsuranceEnrollmentsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch insurance enrollments", err.Error())
		return
	}
	c.JSON(http.StatusOK, enrollments)
}

// terminateInsuranceEnrollmentHandler terminates an employee's insurance enrollment
func terminateInsuranceEnrollmentHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid enrollment ID", nil)
		return
	}
	var payload struct {
		EndDate string `json:"endDate"`
		Reason  string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.TerminateEmployeeInsurance(c.Request.Context(), id, payload.EndDate, payload.Reason); err != nil {
		log.Printf("Failed to terminate insurance enrollment: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to terminate insurance enrollment", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Insurance enrollment terminated successfully"})
}

// ==================== EMPLOYEE DEPENDENTS ====================

// getDependentsHandler lists dependents for an employee
func getDependentsHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	deps, err := repository.GetEmployeeDependents(c.Request.Context(), employeeID)
	if err != nil {
		log.Printf("ERROR in getDependentsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch dependents", err.Error())
		return
	}
	c.JSON(http.StatusOK, deps)
}

// addDependentHandler adds a dependent for an employee
func addDependentHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	var dep models.EmployeeDependent
	if err := c.ShouldBindJSON(&dep); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	dep.EmployeeID = employeeID
	id, err := repository.AddDependent(c.Request.Context(), &dep)
	if err != nil {
		log.Printf("Failed to add dependent: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to add dependent", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Dependent added successfully"})
}

// updateDependentHandler updates a dependent for an employee
func updateDependentHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	dependentID, err := strconv.Atoi(c.Param("dependentId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid dependent ID", nil)
		return
	}
	var dep models.EmployeeDependent
	if err := c.ShouldBindJSON(&dep); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	dep.ID = dependentID
	if err := repository.UpdateDependent(c.Request.Context(), employeeID, &dep); err != nil {
		log.Printf("Failed to update dependent: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update dependent", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dependent updated successfully"})
}

// removeDependentHandler removes a dependent for an employee
func removeDependentHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid employee ID", nil)
		return
	}
	dependentID, err := strconv.Atoi(c.Param("dependentId"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid dependent ID", nil)
		return
	}
	if err := repository.RemoveDependent(c.Request.Context(), employeeID, dependentID); err != nil {
		log.Printf("Failed to remove dependent: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to remove dependent", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Dependent removed successfully"})
}
