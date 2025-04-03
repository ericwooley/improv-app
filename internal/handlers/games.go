package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"improv-app/internal/middleware"
	"improv-app/internal/models"

	"improv-app/internal/auth"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type GameHandler struct {
	db *sql.DB
}

func NewGameHandler(db *sql.DB) *GameHandler {
	return &GameHandler{
		db: db,
	}
}

// List handles GET and POST requests for games
func (h *GameHandler) List(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	// Parse query parameters for filtering
	query := r.URL.Query()
	tagFilter := query.Get("tag")
	libraryFilter := query.Get("library")
	ownedByGroupFilter := query.Get("ownedByGroup")

	// Build query and parameters
	queryStr := `
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
		       GROUP_CONCAT(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
	`

	// Apply library filter if provided
	if libraryFilter != "" {
		queryStr += `
			JOIN group_game_libraries ggl ON g.id = ggl.game_id AND ggl.group_id = ?
		`
	}

	queryStr += `
		WHERE (g.public = TRUE
		   OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))
	`

	// Apply tag filter if provided
	if tagFilter != "" {
		queryStr += `
			AND g.id IN (
				SELECT game_id FROM game_tag_associations gta
				JOIN game_tags t ON gta.tag_id = t.id
				WHERE t.name = ?
			)
		`
	}

	// Apply owned by group filter if provided
	if ownedByGroupFilter != "" {
		queryStr += `
			AND g.group_id = ?
		`
	}

	queryStr += `
		GROUP BY g.id
		ORDER BY g.created_at DESC
	`

	// Prepare query parameters
	var params []interface{}
	if libraryFilter != "" {
		params = append(params, libraryFilter)
	}
	params = append(params, user.ID)
	if tagFilter != "" {
		params = append(params, tagFilter)
	}
	if ownedByGroupFilter != "" {
		params = append(params, ownedByGroupFilter)
	}

	// Execute query
	rows, err := h.db.Query(queryStr, params...)
	if err != nil {
		log.Printf("Error fetching games: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching games")
		return
	}
	defer rows.Close()

	var games []models.Game
	for rows.Next() {
		var game models.Game
		var tagsStr sql.NullString
		err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &game.GroupID, &game.Public, &tagsStr)
		if err != nil {
			log.Printf("Error scanning game row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning games")
			return
		}
		if tagsStr.Valid {
			game.Tags = strings.Split(tagsStr.String, ",")
		} else {
			game.Tags = []string{}
		}
		games = append(games, game)
	}
	if games == nil {
		games = []models.Game{}
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    games,
	})
}

// Create handles creating a new game
func (h *GameHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	// Parse JSON request
	var gameRequest struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		MinPlayers  int      `json:"minPlayers"`
		MaxPlayers  int      `json:"maxPlayers"`
		Tags        []string `json:"tags"`
		GroupID     string   `json:"groupId"`
		Public      bool     `json:"public"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&gameRequest); err != nil {
		log.Printf("Error decoding game request: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate request
	if gameRequest.Name == "" {
		RespondWithError(w, http.StatusBadRequest, "Game name is required")
		return
	}
	if gameRequest.MinPlayers < 1 {
		RespondWithError(w, http.StatusBadRequest, "Minimum players must be at least 1")
		return
	}
	if gameRequest.MaxPlayers < gameRequest.MinPlayers {
		RespondWithError(w, http.StatusBadRequest, "Maximum players must be greater than or equal to minimum players")
		return
	}
	if gameRequest.GroupID == "" {
		RespondWithError(w, http.StatusBadRequest, "Group ID is required")
		return
	}

	// Check if user is a member of the group
	var role string
	err := h.db.QueryRow(`
		SELECT role
		FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, gameRequest.GroupID, user.ID).Scan(&role)
	if err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusForbidden, "You must be a member of the group to create games")
			return
		}
		log.Printf("Error checking group membership: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking group membership")
		return
	}

	gameID := uuid.New().String()
	err = h.db.QueryRow(`
		INSERT INTO games (id, name, description, min_players, max_players, created_by, group_id, public)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`, gameID, gameRequest.Name, gameRequest.Description, gameRequest.MinPlayers, gameRequest.MaxPlayers, user.ID, gameRequest.GroupID, gameRequest.Public).Scan(&gameID)
	if err != nil {
		log.Printf("Error creating game: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error creating game")
		return
	}
	log.Printf("Created new game: %s (ID: %s)", gameRequest.Name, gameID)

	// Automatically add the game to the group's library
	_, err = h.db.Exec(`
		INSERT INTO group_game_libraries (group_id, game_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, gameRequest.GroupID, gameID)
	if err != nil {
		log.Printf("Error adding game to group library: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error adding game to group library")
		return
	}
	log.Printf("Added game %s to group %s library", gameID, gameRequest.GroupID)

	// Handle tags
	var tagIDs []string
	for _, tag := range gameRequest.Tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}

		var tagID string
		err = h.db.QueryRow(`
			INSERT INTO game_tags (id, name)
			VALUES ($1, $2)
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, uuid.New().String(), tag).Scan(&tagID)
		if err != nil {
			log.Printf("Error creating tag '%s': %v", tag, err)
			RespondWithError(w, http.StatusInternalServerError, "Error creating tag")
			return
		}

		_, err = h.db.Exec(`
			INSERT INTO game_tag_associations (game_id, tag_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, gameID, tagID)
		if err != nil {
			log.Printf("Error associating tag '%s' with game '%s': %v", tag, gameID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error associating tag")
			return
		}
		tagIDs = append(tagIDs, tagID)
	}

	// Fetch the newly created game with tags
	var game models.Game
	var tagsStr sql.NullString
	err = h.db.QueryRow(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
				GROUP_CONCAT(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE g.id = $1
		GROUP BY g.id
	`, gameID).Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &game.GroupID, &game.Public, &tagsStr)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error fetching created game")
		return
	}
	if tagsStr.Valid {
		game.Tags = strings.Split(tagsStr.String, ",")
	} else {
		game.Tags = []string{}
	}

	RespondWithJSON(w, http.StatusCreated, ApiResponse{
		Success: true,
		Message: "Game created successfully",
		Data:    game,
	})
}

// Get handles fetching a single game by ID
func (h *GameHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	// First check if the user has access to this game
	var hasAccess bool
	err := h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM games g
			WHERE g.id = $1 AND (
				g.public = TRUE
				OR g.created_by = $2
				OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = $2)
			)
		)
	`, gameID, user.ID).Scan(&hasAccess)

	if err != nil {
		log.Printf("Error checking game access: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking game access")
		return
	}

	if !hasAccess {
		log.Printf("Unauthorized access attempt to game %s by user %s", gameID, user.ID)
		RespondWithError(w, http.StatusForbidden, "You don't have access to this game")
		return
	}

	var game models.Game
	var tagsStr sql.NullString
	err = h.db.QueryRow(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
		       GROUP_CONCAT(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE g.id = $1
		GROUP BY g.id
	`, gameID).Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &game.GroupID, &game.Public, &tagsStr)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Game not found: %s", gameID)
			RespondWithError(w, http.StatusNotFound, "Game not found")
			return
		}
		log.Printf("Error fetching game %s: %v", gameID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching game")
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
		RespondWithError(w, http.StatusInternalServerError, "Error fetching rating")
		return
	}

	// Get upcoming events with this game
	rows, err := h.db.Query(`
		SELECT e.id, e.title, e.description, e.location, e.start_time, e.end_time,
				g.id as group_id, g.name as group_name
		FROM events e
		JOIN event_games eg ON e.id = eg.event_id
		JOIN improv_groups g ON e.group_id = g.id
		JOIN group_members gm ON g.id = gm.group_id
		WHERE eg.game_id = $1 AND gm.user_id = $2 AND e.start_time > CURRENT_TIMESTAMP
		ORDER BY e.start_time
		LIMIT 5
	`, gameID, user.ID)
	if err != nil {
		log.Printf("Error fetching events for game %s: %v", gameID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching events")
		return
	}
	defer rows.Close()

	type UpcomingEvent struct {
		ID          string    `json:"id"`
		Title       string    `json:"title"`
		Description string    `json:"description"`
		Location    string    `json:"location"`
		StartTime   time.Time `json:"startTime"`
		EndTime     time.Time `json:"endTime"`
		GroupID     string    `json:"groupId"`
		GroupName   string    `json:"groupName"`
	}

	var upcomingEvents []UpcomingEvent
	for rows.Next() {
		var event UpcomingEvent
		err := rows.Scan(
			&event.ID, &event.Title, &event.Description, &event.Location,
			&event.StartTime, &event.EndTime, &event.GroupID, &event.GroupName,
		)
		if err != nil {
			log.Printf("Error scanning event row: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning events")
			return
		}
		upcomingEvents = append(upcomingEvents, event)
	}

	gameData := struct {
		Game           models.Game    `json:"game"`
		Rating         int            `json:"rating"`
		UpcomingEvents []UpcomingEvent `json:"upcomingEvents"`
	}{
		Game:           game,
		Rating:         rating,
		UpcomingEvents: upcomingEvents,
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    gameData,
	})
}

// RateGame handles rating a game
func (h *GameHandler) RateGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	// Parse JSON request
	var ratingRequest struct {
		Rating int `json:"rating"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&ratingRequest); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate rating
	if ratingRequest.Rating < 1 || ratingRequest.Rating > 5 {
		RespondWithError(w, http.StatusBadRequest, "Rating must be between 1 and 5")
		return
	}

	// Upsert the rating
	_, err := h.db.Exec(`
		INSERT INTO user_game_preferences (user_id, game_id, rating)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, game_id) DO UPDATE SET rating = $3
	`, user.ID, gameID, ratingRequest.Rating)
	if err != nil {
		log.Printf("Error saving rating for game %s: %v", gameID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error saving rating")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Rating saved successfully",
		Data: map[string]interface{}{
			"gameId": gameID,
			"rating": ratingRequest.Rating,
		},
	})
}

// GetGameGroupLibraries returns all groups that have a specific game in their library
func (h *GameHandler) GetGameGroupLibraries(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	// Check if the game exists
	var gameExists bool
	err := h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM games WHERE id = $1 AND (public = TRUE OR created_by = $2 OR
			group_id IN (SELECT group_id FROM group_members WHERE user_id = $2)))
	`, gameID, user.ID).Scan(&gameExists)

	if err != nil {
		log.Printf("Error checking game access: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking game access")
		return
	}

	if !gameExists {
		RespondWithError(w, http.StatusForbidden, "Game not found or you don't have access")
		return
	}

	// Get all groups that have this game in their library
	rows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.created_at, g.created_by,
			   gm.role as user_role
		FROM improv_groups g
		JOIN group_game_libraries ggl ON g.id = ggl.group_id
		JOIN group_members gm ON g.id = gm.group_id
		WHERE ggl.game_id = $1 AND gm.user_id = $2
		ORDER BY g.name
	`, gameID, user.ID)

	if err != nil {
		log.Printf("Error fetching groups with game in library: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group libraries")
		return
	}
	defer rows.Close()

	type GroupWithRole struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		CreatedAt   string `json:"createdAt"`
		CreatedBy   string `json:"createdBy"`
		UserRole    string `json:"userRole"`
	}

	var groups []GroupWithRole
	for rows.Next() {
		var group GroupWithRole
		err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy, &group.UserRole)
		if err != nil {
			log.Printf("Error scanning group: %v", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning group data")
			return
		}
		groups = append(groups, group)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    groups,
	})
}

// GetAllowedTags returns a list of allowed tags for games
func (h *GameHandler) GetAllowedTags(w http.ResponseWriter, r *http.Request) {
	// Hard-coded list of allowed tags for now
	allowedTags := []string{
		"Warm-up",
		"Short-form",
		"Long-form",
		"Character",
		"Environment",
		"Narrative",
		"Physical",
		"Verbal",
		"Musical",
		"Introduction",
		"High-energy",
		"Low-energy",
		"Performance",
		"Practice",
		"Beginner-friendly",
		"Advanced",
		"Solo",
		"Group",
		"Quick",
		"Audience-interaction",
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    allowedTags,
	})
}

// Update handles updating an existing game
func (h *GameHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	// Parse JSON request
	var gameRequest struct {
		Name        string   `json:"name"`
		Description string   `json:"description"`
		MinPlayers  int      `json:"minPlayers"`
		MaxPlayers  int      `json:"maxPlayers"`
		Tags        []string `json:"tags"`
		Public      bool     `json:"public"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&gameRequest); err != nil {
		log.Printf("Error decoding game update request: %v", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Check if game exists and user has permission to edit
	var groupID string
	var createdBy string
	err := h.db.QueryRow(`
		SELECT group_id, created_by
		FROM games
		WHERE id = $1
	`, gameID).Scan(&groupID, &createdBy)
	if err != nil {
		if err == sql.ErrNoRows {
			RespondWithError(w, http.StatusNotFound, "Game not found")
			return
		}
		log.Printf("Error finding game: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error finding game")
		return
	}

	// Check if user has permission (is admin/owner of group or created the game)
	var role string
	err = h.db.QueryRow(`
		SELECT role
		FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, user.ID).Scan(&role)

	hasPermission := (err == nil && (role == auth.RoleAdmin || role == auth.RoleOwner)) || createdBy == user.ID
	if !hasPermission {
		RespondWithError(w, http.StatusForbidden, "You don't have permission to update this game")
		return
	}

	// Validate request
	if gameRequest.Name == "" {
		RespondWithError(w, http.StatusBadRequest, "Game name is required")
		return
	}
	if gameRequest.MinPlayers < 1 {
		RespondWithError(w, http.StatusBadRequest, "Minimum players must be at least 1")
		return
	}
	if gameRequest.MaxPlayers < gameRequest.MinPlayers {
		RespondWithError(w, http.StatusBadRequest, "Maximum players must be greater than or equal to minimum players")
		return
	}

	// Update game details
	_, err = h.db.Exec(`
		UPDATE games
		SET name = $1, description = $2, min_players = $3, max_players = $4, public = $5
		WHERE id = $6
	`, gameRequest.Name, gameRequest.Description, gameRequest.MinPlayers, gameRequest.MaxPlayers, gameRequest.Public, gameID)
	if err != nil {
		log.Printf("Error updating game: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating game")
		return
	}

	// Remove old tag associations
	_, err = h.db.Exec(`
		DELETE FROM game_tag_associations
		WHERE game_id = $1
	`, gameID)
	if err != nil {
		log.Printf("Error removing old tag associations: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating game tags")
		return
	}

	// Create new tag associations
	for _, tag := range gameRequest.Tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}

		var tagID string
		err = h.db.QueryRow(`
			INSERT INTO game_tags (id, name)
			VALUES ($1, $2)
			ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		`, uuid.New().String(), tag).Scan(&tagID)
		if err != nil {
			log.Printf("Error creating tag '%s': %v", tag, err)
			RespondWithError(w, http.StatusInternalServerError, "Error creating tag")
			return
		}

		_, err = h.db.Exec(`
			INSERT INTO game_tag_associations (game_id, tag_id)
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`, gameID, tagID)
		if err != nil {
			log.Printf("Error associating tag '%s' with game '%s': %v", tag, gameID, err)
			RespondWithError(w, http.StatusInternalServerError, "Error associating tag")
			return
		}
	}

	// Fetch the updated game with tags
	var game models.Game
	var tagsStr sql.NullString
	err = h.db.QueryRow(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
				GROUP_CONCAT(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE g.id = $1
		GROUP BY g.id
	`, gameID).Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &game.GroupID, &game.Public, &tagsStr)
	if err != nil {
		log.Printf("Error fetching updated game: %v", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching updated game")
		return
	}
	if tagsStr.Valid {
		game.Tags = strings.Split(tagsStr.String, ",")
	} else {
		game.Tags = []string{}
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Game updated successfully",
		Data:    game,
	})
}
