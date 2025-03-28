package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

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
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	// GET: List events for the group
	rows, err := h.db.Query(`
		SELECT id, title, description, location, start_time, end_time, created_at, created_by
		FROM events
		WHERE group_id = $1
		ORDER BY start_time DESC
	`, groupID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error fetching events")
		return
	}
	defer rows.Close()

	events := []Event{}
	for rows.Next() {
		var event Event
		err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy)
		if err != nil {
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
		EndTime     string `json:"endTime"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&eventRequest); err != nil {
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
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	startTime, err := time.Parse(time.RFC3339, eventRequest.StartTime)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid start time format")
		return
	}

	endTime, err := time.Parse(time.RFC3339, eventRequest.EndTime)
	if err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid end time format")
		return
	}

	eventID := uuid.New().String()
	err = h.db.QueryRow(`
		INSERT INTO events (id, group_id, title, description, location, start_time, end_time, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, eventID, eventRequest.GroupID, eventRequest.Title, eventRequest.Description, eventRequest.Location, startTime, endTime, user.ID).Scan(&eventID)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error creating event")
		return
	}

	// Fetch the newly created event
	var event Event
	err = h.db.QueryRow(`
		SELECT id, group_id, title, description, location, start_time, end_time, created_at, created_by
		FROM events
		WHERE id = $1
	`, eventID).Scan(&event.ID, &event.GroupID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy)
	if err != nil {
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
		SELECT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by,
		       g.name as group_name
		FROM events e
		JOIN group_members m ON e.group_id = m.group_id
		JOIN improv_groups g ON e.group_id = g.id
		WHERE m.user_id = $1
		ORDER BY e.start_time DESC
	`, user.ID)
	if err != nil {
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
	}

	var events []EventWithGroup
	for rows.Next() {
		var event EventWithGroup
		err := rows.Scan(
			&event.ID, &event.GroupID, &event.Title, &event.Description,
			&event.Location, &event.StartTime, &event.EndTime,
			&event.CreatedAt, &event.CreatedBy, &event.GroupName,
		)
		if err != nil {
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
	err := h.db.QueryRow(`
		SELECT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by,
		       g.name as group_name
		FROM events e
		JOIN improv_groups g ON e.group_id = g.id
		JOIN group_members m ON e.group_id = m.group_id
		WHERE e.id = $1 AND m.user_id = $2
	`, eventID, user.ID).Scan(
		&event.ID, &event.GroupID, &event.Title, &event.Description,
		&event.Location, &event.StartTime, &event.EndTime,
		&event.CreatedAt, &event.CreatedBy, &groupName,
	)
	if err != nil {
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
			RespondWithError(w, http.StatusInternalServerError, "Error scanning games")
			return
		}
		games = append(games, game)
	}

	// Include the member data in the response
	eventData := struct {
		Event     Event           `json:"event"`
		GroupName string          `json:"groupName"`
		RSVPs     []RSVP          `json:"rsvps"`
		Games     []GameWithOrder `json:"games"`
	}{
		Event:     event,
		GroupName: groupName,
		RSVPs:     rsvps,
		Games:     games,
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    eventData,
	})
}
