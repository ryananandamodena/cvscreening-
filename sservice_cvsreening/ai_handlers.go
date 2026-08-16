package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ryantriananda/sservice_cvsreening/repository"
	"github.com/ryantriananda/sservice_cvsreening/utils"
)

type ChatbotRequest struct {
	Message string `json:"message" binding:"required"`
}

// aiChatbotHandler answers HR self-service questions ("sisa cuti saya berapa?", "jadwal shift
// saya hari ini apa?") using the calling employee's own real data — not a generic "go check the
// portal yourself" deflection. Previously ChatbotResponse had zero context about who was asking,
// so Gemini could only answer in vague generalities even for questions with a concrete, known
// answer sitting right there in the database.
func aiChatbotHandler(c *gin.Context) {
	var req ChatbotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		RespondWithError(c, http.StatusBadRequest, "invalid_request", "Missing message field", nil)
		return
	}

	context := buildChatbotEmployeeContext(c)

	aiService := utils.NewGeminiAIService()
	reply, err := aiService.ChatbotResponse(c.Request.Context(), req.Message, context)
	if err != nil {
		RespondWithError(c, http.StatusInternalServerError, "ai_error", "Failed to get AI response", err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"reply": reply})
}

// buildChatbotEmployeeContext gathers a compact, real-data snapshot of the calling employee's
// self-service info (leave balances, today's attendance, today's shift) as plain text for the
// chatbot's prompt. Best-effort: any lookup that fails or finds nothing is simply omitted rather
// than blocking the whole chat — an employee with no shift assigned should still get an answer
// about their leave balance. Returns "" if the caller has no linked employee record at all (e.g.
// an admin account with no employee row), in which case the chatbot falls back to generic mode.
func buildChatbotEmployeeContext(c *gin.Context) string {
	employeeID, err := repository.GetEmployeeIDByUserID(c.Request.Context(), GetUserIDFromContext(c))
	if err != nil || employeeID == 0 {
		return ""
	}

	var b []string

	if emp, err := repository.GetEmployeeByID(c.Request.Context(), employeeID); err == nil && emp != nil {
		b = append(b, fmt.Sprintf("Nama: %s", emp.FullName))
	}

	if balances, err := repository.GetEmployeeLeaveBalances(c.Request.Context(), employeeID, time.Now().Year()); err == nil {
		for _, bal := range balances {
			remaining := bal.TotalDays + bal.CarriedForward - bal.UsedDays
			if bal.RemainingDays != nil {
				remaining = *bal.RemainingDays
			}
			name := bal.LeaveTypeName
			if name == "" {
				name = fmt.Sprintf("Jenis cuti #%d", bal.LeaveTypeID)
			}
			b = append(b, fmt.Sprintf("Saldo cuti %s (%d): sisa %d hari (dipakai %d dari %d hari + %d hari carry-forward)",
				name, bal.Year, remaining, bal.UsedDays, bal.TotalDays, bal.CarriedForward))
		}
	}

	if att, err := repository.GetTodayAttendance(c.Request.Context(), employeeID); err == nil && att != nil {
		switch {
		case att.ClockIn != nil && att.ClockOut != nil:
			b = append(b, fmt.Sprintf("Absensi hari ini: sudah clock in jam %s dan clock out jam %s",
				att.ClockIn.Format("15:04"), att.ClockOut.Format("15:04")))
		case att.ClockIn != nil:
			b = append(b, fmt.Sprintf("Absensi hari ini: sudah clock in jam %s, belum clock out", att.ClockIn.Format("15:04")))
		default:
			b = append(b, "Absensi hari ini: belum clock in")
		}
	}

	if shift, err := repository.GetEmployeeShift(c.Request.Context(), employeeID, time.Now()); err == nil && shift != nil {
		b = append(b, fmt.Sprintf("Shift hari ini: %s (%s - %s)", shift.Name, shift.StartTime, shift.EndTime))
	}

	if len(b) == 0 {
		return ""
	}

	result := "Data karyawan yang sedang bertanya (gunakan ini untuk menjawab pertanyaan seputar cuti/absensi/shift pribadinya secara langsung dan spesifik, jangan menyuruhnya cek sendiri ke portal):\n"
	for _, line := range b {
		result += "- " + line + "\n"
	}
	return result
}