# Attendance Management System - Backend

## Directory Structure
```
backend/
├── go.mod           # Go module definition
├── main.go          # Application entry point
├── handlers/        # HTTP request handlers
│   └── attendance.go
├── services/        # Business logic services
│   └── attendance.go
├── models/          # Data models
│   └── attendance.go
├── middleware/      # HTTP middleware
│   └── auth.go
├── pkg/
│   ├── config/      # Configuration files
│   │   ├── database.go
│   │   └── app.go
│   └── utils/       # Utility functions
│       └── helpers.go
└── internal/
    └── config/      # Internal configuration
        └── app.go
```

## Setup
1. Install Go dependencies: `go mod download`
2. Configure database connection in `pkg/config/app.go`
3. Run the application: `go run main.go`