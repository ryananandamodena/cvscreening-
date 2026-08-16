package main

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/models"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

// ==================== ATTENDANCE HANDLERS ====================

// getOfficeLocationHandler exposes the office coordinates/radius so the frontend can render the geofence map
func getOfficeLocationHandler(c *gin.Context) {
	settings, _ := repository.GetOfficeSettings(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{
		"latitude":     settings.Latitude,
		"longitude":    settings.Longitude,
		"radiusMeters": settings.RadiusMeters,
	})
}

// updateOfficeLocationHandler lets an admin set the office geofencing location (e.g. to their current GPS position)
func updateOfficeLocationHandler(c *gin.Context) {
	var req struct {
		Latitude     float64 `json:"latitude" binding:"required"`
		Longitude    float64 `json:"longitude" binding:"required"`
		RadiusMeters float64 `json:"radiusMeters"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}
	if req.RadiusMeters <= 0 {
		req.RadiusMeters = 100
	}

	err := repository.UpdateOfficeSettings(c.Request.Context(), repository.OfficeSettings{
		Latitude: req.Latitude, Longitude: req.Longitude, RadiusMeters: req.RadiusMeters,
	})
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update office location", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Office location updated"})
}

// getLocationExemptionsHandler lists every employee that currently has a geofencing exemption
// row (enabled or not), for the HR/Admin management screen.
func getLocationExemptionsHandler(c *gin.Context) {
	list, _ := repository.ListLocationExemptions(c.Request.Context())
	c.JSON(http.StatusOK, gin.H{"exemptions": list})
}

// setLocationExemptionHandler lets HR/Admin dynamically allow (or revoke) a specific employee
// clocking in/out from outside the office geofencing radius — e.g. remote workers, field staff,
// or a temporary WFH arrangement — without changing the shared office_settings location that
// everyone else is still checked against.
func setLocationExemptionHandler(c *gin.Context) {
	employeeID, err := strconv.Atoi(c.Param("employeeId"))
	if err != nil || employeeID <= 0 {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid employee id", nil)
		return
	}

	var req struct {
		Enabled   bool    `json:"enabled"`
		Reason    string  `json:"reason"`
		StartDate *string `json:"startDate"`
		EndDate   *string `json:"endDate"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	parseDate := func(s *string) (*time.Time, error) {
		if s == nil || *s == "" {
			return nil, nil
		}
		t, err := time.Parse("2006-01-02", *s)
		if err != nil {
			return nil, err
		}
		return &t, nil
	}
	startDate, err := parseDate(req.StartDate)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "startDate must be YYYY-MM-DD", nil)
		return
	}
	endDate, err := parseDate(req.EndDate)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "endDate must be YYYY-MM-DD", nil)
		return
	}
	if startDate != nil && endDate != nil && endDate.Before(*startDate) {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "endDate must not be before startDate", nil)
		return
	}

	err = repository.SetLocationExemption(c.Request.Context(), GetUserIDFromContext(c), repository.LocationExemption{
		EmployeeID: employeeID,
		Enabled:    req.Enabled,
		Reason:     req.Reason,
		StartDate:  startDate,
		EndDate:    endDate,
	})
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update location exemption", err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Location exemption updated"})
}

// shiftTimeToday combines a "HH:MM:SS" shift time string with today's date into a full time.Time
func shiftTimeToday(reference time.Time, hhmmss string) (time.Time, error) {
	t, err := time.Parse("15:04:05", hhmmss)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(reference.Year(), reference.Month(), reference.Day(), t.Hour(), t.Minute(), t.Second(), 0, reference.Location()), nil
}

// shouldEnforceFaceVerification decides whether mandatory face-matching applies to this
// clock-in, based on the client's own declared platform — not on whether a descriptor happens
// to be present (that was the exact fail-open bug fixed in Module 14; this is a deliberate,
// declared exemption for a channel with no face-matching capability at all, not an omission).
// Only "mobile" is exempted; anything else (empty string = web, or an unrecognized value) still
// enforces verification, so a spoofed/unknown clientType fails closed rather than open.
func shouldEnforceFaceVerification(clientType string) bool {
	return strings.ToLower(strings.TrimSpace(clientType)) != "mobile"
}

func clockInHandler(c *gin.Context) {
	var req models.ClockInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	req.EmployeeID = employeeID

	if onLeave, leaveErr := repository.IsEmployeeOnApprovedLeave(c.Request.Context(), employeeID, time.Now()); leaveErr == nil && onLeave {
		RespondWithError(c, http.StatusForbidden, "on_approved_leave",
			"Anda sedang dalam status cuti yang disetujui hari ini, tidak bisa melakukan clock in", nil)
		return
	}
	if isHoliday, holidayName, holErr := repository.IsHoliday(c.Request.Context(), time.Now()); holErr == nil && isHoliday {
		RespondWithError(c, http.StatusForbidden, "is_holiday",
			fmt.Sprintf("Hari ini adalah hari libur (%s), clock in tidak diperlukan", holidayName), nil)
		return
	}

	if req.QRToken != "" {
		// Scanning the kiosk's live-rotating QR code proves physical presence at the office,
		// so photo/GPS/geofencing verification is not required for this path.
		if err := verifyQRToken(req.QRToken); err != nil {
			RespondWithError(c, http.StatusForbidden, "qr_token_invalid", err.Error(), nil)
			return
		}
	} else {
		if req.Photo == "" {
			RespondWithError(c, http.StatusBadRequest, "photo_required", "Foto live diperlukan untuk clock in", nil)
			return
		}
		if req.Latitude == 0 && req.Longitude == 0 {
			RespondWithError(c, http.StatusBadRequest, "location_required", "Lokasi GPS diperlukan untuk clock in", nil)
			return
		}

		// An employee with an active location exemption (set by HR/Admin — see
		// attendance_location_exemption_repository.go) skips the office geofencing check
		// entirely, e.g. permanent remote workers, field staff, or a time-boxed WFH
		// arrangement. Photo capture is still mandatory either way.
		exempt, exemptErr := repository.IsRemoteExempt(c.Request.Context(), employeeID)
		if exemptErr != nil {
			log.Printf("ERROR checking location exemption for employee %d: %v", employeeID, exemptErr)
		}
		if !exempt {
			office, _ := repository.GetOfficeSettings(c.Request.Context())
			distance := haversineDistance(office.Latitude, office.Longitude, req.Latitude, req.Longitude)
			if distance > office.RadiusMeters {
				RespondWithError(c, http.StatusForbidden, "geofencing_error", "Anda berada di luar jangkauan area kantor (Geofencing)", nil)
				return
			}
		}

		// Face verification is only meaningful once the employee has actually enrolled a
		// reference descriptor — an employee with no enrollment yet has nothing to compare
		// against (see VerifyFaceDescriptor's documented "no enrollment" pass-through; this is
		// an explicit, unchanged business-policy decision, not something fixed here).
		//
		// But for an employee who HAS already enrolled, verification must be mandatory and
		// fail-closed on every clock-in — two bypasses previously existed here (Module 14
		// security fix):
		//   1. Simply omitting `faceDescriptor` from the request skipped the whole check, even
		//      for an already-enrolled employee — trivially bypassable via a direct API call
		//      that never touches the camera/face-api.js at all.
		//   2. Any error from VerifyFaceDescriptor (DB error, malformed/wrong-length descriptor)
		//      was only logged, then fell through as an implicit ALLOW instead of a DENY.
		// Both let an already-enrolled employee falsify their own attendance record — a direct
		// bypass of the anti-fraud "live selfie" policy this feature exists to enforce, not a
		// business-decision case.
		//
		// Exception: the mobile app has no on-device face-matching capability at all (no
		// face-api.js equivalent), so it can never send a faceDescriptor — an explicit, declared
		// exemption (shouldEnforceFaceVerification), not the same silent-omission bypass as
		// above. Photo+GPS/geofencing are still mandatory for mobile either way.
		enrolledDescriptor, faceLookupErr := repository.GetFaceDescriptor(c.Request.Context(), employeeID)
		if faceLookupErr != nil {
			log.Printf("ERROR fetching enrolled face descriptor for employee %d: %v", employeeID, faceLookupErr)
		} else if enrolledDescriptor != nil && shouldEnforceFaceVerification(req.ClientType) {
			if len(req.FaceDescriptor) == 0 {
				RespondWithError(c, http.StatusForbidden, "face_verification_required",
					"Verifikasi wajah diperlukan — wajah tidak terdeteksi pada foto. Silakan coba lagi dengan pencahayaan yang lebih baik.", nil)
				return
			}
			matched, distance, verifyErr := repository.VerifyFaceDescriptor(c.Request.Context(), employeeID, req.FaceDescriptor)
			if verifyErr != nil {
				log.Printf("ERROR verifying face descriptor for employee %d: %v", employeeID, verifyErr)
				RespondWithError(c, http.StatusForbidden, "face_verification_failed",
					"Verifikasi wajah gagal — data wajah tidak valid. Silakan ajukan koreksi absensi (jenis: Verifikasi Foto Gagal) untuk persetujuan manager.", nil)
				return
			}
			if !matched {
				log.Printf("Face verification failed for employee %d (distance=%.3f)", employeeID, distance)
				RespondWithError(c, http.StatusForbidden, "face_verification_failed",
					"Verifikasi wajah gagal — wajah tidak cocok dengan data terdaftar. Silakan ajukan koreksi absensi (jenis: Verifikasi Foto Gagal) untuk persetujuan manager.", nil)
				return
			}
		}
	}

	today := time.Now().Truncate(24 * time.Hour)
	now := time.Now()

	// Late arrival detection, based on the employee's assigned shift (if any)
	status := "present"
	lateMinutes := 0
	if shift, shiftErr := repository.GetEmployeeShift(c.Request.Context(), employeeID, now); shiftErr == nil && shift != nil {
		if shiftStart, parseErr := shiftTimeToday(now, shift.StartTime); parseErr == nil {
			threshold := shiftStart.Add(time.Duration(shift.ToleranceMinutes) * time.Minute)
			if now.After(threshold) {
				status = "late"
				lateMinutes = int(now.Sub(shiftStart).Minutes())
			}
		}
	}

	att := models.Attendance{
		EmployeeID:      req.EmployeeID,
		Date:            today,
		ClockIn:         &now,
		ClockInLocation: req.Location,
		ClockInPhoto:    req.Photo,
		Status:          status,
		LateMinutes:     lateMinutes,
	}

	id, err := repository.RecordClockIn(c.Request.Context(), &att)
	if err != nil {
		if err.Error() == "already clocked in today" {
			RespondWithError(c, http.StatusConflict, "already_clocked_in", "Anda sudah melakukan clock in hari ini", nil)
			return
		}
		log.Printf("ERROR in clockInHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to clock in", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Clock in successful", "id": id, "time": now})
}

func clockOutHandler(c *gin.Context) {
	var req models.ClockOutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	req.EmployeeID = employeeID

	if req.QRToken != "" {
		if err := verifyQRToken(req.QRToken); err != nil {
			RespondWithError(c, http.StatusForbidden, "qr_token_invalid", err.Error(), nil)
			return
		}
	} else {
		if req.Photo == "" {
			RespondWithError(c, http.StatusBadRequest, "photo_required", "Foto live diperlukan untuk clock out", nil)
			return
		}
		if req.Latitude == 0 && req.Longitude == 0 {
			RespondWithError(c, http.StatusBadRequest, "location_required", "Lokasi GPS diperlukan untuk clock out", nil)
			return
		}
		exempt, exemptErr := repository.IsRemoteExempt(c.Request.Context(), employeeID)
		if exemptErr != nil {
			log.Printf("ERROR checking location exemption for employee %d: %v", employeeID, exemptErr)
		}
		if !exempt {
			office, _ := repository.GetOfficeSettings(c.Request.Context())
			if distance := haversineDistance(office.Latitude, office.Longitude, req.Latitude, req.Longitude); distance > office.RadiusMeters {
				RespondWithError(c, http.StatusForbidden, "geofencing_error", "Anda berada di luar jangkauan area kantor (Geofencing)", nil)
				return
			}
		}
	}

	today := time.Now().Truncate(24 * time.Hour)
	now := time.Now()

	// Early leave / overtime detection, based on the employee's assigned shift (if any)
	earlyLeaveMinutes := 0
	overtimeHours := 0.0
	if shift, shiftErr := repository.GetEmployeeShift(c.Request.Context(), employeeID, now); shiftErr == nil && shift != nil {
		if shiftEnd, parseErr := shiftTimeToday(now, shift.EndTime); parseErr == nil {
			if now.Before(shiftEnd) {
				earlyLeaveMinutes = int(shiftEnd.Sub(now).Minutes())
			} else if now.After(shiftEnd) {
				overtimeHours = now.Sub(shiftEnd).Hours()
			}
		}
	}

	att := models.Attendance{
		EmployeeID:        req.EmployeeID,
		Date:              today,
		ClockOut:          &now,
		ClockOutLocation:  req.Location,
		ClockOutPhoto:     req.Photo,
		Notes:             req.Notes,
		EarlyLeaveMinutes: earlyLeaveMinutes,
		OvertimeHours:     overtimeHours,
	}

	err = repository.RecordClockOut(c.Request.Context(), &att)
	if err != nil {
		log.Printf("ERROR in clockOutHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to clock out", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Clock out successful", "time": now})
}

func breakStartHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	brk, err := repository.StartBreak(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "break_start_failed", err.Error(), nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Break started", "breakStart": brk.BreakStart})
}

func breakEndHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	brk, err := repository.EndBreak(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "break_end_failed", err.Error(), nil)
		return
	}
	durationMinutes := int(brk.BreakEnd.Sub(brk.BreakStart).Minutes())
	c.JSON(http.StatusOK, gin.H{"message": "Break ended", "breakEnd": brk.BreakEnd, "durationMinutes": durationMinutes})
}

func getTodayBreaksHandler(c *gin.Context) {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		RespondWithError(c, http.StatusBadRequest, "no_employee_record", "Akun Anda belum terhubung dengan data karyawan", nil)
		return
	}
	breaks, err := repository.GetTodayBreaks(c.Request.Context(), employeeID)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Gagal mengambil data istirahat", err.Error())
		return
	}
	c.JSON(http.StatusOK, breaks)
}

func getTodayAttendanceHandler(c *gin.Context) {
	// Self-service by default, resolved from the JWT — an explicit ?employeeId= is honored
	// only for an admin or that employee's direct manager (authorizeEmployeeTarget). Previously
	// a client-supplied employeeId was used directly with no check at all, and the "JWT
	// fallback" for the no-param case read a gin context key ("employee_id") that AuthMiddleware
	// never actually sets — so self-service calls with no employeeId always 400'd.
	var requestedEmployeeID int
	if empIdStr := c.Query("employeeId"); empIdStr != "" {
		var err error
		requestedEmployeeID, err = strconv.Atoi(empIdStr)
		if err != nil {
			RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid employeeId", nil)
			return
		}
	}
	empId, ok := authorizeEmployeeTarget(c, requestedEmployeeID)
	if !ok {
		return
	}

	att, err := repository.GetTodayAttendance(c.Request.Context(), empId)
	if err != nil {
		log.Printf("ERROR in getTodayAttendanceHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch attendance", err.Error())
		return
	}

	if att == nil {
		c.JSON(http.StatusOK, gin.H{"status": "not_clocked_in"})
		return
	}

	c.JSON(http.StatusOK, att)
}

func getAttendanceHistoryHandler(c *gin.Context) {
	// Same ownership rule as getTodayAttendanceHandler — see its comment.
	var requestedEmployeeID int
	if empIdStr := c.Query("employeeId"); empIdStr != "" {
		var err error
		requestedEmployeeID, err = strconv.Atoi(empIdStr)
		if err != nil {
			RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid employeeId", nil)
			return
		}
	}
	empId, ok := authorizeEmployeeTarget(c, requestedEmployeeID)
	if !ok {
		return
	}

	// Default to last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	if startStr := c.Query("startDate"); startStr != "" {
		if parsedStart, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = parsedStart
		}
	}
	if endStr := c.Query("endDate"); endStr != "" {
		if parsedEnd, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = parsedEnd
		}
	}

	history, err := repository.GetAttendanceHistory(c.Request.Context(), empId, startDate, endDate)
	if err != nil {
		log.Printf("ERROR in getAttendanceHistoryHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch attendance history", err.Error())
		return
	}

	c.JSON(http.StatusOK, history)
}

// getTeamAttendanceHandler returns every active employee's attendance status for a given date (defaults to today)
func getTeamAttendanceHandler(c *gin.Context) {
	date := time.Now()
	if dateStr := c.Query("date"); dateStr != "" {
		if parsed, err := time.Parse("2006-01-02", dateStr); err == nil {
			date = parsed
		}
	}

	rows, err := repository.GetTeamAttendance(c.Request.Context(), date)
	if err != nil {
		log.Printf("ERROR in getTeamAttendanceHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch team attendance", err.Error())
		return
	}

	present, late, absent, onLeave, holiday := 0, 0, 0, 0, 0
	for _, r := range rows {
		switch r.Status {
		case "present":
			present++
		case "late":
			late++
		case "leave":
			onLeave++
		case "holiday":
			holiday++
		default:
			absent++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"date": date.Format("2006-01-02"),
		"data": rows,
		"summary": gin.H{
			"total":   len(rows),
			"present": present,
			"late":    late,
			"absent":  absent,
			"leave":   onLeave,
			"holiday": holiday,
		},
	})
}

// ==================== SHIFT HANDLERS ====================

// haversineDistance calculates the distance in meters between two lat/long points
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371000 // Earth radius in meters
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	deltaPhi := (lat2 - lat1) * math.Pi / 180
	deltaLambda := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaPhi/2)*math.Sin(deltaPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*
			math.Sin(deltaLambda/2)*math.Sin(deltaLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

func getShiftsHandler(c *gin.Context) {
	shifts, err := repository.GetShifts(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getShiftsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch shifts", err.Error())
		return
	}
	c.JSON(http.StatusOK, shifts)
}

func getEmployeeShiftHandler(c *gin.Context) {
	empIdStr := c.Param("id")
	if empIdStr == "" {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "employee ID required", nil)
		return
	}
	requestedEmpId, err := strconv.Atoi(empIdStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid employee ID", nil)
		return
	}
	empId, ok := authorizeEmployeeTarget(c, requestedEmpId)
	if !ok {
		return
	}

	targetDate := time.Now()
	if dateStr := c.Query("date"); dateStr != "" {
		if parsed, err := time.Parse("2006-01-02", dateStr); err == nil {
			targetDate = parsed
		}
	}

	shift, err := repository.GetEmployeeShift(c.Request.Context(), empId, targetDate)
	if err != nil {
		// If no shift found, might not be an error, just means no assigned shift
		if err.Error() == "no rows in result set" {
			c.JSON(http.StatusOK, gin.H{"status": "no_shift"})
			return
		}
		log.Printf("ERROR in getEmployeeShiftHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch employee shift", err.Error())
		return
	}

	c.JSON(http.StatusOK, shift)
}

func createShiftHandler(c *gin.Context) {
	var req models.Shift
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	id, err := repository.CreateShift(c.Request.Context(), &req)
	if err != nil {
		log.Printf("ERROR in createShiftHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to create shift", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Shift created successfully", "id": id})
}

func updateShiftHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid shift ID", nil)
		return
	}

	var req models.Shift
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	if err := repository.UpdateShift(c.Request.Context(), id, &req); err != nil {
		log.Printf("ERROR in updateShiftHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to update shift", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift updated successfully"})
}

func deleteShiftHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid shift ID", nil)
		return
	}

	if err := repository.DeleteShift(c.Request.Context(), id); err != nil {
		log.Printf("ERROR in deleteShiftHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to delete shift", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift deleted successfully"})
}

// ==================== SHIFT ASSIGNMENT HANDLERS ====================

func assignShiftHandler(c *gin.Context) {
	var req struct {
		EmployeeID    int     `json:"employeeId" binding:"required"`
		ShiftID       int     `json:"shiftId" binding:"required"`
		EffectiveDate string  `json:"effectiveDate" binding:"required"`
		EndDate       *string `json:"endDate"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid request data", err.Error())
		return
	}

	effDate, err := time.Parse("2006-01-02", req.EffectiveDate)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid effectiveDate format (use YYYY-MM-DD)", nil)
		return
	}

	es := models.EmployeeShift{
		EmployeeID:    req.EmployeeID,
		ShiftID:       req.ShiftID,
		EffectiveDate: effDate,
	}

	if req.EndDate != nil && *req.EndDate != "" {
		endParsed, err := time.Parse("2006-01-02", *req.EndDate)
		if err == nil {
			es.EndDate = &endParsed
		}
	}

	id, err := repository.AssignShiftToEmployee(c.Request.Context(), &es)
	if err != nil {
		log.Printf("ERROR in assignShiftHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to assign shift", err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Shift assigned successfully", "id": id})
}

func getEmployeeShiftAssignmentsHandler(c *gin.Context) {
	assignments, err := repository.GetEmployeeShiftAssignments(c.Request.Context())
	if err != nil {
		log.Printf("ERROR in getEmployeeShiftAssignmentsHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to fetch assignments", err.Error())
		return
	}

	c.JSON(http.StatusOK, assignments)
}

func removeShiftAssignmentHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		RespondWithError(c, http.StatusBadRequest, "validation_error", "Invalid assignment ID", nil)
		return
	}

	if err := repository.RemoveEmployeeShiftAssignment(c.Request.Context(), id); err != nil {
		log.Printf("ERROR in removeShiftAssignmentHandler: %v", err)
		RespondWithError(c, http.StatusInternalServerError, "server_error", "Failed to remove assignment", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Shift assignment removed successfully"})
}
