package main

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== PAYROLL HANDLERS ====================

// GetPayrollPeriods godoc
func GetPayrollPeriods(c *gin.Context) {
	periods, err := repository.GetPayrollPeriods(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, periods)
}

// CreatePayrollPeriod godoc
func CreatePayrollPeriod(c *gin.Context) {
	var period models.PayrollPeriod
	if err := c.ShouldBindJSON(&period); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := repository.CreatePayrollPeriod(c.Request.Context(), &period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	period.ID = id
	c.JSON(http.StatusCreated, period)
}

// GetSalaryConfigurations godoc
func GetSalaryConfigurations(c *gin.Context) {
	configs, err := repository.GetSalaryConfigurations(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

// UpdateSalaryConfiguration godoc — direct apply for regular grades; for grades flagged
// requires_approval_for_change (Director/C-Level by default), stages the change and routes
// it through the Master Approval Engine instead of applying it immediately.
func UpdateSalaryConfiguration(c *gin.Context) {
	var config models.SalaryConfiguration
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	grade, gradeErr := repository.GetPayGradeForEmployee(c.Request.Context(), config.EmployeeID)
	if gradeErr == nil && grade.RequiresApprovalForChange {
		actorEmployeeID, _ := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
		if actorEmployeeID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Akun Anda belum terhubung dengan data karyawan"})
			return
		}

		reqID, err := repository.CreateSalaryChangeRequest(c.Request.Context(), &models.SalaryChangeRequest{
			EmployeeID:         config.EmployeeID,
			BaseSalary:         config.BaseSalary,
			TransportAllowance: config.TransportAllowance,
			MealAllowance:      config.MealAllowance,
			PositionAllowance:  config.PositionAllowance,
			RequestedBy:        actorEmployeeID,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		employee, _ := repository.GetEmployeeByID(c.Request.Context(), config.EmployeeID)
		summary := fmt.Sprintf("Perubahan gaji untuk %s (%s)", employee.FullName, grade.Name)
		if _, err := repository.SubmitApprovalRequest(c.Request.Context(), "salary_change", reqID, actorEmployeeID, summary); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Belum ada alur approval aktif untuk perubahan gaji level " + grade.Name + ": " + err.Error()})
			return
		}

		c.JSON(http.StatusAccepted, gin.H{"message": "Perubahan gaji level " + grade.Name + " memerlukan approval dan telah diajukan"})
		return
	}

	if err := repository.UpdateSalaryConfiguration(c.Request.Context(), &config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Salary configuration updated successfully"})
}

// GetPayGrades godoc
func GetPayGrades(c *gin.Context) {
	grades, err := repository.GetPayGrades(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, grades)
}

// UpdatePayGrade godoc — upserts the pay band/policy for one organizational level
func UpdatePayGrade(c *gin.Context) {
	var grade models.PayGrade
	if err := c.ShouldBindJSON(&grade); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.UpdatePayGrade(c.Request.Context(), &grade); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Salary grade updated successfully"})
}

// GetBPJSRateConfig godoc — the editable employee-side BPJS contribution rates/caps
func GetBPJSRateConfig(c *gin.Context) {
	cfg, err := repository.GetBPJSRateConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

// UpdateBPJSRateConfig godoc
func UpdateBPJSRateConfig(c *gin.Context) {
	var cfg models.BPJSRateConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.UpdateBPJSRateConfig(c.Request.Context(), &cfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tarif BPJS berhasil diperbarui"})
}

// GetPPh21TERBrackets godoc — all TER brackets across all PTKP categories
func GetPPh21TERBrackets(c *gin.Context) {
	brackets, err := repository.GetAllTERBrackets(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, brackets)
}

// UpdatePPh21TERBrackets godoc — replaces the whole bracket table for one PTKP category (A/B/C)
func UpdatePPh21TERBrackets(c *gin.Context) {
	category := c.Param("category")
	if category != "A" && category != "B" && category != "C" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori harus A, B, atau C"})
		return
	}
	var req struct {
		Brackets []models.PPh21TERBracket `json:"brackets" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.ReplaceTERBracketsForCategory(c.Request.Context(), category, req.Brackets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Bracket PPh21 kategori " + category + " berhasil diperbarui"})
}

// SimulatePayroll godoc — computes a full gaji breakdown (gross, BPJS, PPh21, other
// deductions, net) for hypothetical inputs using the same dynamic rate config as
// GeneratePayroll, without writing anything to the database. Lets Finance/HR preview
// "what if" pay scenarios, including ad-hoc "other deductions" (loan, koperasi, etc).
func SimulatePayroll(c *gin.Context) {
	var req struct {
		BaseSalary              float64 `json:"baseSalary" binding:"required"`
		TransportAllowance      float64 `json:"transportAllowance"`
		MealAllowance           float64 `json:"mealAllowance"`
		PositionAllowance       float64 `json:"positionAllowance"`
		TaxStatus               string  `json:"taxStatus" binding:"required"`
		BpjsKesehatanType       string  `json:"bpjsKesehatanType"`
		BpjsKetenagakerjaanType string  `json:"bpjsKetenagakerjaanType"`
		ExtraDeductions         []struct {
			Name   string  `json:"name" binding:"required"`
			Amount float64 `json:"amount" binding:"required"`
		} `json:"extraDeductions"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	bpjsCfg, err := repository.GetBPJSRateConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	terCategory := repository.TerCategoryForTaxStatus(req.TaxStatus)
	brackets, err := repository.GetTERBracketsForCategory(c.Request.Context(), terCategory)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalAllowance := req.TransportAllowance + req.MealAllowance + req.PositionAllowance
	grossSalary := req.BaseSalary + totalAllowance

	bpjsKesehatan := repository.CalculateBPJSKesehatanEmployeeDynamic(req.BaseSalary, req.BpjsKesehatanType, bpjsCfg)
	bpjsJHT, bpjsJP := repository.CalculateBPJSKetenagakerjaanEmployeeDynamic(req.BaseSalary, req.BpjsKetenagakerjaanType, bpjsCfg)
	pph21 := repository.CalculatePPh21MonthlyDynamic(grossSalary-bpjsKesehatan-bpjsJHT-bpjsJP, req.TaxStatus, brackets)

	extraTotal := 0.0
	extraBreakdown := make([]gin.H, 0, len(req.ExtraDeductions))
	for _, ed := range req.ExtraDeductions {
		extraTotal += ed.Amount
		extraBreakdown = append(extraBreakdown, gin.H{"name": ed.Name, "amount": ed.Amount})
	}

	totalDeduction := bpjsKesehatan + bpjsJHT + bpjsJP + pph21 + extraTotal
	netSalary := grossSalary - totalDeduction

	c.JSON(http.StatusOK, gin.H{
		"grossSalary":     grossSalary,
		"totalAllowance":  totalAllowance,
		"bpjsKesehatan":   bpjsKesehatan,
		"bpjsJHT":         bpjsJHT,
		"bpjsJP":          bpjsJP,
		"pph21":           pph21,
		"terCategory":     terCategory,
		"extraDeductions": extraBreakdown,
		"totalDeduction":  totalDeduction,
		"netSalary":       netSalary,
	})
}

// ==================== OTHER DEDUCTIONS (loan, koperasi, denda, dll) ====================

// GetDeductionTypes godoc — the reusable catalog of "other deduction" types
func GetDeductionTypes(c *gin.Context) {
	types, err := repository.GetDeductionTypes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, types)
}

// CreateDeductionType godoc
func CreateDeductionType(c *gin.Context) {
	var t models.DeductionType
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id, err := repository.CreateDeductionType(c.Request.Context(), &t)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Jenis potongan berhasil dibuat"})
}

// UpdateDeductionType godoc
func UpdateDeductionType(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var t models.DeductionType
	if err := c.ShouldBindJSON(&t); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	t.ID = id
	if err := repository.UpdateDeductionType(c.Request.Context(), &t); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Jenis potongan berhasil diperbarui"})
}

// DeleteDeductionType godoc
func DeleteDeductionType(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := repository.DeleteDeductionType(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Tidak bisa menghapus: masih dipakai oleh potongan karyawan aktif"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Jenis potongan berhasil dihapus"})
}

// GetEmployeeDeductions godoc — an employee's recurring "other deductions"
func GetEmployeeDeductions(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee id"})
		return
	}
	deductions, err := repository.GetEmployeeDeductions(c.Request.Context(), employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, deductions)
}

// CreateEmployeeDeduction godoc — assigns a deduction type to an employee as a recurring deduction
func CreateEmployeeDeduction(c *gin.Context) {
	var d models.EmployeeDeduction
	if err := c.ShouldBindJSON(&d); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id, err := repository.CreateEmployeeDeduction(c.Request.Context(), &d)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"id": id, "message": "Potongan berhasil ditambahkan ke karyawan"})
}

// SetEmployeeDeductionActive godoc — pause/resume a recurring deduction
func SetEmployeeDeductionActive(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	var req struct {
		Active bool `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.SetEmployeeDeductionActive(c.Request.Context(), id, req.Active); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Status potongan berhasil diperbarui"})
}

// DeleteEmployeeDeduction godoc
func DeleteEmployeeDeduction(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}
	if err := repository.DeleteEmployeeDeduction(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Potongan berhasil dihapus"})
}

// GetMyPayslips godoc — self-service: an employee views only their own released payslips
func GetMyPayslips(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Akun Anda belum terhubung dengan data karyawan"})
		return
	}
	payslips, err := repository.GetPayslipsForEmployee(c.Request.Context(), employeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payslips)
}

// GetMyPayslipDetail godoc — self-service payslip breakdown, only the owner may view it
func GetMyPayslipDetail(c *gin.Context) {
	payslipID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payslip id"})
		return
	}
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Akun Anda belum terhubung dengan data karyawan"})
		return
	}
	ownerID, err := repository.GetPayslipOwnerEmployeeID(c.Request.Context(), payslipID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payslip not found"})
		return
	}
	// Owner, or a manager viewing a direct report's slip, may view — otherwise forbidden.
	if ownerID != employeeID {
		team, _ := repository.GetTeamPayslipsForManager(c.Request.Context(), employeeID)
		authorized := false
		for _, p := range team {
			if p.EmployeeID == ownerID {
				authorized = true
				break
			}
		}
		if !authorized {
			c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak berwenang melihat slip gaji ini"})
			return
		}
	}
	components, err := repository.GetPayslipComponents(c.Request.Context(), payslipID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, components)
}

// GetTeamPayslips godoc — a manager sees their direct reports' most recent released payslips
func GetTeamPayslips(c *gin.Context) {
	managerEmployeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || managerEmployeeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Akun Anda belum terhubung dengan data karyawan"})
		return
	}
	payslips, err := repository.GetTeamPayslipsForManager(c.Request.Context(), managerEmployeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payslips)
}

// GeneratePayroll godoc
func GeneratePayroll(c *gin.Context) {
	periodID, _ := strconv.Atoi(c.Param("id"))
	if periodID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period ID"})
		return
	}

	err := repository.GeneratePayroll(c.Request.Context(), periodID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payroll generated successfully for the period"})
}

// UpdatePayrollPeriodStatus godoc — close, release, or cancel a payroll period
func UpdatePayrollPeriodStatus(c *gin.Context) {
	periodID, err := strconv.Atoi(c.Param("id"))
	if err != nil || periodID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	allowed := map[string]bool{"draft": true, "processing": true, "closed": true, "cancelled": true}
	if !allowed[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status. Allowed: draft, processing, closed, cancelled"})
		return
	}

	if err := repository.UpdatePayrollPeriodStatus(c.Request.Context(), periodID, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payroll period status updated to " + req.Status})
}

// GetPayslips godoc
func GetPayslips(c *gin.Context) {
	periodID, _ := strconv.Atoi(c.Query("periodId"))
	if periodID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Period ID is required"})
		return
	}

	payslips, err := repository.GetPayslipsByPeriod(c.Request.Context(), periodID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, payslips)
}

