package config

import (
	"os"
)

var (
	EnvPort     = getEnv("PORT", ":8080")
	EnvDatabase = getEnv("DATABASE_URL", "root:@tcp(localhost:3306)/attendance?charset=utf8mb4&parseTime=True&loc=Local")
	EnvMode     = getEnv("APP_MODE", "development")
)

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
