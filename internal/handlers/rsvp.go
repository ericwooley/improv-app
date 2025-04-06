package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"improv-app/internal/middleware"
	"improv-app/internal/models"

	"github.com/gorilla/mux"
)

// RSVPHandler handles RSVP-related operations
type RSVPHandler struct {
	db *sql.DB
}

// NewRSVPHandler creates a new RSVPHandler
func NewRSVPHandler(db *sql.DB) *RSVPHandler {
	return &RSVPHandler{
		db: db,
	}
}

// SubmitRSVP handles creating or updating an RSVP for an event
func (h *RSVPHandler) SubmitRSVP(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Parse request body
	var request struct {
		Status string `json:"status"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		log.Printf("Error decoding RSVP request: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate status
	if request.Status != "attending" && request.Status != "maybe" && request.Status != "declined" {
		log.Printf("Invalid RSVP status: %s", request.Status)
		RespondWithError(w, http.StatusBadRequest, "Invalid RSVP status. Must be 'attending', 'maybe', or 'declined'")
		return
	}

	// Verify the event exists and user has access
	var groupID string
	err := h.db.QueryRow(`
		SELECT group_id FROM events
		WHERE id = $1
	`, eventID).Scan(&groupID)
	if err != nil {
		log.Printf("Error verifying event %s exists: %v", eventID, err)
		RespondWithError(w, http.StatusNotFound, "Event not found")
		return
	}

	// Verify user is a member of the group
	var isMember bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, user.ID).Scan(&isMember)
	if err != nil {
		log.Printf("Error checking group membership: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking group membership")
		return
	}

	if !isMember {
		log.Printf("User %s is not a member of group %s", user.ID, groupID)
		RespondWithError(w, http.StatusForbidden, "You must be a member of the group to RSVP")
		return
	}

	// Check if RSVP already exists for this user and event
	var exists bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM event_rsvps
			WHERE event_id = $1 AND user_id = $2
		)
	`, eventID, user.ID).Scan(&exists)
	if err != nil {
		log.Printf("Error checking if RSVP exists: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking RSVP status")
		return
	}

	// Insert or update RSVP
	if exists {
		// Update existing RSVP
		_, err = h.db.Exec(`
			UPDATE event_rsvps
			SET status = $1
			WHERE event_id = $2 AND user_id = $3
		`, request.Status, eventID, user.ID)
		if err != nil {
			log.Printf("Error updating RSVP for user %s, event %s: %v", user.ID, eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error updating RSVP")
			return
		}
	} else {
		// Insert new RSVP
		_, err = h.db.Exec(`
			INSERT INTO event_rsvps (event_id, user_id, status)
			VALUES ($1, $2, $3)
		`, eventID, user.ID, request.Status)
		if err != nil {
			log.Printf("Error creating RSVP for user %s, event %s: %v", user.ID, eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error creating RSVP")
			return
		}
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "RSVP submitted successfully",
	})
}

// GetCurrentUserRSVP retrieves the current user's RSVP status for an event
func (h *RSVPHandler) GetCurrentUserRSVP(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Query the database for the RSVP
	var status sql.NullString
	err := h.db.QueryRow(`
		SELECT status
		FROM event_rsvps
		WHERE event_id = $1 AND user_id = $2
	`, eventID, user.ID).Scan(&status)

	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error querying RSVP for user %s, event %s: %v", user.ID, eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error retrieving RSVP status")
		return
	}

	if err == sql.ErrNoRows || !status.Valid {
		// No RSVP found
		RespondWithJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Data:    nil,
		})
		return
	}

	// RSVP found, return the status
	rsvp := struct {
		UserID    string `json:"userId"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Status    string `json:"status"`
	}{
		UserID:    user.ID,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Status:    status.String,
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    rsvp,
	})
}

// UpdateUserRSVP allows admins/organizers to update another user's RSVP status
func (h *RSVPHandler) UpdateUserRSVP(w http.ResponseWriter, r *http.Request) {
	currentUser := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]
	targetUserID := vars["userId"]

	// Parse request body
	var request struct {
		Status string `json:"status"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		log.Printf("Error decoding update RSVP request: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate status
	if request.Status != "attending" && request.Status != "maybe" && request.Status != "declined" {
		log.Printf("Invalid RSVP status: %s", request.Status)
		RespondWithError(w, http.StatusBadRequest, "Invalid RSVP status. Must be 'attending', 'maybe', or 'declined'")
		return
	}

	// Get the event's group ID
	var groupID string
	err := h.db.QueryRow(`
		SELECT group_id FROM events
		WHERE id = $1
	`, eventID).Scan(&groupID)
	if err != nil {
		log.Printf("Error fetching event %s group ID: %v", eventID, err)
		RespondWithError(w, http.StatusNotFound, "Event not found")
		return
	}

	// Verify current user is an admin or organizer of the group
	var userRole string
	err = h.db.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, currentUser.ID).Scan(&userRole)
	if err != nil {
		log.Printf("Error checking user role: %v", err)
		RespondWithError(w, http.StatusForbidden, "Not authorized to update RSVPs")
		return
	}

	// Check if user has admin/organizer permissions
	if userRole != "admin" && userRole != "organizer" {
		log.Printf("User %s is not an admin/organizer of group %s", currentUser.ID, groupID)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can update other users' RSVPs")
		return
	}

	// Verify target user is a member of the group
	var isMember bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, targetUserID).Scan(&isMember)
	if err != nil {
		log.Printf("Error checking target user membership: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking target user group membership")
		return
	}

	if !isMember {
		log.Printf("Target user %s is not a member of group %s", targetUserID, groupID)
		RespondWithError(w, http.StatusBadRequest, "Target user is not a member of this group")
		return
	}

	// Check if RSVP already exists for the target user
	var exists bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM event_rsvps
			WHERE event_id = $1 AND user_id = $2
		)
	`, eventID, targetUserID).Scan(&exists)
	if err != nil {
		log.Printf("Error checking if RSVP exists: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking RSVP status")
		return
	}

	// Insert or update RSVP
	if exists {
		_, err = h.db.Exec(`
			UPDATE event_rsvps
			SET status = $1
			WHERE event_id = $2 AND user_id = $3
		`, request.Status, eventID, targetUserID)
		if err != nil {
			log.Printf("Error updating RSVP for user %s, event %s: %v", targetUserID, eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error updating RSVP")
			return
		}
	} else {
		_, err = h.db.Exec(`
			INSERT INTO event_rsvps (event_id, user_id, status)
			VALUES ($1, $2, $3)
		`, eventID, targetUserID, request.Status)
		if err != nil {
			log.Printf("Error creating RSVP for user %s, event %s: %v", targetUserID, eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error creating RSVP")
			return
		}
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "RSVP updated successfully",
	})
}
