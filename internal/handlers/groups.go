package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"improv-app/internal/middleware"
	"improv-app/internal/models"

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
		RespondWithError(w, http.StatusInternalServerError, "Error creating group")
		return
	}

	// Add creator as admin
	_, err = h.db.Exec(`
	INSERT INTO group_members (group_id, user_id, role)
	VALUES ($1, $2, 'admin')
`, groupID, user.ID)
	if err != nil {
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
		RespondWithError(w, http.StatusInternalServerError, "Error fetching groups")
		return
	}
	defer rows.Close()

	groups := []ImprovGroup{}
	for rows.Next() {
		var group ImprovGroup
		err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
		if err != nil {
			RespondWithError(w, http.StatusInternalServerError, "Error scanning groups")
			return
		}
		groups = append(groups, group)
	}
	fmt.Println(groups)
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
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	if role != "admin" {
		RespondWithError(w, http.StatusForbidden, "Only admins can update the group")
		return
	}

	var groupRequest struct {
		Name        string `json:"name" validate:"required,min=3,max=100"`
		Description string `json:"description" validate:"omitempty,max=500"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&groupRequest); err != nil {
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
		fmt.Println(err)
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	if role != "admin" && role != "organizer" {
		fmt.Println("User is not an admin or organizer")
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can manage the group library")
		return
	}

	// Check if the game exists
	var gameExists bool
	err = h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM games WHERE id = $1)
	`, gameID).Scan(&gameExists)
	if err != nil {
		fmt.Println(err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking game existence")
		return
	}

	if !gameExists {
		fmt.Println("Game not found")
		RespondWithError(w, http.StatusNotFound, "Game not found")
		return
	}

	// Check if the game is already in the library
	var inLibrary bool
	err = h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_game_libraries WHERE group_id = $1 AND game_id = $2)
	`, groupID, gameID).Scan(&inLibrary)
	if err != nil {
		fmt.Println(err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking library")
		return
	}

	if inLibrary {
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
		log.Printf("Error adding game %s to library for group %s: %v", gameID, groupID, err)
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
		log.Printf("Error checking member role for user %s in group %s: %v", user.ID, groupID, err)
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	if role != "admin" && role != "organizer" {
		log.Printf("User %s with role %s attempted to remove game %s from group %s library",
			user.ID, role, gameID, groupID)
		RespondWithError(w, http.StatusForbidden, "Only admins and organizers can manage the group library")
		return
	}

	// Check if the game is in the library
	var inLibrary bool
	err = h.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM group_game_libraries WHERE group_id = $1 AND game_id = $2)
	`, groupID, gameID).Scan(&inLibrary)
	if err != nil {
		log.Printf("Error checking if game %s is in library for group %s: %v", gameID, groupID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error checking library")
		return
	}

	if !inLibrary {
		log.Printf("Game %s not found in library for group %s", gameID, groupID)
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
		log.Printf("Error removing game %s from library for group %s: %v", gameID, groupID, err)
		RespondWithError(w, http.StatusInternalServerError, "Error removing game from library")
		return
	}

	log.Printf("Successfully removed game %s from library for group %s", gameID, groupID)
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

// AddMember handles adding a new member to a group
func (h *GroupHandler) AddMember(w http.ResponseWriter, r *http.Request) {
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
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	if role != "admin" {
		RespondWithError(w, http.StatusForbidden, "Only admins can add members")
		return
	}

	var memberRequest struct {
		Email string `json:"email" validate:"required,email"`
		Role  string `json:"role" validate:"required,oneof=member admin organizer"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&memberRequest); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(memberRequest); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid member data")
		return
	}

	// Check if the user exists
	var userID string
	err = h.db.QueryRow(`
		SELECT id
		FROM users
		WHERE email = $1
	`, memberRequest.Email).Scan(&userID)
	if err == sql.ErrNoRows {
		RespondWithError(w, http.StatusNotFound, "User not found")
		return
	} else if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error checking user")
		return
	}

	// Check if the user is already a member
	var isMember bool
	err = h.db.QueryRow(`
		SELECT EXISTS(
			SELECT 1
			FROM group_members
			WHERE group_id = $1 AND user_id = $2
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
		return
	}

	if isMember {
		RespondWithError(w, http.StatusBadRequest, "User is already a member of this group")
		return
	}

	// Add the user to the group
	_, err = h.db.Exec(`
		INSERT INTO group_members (group_id, user_id, role)
		VALUES ($1, $2, $3)
	`, groupID, userID, memberRequest.Role)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error adding member")
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
	`, groupID, userID).Scan(&member.ID, &member.Email, &member.FirstName, &member.LastName, &member.Role)
	if err != nil {
		RespondWithError(w, http.StatusInternalServerError, "Error fetching added member")
		return
	}

	RespondWithJSON(w, http.StatusCreated, ApiResponse{
		Success: true,
		Message: "Member added successfully",
		Data:    member,
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
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	if role != "admin" {
		RespondWithError(w, http.StatusForbidden, "Only admins can update member roles")
		return
	}

	var roleRequest struct {
		Role string `json:"role" validate:"required,oneof=member admin organizer"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&roleRequest); err != nil {
		RespondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// Validate the request
	validate := validator.New()
	if err := validate.Struct(roleRequest); err != nil {
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
		RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
		return
	}

	if !isMember {
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
			RespondWithError(w, http.StatusInternalServerError, "Error checking current role")
			return
		}

		if adminCount == 1 && currentRole == "admin" {
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
		RespondWithError(w, http.StatusForbidden, "Not a member of this group")
		return
	}

	// Allow users to remove themselves, otherwise require admin privileges
	if targetUserID != user.ID && role != "admin" {
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
		RespondWithError(w, http.StatusInternalServerError, "Error checking membership")
		return
	}

	if !isMember {
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
			RespondWithError(w, http.StatusInternalServerError, "Error checking admin count")
			return
		}

		if adminCount == 1 {
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
		RespondWithError(w, http.StatusInternalServerError, "Error removing member")
		return
	}

	RespondWithJSON(w, http.StatusOK, ApiResponse{
		Success: true,
		Message: "Member removed successfully",
	})
}
