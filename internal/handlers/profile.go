package handlers

import (
	"database/sql"
	"html/template"
	"improv-app/internal/middleware"
	"improv-app/internal/models"
	"net/http"
)

type ProfileHandler struct {
	db *sql.DB
}

func NewProfileHandler(db *sql.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

func (h *ProfileHandler) Update(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	firstName := r.FormValue("first_name")
	lastName := r.FormValue("last_name")

	// Initialize errors map
	errors := make(map[string]string)

	// Validate input
	if len(firstName) == 0 {
		errors["FirstName"] = "First name is required"
	} else if len(firstName) > 50 {
		errors["FirstName"] = "First name must be less than 50 characters"
	}

	if len(lastName) == 0 {
		errors["LastName"] = "Last name is required"
	} else if len(lastName) > 50 {
		errors["LastName"] = "Last name must be less than 50 characters"
	}

	// If there are validation errors
	if len(errors) > 0 {
		data := models.PageData{
			Title:  "Profile",
			User:   user,
			Errors: errors,
		}

		t, _ := template.ParseFiles("templates/partials/profile_form.html")
		t.Execute(w, data)
		return
	}

	_, err := h.db.Exec("UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3", firstName, lastName, user.ID)
	if err != nil {
		data := models.PageData{
			Title: "Profile",
			User:  user,
			Error: "Error updating profile",
		}

		t, _ := template.ParseFiles("templates/partials/profile_form.html")
		t.Execute(w, data)
		return
	}

	// Update user in context
	user.FirstName = firstName
	user.LastName = lastName
	data := models.PageData{
		Title:   "Profile",
		User:    user,
		Success: "Profile updated successfully!",
	}
	t, _ := template.ParseFiles("templates/partials/profile_form.html")
	t.Execute(w, data)
}

func (h *ProfileHandler) Profile(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	data := models.PageData{
		Title: "Profile",
		User:  user,
	}
	RenderTemplateWithLayout(w, &data, "templates/profile.html")
}

func (h *ProfileHandler) Form(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)

	data := models.PageData{
		Title: "Profile",
		User:  user,
	}

	t, _ := template.ParseFiles("templates/partials/profile_form.html")
	t.Execute(w, data)
}
