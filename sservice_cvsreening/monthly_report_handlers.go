package main

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// getMonthlyAttendanceReportHandler returns the monthly attendance summary.
// HR/Admin can view all employees or filter by employeeId; regular employees only see their own.
func getMonthlyAttendanceReportHandler(c *gin.Context) {
	now := time.Now()
	year, _ := strconv.Atoi(c.DefaultQuery("year", strconv.Itoa(now.Year())))
	month, _ := strconv.Atoi(c.DefaultQuery("month", strconv.Itoa(int(now.Month()))))
	if month < 1 || month > 12 {
		RespondWithError(c, http.StatusBadRequest, "invalid_month", "Bulan harus antara 1-12", nil)
		return
	}

	employeeID, _ := strconv.Atoi(c.Query("employeeId"))
	role := GetUserRoleFromContext(c)
	if !isHRRoleForApprovals(role) {
		// Non-HR users can only ever see their own report
		selfID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
		if err != nil || selfID == 0 {
			RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
			return
		}
		employeeID = selfID
	}

	rows, err := repository.GetMonthlyAttendanceReport(c.Request.Context(), year, month, employeeID)
	if err != nil {
		log.Printf("ERROR in getMonthlyAttendanceReportHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil laporan bulanan", err.Error())
		return
	}

	daily, err := repository.GetDailyAttendanceReport(c.Request.Context(), year, month)
	if err != nil {
		log.Printf("ERROR fetching daily report: %v", err)
		daily = []map[string]interface{}{}
	}

	c.JSON(http.StatusOK, gin.H{
		"year":  year,
		"month": month,
		"data":  rows,
		"daily": daily,
	})
}
