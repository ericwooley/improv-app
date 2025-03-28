package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"strings"

	"improv-app/internal/middleware"
	"improv-app/internal/models"

	"github.com/gorilla/mux"
)

type GameHandler struct {
	db        *sql.DB
}

func NewGameHandler(db *sql.DB) *GameHandler {
	return &GameHandler{
		db:        db,
	}
}

func (h *GameHandler) List(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	if r.Method == "POST" {
		name := r.FormValue("name")
		description := r.FormValue("description")
		minPlayers, err := strconv.Atoi(r.FormValue("min_players"))
		if err != nil {
			log.Printf("Error parsing min_players: %v", err)
			http.Error(w, "Invalid min players", http.StatusBadRequest)
			return
		}
		maxPlayers, err := strconv.Atoi(r.FormValue("max_players"))
		if err != nil {
			log.Printf("Error parsing max_players: %v", err)
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
			log.Printf("Error creating game: %v", err)
			http.Error(w, "Error creating game", http.StatusInternalServerError)
			return
		}
		log.Printf("Created new game: %s (ID: %s)", name, gameID)

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
				log.Printf("Error creating tag '%s': %v", tag, err)
				http.Error(w, "Error creating tag", http.StatusInternalServerError)
				return
			}

			_, err = h.db.Exec(`
				INSERT INTO game_tag_associations (game_id, tag_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`, gameID, tagID)
			if err != nil {
				log.Printf("Error associating tag '%s' with game '%s': %v", tag, gameID, err)
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
		       GROUP_CONCAT(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		GROUP BY g.id
		ORDER BY g.created_at DESC
	`)
	if err != nil {
		log.Printf("Error fetching games: %v", err)
		http.Error(w, "Error fetching games", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var games []Game
	for rows.Next() {
		var game Game
		var tagsStr sql.NullString
		err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &tagsStr)
		if err != nil {
			log.Printf("Error scanning game row: %v", err)
			http.Error(w, "Error scanning games", http.StatusInternalServerError)
			return
		}
		if tagsStr.Valid {
			game.Tags = strings.Split(tagsStr.String, ",")
		} else {
			game.Tags = []string{}
		}
		games = append(games, game)
	}

	data := models.PageData{
		Title: "Games",
		User:  user,
		Data:  games,
	}
	RenderTemplateWithLayout(w, &data, "templates/games.html")
}

func (h *GameHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	var game Game
	var tagsStr sql.NullString
	err := h.db.QueryRow(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by,
		       GROUP_CONCAT(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE g.id = $1
		GROUP BY g.id
	`, gameID).Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &tagsStr)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Game not found: %s", gameID)
			http.Error(w, "Game not found", http.StatusNotFound)
			return
		}
		log.Printf("Error fetching game %s: %v", gameID, err)
		http.Error(w, "Error fetching game", http.StatusInternalServerError)
		return
	}
	if tagsStr.Valid {
		game.Tags = strings.Split(tagsStr.String, ",")
	} else {
		game.Tags = []string{}
	}

	// Get user's rating
	var rating int
	err = h.db.QueryRow(`
		SELECT rating
		FROM user_game_preferences
		WHERE user_id = $1 AND game_id = $2
	`, user.ID, gameID).Scan(&rating)
	if err != nil && err != sql.ErrNoRows {
		log.Printf("Error fetching rating for game %s and user %s: %v", gameID, user.ID, err)
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
	RenderTemplateWithLayout(w, &data, "templates/game.html")
}
