package main

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

type EmailService struct {
	smtpHost string
	smtpPort string
	auth     smtp.Auth
	sender   string
	mockMode bool
}

func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	sender := os.Getenv("SMTP_SENDER")

	if host == "" || user == "" {
		log.Println("⚠️ SMTP configuration missing. Email Service running in MOCK MODE (logging only).")
		return &EmailService{mockMode: true}
	}

	return &EmailService{
		smtpHost: host,
		smtpPort: port,
		auth:     smtp.PlainAuth("", user, pass, host),
		sender:   sender,
		mockMode: false,
	}
}

func (s *EmailService) SendEmail(to []string, subject, body string) error {
	if s.mockMode {
		log.Printf("📧 [MOCK EMAIL] To: %v | Subject: %s | Body length: %d chars", to, subject, len(body))
		return nil
	}

	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\"\r\n"+
		"\r\n"+
		"%s\r\n", to[0], subject, body))

	addr := fmt.Sprintf("%s:%s", s.smtpHost, s.smtpPort)
	if err := smtp.SendMail(addr, s.auth, s.sender, to, msg); err != nil {
		log.Printf("❌ Failed to send email to %v: %v", to, err)
		return err
	}

	log.Printf("✅ Email sent to %v: %s", to, subject)
	return nil
}

func (s *EmailService) SendWelcomeEmail(email, name string) {
	subject := "Welcome to CV Screening Platform"
	body := fmt.Sprintf(`
		<h1>Welcome, %s!</h1>
		<p>Thank you for registering with our platform.</p>
		<p>You can now log in and start screening candidates effectively.</p>
		<br>
		<p>Regards,<br>CV Screening Team</p>
	`, name)

	go s.SendEmail([]string{email}, subject, body)
}

func (s *EmailService) SendInterviewInvite(email, candidateName, date, link string) {
	subject := "Interview Invitation"
	body := fmt.Sprintf(`
		<h1>Interview Invitation</h1>
		<p>Dear %s,</p>
		<p>We are pleased to invite you for an interview.</p>
		<p><strong>Date:</strong> %s</p>
		<p><strong>Link:</strong> <a href="%s">%s</a></p>
		<br>
		<p>Please ensure your camera and microphone are working.</p>
		<br>
		<p>Good luck!</p>
	`, candidateName, date, link, link)

	go s.SendEmail([]string{email}, subject, body)
}

func (s *EmailService) SendScreeningResult(email, candidateName, status string) {
	subject := fmt.Sprintf("Application Update: %s", status)
	body := fmt.Sprintf(`
		<h1>Application Status Update</h1>
		<p>Dear %s,</p>
		<p>Your application status has been updated to: <strong>%s</strong>.</p>
		<br>
		<p>We will contact you with further steps accordingly.</p>
	`, candidateName, status)

	go s.SendEmail([]string{email}, subject, body)
}

// SendApprovalDecisionEmail notifies the requester once their request clears (or fails) an approval step
func (s *EmailService) SendApprovalDecisionEmail(email, requesterName, moduleLabel, summary, decision, comment string) {
	statusColor := "#16a34a"
	statusLabel := "Disetujui"
	switch decision {
	case "rejected":
		statusColor, statusLabel = "#dc2626", "Ditolak"
	case "returned":
		statusColor, statusLabel = "#d97706", "Dikembalikan untuk Revisi"
	}

	subject := fmt.Sprintf("[%s] Pengajuan Anda %s", moduleLabel, statusLabel)
	body := fmt.Sprintf(`
		<h2>Update Pengajuan: %s</h2>
		<p>Halo %s,</p>
		<p>Pengajuan Anda (<strong>%s</strong>) telah <span style="color:%s;font-weight:bold">%s</span>.</p>
		<p><strong>Komentar:</strong> %s</p>
		<br>
		<p>Silakan cek Approval Center untuk detail lengkap.</p>
	`, moduleLabel, requesterName, summary, statusColor, statusLabel, comment)

	go s.SendEmail([]string{email}, subject, body)
}

// SendApprovalPendingEmail notifies an approver that a new request is waiting for their action
func (s *EmailService) SendApprovalPendingEmail(email, approverName, moduleLabel, requesterName, summary string) {
	subject := fmt.Sprintf("[%s] Menunggu Persetujuan Anda", moduleLabel)
	body := fmt.Sprintf(`
		<h2>Pengajuan Baru Menunggu Persetujuan</h2>
		<p>Halo %s,</p>
		<p><strong>%s</strong> mengajukan: %s</p>
		<p>Silakan buka Approval Center untuk meninjau pengajuan ini.</p>
	`, approverName, requesterName, summary)

	go s.SendEmail([]string{email}, subject, body)
}

func (s *EmailService) SendAssessmentInvite(email, candidateName, assessmentTitle, link string) {
	subject := fmt.Sprintf("Assessment Invitation: %s", assessmentTitle)
	body := fmt.Sprintf(`
		<h1>Assessment Invitation</h1>
		<p>Dear %s,</p>
		<p>You have been invited to take the assessment: <strong>%s</strong>.</p>
		<p>Please click the link below to start your assessment:</p>
		<p><a href="%s">%s</a></p>
		<br>
		<p>Good luck!</p>
	`, candidateName, assessmentTitle, link, link)

	go s.SendEmail([]string{email}, subject, body)
}
