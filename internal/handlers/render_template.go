package handlers

import (
	"html/template"
	"improv-app/internal/models"
	"net/http"
)

func RenderTemplate(w http.ResponseWriter, templatePath string, data *models.PageData) {
	t, _ := template.ParseFiles("templates/layouts/base.html", templatePath)
	t.ExecuteTemplate(w, t.Name(), data)
}
