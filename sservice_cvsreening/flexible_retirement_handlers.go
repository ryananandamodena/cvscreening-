package main

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== FLEXIBLE BENEFITS ====================

func getFlexibleBenefitsHandler(c *gin.Context) {
	list, err := repository.GetFlexibleBenefits(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getFlexibleBenefitsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch flexible benefits", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

func createFlexibleBenefitHandler(c *gin.Context) {
	var f models.FlexibleBenefit
	if err := c.ShouldBindJSON(&f); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateFlexibleBenefit(c.Request.Context(), &f)
	if err != nil {
		log.Printf("Failed to create flexible benefit: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create flexible benefit", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Flexible benefit created successfully"})
}

func updateFlexibleBenefitHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid flexible benefit ID", nil)
		return
	}
	var patch repository.FlexibleBenefitPatch
	if err := c.ShouldBindJSON(&patch); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.UpdateFlexibleBenefit(c.Request.Context(), id, &patch); err != nil {
		log.Printf("Failed to update flexible benefit: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update flexible benefit", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Flexible benefit updated successfully"})
}

func enrollFlexibleBenefitHandler(c *gin.Context) {
	var payload struct {
		EmployeeID int     `json:"employeeId" binding:"required"`
		BenefitID  int     `json:"benefitId" binding:"required"`
		Amount     float64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.EnrollFlexibleBenefit(c.Request.Context(), payload.EmployeeID, payload.BenefitID, payload.Amount)
	if err != nil {
		log.Printf("Failed to enroll flexible benefit: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to enroll flexible benefit", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Enrolled successfully"})
}

// ==================== RETIREMENT PLANS ====================

func getRetirementPlansHandler(c *gin.Context) {
	list, err := repository.GetRetirementPlans(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getRetirementPlansHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch retirement plans", err.Error())
		return
	}
	c.JSON(http.StatusOK, list)
}

func createRetirementPlanHandler(c *gin.Context) {
	var r models.RetirementPlan
	if err := c.ShouldBindJSON(&r); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.CreateRetirementPlan(c.Request.Context(), &r)
	if err != nil {
		log.Printf("Failed to create retirement plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create retirement plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Retirement plan created successfully"})
}

func updateRetirementPlanHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_id", "Invalid retirement plan ID", nil)
		return
	}
	var patch repository.RetirementPlanPatch
	if err := c.ShouldBindJSON(&patch); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if err := repository.UpdateRetirementPlan(c.Request.Context(), id, &patch); err != nil {
		log.Printf("Failed to update retirement plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update retirement plan", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Retirement plan updated successfully"})
}

func enrollRetirementPlanHandler(c *gin.Context) {
	var payload struct {
		EmployeeID int `json:"employeeId" binding:"required"`
		PlanID     int `json:"planId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	id, err := repository.EnrollRetirementPlan(c.Request.Context(), payload.EmployeeID, payload.PlanID)
	if err != nil {
		log.Printf("Failed to enroll retirement plan: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to enroll retirement plan", err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Enrolled successfully"})
}
