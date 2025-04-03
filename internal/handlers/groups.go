package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"improv-app/internal/middleware"
	"improv-app/internal/models"

	"improv-app/internal/auth"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type GroupHandler struct {
	db *sql.DB
}

func NewGroupHandler(db *sql.DB) *GroupHandler {
	return &GroupHandler{
		db: db,
	}
}

func (h *GroupHandler) Create(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	var groupRequest struct {
		Name        string `json:"name" validate:"required,min=3,max=100"`
		Description string `json:"description" validate:"omitempty,max=500"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&groupRequest); err != nil {
		fmt.Printf("Error decoding request: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Trim whitespace
	groupRequest.Name = strings.TrimSpace(groupRequest.Name)
	groupRequest.Description = strings.TrimSpace(groupRequest.Description)

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(groupRequest); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		errorMessage := "Validation failed: "
		for _, e := range validationErrors {
			switch e.Field() {
			case "Name":
				if e.Tag() == "required" {
					errorMessage += "Name is required. "
				} else if e.Tag() == "min" {
					errorMessage += "Name must be at least 3 characters. "
				} else if e.Tag() == "max" {
					errorMessage += "Name must be less than 100 characters. "
				}
			case "Description":
				if e.Tag() == "max" {
					errorMessage += "Description must be less than 500 characters. "
				}
			}
		}
		fmt.Printf("Validation error: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, errorMessage)
		return
	}

	groupID := uuid.New().String()
	err := h.db.QueryRow(`
	INSERT INTO improv_groups (id, name, description, created_by)
	VALUES ($1, $2, $3, $4)
	RETURNING id
`, groupID, groupRequest.Name, groupRequest.Description, user.ID).Scan(&groupID)
	if err != nil {
		fmt.Printf("Error creating group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error creating group")
		return
	}

	// Add creator as admin
	_, err = h.db.Exec(`
	INSERT INTO group_members (group_id, user_id, role)
	VALUES ($1, $2, $3)
`, groupID, user.ID, auth.RoleAdmin)
	if err != nil {
		fmt.Printf("Error adding group member: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error adding group member")
		return
	}

	// Fetch the newly created group
	var group ImprovGroup
	err = h.db.QueryRow(`
	SELECT id, name, description, created_at, created_by
	FROM improv_groups
	WHERE id = $1
`, groupID).Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
	if err != nil {
		fmt.Printf("Error fetching created group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching created group")
		return
	}

	RespondWithJSON(w, http.StatusCreated, ApiResponse{
		Success: true,
		Message: "Group created successfully",
		Data:    group,
	})

}

// List handles GET and POST requests for groups
func (h *GroupHandler) List(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	// GET: List groups
	rows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.created_at, g.created_by
		FROM improv_groups g
		JOIN group_members m ON g.id = m.group_id
		WHERE m.user_id = $1
		ORDER BY g.created_at DESC
	`, user.ID)
	if err != nil {
		fmt.Printf("Error fetching groups: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching groups")
		return
	}
	defer rows.Close()

	groups := []ImprovGroup{}
	for rows.Next() {
		var group ImprovGroup
		err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
		if err != nil {
			fmt.Printf("Error scanning groups: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning groups")
			return
		}
		groups = append(groups, group)
	}
	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    groups,
	})
}

// Get handles fetching a single group by ID
func (h *GroupHandler) Get(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	var group ImprovGroup
	err := h.db.QueryRow(`
		SELECT id, name, description, created_at, created_by
		FROM improv_groups
		WHERE id = $1
	`, groupID).Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
	if err != nil {
		fmt.Printf("Group not found: %v\n", err)
		RespondWithError(w, http.StatusNotFound, "Group not found")
		return
	}

	// Check if user is a member
	var role string
	err = h.db.QueryRow(`
		SELECT role
		FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, user.ID).Scan(&role)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("User not a member of group: %v\n", err)
			RespondWithError(w, http.StatusForbidden, "Not a member of this group")
			return
		}
		fmt.Printf("Database error checking membership: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking group membership")
		return
	}

	// Get members
	memberRows, err := h.db.Query(`
		SELECT u.id, u.email, u.first_name, u.last_name, gm.role
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = $1
	`, groupID)
	if err != nil {
		fmt.Printf("Error fetching group members: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group members")
		return
	}
	defer memberRows.Close()

	type Member struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Role      string `json:"role"`
	}

	var members []Member
	for memberRows.Next() {
		var member Member
		err := memberRows.Scan(&member.ID, &member.Email, &member.FirstName, &member.LastName, &member.Role)
		if err != nil {
			fmt.Printf("Error scanning members: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning members")
			return
		}
		members = append(members, member)
	}

	// Include the member data in the response
	groupData := struct {
		Group    ImprovGroup `json:"group"`
		Members  []Member    `json:"members"`
		UserRole string      `json:"userRole"`
	}{
		Group:    group,
		Members:  members,
		UserRole: role,
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    groupData,
	})
}

// Update handles updating a group's information
func (h *GroupHandler) Update(w http.ResponseWriter, r *http.Request) {
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

	if role != auth.RoleAdmin {
		fmt.Printf("User not admin (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins can update the group")
		return
	}

	var groupRequest struct {
		Name        string `json:"name" validate:"required,min=3,max=100"`
		Description string `json:"description" validate:"omitempty,max=500"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&groupRequest); err != nil {
		fmt.Printf("Invalid request payload: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Trim whitespace
	groupRequest.Name = strings.TrimSpace(groupRequest.Name)
	groupRequest.Description = strings.TrimSpace(groupRequest.Description)

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(groupRequest); err != nil {
		validationErrors := err.(validator.ValidationErrors)
		errorMessage := "Validation failed: "
		for _, e := range validationErrors {
			switch e.Field() {
			case "Name":
				if e.Tag() == "required" {
					errorMessage += "Name is required. "
				} else if e.Tag() == "min" {
					errorMessage += "Name must be at least 3 characters. "
				} else if e.Tag() == "max" {
					errorMessage += "Name must be less than 100 characters. "
				}
			case "Description":
				if e.Tag() == "max" {
					errorMessage += "Description must be less than 500 characters. "
				}
			}
		}
		fmt.Printf("Validation error: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, errorMessage)
		return
	}

	// Update the group
	_, err = h.db.Exec(`
		UPDATE improv_groups
		SET name = $1, description = $2
		WHERE id = $3
	`, groupRequest.Name, groupRequest.Description, groupID)
	if err != nil {
		fmt.Printf("Error updating group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating group")
		return
	}

	// Fetch the updated group
	var group ImprovGroup
	err = h.db.QueryRow(`
		SELECT id, name, description, created_at, created_by
		FROM improv_groups
		WHERE id = $1
	`, groupID).Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
	if err != nil {
		fmt.Printf("Error fetching updated group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching updated group")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Group updated successfully",
		Data:    group,
	})
}

// GetLibraryGames handles fetching all games in a group's library
func (h *GroupHandler) GetLibraryGames(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Check if user is a member of the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can add games to the library")
		return
	}

	// Fetch games from the group's library
	rows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.public, g.created_at, g.created_by,
		       CASE WHEN g.created_by = $1 OR g.group_id = $2 THEN true ELSE false END as owned_by_group
		FROM games g
		JOIN group_game_libraries gg ON g.id = gg.game_id
		WHERE gg.group_id = $2
		ORDER BY g.name
	`, user.ID, groupID)
	if err != nil {
		fmt.Printf("Error fetching group library games: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group library games")
		return
	}
	defer rows.Close()

	type LibraryGame struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		MinPlayers  int    `json:"minPlayers"`
		MaxPlayers  int    `json:"maxPlayers"`
		Public      bool   `json:"public"`
		CreatedAt   string `json:"createdAt"`
		CreatedBy   string `json:"createdBy"`
		OwnedByGroup bool  `json:"ownedByGroup"`
	}

	games := []LibraryGame{}

	for rows.Next() {
		var game LibraryGame

		if err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers,
		                  &game.MaxPlayers, &game.Public, &game.CreatedAt, &game.CreatedBy, &game.OwnedByGroup); err != nil {
			fmt.Printf("Error scanning game data: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning game data")
			return
		}

		games = append(games, game)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    games,
	})
}

// GetOwnedGames handles fetching only games owned by the group
func (h *GroupHandler) GetOwnedGames(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Check if user is a member of the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can remove games from the library")
		return
	}

	// Fetch games owned by the group
	rows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.public, g.created_at, g.created_by
		FROM games g
		WHERE g.group_id = $1
		ORDER BY g.name
	`, groupID)
	if err != nil {
		fmt.Printf("Error fetching group owned games: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group owned games")
		return
	}
	defer rows.Close()

	type OwnedGame struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		MinPlayers  int    `json:"minPlayers"`
		MaxPlayers  int    `json:"maxPlayers"`
		Public      bool   `json:"public"`
		CreatedAt   string `json:"createdAt"`
		CreatedBy   string `json:"createdBy"`
	}

	games := []OwnedGame{}

	for rows.Next() {
		var game OwnedGame

		if err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers,
		                  &game.MaxPlayers, &game.Public, &game.CreatedAt, &game.CreatedBy); err != nil {
			fmt.Printf("Error scanning game data: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning game data")
			return
		}

		games = append(games, game)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    games,
	})
}

// AddGameToLibrary handles adding a game to a group's library
func (h *GroupHandler) AddGameToLibrary(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]
	gameID := vars["gameId"]

	// Check if user has admin or organizer role in the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can add games to the library")
		return
	}

	// Check if the game exists
	var gameExists bool
	err = h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM games WHERE id = $1)
	`, gameID).Scan(&gameExists)
	if err != nil {
		fmt.Printf("Error checking game existence: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking game existence")
		return
	}

	if !gameExists {
		fmt.Printf("Game not found: %s\n", gameID)
		RespondWithError(w, http.StatusNotFound, "Game not found")
		return
	}

	// Check if the game is already in the library
	var inLibrary bool
	err = h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_game_libraries WHERE group_id = $1 AND game_id = $2)
	`, groupID, gameID).Scan(&inLibrary)
	if err != nil {
		fmt.Printf("Error checking library: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking library")
		return
	}

	if inLibrary {
		fmt.Printf("Game %s already in library for group %s\n", gameID, groupID)
		RespondWithJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Message: "Game is already in the library",
		})
		return
	}

	// Add the game to the library
	_, err = h.db.Exec(`
		INSERT INTO group_game_libraries (group_id, game_id, added_by)
		VALUES ($1, $2, $3)
	`, groupID, gameID, user.ID)
	if err != nil {
		fmt.Printf("Error adding game to library: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error adding game to library")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Game added to library successfully",
	})
}

// RemoveGameFromLibrary handles removing a game from a group's library
func (h *GroupHandler) RemoveGameFromLibrary(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]
	gameID := vars["gameId"]

	// Check if user has admin or organizer role in the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can remove games from the library")
		return
	}

	// Check if the game is in the library
	var inLibrary bool
	err = h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_game_libraries WHERE group_id = $1 AND game_id = $2)
	`, groupID, gameID).Scan(&inLibrary)
	if err != nil {
		fmt.Printf("Error checking library: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking library")
		return
	}

	if !inLibrary {
		fmt.Printf("Game %s not in library for group %s\n", gameID, groupID)
		RespondWithJSON(w, http.StatusOK, ApiResponse{
			Success: true,
			Message: "Game is not in the library",
		})
		return
	}

	// Remove the game from the library
	_, err = h.db.Exec(`
		DELETE FROM group_game_libraries
		WHERE group_id = $1 AND game_id = $2
	`, groupID, gameID)
	if err != nil {
		fmt.Printf("Error removing game from library: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error removing game from library")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Game removed from library successfully",
	})
}

// ListMembers handles fetching all members of a group
func (h *GroupHandler) ListMembers(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Check if user is a member of the group
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

	// Get members
	memberRows, err := h.db.Query(`
		SELECT u.id, u.email, u.first_name, u.last_name, gm.role
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = $1
		ORDER BY gm.role, u.first_name, u.last_name
	`, groupID)
	if err != nil {
		fmt.Printf("Error fetching group members: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group members")
		return
	}
	defer memberRows.Close()

	type Member struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Role      string `json:"role"`
	}

	var members []Member
	for memberRows.Next() {
		var member Member
		err := memberRows.Scan(&member.ID, &member.Email, &member.FirstName, &member.LastName, &member.Role)
		if err != nil {
			fmt.Printf("Error scanning members: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning members")
			return
		}
		members = append(members, member)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    members,
	})
}

// UpdateMemberRole handles updating a member's role
func (h *GroupHandler) UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]
	targetUserID := vars["userId"]

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

	if role != auth.RoleAdmin {
		fmt.Printf("User not admin (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins can update member roles")
		return
	}

	var roleRequest struct {
		Role string `json:"role" validate:"required,oneof=member admin organizer"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&roleRequest); err != nil {
		fmt.Printf("Invalid request payload: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(roleRequest); err != nil {
		fmt.Printf("Invalid role: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid role")
		return
	}

	// Check if the target user is a member
	var isMember bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1
			FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, targetUserID).Scan(&isMember)
	if err != nil {
		fmt.Printf("Error checking membership: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
		return
	}

	if !isMember {
		fmt.Printf("User %s is not a member of group %s\n", targetUserID, groupID)
		RespondWithError(w, http.StatusNotFound, "User is not a member of this group")
		return
	}

	// Prevent removing the last admin
	if roleRequest.Role != auth.RoleAdmin {
		var adminCount int
		err = h.db.QueryRow(`
			SELECT COUNT(*)
			FROM group_members
			WHERE group_id = $1 AND role = $2
		`, groupID, auth.RoleAdmin).Scan(&adminCount)
		if err != nil {
			fmt.Printf("Error counting admins: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error checking admin count")
			return
		}

		var currentRole string
		err = h.db.QueryRow(`
			SELECT role
			FROM group_members
			WHERE group_id = $1 AND user_id = $2
		`, groupID, targetUserID).Scan(&currentRole)
		if err != nil {
			fmt.Printf("Error checking current role: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error checking current role")
			return
		}

		if adminCount == 1 && currentRole == auth.RoleAdmin {
			fmt.Printf("Cannot remove last admin from group %s\n", groupID)
			RespondWithError(w, http.StatusBadRequest, "Cannot remove the last admin")
			return
		}
	}

	// Update the member's role
	_, err = h.db.Exec(`
		UPDATE group_members
		SET role = $1
		WHERE group_id = $2 AND user_id = $3
	`, roleRequest.Role, groupID, targetUserID)
	if err != nil {
		fmt.Printf("Error updating member role: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating member role")
		return
	}

	// Get the updated member information
	var member struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"firstName"`
		LastName  string `json:"lastName"`
		Role      string `json:"role"`
	}
	err = h.db.QueryRow(`
		SELECT u.id, u.email, u.first_name, u.last_name, gm.role
		FROM group_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.group_id = $1 AND gm.user_id = $2
	`, groupID, targetUserID).Scan(&member.ID, &member.Email, &member.FirstName, &member.LastName, &member.Role)
	if err != nil {
		fmt.Printf("Error fetching updated member: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching updated member")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Member role updated successfully",
		Data:    member,
	})
}

// RemoveMember handles removing a member from a group
func (h *GroupHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]
	targetUserID := vars["userId"]

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

	// Allow users to remove themselves, otherwise require admin privileges
	if targetUserID != user.ID && role != auth.RoleAdmin {
		fmt.Printf("User %s with role %s attempted to remove user %s\n", user.ID, role, targetUserID)
		RespondWithError(w, http.StatusForbidden, "Only admins can remove other members")
		return
	}

	// Check if the target user is a member
	var isMember bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1
			FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, targetUserID).Scan(&isMember)
	if err != nil {
		fmt.Printf("Error checking membership: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
		return
	}

	if !isMember {
		fmt.Printf("User %s is not a member of group %s\n", targetUserID, groupID)
		RespondWithError(w, http.StatusNotFound, "User is not a member of this group")
		return
	}

	// Prevent removing the last admin
	var targetRole string
	err = h.db.QueryRow(`
		SELECT role
		FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, targetUserID).Scan(&targetRole)
	if err != nil {
		fmt.Printf("Error checking target role: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking target role")
		return
	}

	if targetRole == auth.RoleAdmin {
		var adminCount int
		err = h.db.QueryRow(`
			SELECT COUNT(*)
			FROM group_members
			WHERE group_id = $1 AND role = $2
		`, groupID, auth.RoleAdmin).Scan(&adminCount)
		if err != nil {
			fmt.Printf("Error counting admins: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error checking admin count")
			return
		}

		if adminCount == 1 {
			fmt.Printf("Cannot remove last admin from group %s\n", groupID)
			RespondWithError(w, http.StatusBadRequest, "Cannot remove the last admin")
			return
		}
	}

	// Remove the member
	_, err = h.db.Exec(`
		DELETE FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, targetUserID)
	if err != nil {
		fmt.Printf("Error removing member: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error removing member")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Member removed successfully",
	})
}

// GroupInviteLink represents an invite link for a group
type GroupInviteLink struct {
	ID          string    `json:"id"`
	GroupID     string    `json:"groupId"`
	Description string    `json:"description"`
	Code        string    `json:"code"`
	ExpiresAt   string    `json:"expiresAt"`
	Active      bool      `json:"active"`
	CreatedBy   string    `json:"createdBy"`
	CreatedAt   string    `json:"createdAt"`
}

// CreateInviteLink handles creating a new invite link for a group
func (h *GroupHandler) CreateInviteLink(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Check if user has admin or organizer role in the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can create invite links")
		return
	}

	var inviteRequest struct {
		Description string `json:"description" validate:"required,max=100"`
		ExpiresAt   string `json:"expiresAt" validate:"required"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&inviteRequest); err != nil {
		fmt.Printf("Invalid request payload: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Trim whitespace
	inviteRequest.Description = strings.TrimSpace(inviteRequest.Description)

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(inviteRequest); err != nil {
		fmt.Printf("Validation error: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request data")
		return
	}

	// Generate a unique code
	code := uuid.New().String()[:8]

	// Create the invite link
	inviteLinkID := uuid.New().String()
	_, err = h.db.Exec(`
		INSERT INTO group_invite_links (id, group_id, description, code, expires_at, active, created_by)
		VALUES ($1, $2, $3, $4, $5, true, $6)
	`, inviteLinkID, groupID, inviteRequest.Description, code, inviteRequest.ExpiresAt, user.ID)
	if err != nil {
		fmt.Printf("Error creating invite link: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error creating invite link")
		return
	}

	// Get the created invite link
	var inviteLink GroupInviteLink
	err = h.db.QueryRow(`
		SELECT id, group_id, description, code, expires_at, active, created_by, created_at
		FROM group_invite_links
		WHERE id = $1
	`, inviteLinkID).Scan(
		&inviteLink.ID, &inviteLink.GroupID, &inviteLink.Description,
		&inviteLink.Code, &inviteLink.ExpiresAt, &inviteLink.Active,
		&inviteLink.CreatedBy, &inviteLink.CreatedAt,
	)
	if err != nil {
		fmt.Printf("Error fetching created invite link: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching created invite link")
		return
	}

	RespondWithJSON(w, http.StatusCreated, ApiResponse{
		Success: true,
		Message: "Invite link created successfully",
		Data:    inviteLink,
	})
}

// ListInviteLinks handles fetching all invite links for a group
func (h *GroupHandler) ListInviteLinks(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	// Check if user has admin or organizer role in the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can view invite links")
		return
	}

	// Fetch all invite links for the group
	rows, err := h.db.Query(`
		SELECT id, group_id, description, code, expires_at, active, created_by, created_at
		FROM group_invite_links
		WHERE group_id = $1
		ORDER BY created_at DESC
	`, groupID)
	if err != nil {
		fmt.Printf("Error fetching invite links: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching invite links")
		return
	}
	defer rows.Close()

	inviteLinks := []GroupInviteLink{}
	for rows.Next() {
		var link GroupInviteLink
		err := rows.Scan(
			&link.ID, &link.GroupID, &link.Description,
			&link.Code, &link.ExpiresAt, &link.Active,
			&link.CreatedBy, &link.CreatedAt,
		)
		if err != nil {
			fmt.Printf("Error scanning invite link: %v\n", err)
			RespondWithError(w, http.StatusInternalServerError, "Error scanning invite link")
			return
		}
		inviteLinks = append(inviteLinks, link)
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    inviteLinks,
	})
}

// UpdateInviteLinkStatus handles updating the active status of an invite link
func (h *GroupHandler) UpdateInviteLinkStatus(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	groupID := vars["id"]
	linkID := vars["linkId"]

	// Check if user has admin or organizer role in the group
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

	if role != auth.RoleAdmin && role != auth.RoleOrganizer {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can update invite links")
		return
	}

	var statusRequest struct {
		Active bool `json:"active"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&statusRequest); err != nil {
		fmt.Printf("Invalid request payload: %v\n", err)
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Update the invite link status
	_, err = h.db.Exec(`
		UPDATE group_invite_links
		SET active = $1
		WHERE id = $2 AND group_id = $3
	`, statusRequest.Active, linkID, groupID)
	if err != nil {
		fmt.Printf("Error updating invite link status: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error updating invite link status")
		return
	}

	// Get the updated invite link
	var inviteLink GroupInviteLink
	err = h.db.QueryRow(`
		SELECT id, group_id, description, code, expires_at, active, created_by, created_at
		FROM group_invite_links
		WHERE id = $1
	`, linkID).Scan(
		&inviteLink.ID, &inviteLink.GroupID, &inviteLink.Description,
		&inviteLink.Code, &inviteLink.ExpiresAt, &inviteLink.Active,
		&inviteLink.CreatedBy, &inviteLink.CreatedAt,
	)
	if err != nil {
		fmt.Printf("Error fetching updated invite link: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching updated invite link")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Invite link status updated successfully",
		Data:    inviteLink,
	})
}

// JoinViaInviteLink handles processing a join request through an invite link
func (h *GroupHandler) JoinViaInviteLink(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	vars := mux.Vars(r)
	code := vars["code"]

	// Find the invite link by code
	var linkID, groupID string
	var active bool
	var expiresAt string
	err := h.db.QueryRow(`
		SELECT id, group_id, active, expires_at
		FROM group_invite_links
		WHERE code = $1
	`, code).Scan(&linkID, &groupID, &active, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("Invalid invite code: %s\n", code)
			RespondWithError(w, http.StatusNotFound, "Invalid invite code")
			return
		}
		fmt.Printf("Error finding invite link: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error finding invite link")
		return
	}

	// Check if the link is active
	if !active {
		fmt.Printf("Invite link is inactive: %s\n", linkID)
		RespondWithError(w, http.StatusForbidden, "This invite link is no longer active")
		return
	}

	// Check if the link has expired
	var expired bool
	err = h.db.QueryRow(`
		SELECT expires_at < datetime('now')
		FROM group_invite_links
		WHERE id = $1
	`, linkID).Scan(&expired)
	if err != nil {
		fmt.Printf("Error checking link expiration: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking link expiration")
		return
	}

	if expired {
		fmt.Printf("Invite link has expired: %s\n", linkID)
		RespondWithError(w, http.StatusForbidden, "This invite link has expired")
		return
	}

	// Check if user is already a member
	var isMember bool
	err = h.db.QueryRow(`
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

	// Add user to the group as a member
	_, err = h.db.Exec(`
		INSERT INTO group_members (group_id, user_id, role)
		VALUES ($1, $2, 'member')
	`, groupID, user.ID)
	if err != nil {
		fmt.Printf("Error adding member: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error adding you to the group")
		return
	}

	// Get the group info
	var group ImprovGroup
	err = h.db.QueryRow(`
		SELECT id, name, description, created_at, created_by
		FROM improv_groups
		WHERE id = $1
	`, groupID).Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
	if err != nil {
		fmt.Printf("Error fetching group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group information")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: fmt.Sprintf("You have successfully joined %s", group.Name),
		Data:    group,
	})
}

// VerifyInviteLink handles verifying an invite link without joining
func (h *GroupHandler) VerifyInviteLink(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	code := vars["code"]

	// Find the invite link by code
	var linkID, groupID string
	var active bool
	var expiresAt string
	err := h.db.QueryRow(`
		SELECT id, group_id, active, expires_at
		FROM group_invite_links
		WHERE code = $1
	`, code).Scan(&linkID, &groupID, &active, &expiresAt)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("Invalid invite code: %s\n", code)
			RespondWithError(w, http.StatusNotFound, "Invalid invite code")
			return
		}
		fmt.Printf("Error finding invite link: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error finding invite link")
		return
	}

	// Check if the link is active
	if !active {
		fmt.Printf("Invite link is inactive: %s\n", linkID)
		RespondWithError(w, http.StatusForbidden, "This invite link is no longer active")
		return
	}

	// Check if the link has expired
	var expired bool
	err = h.db.QueryRow(`
		SELECT expires_at < datetime('now')
		FROM group_invite_links
		WHERE id = $1
	`, linkID).Scan(&expired)
	if err != nil {
		fmt.Printf("Error checking link expiration: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking link expiration")
		return
	}

	if expired {
		fmt.Printf("Invite link has expired: %s\n", linkID)
		RespondWithError(w, http.StatusForbidden, "This invite link has expired")
		return
	}

	// Get the group info
	var group ImprovGroup
	err = h.db.QueryRow(`
		SELECT id, name, description, created_at, created_by
		FROM improv_groups
		WHERE id = $1
	`, groupID).Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
	if err != nil {
		fmt.Printf("Error fetching group: %v\n", err)
		RespondWithError(w, http.StatusInternalServerError, "Error fetching group information")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Data:    group,
	})
}
