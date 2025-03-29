package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"improv-app/internal/middleware"
	"improv-app/internal/models"
	"improv-app/internal/services"

	"github.com/go-playground/validator/v10"
	"github.com/gorilla/mux"
)

type InvitationHandler struct {
	db *sql.DB
}

func NewInvitationHandler(db *sql.DB) *InvitationHandler {
	return &InvitationHandler{
		db: db,
	}
}

// InviteMember handles sending an invitation to join a group
func (h *InvitationHandler) InviteMember(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Check if user is an admin of the group
	var role string
	err := h.db.QueryRow(`
		SELECT role
		FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, user.ID).Scan(&role)
	if err != nil {
		fmt.Printf("Not a member of group: %v\n", err)
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	if role != "admin" && role != "organizer" {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can invite members")
		return
	}

	var inviteRequest struct {
		Email string `json:"email" validate:"required,email"`
		Role  string `json:"role" validate:"required,oneof=member admin organizer"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&inviteRequest); err != nil {
		fmt.Printf("Invalid request payload: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(inviteRequest); err != nil {
		fmt.Printf("Invalid invite data: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid invite data")
		return
	}

	// Check if the user exists
	var userID string
	var userExists bool
	err = h.db.QueryRow(`
		SELECT id, true
		FROM users
		WHERE email = $1
	`, inviteRequest.Email).Scan(&userID, &userExists)

	// If user doesn't exist, we'll still send an invitation email
	if err == sql.ErrNoRows {
		userExists = false
	} else if err != nil && err != sql.ErrNoRows {
		fmt.Printf("Error checking user: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking user")
		return
	}

	// If user exists, check if already a member
	if userExists {
		var isMember bool
		err = h.db.QueryRow(`
			SELECT EXISTS(
				SELECT 1
				FROM group_members
				WHERE group_id = $1 AND user_id = $2
			)
		`, groupID, userID).Scan(&isMember)
		if err != nil {
			fmt.Printf("Error checking membership: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
			return
		}

		if isMember {
			fmt.Printf("User %s is already a member of group %s\n", userID, groupID)
			RespondWithError(w, http.StatusBadRequest, "User is already a member of this group")
			return
		}
	}

	// Check if there's already a pending invitation for this email to this group
	var hasPendingInvitation bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1
			FROM group_invitations
			WHERE group_id = $1 AND email = $2 AND status = 'pending' AND expires_at > $3
		)
	`, groupID, inviteRequest.Email, time.Now()).Scan(&hasPendingInvitation)
	if err != nil {
		fmt.Printf("Error checking existing invitations: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking existing invitations")
		return
	}

	if hasPendingInvitation {
		fmt.Printf("User %s already has a pending invitation to group %s\n", inviteRequest.Email, groupID)
		RespondWithError(w, http.StatusBadRequest, "This user already has a pending invitation to this group")
		return
	}

	// Get group name for the invitation
	var groupName string
	err = h.db.QueryRow(`
		SELECT name FROM improv_groups WHERE id = $1
	`, groupID).Scan(&groupName)
	if err != nil {
		fmt.Printf("Error getting group name: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error getting group information")
		return
	}

	// Get the inviter's name
	var inviterName string
	if user.FirstName != "" || user.LastName != "" {
		inviterName = user.FirstName + " " + user.LastName
	} else {
		inviterName = user.Email
	}

	// Create EmailService instance
	emailService := services.NewEmailService(h.db)

	// Send invitation email
	token, err := emailService.SendGroupInvitation(
		inviteRequest.Email,
		groupID,
		groupName,
		inviterName,
		user.ID,
		inviteRequest.Role,
	)
	if err != nil {
		fmt.Printf("Error sending invitation: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error sending invitation")
		return
	}

	// For now, just respond with success
	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Invitation sent successfully",
		Data: map[string]string{
			"email": inviteRequest.Email,
			"token": token,
		},
	})
}

// VerifyInvitation handles verifying a group invitation token
func (h *InvitationHandler) VerifyInvitation(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		fmt.Printf("Missing invitation token\n")
		RespondWithError(w, http.StatusBadRequest, "Missing invitation token")
		return
	}

	// Create EmailService instance
	emailService := services.NewEmailService(h.db)

	// Verify the invitation token
	invitation, err := emailService.VerifyGroupInvitation(token)
	if err != nil {
		fmt.Printf("Invalid or expired invitation token: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid or expired invitation token")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Invitation verified",
		Data:    invitation,
	})
}

// AcceptInvitation handles accepting a group invitation
func (h *InvitationHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	var acceptRequest struct {
		Token string `json:"token" validate:"required"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&acceptRequest); err != nil {
		fmt.Printf("Invalid request payload: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(acceptRequest); err != nil {
		fmt.Printf("Invalid accept data: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid accept data")
		return
	}

	// Create EmailService instance
	emailService := services.NewEmailService(h.db)

	// Verify the invitation token
	invitation, err := emailService.VerifyGroupInvitation(acceptRequest.Token)
	if err != nil {
		fmt.Printf("Invalid or expired invitation token: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid or expired invitation token")
		return
	}

	// Check if the email in the invitation matches the user's email
	if user.Email != invitation["email"] {
		fmt.Printf("Email mismatch: invitation for %s, user %s\n", invitation["email"], user.Email)
		RespondWithError(w, http.StatusForbidden, "This invitation was sent to a different email address")
		return
	}

	groupID := invitation["groupId"].(string)
	role := invitation["role"].(string)

	// Begin transaction
	tx, err := h.db.Begin()
	if err != nil {
		fmt.Printf("Error beginning transaction: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error processing invitation")
		return
	}
	defer tx.Rollback()

	// Check if already a member
	var isMember bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1
			FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, user.ID).Scan(&isMember)
	if err != nil {
		fmt.Printf("Error checking membership: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
		return
	}

	if isMember {
		fmt.Printf("User %s is already a member of group %s\n", user.ID, groupID)
		RespondWithError(w, http.StatusBadRequest, "You are already a member of this group")
		return
	}

	// Add user to the group with the specified role
	_, err = tx.Exec(`
		INSERT INTO group_members (group_id, user_id, role)
		VALUES ($1, $2, $3)
	`, groupID, user.ID, role)
	if err != nil {
		fmt.Printf("Error adding user to group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error adding user to group")
		return
	}

	// Update invitation status to 'accepted'
	_, err = tx.Exec(`
		UPDATE group_invitations
		SET status = 'accepted'
		WHERE token = $1
	`, acceptRequest.Token)
	if err != nil {
		fmt.Printf("Error updating invitation status: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating invitation status")
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		fmt.Printf("Error committing transaction: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error committing changes")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Successfully joined group",
		Data: map[string]string{
			"groupId": groupID,
			"role":    role,
		},
	})
}

// ListInvitations returns all pending invitations for the current user
func (h *InvitationHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	// Query for invitations by email
	rows, err := h.db.Query(`
		SELECT i.id, i.group_id, g.name, i.email, i.role, i.status, i.invited_by, u.first_name, u.last_name, u.email as inviter_email, i.created_at
		FROM group_invitations i
		JOIN improv_groups g ON i.group_id = g.id
		JOIN users u ON i.invited_by = u.id
		WHERE i.email = $1 AND i.status = 'pending' AND i.expires_at > $2
		ORDER BY i.created_at DESC
	`, user.Email, time.Now())
	if err != nil {
		fmt.Printf("Error fetching invitations: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching invitations")
		return
	}
	defer rows.Close()

	type Invitation struct {
		ID          string `json:"id"`
		GroupID     string `json:"groupId"`
		GroupName   string `json:"groupName"`
		Email       string `json:"email"`
		Role        string `json:"role"`
		Status      string `json:"status"`
		InvitedBy   string `json:"invitedBy"`
		InviterName string `json:"inviterName"`
		CreatedAt   string `json:"createdAt"`
	}

	invitations := []Invitation{}
	for rows.Next() {
		var invitation Invitation
		var inviterFirstName, inviterLastName, inviterEmail string

		err := rows.Scan(
			&invitation.ID,
			&invitation.GroupID,
			&invitation.GroupName,
			&invitation.Email,
			&invitation.Role,
			&invitation.Status,
			&invitation.InvitedBy,
			&inviterFirstName,
			&inviterLastName,
			&inviterEmail,
			&invitation.CreatedAt,
		)
		if err != nil {
			fmt.Printf("Error scanning invitation: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning invitation")
			return
		}

		// Format inviter name
		if inviterFirstName != "" || inviterLastName != "" {
			invitation.InviterName = inviterFirstName + " " + inviterLastName
		} else {
			invitation.InviterName = inviterEmail
		}

		invitations = append(invitations, invitation)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    invitations,
	})
}
