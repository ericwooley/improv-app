package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"improv-app/internal/middleware"
	"improv-app/internal/models"
	"improv-app/internal/services"

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
	VALUES ($1, $2, 'admin')
`, groupID, user.ID)
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
		fmt.Printf("User not a member of group: %v\n", err)
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
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

	if role != "admin" {
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

	if role != "admin" && role != "organizer" {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can manage the group library")
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

	if role != "admin" && role != "organizer" {
		fmt.Printf("User not admin or organizer (role=%s)\n", role)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can manage the group library")
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

	if role != "admin" {
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
	if roleRequest.Role != "admin" {
		var adminCount int
		err = h.db.QueryRow(`
			SELECT COUNT(*)
			FROM group_members
			WHERE group_id = $1 AND role = 'admin'
		`, groupID).Scan(&adminCount)
		if err != nil {
			fmt.Printf("Error checking admin count: %v\n", err)
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

		if adminCount == 1 && currentRole == "admin" {
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
	if targetUserID != user.ID && role != "admin" {
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

	if targetRole == "admin" {
		var adminCount int
		err = h.db.QueryRow(`
			SELECT COUNT(*)
			FROM group_members
			WHERE group_id = $1 AND role = 'admin'
		`, groupID).Scan(&adminCount)
		if err != nil {
			fmt.Printf("Error checking admin count: %v\n", err)
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

// InviteMember handles sending an invitation to join a group
func (h *GroupHandler) InviteMember(w http.ResponseWriter, r *http.Request) {
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
func (h *GroupHandler) VerifyInvitation(w http.ResponseWriter, r *http.Request) {
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
func (h *GroupHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
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
func (h *GroupHandler) ListInvitations(w http.ResponseWriter, r *http.Request) {
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
