package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"time"

	"improv-app/internal/models"

	"github.com/google/uuid"
)

type EmailService struct {
	db *sql.DB
}

func NewEmailService(db *sql.DB) *EmailService {
	return &EmailService{db: db}
}

func (s *EmailService) generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *EmailService) SendMagicLink(email string) error {
	token, err := s.generateToken()
	if err != nil {
		return err
	}

	// Create or update user
	var userID string
	newId := uuid.New().String()
	err = s.db.QueryRow(`
		INSERT INTO users (id, email)
		VALUES ($1, $2)
		ON CONFLICT (email) DO UPDATE SET email = $2
		RETURNING id
	`, newId, email, ).Scan(&userID)
	if err != nil {
		return err
	}

	fmt.Println("Sending magic link to:", email, "User ID:", userID, newId)
	// Create email token
	_, err = s.db.Exec(`
		INSERT INTO email_tokens (id, user_id, token, expires_at)
		VALUES ($1, $2, $3, $4)
	`, uuid.New().String(), userID, token, time.Now().Add(24*time.Hour))
	if err != nil {
		return err
	}

	// Send email with magic link
	from := os.Getenv("SMTP_FROM")
	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "Improv App"
	}

	to := os.Getenv("SMTP_TO")
	if to == "" {
		to = email
	}

	subject := "Your Magic Link for Improv App"
	body := fmt.Sprintf(`
		Hello,

		Click the link below to sign in to your Improv App account:

		http://localhost:4080/auth/verify?token=%s

		This link will expire in 24 hours.

		Best regards,
		%s
	`, token, fromName)

	// Set up email message
	msg := []byte(fmt.Sprintf("From: %s <%s>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n"+
		"\r\n"+
		"%s", fromName, from, to, subject, body))

	// Connect to SMTP server
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")
	fmt.Println("Sending email to:", to, "from:", from, "host:", host, "port:", port, "username:", username, "password:", password)

	addr := fmt.Sprintf("%s:%s", host, port)
	auth := smtp.PlainAuth("", username, password, host)

	err = smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("Magic link email sent to %s", email)
	return nil
}

func (s *EmailService) VerifyToken(token string) (*models.User, error) {
	var user models.User
	err := s.db.QueryRow(`
		SELECT u.id, u.email, u.first_name, u.last_name
		FROM users u
		JOIN email_tokens t ON u.id = t.user_id
		WHERE t.token = $1 AND t.used = false AND t.expires_at > $2
	`, token, time.Now()).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName)
	if err != nil {
		return nil, err
	}

	// Mark token as used
	_, err = s.db.Exec("UPDATE email_tokens SET used = true WHERE token = $1", token)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *EmailService) UpdateUserProfile(userID string, firstName string, lastName string) error {
	_, err := s.db.Exec(`
		UPDATE users
		SET first_name = $1, last_name = $2
		WHERE id = $3
	`, firstName, lastName, userID)
	return err
}
