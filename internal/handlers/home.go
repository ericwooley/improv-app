package handlers

import (
	"database/sql"
	"net/http"

	"improv-app/internal/middleware"
	"improv-app/internal/models"
)
type HomeHandler struct {
	db *sql.DB
}

func NewHomeHandler(db *sql.DB) *HomeHandler {
	return &HomeHandler{db: db}
}

func (h *HomeHandler) Home(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value(middleware.UserContextKey).(*models.User)
	data := models.PageData{
		User:  user,
		Data:  nil,
		Title: "Home",
	}
	RenderTemplateWithLayout(w, &data, "templates/home.html")
}
