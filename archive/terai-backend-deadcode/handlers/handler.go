package handlers

import (
	"attendance/backend/models/attendancemodels"
	"attendance/backend/services"
	"net/http"
	"time"
)

type AttendanceHandler struct {
	service services.AttendanceService
}

func NewAttendanceHandler(service services.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{service: service}
}

func (h *AttendanceHandler) RecordAttendance(w http.ResponseWriter, r *http.Request) {
	// TODO: Parse request, call service, respond
}

func (h *AttendanceHandler) GetAttendance(w http.ResponseWriter, r *http.Request) {
	// TODO: Parse query params, call service, respond
}

func (h *AttendanceHandler) SubmitLeave(w http.ResponseWriter, r *http.Request) {
	// TODO: Parse request, call service, respond
}

func (h *AttendanceHandler) ApproveLeave(w http.ResponseWriter, r *http.Request) {
	// TODO: Parse request, call service, respond
}
