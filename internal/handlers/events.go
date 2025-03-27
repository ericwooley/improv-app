package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"improv-app/internal/models"

	"github.com/gorilla/mux"
)

type EventHandler struct {
	db        *sql.DB
}

func NewEventHandler(db *sql.DB) *EventHandler {
	return &EventHandler{
		db:        db,
	}
}

func (h *EventHandler) List(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	if r.Method == "POST" {
		title := r.FormValue("title")
		description := r.FormValue("description")
		location := r.FormValue("location")
		startTime, err := time.Parse("2006-01-02T15:04", r.FormValue("start_time"))
		if err != nil {
			http.Error(w, "Invalid start time", http.StatusBadRequest)
			return
		}
		endTime, err := time.Parse("2006-01-02T15:04", r.FormValue("end_time"))
		if err != nil {
			http.Error(w, "Invalid end time", http.StatusBadRequest)
			return
		}

		var eventID string
		err = h.db.QueryRow(`
			INSERT INTO events (group_id, title, description, location, start_time, end_time, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`, groupID, title, description, location, startTime, endTime, user.ID).Scan(&eventID)
		if err != nil {
			http.Error(w, "Error creating event", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/events/"+eventID, http.StatusSeeOther)
		return
	}

	// GET: List events
	rows, err := h.db.Query(`
		SELECT id, title, description, location, start_time, end_time, created_at, created_by
		FROM events
		WHERE group_id = $1
		ORDER BY start_time DESC
	`, groupID)
	if err != nil {
		http.Error(w, "Error fetching events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var event Event
		err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy)
		if err != nil {
			http.Error(w, "Error scanning events", http.StatusInternalServerError)
			return
		}
		events = append(events, event)
	}

	data := models.PageData{
		Title: "Events",
		User:  user,
		Data:  events,
	}
	RenderTemplate(w, "templates/events.html", &data)
}

func (h *EventHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	var event Event
	err := h.db.QueryRow(`
		SELECT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by
		FROM events e
		JOIN group_members m ON e.group_id = m.group_id
		WHERE e.id = $1 AND m.user_id = $2
	`, eventID, user.ID).Scan(&event.ID, &event.GroupID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Get RSVPs
	rows, err := h.db.Query(`
		SELECT u.first_name, u.last_name, r.status
		FROM event_rsvps r
		JOIN users u ON r.user_id = u.id
		WHERE r.event_id = $1
	`, eventID)
	if err != nil {
		http.Error(w, "Error fetching RSVPs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type RSVP struct {
		FirstName string
		LastName  string
		Status    string
	}

	var rsvps []RSVP
	for rows.Next() {
		var rsvp RSVP
		err := rows.Scan(&rsvp.FirstName, &rsvp.LastName, &rsvp.Status)
		if err != nil {
			http.Error(w, "Error scanning RSVPs", http.StatusInternalServerError)
			return
		}
		rsvps = append(rsvps, rsvp)
	}

	// Get assigned games
	rows, err = h.db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, eg.order_index
		FROM event_games eg
		JOIN games g ON eg.game_id = g.id
		WHERE eg.event_id = $1
		ORDER BY eg.order_index
	`, eventID)
	if err != nil {
		http.Error(w, "Error fetching games", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var games []Game
	for rows.Next() {
		var game Game
		var orderIndex int
		err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &orderIndex)
		if err != nil {
			http.Error(w, "Error scanning games", http.StatusInternalServerError)
			return
		}
		games = append(games, game)
	}

	data := models.PageData{
		Title: event.Title,
		User:  user,
		Data: struct {
			Event Event
			RSVPs []RSVP
			Games []Game
		}{
			Event: event,
			RSVPs: rsvps,
			Games: games,
		},
	}
	RenderTemplate(w, "templates/event.html", &data)
}
