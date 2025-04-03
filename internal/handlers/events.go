package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"improv-app/internal/auth"
	"improv-app/internal/middleware"
	"improv-app/internal/models"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)


type EventHandler struct {
	db *sql.DB
}

func NewEventHandler(db *sql.DB) *EventHandler {
	return &EventHandler{
		db: db,
	}
}

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Verify user is a member of the group
	var role string
	err := h.db.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, user.ID).Scan(&role)
	if err != nil {
		log.Printf("Error verifying group membership for user %s in group %s: %v", user.ID, groupID, err)
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	// GET: List events for the group
	rows, err := h.db.Query(`
		SELECT id, title, description, location, start_time, end_time, created_at, created_by, mc_id
		FROM events
		WHERE group_id = $1
		ORDER BY start_time DESC
	`, groupID)
	if err != nil {
		log.Printf("Error fetching events for group %s: %v", groupID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching events")
		return
	}
	defer rows.Close()

	events := []Event{}
	for rows.Next() {
		var event Event
		err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy, &event.MCID)
		if err != nil {
			log.Printf("Error scanning events row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning events")
			return
		}
		event.GroupID = groupID // Add the group ID
		events = append(events, event)
	}
	if events == nil {
		events = []Event{}
	}
	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    events,
	})
}

// Create handles creating a new event
func (h *EventHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	// Parse JSON request
	var eventRequest struct {
		GroupID     string `json:"groupId"`
		Title       string `json:"title"`
		Description string `json:"description"`
		Location    string `json:"location"`
		StartTime   string `json:"startTime"`
		EndTime     string `json:"endTime,omitempty"` // Make EndTime optional
		MCID        string `json:"mcId,omitempty"` // Optional MC ID
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&eventRequest); err != nil {
		log.Printf("Error decoding event request: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Verify user is a member of the group
	var role string
	err := h.db.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, eventRequest.GroupID, user.ID).Scan(&role)
	if err != nil {
		log.Printf("Error verifying group membership for create event - user %s, group %s: %v", user.ID, eventRequest.GroupID, err)
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	startTime, err := time.Parse(time.RFC3339, eventRequest.StartTime)
	if err != nil {
		log.Printf("Error parsing start time %s: %v", eventRequest.StartTime, err)
		RespondWithError(w, http.StatusBadRequest, "Invalid start time format")
		return
	}

	// Use startTime as endTime if endTime is not provided or empty
	var endTime time.Time
	if eventRequest.EndTime == "" {
		// If EndTime is not provided, use the same value as StartTime
		endTime = startTime
		log.Printf("EndTime not provided for new event, using StartTime instead")
	} else {
		var err error
		endTime, err = time.Parse(time.RFC3339, eventRequest.EndTime)
		if err != nil {
			log.Printf("Error parsing end time %s: %v", eventRequest.EndTime, err)
			RespondWithError(w, http.StatusBadRequest, "Invalid end time format")
			return
		}
	}

	// If MC is provided, verify they are a member of the group
	if eventRequest.MCID != "" {
		var isMember bool
		err = h.db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM group_members
				WHERE group_id = $1 AND user_id = $2
			)
		`, eventRequest.GroupID, eventRequest.MCID).Scan(&isMember)
		if err != nil {
			log.Printf("Error checking MC membership for user %s in group %s: %v", eventRequest.MCID, eventRequest.GroupID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error checking MC membership")
			return
		}
		if !isMember {
			log.Printf("MC %s is not a member of group %s", eventRequest.MCID, eventRequest.GroupID)
			RespondWithError(w, http.StatusBadRequest, "Selected MC is not a member of this group")
			return
		}
	}

	eventID := uuid.New().String()
	// Support nullable MC_ID field
	var mcID interface{} = nil
	if eventRequest.MCID != "" {
		mcID = eventRequest.MCID
	}

	err = h.db.QueryRow(`
		INSERT INTO events (id, group_id, title, description, location, start_time, end_time, created_by, mc_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`, eventID, eventRequest.GroupID, eventRequest.Title, eventRequest.Description, eventRequest.Location, startTime, endTime, user.ID, mcID).Scan(&eventID)
	if err != nil {
		log.Printf("Error creating event: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error creating event")
		return
	}

	// Fetch the newly created event
	var event Event
	err = h.db.QueryRow(`
		SELECT id, group_id, title, description, location, start_time, end_time, created_at, created_by, mc_id
		FROM events
		WHERE id = $1
	`, eventID).Scan(&event.ID, &event.GroupID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy, &event.MCID)
	if err != nil {
		log.Printf("Error fetching created event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching created event")
		return
	}

	RespondWithJSON(w, http.StatusCreated, ApiResponse{
		Success: true,
		Message: "Event created successfully",
		Data:    event,
	})
}

// ListAll returns all events the user has access to
func (h *EventHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	rows, err := h.db.Query(`
		SELECT DISTINCT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by,
		       g.name as group_name, e.mc_id
		FROM events e
		JOIN improv_groups g ON e.group_id = g.id
		LEFT JOIN group_members m ON e.group_id = m.group_id AND m.user_id = $1
		LEFT JOIN group_followers f ON e.group_id = f.group_id AND f.user_id = $1
		WHERE e.visibility = 'public'
		   OR (e.visibility = 'private' AND (m.user_id IS NOT NULL OR f.user_id IS NOT NULL))
		ORDER BY e.start_time DESC
	`, user.ID)
	if err != nil {
		log.Printf("Error fetching all events for user %s: %v", user.ID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching events")
		return
	}
	defer rows.Close()

	type EventWithGroup struct {
		ID          string    `json:"id"`
		GroupID     string    `json:"groupId"`
		GroupName   string    `json:"groupName"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Location    string    `json:"location"`
		StartTime   time.Time `json:"startTime"`
		EndTime     time.Time `json:"endTime"`
		CreatedAt   time.Time `json:"createdAt"`
		CreatedBy   string    `json:"createdBy"`
		MCID        *string   `json:"mcId,omitempty"`
	}

	var events []EventWithGroup
	for rows.Next() {
		var event EventWithGroup
		err := rows.Scan(
			&event.ID, &event.GroupID, &event.Title, &event.Description,
			&event.Location, &event.StartTime, &event.EndTime,
			&event.CreatedAt, &event.CreatedBy, &event.GroupName, &event.MCID,
		)
		if err != nil {
			log.Printf("Error scanning event row in ListAll: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning events")
			return
		}
		events = append(events, event)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    events,
	})
}

// Get handles fetching a single event
func (h *EventHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	var event Event
	var groupName string
	var mcFirstName, mcLastName sql.NullString
	err := h.db.QueryRow(`
		SELECT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by,
		       g.name as group_name, e.mc_id,
		       CASE WHEN e.mc_id IS NOT NULL THEN mc.first_name ELSE NULL END as mc_first_name,
		       CASE WHEN e.mc_id IS NOT NULL THEN mc.last_name ELSE NULL END as mc_last_name
		FROM events e
		JOIN improv_groups g ON e.group_id = g.id
		JOIN group_members m ON e.group_id = m.group_id
		LEFT JOIN users mc ON e.mc_id = mc.id
		WHERE e.id = $1 AND m.user_id = $2
	`, eventID, user.ID).Scan(
		&event.ID, &event.GroupID, &event.Title, &event.Description,
		&event.Location, &event.StartTime, &event.EndTime,
		&event.CreatedAt, &event.CreatedBy, &groupName, &event.MCID,
		&mcFirstName, &mcLastName,
	)
	if err != nil {
		log.Printf("Error fetching event %s for user %s: %v", eventID, user.ID, err)
		RespondWithError(w, http.StatusNotFound, "Event not found")
		return
	}

	// Get RSVPs
	rsvpRows, err := h.db.Query(`
		SELECT u.id, u.first_name, u.last_name, r.status
		FROM event_rsvps r
		JOIN users u ON r.user_id = u.id
		WHERE r.event_id = $1
	`, eventID)
	if err != nil {
		log.Printf("Error fetching RSVPs for event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching RSVPs")
		return
	}
	defer rsvpRows.Close()

	type RSVP struct {
		UserID    string `json:"userId"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Status    string `json:"status"`
	}

	var rsvps []RSVP
	for rsvpRows.Next() {
		var rsvp RSVP
		err := rsvpRows.Scan(&rsvp.UserID, &rsvp.FirstName, &rsvp.LastName, &rsvp.Status)
		if err != nil {
			log.Printf("Error scanning RSVP row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning RSVPs")
			return
		}
		rsvps = append(rsvps, rsvp)
	}

	// Get assigned games
	gameRows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, eg.order_index
		FROM event_games eg
		JOIN games g ON eg.game_id = g.id
		WHERE eg.event_id = $1
		ORDER BY eg.order_index
	`, eventID)
	if err != nil {
		log.Printf("Error fetching games for event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching games")
		return
	}
	defer gameRows.Close()

	type GameWithOrder struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		MinPlayers  int    `json:"minPlayers"`
		MaxPlayers  int    `json:"maxPlayers"`
		OrderIndex  int    `json:"orderIndex"`
	}

	var games []GameWithOrder
	for gameRows.Next() {
		var game GameWithOrder
		err := gameRows.Scan(
			&game.ID, &game.Name, &game.Description,
			&game.MinPlayers, &game.MaxPlayers, &game.OrderIndex,
		)
		if err != nil {
			log.Printf("Error scanning game row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning games")
			return
		}
		games = append(games, game)
	}

	// MC data
	type MCInfo struct {
		ID        string `json:"id,omitempty"`
		FirstName string `json:"firstName,omitempty"`
		LastName  string `json:"lastName,omitempty"`
	}

	var mc *MCInfo
	if event.MCID != nil {
		mc = &MCInfo{
			ID:        *event.MCID,
			FirstName: mcFirstName.String,
			LastName:  mcLastName.String,
		}
	}

	// Include the member data in the response
	eventData := struct {
		Event     Event          `json:"event"`
		GroupName string         `json:"groupName"`
		RSVPs     []RSVP         `json:"rsvps"`
		Games     []GameWithOrder `json:"games"`
		MC        *MCInfo        `json:"mc,omitempty"`
	}{
		Event:     event,
		GroupName: groupName,
		RSVPs:     rsvps,
		Games:     games,
		MC:        mc,
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    eventData,
	})
}

// Update handles updating an existing event
func (h *EventHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Parse JSON request
	var eventRequest struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Location    string `json:"location"`
		StartTime   string `json:"startTime"`
		EndTime     string `json:"endTime,omitempty"` // Make EndTime optional
		MCID        string `json:"mcId,omitempty"` // Optional MC ID
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&eventRequest); err != nil {
		log.Printf("Error decoding event update request for event %s: %v", eventID, err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// First, check if the event exists and get its group ID
	var groupID string
	err := h.db.QueryRow(`
		SELECT group_id FROM events
		WHERE id = $1
	`, eventID).Scan(&groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Event not found during update: %s", eventID)
			RespondWithError(w, http.StatusNotFound, "Event not found")
		} else {
			log.Printf("Error fetching event %s during update: %v", eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error fetching event")
		}
		return
	}

	// Verify user is an admin or organizer of the group
	var role string
	err = h.db.QueryRow(`
		SELECT role FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, user.ID).Scan(&role)
	if err != nil || (role != auth.RoleAdmin && role != auth.RoleOrganizer) {
		log.Printf("User %s not authorized to update event %s (role: %s, error: %v)", user.ID, eventID, role, err)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can update events")
		return
	}

	startTime, err := time.Parse(time.RFC3339, eventRequest.StartTime)
	if err != nil {
		log.Printf("Error parsing start time during update %s: %v", eventRequest.StartTime, err)
		RespondWithError(w, http.StatusBadRequest, "Invalid start time format")
		return
	}

	// Use startTime as endTime if endTime is not provided or empty
	var endTime time.Time
	if eventRequest.EndTime == "" {
		// If EndTime is not provided, use the same value as StartTime
		endTime = startTime
		log.Printf("EndTime not provided for event %s, using StartTime instead", eventID)
	} else {
		var err error
		endTime, err = time.Parse(time.RFC3339, eventRequest.EndTime)
		if err != nil {
			log.Printf("Error parsing end time during update %s: %v", eventRequest.EndTime, err)
			RespondWithError(w, http.StatusBadRequest, "Invalid end time format")
			return
		}
	}

	// If MC is provided, verify they are a member of the group
	if eventRequest.MCID != "" {
		var isMember bool
		err = h.db.QueryRow(`
			SELECT EXISTS(
				SELECT 1 FROM group_members
				WHERE group_id = $1 AND user_id = $2
			)
		`, groupID, eventRequest.MCID).Scan(&isMember)
		if err != nil {
			log.Printf("Error checking MC membership for update - MC %s, group %s: %v", eventRequest.MCID, groupID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error checking MC membership")
			return
		}
		if !isMember {
			log.Printf("MC %s is not a member of group %s for event update", eventRequest.MCID, groupID)
			RespondWithError(w, http.StatusBadRequest, "Selected MC is not a member of this group")
			return
		}
	}

	// Support nullable MC_ID field
	var mcID interface{} = nil
	if eventRequest.MCID != "" {
		mcID = eventRequest.MCID
	}

	// Update the event
	_, err = h.db.Exec(`
		UPDATE events
		SET title = $1, description = $2, location = $3, start_time = $4, end_time = $5, mc_id = $6
		WHERE id = $7
	`, eventRequest.Title, eventRequest.Description, eventRequest.Location, startTime, endTime, mcID, eventID)

	if err != nil {
		log.Printf("Error updating event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating event")
		return
	}

	// Fetch the updated event details
	var event Event
	var groupName string
	err = h.db.QueryRow(`
		SELECT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by,
			g.name as group_name, e.mc_id
		FROM events e
		JOIN improv_groups g ON e.group_id = g.id
		WHERE e.id = $1
	`, eventID).Scan(
		&event.ID, &event.GroupID, &event.Title, &event.Description,
		&event.Location, &event.StartTime, &event.EndTime,
		&event.CreatedAt, &event.CreatedBy, &groupName, &event.MCID,
	)
	if err != nil {
		log.Printf("Error fetching updated event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching updated event")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Event updated successfully",
		Data:    event,
	})
}
