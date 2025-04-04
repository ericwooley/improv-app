package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
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
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, eg.order_index,
		       GROUP_CONCAT(DISTINCT t.name) as tags
		FROM event_games eg
		JOIN games g ON eg.game_id = g.id
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE eg.event_id = $1
		GROUP BY g.id
		ORDER BY eg.order_index
	`, eventID)
	if err != nil {
		log.Printf("Error fetching games for event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching games")
		return
	}
	defer gameRows.Close()

	type GameWithOrder struct {
		ID          string   `json:"id"`
		Name        string   `json:"name"`
		Description string   `json:"description"`
		MinPlayers  int      `json:"minPlayers"`
		MaxPlayers  int      `json:"maxPlayers"`
		OrderIndex  int      `json:"orderIndex"`
		Tags        []string `json:"tags"`
	}

	var games []GameWithOrder
	for gameRows.Next() {
		var game GameWithOrder
		var tagsStr sql.NullString
		err := gameRows.Scan(
			&game.ID, &game.Name, &game.Description,
			&game.MinPlayers, &game.MaxPlayers, &game.OrderIndex, &tagsStr,
		)
		if err != nil {
			log.Printf("Error scanning game row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning games")
			return
		}

		// Parse tags from comma-separated string
		if tagsStr.Valid {
			game.Tags = strings.Split(tagsStr.String, ",")
		} else {
			game.Tags = []string{}
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

// GetEventGames gets all games associated with an event
func (h *EventHandler) GetEventGames(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	// First, check if the event exists and get its group ID
	var groupID string
	err := h.db.QueryRow(`
		SELECT group_id FROM events
		WHERE id = $1
	`, eventID).Scan(&groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Event not found: %s", eventID)
			RespondWithError(w, http.StatusNotFound, "Event not found")
		} else {
			log.Printf("Error fetching event %s: %v", eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error fetching event")
		}
		return
	}

	// Check if user has access to this event (is a member of the group)
	var isGroupMember bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, user.ID).Scan(&isGroupMember)
	if err != nil {
		log.Printf("Error checking group membership for user %s in group %s: %v", user.ID, groupID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking group membership")
		return
	}

	if !isGroupMember {
		log.Printf("User %s is not a member of group %s", user.ID, groupID)
		RespondWithError(w, http.StatusForbidden, "You are not a member of this group")
		return
	}

	// Get assigned games with tags
	gameRows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, eg.order_index,
		       GROUP_CONCAT(DISTINCT t.name) as tags
		FROM event_games eg
		JOIN games g ON eg.game_id = g.id
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE eg.event_id = $1
		GROUP BY g.id
		ORDER BY eg.order_index
	`, eventID)
	if err != nil {
		log.Printf("Error fetching games for event %s: %v", eventID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching games")
		return
	}
	defer gameRows.Close()

	type GameWithOrder struct {
		ID          string   `json:"id"`
		Name        string   `json:"name"`
		Description string   `json:"description"`
		MinPlayers  int      `json:"minPlayers"`
		MaxPlayers  int      `json:"maxPlayers"`
		OrderIndex  int      `json:"orderIndex"`
		Tags        []string `json:"tags"`
	}

	var games []GameWithOrder
	for gameRows.Next() {
		var game GameWithOrder
		var tagsStr sql.NullString
		err := gameRows.Scan(
			&game.ID, &game.Name, &game.Description,
			&game.MinPlayers, &game.MaxPlayers, &game.OrderIndex, &tagsStr,
		)
		if err != nil {
			log.Printf("Error scanning game row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning games")
			return
		}

		// Parse tags from comma-separated string
		if tagsStr.Valid {
			game.Tags = strings.Split(tagsStr.String, ",")
		} else {
			game.Tags = []string{}
		}

		games = append(games, game)
	}

	// Return response
	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data: struct {
			Games []GameWithOrder `json:"games"`
		}{
			Games: games,
		},
	})
}

// AddGameToEvent adds a game to an event
func (h *EventHandler) AddGameToEvent(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	// Parse request body
	var request struct {
		GameID string `json:"gameId"`
	}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Printf("Error parsing request body: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	// Verify the event exists and get group ID
	var groupID string
	var mcID sql.NullString
	err = h.db.QueryRow(`
		SELECT group_id, mc_id FROM events
		WHERE id = $1
	`, eventID).Scan(&groupID, &mcID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Event not found: %s", eventID)
			RespondWithError(w, http.StatusNotFound, "Event not found")
		} else {
			log.Printf("Error fetching event %s: %v", eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error fetching event")
		}
		return
	}

	// Check if the user is the MC for this event
	if !mcID.Valid || mcID.String != user.ID {
		log.Printf("User %s is not the MC for event %s", user.ID, eventID)
		RespondWithError(w, http.StatusForbidden, "Only the event's MC can manage games")
		return
	}

	// Verify the game exists and belongs to the group or its library
	var gameExists bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM games g
			LEFT JOIN group_game_libraries l ON g.id = l.game_id
			WHERE g.id = $1 AND (g.group_id = $2 OR l.group_id = $2)
		)
	`, request.GameID, groupID).Scan(&gameExists)
	if err != nil {
		log.Printf("Error checking game existence: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking game existence")
		return
	}

	if !gameExists {
		log.Printf("Game %s does not exist or is not in group %s library", request.GameID, groupID)
		RespondWithError(w, http.StatusBadRequest, "Game does not exist or is not in your group's library")
		return
	}

	// Get the maximum order index for this event
	var maxOrderIndex int
	err = h.db.QueryRow(`
		SELECT COALESCE(MAX(order_index), -1) FROM event_games
		WHERE event_id = $1
	`, eventID).Scan(&maxOrderIndex)
	if err != nil {
		log.Printf("Error getting max order index: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error calculating game order")
		return
	}

	// Check if game is already added to the event
	var gameAlreadyAdded bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM event_games
			WHERE event_id = $1 AND game_id = $2
		)
	`, eventID, request.GameID).Scan(&gameAlreadyAdded)
	if err != nil {
		log.Printf("Error checking if game is already added: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking event games")
		return
	}

	if gameAlreadyAdded {
		log.Printf("Game %s is already added to event %s", request.GameID, eventID)
		RespondWithError(w, http.StatusBadRequest, "This game is already added to the event")
		return
	}

	// Add the game to the event
	_, err = h.db.Exec(`
		INSERT INTO event_games (event_id, game_id, order_index)
		VALUES ($1, $2, $3)
	`, eventID, request.GameID, maxOrderIndex+1)
	if err != nil {
		log.Printf("Error adding game to event: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error adding game to event")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Game added to event successfully",
	})
}

// RemoveGameFromEvent removes a game from an event
func (h *EventHandler) RemoveGameFromEvent(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]
	gameID := vars["gameId"]

	// Verify the event exists and get MC ID
	var mcID sql.NullString
	err := h.db.QueryRow(`
		SELECT mc_id FROM events
		WHERE id = $1
	`, eventID).Scan(&mcID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Event not found: %s", eventID)
			RespondWithError(w, http.StatusNotFound, "Event not found")
		} else {
			log.Printf("Error fetching event %s: %v", eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error fetching event")
		}
		return
	}

	// Check if the user is the MC for this event
	if !mcID.Valid || mcID.String != user.ID {
		log.Printf("User %s is not the MC for event %s", user.ID, eventID)
		RespondWithError(w, http.StatusForbidden, "Only the event's MC can manage games")
		return
	}

	// Remove the game from the event
	_, err = h.db.Exec(`
		DELETE FROM event_games
		WHERE event_id = $1 AND game_id = $2
	`, eventID, gameID)
	if err != nil {
		log.Printf("Error removing game from event: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error removing game from event")
		return
	}

	// Reorder the remaining games to ensure they are sequential
	_, err = h.db.Exec(`
		WITH ranked_games AS (
			SELECT game_id, ROW_NUMBER() OVER (ORDER BY order_index) - 1 as new_index
			FROM event_games
			WHERE event_id = $1
		)
		UPDATE event_games
		SET order_index = ranked_games.new_index
		FROM ranked_games
		WHERE event_games.event_id = $1 AND event_games.game_id = ranked_games.game_id
	`, eventID)
	if err != nil {
		log.Printf("Error reordering games after removal: %v", err)
		// Don't return an error to the client, just log it
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Game removed from event successfully",
	})
}

// UpdateGameOrder updates a game's order in an event
func (h *EventHandler) UpdateGameOrder(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]
	gameID := vars["gameId"]

	// Parse request body
	var request struct {
		OrderIndex int `json:"orderIndex"`
	}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Printf("Error parsing request body: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request format")
		return
	}

	log.Printf("Received order update request for game %s in event %s, target index: %d",
		gameID, eventID, request.OrderIndex)

	// Verify the event exists and get MC ID
	var mcID sql.NullString
	err = h.db.QueryRow(`
		SELECT mc_id FROM events
		WHERE id = $1
	`, eventID).Scan(&mcID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Event not found: %s", eventID)
			RespondWithError(w, http.StatusNotFound, "Event not found")
		} else {
			log.Printf("Error fetching event %s: %v", eventID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error fetching event")
		}
		return
	}

	// Check if the user is the MC for this event
	if !mcID.Valid || mcID.String != user.ID {
		log.Printf("User %s is not the MC for event %s", user.ID, eventID)
		RespondWithError(w, http.StatusForbidden, "Only the event's MC can manage games")
		return
	}

	// Get the current order index for the target game
	var currentIndex int
	err = h.db.QueryRow(`
		SELECT order_index FROM event_games
		WHERE event_id = $1 AND game_id = $2
	`, eventID, gameID).Scan(&currentIndex)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Game %s not found in event %s", gameID, eventID)
			RespondWithError(w, http.StatusNotFound, "Game not found in event")
		} else {
			log.Printf("Error getting current order index: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error retrieving game order")
		}
		return
	}

	// Get the total number of games
	var gameCount int
	err = h.db.QueryRow(`
		SELECT COUNT(*) FROM event_games
		WHERE event_id = $1
	`, eventID).Scan(&gameCount)
	if err != nil {
		log.Printf("Error counting games in event: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error counting games")
		return
	}

	// Validate the target index is adjacent to the current index
	if request.OrderIndex < 0 || request.OrderIndex >= gameCount {
		log.Printf("Index out of bounds: %d (must be between 0 and %d)", request.OrderIndex, gameCount-1)
		RespondWithError(w, http.StatusBadRequest, "Invalid order index")
		return
	}

	// If indices are the same, no change needed
	if currentIndex == request.OrderIndex {
		log.Printf("No change in order index (%d), skipping update", currentIndex)
		RespondWithJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Message: "Game order unchanged",
		})
		return
	}

	// Simple implementation - find the game at the target position and swap positions
	// First, find the other game that needs to move
	var otherGameID string
	err = h.db.QueryRow(`
		SELECT game_id FROM event_games
		WHERE event_id = $1 AND order_index = $2
	`, eventID, request.OrderIndex).Scan(&otherGameID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("No game found at target position %d, will perform a shift operation instead", request.OrderIndex)
			// Instead of swapping, we'll reorder all games
			tx, err := h.db.Begin()
			if err != nil {
				log.Printf("Error starting transaction: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Database error")
				return
			}
			defer tx.Rollback()

			// First, temporarily move our target game out of the way (to a negative index)
			_, err = tx.Exec(`
				UPDATE event_games
				SET order_index = -1
				WHERE event_id = $1 AND game_id = $2
			`, eventID, gameID)
			if err != nil {
				log.Printf("Error updating game to temporary index: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Error updating game order")
				return
			}

			// Then reorder all games to ensure they have sequential indices
			_, err = tx.Exec(`
				WITH ranked_games AS (
					SELECT game_id, ROW_NUMBER() OVER (ORDER BY order_index) - 1 as new_index
					FROM event_games
					WHERE event_id = $1 AND game_id != $2
				)
				UPDATE event_games
				SET order_index =
					CASE
						WHEN ranked_games.new_index >= $3 THEN ranked_games.new_index + 1
						ELSE ranked_games.new_index
					END
				FROM ranked_games
				WHERE event_games.event_id = $1 AND event_games.game_id = ranked_games.game_id
			`, eventID, gameID, request.OrderIndex)
			if err != nil {
				log.Printf("Error reordering games: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Error updating game order")
				return
			}

			// Finally, put our target game at the requested position
			_, err = tx.Exec(`
				UPDATE event_games
				SET order_index = $3
				WHERE event_id = $1 AND game_id = $2
			`, eventID, gameID, request.OrderIndex)
			if err != nil {
				log.Printf("Error moving game to target position: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Error updating game order")
				return
			}

			// Commit transaction
			err = tx.Commit()
			if err != nil {
				log.Printf("Error committing transaction: %v", err)
				RespondWithError(w, http.StatusInternalServerError, "Database error")
				return
			}

			log.Printf("Successfully moved game %s to position %d", gameID, request.OrderIndex)

			RespondWithJSON(w, http.StatusOK, ApiResponse{
				Success: true,
				Message: "Game order updated successfully",
			})
			return
		}

		log.Printf("Error finding game at target position %d: %v", request.OrderIndex, err)
		RespondWithError(w, http.StatusInternalServerError, "Error finding game at target position")
		return
	}

	log.Printf("Swapping positions: game %s from index %d with game %s at index %d",
		gameID, currentIndex, otherGameID, request.OrderIndex)

	// Begin transaction for the swap
	tx, err := h.db.Begin()
	if err != nil {
		log.Printf("Error starting transaction: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	defer tx.Rollback()

	// Perform the swap
	// First update the target game to a temporary index to avoid unique constraint violations
	_, err = tx.Exec(`
		UPDATE event_games
		SET order_index = -1
		WHERE event_id = $1 AND game_id = $2
	`, eventID, gameID)
	if err != nil {
		log.Printf("Error updating target game to temporary index: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating game order")
		return
	}

	// Move the other game to the original position
	_, err = tx.Exec(`
		UPDATE event_games
		SET order_index = $3
		WHERE event_id = $1 AND game_id = $2
	`, eventID, otherGameID, currentIndex)
	if err != nil {
		log.Printf("Error moving other game to original position: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating game order")
		return
	}

	// Move the target game to the final position
	_, err = tx.Exec(`
		UPDATE event_games
		SET order_index = $3
		WHERE event_id = $1 AND game_id = $2
	`, eventID, gameID, request.OrderIndex)
	if err != nil {
		log.Printf("Error moving target game to final position: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating game order")
		return
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		log.Printf("Error committing transaction: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}

	log.Printf("Successfully swapped positions of games %s and %s", gameID, otherGameID)

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Game order updated successfully",
	})
}
