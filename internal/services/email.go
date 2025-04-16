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

type UserNotFound struct{}

func (e *UserNotFound) Error() string {
	return "user not found"
}
func (s *EmailService) generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func (s *EmailService) SendVerificationEmail(email string) error {

	link, err := s.CreateVerificationLink(&email)
	if err != nil {
		return err
	}
	fmt.Printf("Sending verification email to: %s", email)
	s.SendEmail(email, "Verify your email", fmt.Sprintf(
		`
		Hello,

		Please use this link to verify your email

		Verification Link: %s

		`, link,
	))
	return nil
}

func (s *EmailService) CreateVerificationLink(email *string) (string, error) {
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		panic("BASE_URL is not set")
	}
	token, err := s.generateToken()
	if err != nil {
		return "", err
	}
	// Create or update user
	var userID string
	newId := uuid.New().String()
	err = s.db.QueryRow(`
		INSERT INTO users (id, email)
		VALUES ($1, $2)
		ON CONFLICT (email) DO UPDATE SET email = $2
		RETURNING id
	`, newId, email).Scan(&userID)
	if err != nil {
		return "", err
	}
	// Create email token
	_, err = s.db.Exec(`
		INSERT INTO email_tokens (id, user_id, token, expires_at)
		VALUES ($1, $2, $3, $4)
	`, uuid.New().String(), userID, token, time.Now().Add(24*time.Hour))
	if err != nil {
		return "", err
	}

	magicLink := fmt.Sprintf("%s/api/auth/verify?token=%s", baseURL, token)
	return magicLink, nil
}

func (s *EmailService) SendEmail(email string, subject string, body string) error {

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

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		panic("BASE_URL is not set")
	}

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
	var auth smtp.Auth
	if username != "" && password != "" {
		auth = smtp.PlainAuth("", username, password, host)
	}

	err := smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		return fmt.Errorf("failed to send email: %v", err)
	}
	return nil
}

func (s *EmailService) SendMagicLink(email string) error {

	magicLink, err := s.CreateVerificationLink(&email)
	if err != nil {
		return err
	}
	subject := "Your Magic Link for Improv App"
	body := fmt.Sprintf(`
Hello,

Click the link below to sign in to your Improv App account:

MAGIC_LINK: %s

This link will expire in 24 hours.
	`, magicLink)

	err = s.SendEmail(email, subject, body)
	if err != nil {
		return err
	}
	return nil
}

func (s *EmailService) VerifyToken(token string) (*models.User, error) {
	var user models.User
	// Use a separate NullString for temporary scanning to avoid scan errors with NULL fields
	var passwordNullString sql.NullString

	err := s.db.QueryRow(`
		SELECT u.id, u.email, u.first_name, u.last_name, u.password, u.email_verified
		FROM users u
		JOIN email_tokens t ON u.id = t.user_id
		WHERE t.token = $1 AND t.used = false AND t.expires_at > $2
	`, token, time.Now()).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &passwordNullString, &user.EmailVerified)
	if err != nil {
		return nil, err
	}

	// Assign the NullString to the user struct
	user.Password = passwordNullString

	// Mark token as used and set email as verified
	_, err = s.db.Exec("UPDATE email_tokens SET used = true WHERE token = $1", token)
	if err != nil {
		return nil, err
	}

	// Mark email as verified
	_, err = s.db.Exec("UPDATE users SET email_verified = true WHERE id = $1", user.ID)
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

// GetUserByID retrieves a user by their ID
func (s *EmailService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := s.db.QueryRow(`
		SELECT id, email, first_name, last_name, password, email_verified
		FROM users
		WHERE id = $1
	`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Password, &user.EmailVerified)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserByEmail retrieves a user by their email address
func (s *EmailService) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := s.db.QueryRow(`
		SELECT id, email, first_name, last_name, password, email_verified
		FROM users
		WHERE email = $1
	`, email).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &user.Password, &user.EmailVerified)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// RegisterUserWithPassword creates a new user with a password
func (s *EmailService) RegisterUserWithPassword(email string, hashedPassword string) (*models.User, error) {
	// Create a new user with a password
	userID := uuid.New().String()

	// Set the password as a valid NullString
	passwordNullString := sql.NullString{
		String: hashedPassword,
		Valid:  true,
	}

	_, err := s.db.Exec(`
		INSERT INTO users (id, email, password, email_verified)
		VALUES ($1, $2, $3, false)
	`, userID, email, passwordNullString)
	if err != nil {
		return nil, err
	}

	// Return the newly created user
	return s.GetUserByID(userID)
}

// SendGroupInvitation sends an email inviting a user to join a group
func (s *EmailService) SendGroupInvitation(email, groupID, groupName, inviterName, inviterID, role string) (string, error) {
	// Create invitation record
	invitationID := uuid.New().String()
	_, err := s.db.Exec(`
		INSERT INTO group_invitations (id, group_id, email, invited_by, role, status)
		VALUES ($1, $2, $3, $4, $5, 'pending')
	`, invitationID, groupID, email, inviterID, role)
	if err != nil {
		return "", err
	}

	// Send email with invitation link
	from := os.Getenv("SMTP_FROM")
	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "Improv App"
	}

	to := os.Getenv("SMTP_TO")
	if to == "" {
		to = email
	}

	subject := fmt.Sprintf("Invitation to join %s on Improv App", groupName)

	baseURL := os.Getenv("FRONTEND_URL")
	if baseURL == "" {
		panic("FRONTEND_URL is not set")
	}

	body := fmt.Sprintf(`
		Hello,

		You've been invited by %s to join "%s" as a %s on Improv App.

		Click the link below to sign in and view your invitation:

		%s

		Best regards,
		%s
	`, inviterName, groupName, role, baseURL, fromName)

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
	log.Printf("Sending group invitation email to: %s for group: %s", to, groupName)

	addr := fmt.Sprintf("%s:%s", host, port)
	var auth smtp.Auth
	if username != "" && password != "" {
		auth = smtp.PlainAuth("", username, password, host)
	}

	err = smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		log.Printf("Error sending invitation email: %v", err)
		return "", fmt.Errorf("failed to send invitation email: %v", err)
	}

	log.Printf("Group invitation email sent to %s", email)
	return invitationID, nil
}

// VerifyGroupInvitation checks if an invitation is valid and returns the invitation details
func (s *EmailService) VerifyGroupInvitation(invitationID string) (map[string]interface{}, error) {
	var invitation struct {
		ID        string
		GroupID   string
		GroupName string
		Email     string
		Role      string
		Status    string
	}

	err := s.db.QueryRow(`
		SELECT i.id, i.group_id, g.name, i.email, i.role, i.status
		FROM group_invitations i
		JOIN improv_groups g ON i.group_id = g.id
		WHERE i.id = $1 AND i.status = 'pending'
	`, invitationID).Scan(&invitation.ID, &invitation.GroupID, &invitation.GroupName,
		&invitation.Email, &invitation.Role, &invitation.Status)

	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"id":        invitation.ID,
		"groupId":   invitation.GroupID,
		"groupName": invitation.GroupName,
		"email":     invitation.Email,
		"role":      invitation.Role,
		"status":    invitation.Status,
	}

	return result, nil
}
