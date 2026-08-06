package utils

import (
	"fmt"
	"time"
)

func FormatDateTime(t time.Time) string {
	return t.Format("2006-01-02 15:04:05")
}

func GenerateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func ValidateEmail(email string) bool {
	// TODO: Implement email validation
	return len(email) > 5
}
