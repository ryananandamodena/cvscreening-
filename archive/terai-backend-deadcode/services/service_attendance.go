package services

import (
	"attendance/backend/models"
	"context"
	"time"
)

type AttendanceService interface {
	RecordAttendance(ctx context.Context, empID uint, date time.Time) (*models.Attendance, error)
	GetAttendanceByEmployee(ctx context.Context, empID uint, startDate, endDate time.Time) ([]*models.Attendance, error)
	SubmitLeaveRequest(ctx context.Context, req *models.LeaveRequest) error
	ApproveLeaveRequest(ctx context.Context, id uint, approved bool) error
	GetLeaveRequests(ctx context.Context, empID uint, startDate, endDate time.Time) ([]*models.LeaveRequest, error)
}

type attendanceService struct {
	repo AttendanceRepository
}

type AttendanceRepository interface {
	RecordAttendance(ctx context.Context, attendance *models.Attendance) error
	GetAttendanceByEmployee(ctx context.Context, empID uint, startDate, endDate time.Time) ([]*models.Attendance, error)
	CreateLeaveRequest(ctx context.Context, req *models.LeaveRequest) error
	UpdateLeaveRequestStatus(ctx context.Context, id uint, status string) error
	GetLeaveRequests(ctx context.Context, empID uint, startDate, endDate time.Time) ([]*models.LeaveRequest, error)
}

func NewAttendanceService(repo AttendanceRepository) AttendanceService {
	return &attendanceService{repo: repo}
}

func (s *attendanceService) RecordAttendance(ctx context.Context, empID uint, date time.Time) (*models.Attendance, error) {
	attendance := &models.Attendance{
		EmployeeID: empID,
		Date:       date,
		Status:     "present",
	}
	if err := s.repo.RecordAttendance(ctx, attendance); err != nil {
		return nil, err
	}
	return attendance, nil
}

func (s *attendanceService) GetAttendanceByEmployee(ctx context.Context, empID uint, startDate, endDate time.Time) ([]*models.Attendance, error) {
	return s.repo.GetAttendanceByEmployee(ctx, empID, startDate, endDate)
}

func (s *attendanceService) SubmitLeaveRequest(ctx context.Context, req *models.LeaveRequest) error {
	return s.repo.CreateLeaveRequest(ctx, req)
}

func (s *attendanceService) ApproveLeaveRequest(ctx context.Context, id uint, approved bool) error {
	status := "rejected"
	if approved {
		status = "approved"
	}
	return s.repo.UpdateLeaveRequestStatus(ctx, id, status)
}

func (s *attendanceService) GetLeaveRequests(ctx context.Context, empID uint, startDate, endDate time.Time) ([]*models.LeaveRequest, error) {
	return s.repo.GetLeaveRequests(ctx, empID, startDate, endDate)
}
