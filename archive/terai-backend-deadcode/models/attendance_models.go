package attendancemodels

import "time"

type Attendance struct {
	ID         uint      `json:"id"`
	EmployeeID uint      `json:"employee_id"`
	Date       time.Time `json:"date"`
	CheckIn    time.Time `json:"check_in"`
	CheckOut   time.Time `json:"check_out"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type LeaveRequest struct {
	ID         uint      `json:"id"`
	EmployeeID uint      `json:"employee_id"`
	LeaveType  string    `json:"leave_type"`
	StartDate  time.Time `json:"start_date"`
	EndDate    time.Time `json:"end_date"`
	Reason     string    `json:"reason"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
