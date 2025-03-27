package handlers

import (
	"database/sql"
	"html/template"
	"net/http"
	"strconv"
	"strings"

	"improv-app/internal/models"

	"github.com/gorilla/mux"
)

type GameHandler struct {
	db        *sql.DB
	templates *template.Template
}

func NewGameHandler(db *sql.DB, templates *template.Template) *GameHandler {
	return &GameHandler{
		db:        db,
		templates: templates,
	}
}

func (h *GameHandler) List(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)

	if r.Method == "POST" {
		name := r.FormValue("name")
		description := r.FormValue("description")
		minPlayers, err := strconv.Atoi(r.FormValue("min_players"))
		if err != nil {
			http.Error(w, "Invalid min players", http.StatusBadRequest)
			return
		}
		maxPlayers, err := strconv.Atoi(r.FormValue("max_players"))
		if err != nil {
			http.Error(w, "Invalid max players", http.StatusBadRequest)
			return
		}

		var gameID string
		err = h.db.QueryRow(`
			INSERT INTO games (name, description, min_players, max_players, created_by)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, name, description, minPlayers, maxPlayers, user.ID).Scan(&gameID)
		if err != nil {
			http.Error(w, "Error creating game", http.StatusInternalServerError)
			return
		}

		// Handle tags
		tags := strings.Split(r.FormValue("tags"), ",")
		for _, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag == "" {
				continue
			}

			var tagID string
			err = h.db.QueryRow(`
				INSERT INTO game_tags (name)
				VALUES ($1)
				ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
				RETURNING id
			`, tag).Scan(&tagID)
			if err != nil {
				http.Error(w, "Error creating tag", http.StatusInternalServerError)
				return
			}

			_, err = h.db.Exec(`
				INSERT INTO game_tag_associations (game_id, tag_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`, gameID, tagID)
			if err != nil {
				http.Error(w, "Error associating tag", http.StatusInternalServerError)
				return
			}
		}

		http.Redirect(w, r, "/games/"+gameID, http.StatusSeeOther)
		return
	}

	// GET: List games
	rows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by,
		       array_agg(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		GROUP BY g.id
		ORDER BY g.created_at DESC
	`)
	if err != nil {
		http.Error(w, "Error fetching games", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var games []Game
	for rows.Next() {
		var game Game
		var tags []string
		err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &tags)
		if err != nil {
			http.Error(w, "Error scanning games", http.StatusInternalServerError)
			return
		}
		game.Tags = tags
		games = append(games, game)
	}

	data := models.PageData{
		Title: "Games",
		User:  user,
		Data:  games,
	}
	h.templates.ExecuteTemplate(w, "games.html", data)
}

func (h *GameHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*models.User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	var game Game
	err := h.db.QueryRow(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by,
		       array_agg(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE g.id = $1
		GROUP BY g.id
	`, gameID).Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &game.Tags)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Get user's rating
	var rating int
	err = h.db.QueryRow(`
		SELECT rating
		FROM user_game_preferences
		WHERE user_id = $1 AND game_id = $2
	`, user.ID, gameID).Scan(&rating)
	if err != nil && err != sql.ErrNoRows {
		http.Error(w, "Error fetching rating", http.StatusInternalServerError)
		return
	}

	data := models.PageData{
		Title: game.Name,
		User:  user,
		Data: struct {
			Game   Game
			Rating int
		}{
			Game:   game,
			Rating: rating,
		},
	}
	h.templates.ExecuteTemplate(w, "game.html", data)
}
