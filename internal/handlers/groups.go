package handlers

import (
	"database/sql"
	"net/http"

	"improv-app/internal/middleware"
	"improv-app/internal/models"

	"github.com/gorilla/mux"
)

type GroupHandler struct {
	db        *sql.DB
}

func NewGroupHandler(db *sql.DB) *GroupHandler {
	return &GroupHandler{
		db:        db,
	}
}

func (h *GroupHandler) List(w http.ResponseWriter, r *http.Request) {
		user := r.Context().Value(middleware.UserContextKey).(*models.User)

	if r.Method == "POST" {
		name := r.FormValue("name")
		description := r.FormValue("description")

		var groupID string
		err := h.db.QueryRow(`
			INSERT INTO improv_groups (name, description, created_by)
			VALUES ($1, $2, $3)
			RETURNING id
		`, name, description, user.ID).Scan(&groupID)
		if err != nil {
			http.Error(w, "Error creating group", http.StatusInternalServerError)
			return
		}

		// Add creator as admin
		_, err = h.db.Exec(`
			INSERT INTO group_members (group_id, user_id, role)
			VALUES ($1, $2, 'admin')
		`, groupID, user.ID)
		if err != nil {
			http.Error(w, "Error adding group member", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/groups/"+groupID, http.StatusSeeOther)
		return
	}

	// GET: List groups
	rows, err := h.db.Query(`
		SELECT g.id, g.name, g.description, g.created_at, g.created_by
		FROM improv_groups g
		JOIN group_members m ON g.id = m.group_id
		WHERE m.user_id = $1
		ORDER BY g.created_at DESC
	`, user.ID)
	if err != nil {
		http.Error(w, "Error fetching groups", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groups []ImprovGroup
	for rows.Next() {
		var group ImprovGroup
		err := rows.Scan(&group.ID, &group.Name, &group.Description, &group.CreatedAt, &group.CreatedBy)
		if err != nil {
			http.Error(w, "Error scanning groups", http.StatusInternalServerError)
			return
		}
		groups = append(groups, group)
	}

	data := models.PageData{
		Title: "Groups",
		User:  user,
		Data:  groups,
	}
	RenderTemplateWithLayout(w, &data, "templates/groups.html")
}

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
		http.Error(w, "Group not found", http.StatusNotFound)
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
		http.Error(w, "Not a member of this group", http.StatusForbidden)
		return
	}

	data := models.PageData{
		Title: group.Name,
		User:  user,
		Data:  group,
	}
	RenderTemplateWithLayout(w, &data, "templates/group.html")
}
