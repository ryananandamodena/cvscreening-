package main

import "github.com/gin-gonic/gin"

// registerAdminFinanceRoutes wires up the AdminOnly() user-management/audit-trail
// group, the FinanceOrAdmin() payroll group, and the payroll self-service routes
// any authenticated employee can hit. Split out of main() verbatim — same routes,
// same order, same middleware groupings.
func registerAdminFinanceRoutes(protected *gin.RouterGroup) {
	// User Management (Admin only)
	adminOnly := protected.Group("/")
	adminOnly.Use(AdminOnly())
	{
		adminOnly.GET("/users", getUsersHandler)
		adminOnly.GET("/users/:id", getUserByIDHandler)
		adminOnly.POST("/users", createUserHandler)
		adminOnly.PUT("/users/:id", updateUserHandler)
		adminOnly.DELETE("/users/:id", deleteUserHandler)
		adminOnly.PATCH("/users/:id/status", toggleUserStatusHandler)

		// Audit Trail (Admin / HR Manager only)
		adminOnly.GET("/audit-trail", getAuditTrailHandler)
	}

	// Finance Management (Admin & Finance only)
	financeOnly := protected.Group("/")
	financeOnly.Use(FinanceOrAdmin())
	{
		// Payroll
		financeOnly.GET("/payroll/periods", GetPayrollPeriods)
		financeOnly.POST("/payroll/periods", CreatePayrollPeriod)
		financeOnly.PUT("/payroll/periods/:id/status", UpdatePayrollPeriodStatus)
		financeOnly.GET("/payroll/configurations", GetSalaryConfigurations)
		financeOnly.POST("/payroll/configurations", UpdateSalaryConfiguration)
		financeOnly.POST("/payroll/salary-change-requests", RequestSalaryChange)
		financeOnly.POST("/payroll/generate/:id", GeneratePayroll)
		financeOnly.GET("/payroll/payslips", GetPayslips)
		financeOnly.GET("/payroll/grades", GetPayGrades)
		financeOnly.PUT("/payroll/grades", UpdatePayGrade)
		financeOnly.GET("/payroll/bpjs-config", GetBPJSRateConfig)
		financeOnly.PUT("/payroll/bpjs-config", UpdateBPJSRateConfig)
		financeOnly.GET("/payroll/tax-brackets", GetPPh21TERBrackets)
		financeOnly.PUT("/payroll/tax-brackets/:category", UpdatePPh21TERBrackets)
		financeOnly.POST("/payroll/simulate", SimulatePayroll)

		financeOnly.GET("/payroll/deduction-types", GetDeductionTypes)
		financeOnly.POST("/payroll/deduction-types", CreateDeductionType)
		financeOnly.PUT("/payroll/deduction-types/:id", UpdateDeductionType)
		financeOnly.DELETE("/payroll/deduction-types/:id", DeleteDeductionType)
		financeOnly.GET("/payroll/employees/:employeeId/deductions", GetEmployeeDeductions)
		financeOnly.POST("/payroll/employee-deductions", CreateEmployeeDeduction)
		financeOnly.PUT("/payroll/employee-deductions/:id/active", SetEmployeeDeductionActive)
		financeOnly.DELETE("/payroll/employee-deductions/:id", DeleteEmployeeDeduction)
	}

	// Payroll self-service — any authenticated employee views their own payslips;
	// a manager additionally sees their direct reports' payslips.
	protected.GET("/payroll/my-payslips", GetMyPayslips)
	protected.GET("/payroll/my-payslips/:id/components", GetMyPayslipDetail)
	protected.GET("/payroll/team-payslips", GetTeamPayslips)
}
