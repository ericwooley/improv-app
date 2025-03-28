package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
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
		LEFT JOIN group_game_libraries gg ON g.id = gg.game_id
		WHERE gg.group_id = $2 OR g.public = true
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
