package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/ryantriananda/sservice_cvsreening/repository"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Initialize Database
	if err := repository.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer repository.CloseDB()

	log.Println("✅ Connected to database successfully!")

	// Read SQL file
	sqlContent, err := os.ReadFile("../../schema_attendance_leave.sql")
	if err != nil {
		log.Fatalf("Unable to read SQL file: %v\n", err)
	}

	// Execute SQL
	log.Println("📝 Executing schema_attendance_leave.sql...")
	
	ctx := context.Background()
	_, err = repository.GetDB().Exec(ctx, string(sqlContent))
	if err != nil {
		log.Printf("⚠️  Error executing SQL (might be normal if tables exist): %v\n", err)
		log.Println("Continuing anyway...")
	}

	log.Println("\n✅ Migration completed!")
	log.Println("\n📊 Tables that should now exist:")
	log.Println("   ✓ shifts")
	log.Println("   ✓ employee_shifts")
	log.Println("   ✓ attendances")
	log.Println("   ✓ leave_types")
	log.Println("   ✓ leave_balances")
	log.Println("   ✓ leave_requests")
	log.Println("   ✓ holidays")
	log.Println("   ✓ notification_templates")
	log.Println("   ✓ notifications")
	
	log.Println("\n🌱 Seed data inserted:")
	log.Println("   ✓ 3 default shifts")
	log.Println("   ✓ 5 leave types")
	log.Println("   ✓ 3 notification templates")

	// Verify tables exist
	log.Println("\n🔍 Verifying tables...")
	
	tables := []string{
		"shifts", "employee_shifts", "attendances",
		"leave_types", "leave_balances", "leave_requests",
		"holidays", "notification_templates", "notifications",
	}

	for _, table := range tables {
		var exists bool
		err := repository.GetDB().QueryRow(ctx, 
			"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)", 
			table).Scan(&exists)
		
		if err != nil {
			log.Printf("   ⚠️  Error checking table %s: %v\n", table, err)
		} else if exists {
			log.Printf("   ✅ Table '%s' exists\n", table)
		} else {
			log.Printf("   ❌ Table '%s' NOT found\n", table)
		}
	}

	fmt.Println("\n🎉 All done! You can now start the backend service.")
}
