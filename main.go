package main

import (
	"database/sql"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

var db *sql.DB
var templates *template.Template
var titleCaser = cases.Title(language.English)

type PageData struct {
	Title string
}

func initTemplates() {
	// Create a new template set
	templates = template.New("")

	// Load all template files from the templates directory
	err := filepath.Walk("templates", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(path, ".html") {
			_, err = templates.ParseFiles(path)
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		log.Fatal(err)
	}
}

func pageHandler(w http.ResponseWriter, r *http.Request) {
	// Get the path from the URL
	path := r.URL.Path
	if path == "/" {
		path = "/home"
	}

	// Remove leading slash and add .html
	templateName := strings.TrimPrefix(path, "/") + ".html"

	// Check if the template exists
	if templates.Lookup(templateName) == nil {
		http.Error(w, "Page not found", http.StatusNotFound)
		return
	}

	// Create page data
	data := PageData{
		Title: titleCaser.String(strings.TrimPrefix(path, "/")),
	}

	// Execute the template
	err := templates.ExecuteTemplate(w, templateName, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", 500)
		return
	}
	_, err = db.Exec("insert into users (username, password) VALUES (?, ?)", username, hashed)
	if err != nil {
		http.Error(w, "Error creating user", 500)
		return
	}
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func main() {
	db = initDB()
	defer db.Close()

	initTemplates()

	r := mux.NewRouter()

	// Handle all GET requests with the dynamic page handler
	r.HandleFunc("/{page}", pageHandler).Methods("GET")
	r.HandleFunc("/", pageHandler).Methods("GET")

	// Handle POST requests
	r.HandleFunc("/register", registerHandler).Methods("POST")

	port := ":4080"
	log.Printf("Starting on port http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, r))
}

/*


func loginHandler(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("username")
	password := r.FormValue("password")

	var hashed string
	err := db.QueryRow("SELECT password FROM users WHERE username = ?", username).Scan(&hashed)
	if err != nil {
		http.Error(w, "User not found", 404)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
	if err != nil {
		http.Error(w, "Invalid password", 401)
		return
	}

	fmt.Fprintf(w, "Welcome, %s!", username)
}
*/

/*
func main() {
	db = initDB()
	defer db.Close()

	r := mux.NewRouter()
	r.HandleFunc("/register", registerHandler).Methods("POST")
	r.HandleFunc("/login", loginHandler).Methods("POST")
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static/")))

	log.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
*/
