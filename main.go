package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

var db *sql.DB
var templates *template.Template
var titleCaser = cases.Title(language.English)
var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_SECRET")))

type PageData struct {
	Title   string
	Error   string
	Success string
	User    *User
	Data    interface{}
}

type User struct {
	ID        string
	Email     string
	FirstName string
	LastName  string
}

type ImprovGroup struct {
	ID          string
	Name        string
	Description string
	CreatedAt   time.Time
	CreatedBy   string
}

type Event struct {
	ID          string
	GroupID     string
	Title       string
	Description string
	Location    string
	StartTime   time.Time
	EndTime     time.Time
	CreatedAt   time.Time
	CreatedBy   string
}

type Game struct {
	ID          string
	Name        string
	Description string
	MinPlayers  int
	MaxPlayers  int
	CreatedAt   time.Time
	CreatedBy   string
	Tags        []string
}

func initTemplates() {
	templates = template.New("").Funcs(template.FuncMap{
		"seq": func(start, end int) []int {
			var result []int
			for i := start; i <= end; i++ {
				result = append(result, i)
			}
			return result
		},
	})
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

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func sendMagicLink(email string, firstName string, lastName string) error {
	token, err := generateToken()
	if err != nil {
		return err
	}

	// Create or update user
	var userID string
	err = db.QueryRow(`
		INSERT INTO users (email, first_name, last_name)
		VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE SET first_name = $2, last_name = $3
		RETURNING id
	`, email, firstName, lastName).Scan(&userID)
	if err != nil {
		return err
	}

	// Create email token
	_, err = db.Exec(`
		INSERT INTO email_tokens (user_id, token, expires_at)
		VALUES ($1, $2, $3)
	`, userID, token, time.Now().Add(24*time.Hour))
	if err != nil {
		return err
	}

	// Send email with magic link
	from := os.Getenv("SMTP_FROM")
	fromName := os.Getenv("SMTP_FROM_NAME")
	if fromName == "" {
		fromName = "Improv App"
	}

	to := os.Getenv("SMTP_TO")
	if to == "" {
		to = email
	}

	subject := "Your Magic Link for Improv App"
	body := fmt.Sprintf(`
		Hello %s %s,

		Click the link below to sign in to your Improv App account:

		http://localhost:4080/auth/verify?token=%s

		This link will expire in 24 hours.

		Best regards,
		%s
	`, firstName, lastName, token, fromName)

	// Set up email message
	msg := []byte(fmt.Sprintf("From: %s <%s>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/plain; charset=UTF-8\r\n"+
		"\r\n"+
		"%s", fromName, from, to, subject, body))

	// Connect to SMTP server
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	username := os.Getenv("SMTP_USERNAME")
	password := os.Getenv("SMTP_PASSWORD")

	fmt.Println(host, port, username, password)
	addr := fmt.Sprintf("%s:%s", host, port)
	auth := smtp.PlainAuth("", username, password, host)

	err = smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("Magic link email sent to %s", email)
	return nil
}

func verifyToken(token string) (*User, error) {
	var user User
	err := db.QueryRow(`
		SELECT u.id, u.email, u.first_name, u.last_name
		FROM users u
		JOIN email_tokens t ON u.id = t.user_id
		WHERE t.token = $1 AND t.used = false AND t.expires_at > NOW()
	`, token).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName)
	if err != nil {
		return nil, err
	}

	// Mark token as used
	_, err = db.Exec("UPDATE email_tokens SET used = true WHERE token = $1", token)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func requireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		session, _ := store.Get(r, "session")
		userID, ok := session.Values["user_id"].(string)
		if !ok {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		var user User
		err := db.QueryRow(`
			SELECT id, email, first_name, last_name
			FROM users
			WHERE id = $1
		`, userID).Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName)
		if err != nil {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}

		ctx := r.Context()
		ctx = context.WithValue(ctx, "user", &user)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func pageHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if path == "/" {
		path = "/home"
	}

	templateName := strings.TrimPrefix(path, "/") + ".html"
	if templates.Lookup(templateName) == nil {
		http.Error(w, "Page not found", http.StatusNotFound)
		return
	}

	data := PageData{
		Title: titleCaser.String(strings.TrimPrefix(path, "/")),
	}

	if user, ok := r.Context().Value("user").(*User); ok {
		data.User = user
	}

	err := templates.ExecuteTemplate(w, templateName, data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		email := r.FormValue("email")
		firstName := r.FormValue("first_name")
		lastName := r.FormValue("last_name")

		err := sendMagicLink(email, firstName, lastName)
		if err != nil {
			data := PageData{
				Title: "Login",
				Error: "Error sending magic link",
			}
			templates.ExecuteTemplate(w, "login.html", data)
			return
		}

		data := PageData{
			Title:   "Login",
			Success: "Magic link sent! Check your email.",
		}
		templates.ExecuteTemplate(w, "login.html", data)
		return
	}

	data := PageData{
		Title: "Login",
	}
	templates.ExecuteTemplate(w, "login.html", data)
}

func verifyHandler(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	user, err := verifyToken(token)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusBadRequest)
		return
	}

	session, _ := store.Get(r, "session")
	session.Values["user_id"] = user.ID
	session.Save(r, w)

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := store.Get(r, "session")
	delete(session.Values, "user_id")
	session.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func groupsHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*User)

	if r.Method == "POST" {
		name := r.FormValue("name")
		description := r.FormValue("description")

		var groupID string
		err := db.QueryRow(`
			INSERT INTO improv_groups (name, description, created_by)
			VALUES ($1, $2, $3)
			RETURNING id
		`, name, description, user.ID).Scan(&groupID)
		if err != nil {
			http.Error(w, "Error creating group", http.StatusInternalServerError)
			return
		}

		// Add creator as admin
		_, err = db.Exec(`
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
	rows, err := db.Query(`
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

	data := PageData{
		Title: "Groups",
		User:  user,
		Data:  groups,
	}
	templates.ExecuteTemplate(w, "groups.html", data)
}

func groupHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	var group ImprovGroup
	err := db.QueryRow(`
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
	err = db.QueryRow(`
		SELECT role
		FROM group_members
		WHERE group_id = $1 AND user_id = $2
	`, groupID, user.ID).Scan(&role)
	if err != nil {
		http.Error(w, "Not a member of this group", http.StatusForbidden)
		return
	}

	data := PageData{
		Title: group.Name,
		User:  user,
		Data:  group,
	}
	templates.ExecuteTemplate(w, "group.html", data)
}

func eventsHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*User)
	vars := mux.Vars(r)
	groupID := vars["id"]

	if r.Method == "POST" {
		title := r.FormValue("title")
		description := r.FormValue("description")
		location := r.FormValue("location")
		startTime, err := time.Parse("2006-01-02T15:04", r.FormValue("start_time"))
		if err != nil {
			http.Error(w, "Invalid start time", http.StatusBadRequest)
			return
		}
		endTime, err := time.Parse("2006-01-02T15:04", r.FormValue("end_time"))
		if err != nil {
			http.Error(w, "Invalid end time", http.StatusBadRequest)
			return
		}

		var eventID string
		err = db.QueryRow(`
			INSERT INTO events (group_id, title, description, location, start_time, end_time, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`, groupID, title, description, location, startTime, endTime, user.ID).Scan(&eventID)
		if err != nil {
			http.Error(w, "Error creating event", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/events/"+eventID, http.StatusSeeOther)
		return
	}

	// GET: List events
	rows, err := db.Query(`
		SELECT id, title, description, location, start_time, end_time, created_at, created_by
		FROM events
		WHERE group_id = $1
		ORDER BY start_time DESC
	`, groupID)
	if err != nil {
		http.Error(w, "Error fetching events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var event Event
		err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy)
		if err != nil {
			http.Error(w, "Error scanning events", http.StatusInternalServerError)
			return
		}
		events = append(events, event)
	}

	data := PageData{
		Title: "Events",
		User:  user,
		Data:  events,
	}
	templates.ExecuteTemplate(w, "events.html", data)
}

func eventHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*User)
	vars := mux.Vars(r)
	eventID := vars["id"]

	var event Event
	err := db.QueryRow(`
		SELECT e.id, e.group_id, e.title, e.description, e.location, e.start_time, e.end_time, e.created_at, e.created_by
		FROM events e
		JOIN group_members m ON e.group_id = m.group_id
		WHERE e.id = $1 AND m.user_id = $2
	`, eventID, user.ID).Scan(&event.ID, &event.GroupID, &event.Title, &event.Description, &event.Location, &event.StartTime, &event.EndTime, &event.CreatedAt, &event.CreatedBy)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Get RSVPs
	rows, err := db.Query(`
		SELECT u.first_name, u.last_name, r.status
		FROM event_rsvps r
		JOIN users u ON r.user_id = u.id
		WHERE r.event_id = $1
	`, eventID)
	if err != nil {
		http.Error(w, "Error fetching RSVPs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type RSVP struct {
		FirstName string
		LastName  string
		Status    string
	}

	var rsvps []RSVP
	for rows.Next() {
		var rsvp RSVP
		err := rows.Scan(&rsvp.FirstName, &rsvp.LastName, &rsvp.Status)
		if err != nil {
			http.Error(w, "Error scanning RSVPs", http.StatusInternalServerError)
			return
		}
		rsvps = append(rsvps, rsvp)
	}

	// Get assigned games
	rows, err = db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, eg.order_index
		FROM event_games eg
		JOIN games g ON eg.game_id = g.id
		WHERE eg.event_id = $1
		ORDER BY eg.order_index
	`, eventID)
	if err != nil {
		http.Error(w, "Error fetching games", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var games []Game
	for rows.Next() {
		var game Game
		var orderIndex int
		err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &orderIndex)
		if err != nil {
			http.Error(w, "Error scanning games", http.StatusInternalServerError)
			return
		}
		games = append(games, game)
	}

	data := PageData{
		Title: event.Title,
		User:  user,
		Data: struct {
			Event Event
			RSVPs []RSVP
			Games []Game
		}{
			Event: event,
			RSVPs: rsvps,
			Games: games,
		},
	}
	templates.ExecuteTemplate(w, "event.html", data)
}

func gamesHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*User)

	if r.Method == "POST" {
		name := r.FormValue("name")
		description := r.FormValue("description")
		minPlayers, err := strconv.Atoi(r.FormValue("min_players"))
		if err != nil {
			http.Error(w, "Invalid min players", http.StatusBadRequest)
			return
		}
		maxPlayers, err := strconv.Atoi(r.FormValue("max_players"))
		if err != nil {
			http.Error(w, "Invalid max players", http.StatusBadRequest)
			return
		}

		var gameID string
		err = db.QueryRow(`
			INSERT INTO games (name, description, min_players, max_players, created_by)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id
		`, name, description, minPlayers, maxPlayers, user.ID).Scan(&gameID)
		if err != nil {
			http.Error(w, "Error creating game", http.StatusInternalServerError)
			return
		}

		// Handle tags
		tags := strings.Split(r.FormValue("tags"), ",")
		for _, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag == "" {
				continue
			}

			var tagID string
			err = db.QueryRow(`
				INSERT INTO game_tags (name)
				VALUES ($1)
				ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
				RETURNING id
			`, tag).Scan(&tagID)
			if err != nil {
				http.Error(w, "Error creating tag", http.StatusInternalServerError)
				return
			}

			_, err = db.Exec(`
				INSERT INTO game_tag_associations (game_id, tag_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`, gameID, tagID)
			if err != nil {
				http.Error(w, "Error associating tag", http.StatusInternalServerError)
				return
			}
		}

		http.Redirect(w, r, "/games/"+gameID, http.StatusSeeOther)
		return
	}

	// GET: List games
	rows, err := db.Query(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by,
		       array_agg(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		GROUP BY g.id
		ORDER BY g.created_at DESC
	`)
	if err != nil {
		http.Error(w, "Error fetching games", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var games []Game
	for rows.Next() {
		var game Game
		var tags []string
		err := rows.Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &tags)
		if err != nil {
			http.Error(w, "Error scanning games", http.StatusInternalServerError)
			return
		}
		game.Tags = tags
		games = append(games, game)
	}

	data := PageData{
		Title: "Games",
		User:  user,
		Data:  games,
	}
	templates.ExecuteTemplate(w, "games.html", data)
}

func gameHandler(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("user").(*User)
	vars := mux.Vars(r)
	gameID := vars["id"]

	var game Game
	err := db.QueryRow(`
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by,
		       array_agg(DISTINCT t.name) as tags
		FROM games g
		LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
		LEFT JOIN game_tags t ON gta.tag_id = t.id
		WHERE g.id = $1
		GROUP BY g.id
	`, gameID).Scan(&game.ID, &game.Name, &game.Description, &game.MinPlayers, &game.MaxPlayers, &game.CreatedAt, &game.CreatedBy, &game.Tags)
	if err != nil {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Get user's rating
	var rating int
	err = db.QueryRow(`
		SELECT rating
		FROM user_game_preferences
		WHERE user_id = $1 AND game_id = $2
	`, user.ID, gameID).Scan(&rating)
	if err != nil && err != sql.ErrNoRows {
		http.Error(w, "Error fetching rating", http.StatusInternalServerError)
		return
	}

	data := PageData{
		Title: game.Name,
		User:  user,
		Data: struct {
			Game   Game
			Rating int
		}{
			Game:   game,
			Rating: rating,
		},
	}
	templates.ExecuteTemplate(w, "game.html", data)
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	db = initDB()
	defer db.Close()

	initTemplates()

	r := mux.NewRouter()

	// Auth routes
	r.HandleFunc("/login", loginHandler).Methods("GET", "POST")
	r.HandleFunc("/auth/verify", verifyHandler).Methods("GET")
	r.HandleFunc("/logout", logoutHandler).Methods("POST")

	// Protected routes
	r.HandleFunc("/groups", requireAuth(groupsHandler)).Methods("GET", "POST")
	r.HandleFunc("/groups/{id}", requireAuth(groupHandler)).Methods("GET")
	r.HandleFunc("/groups/{id}/events", requireAuth(eventsHandler)).Methods("GET", "POST")
	r.HandleFunc("/events/{id}", requireAuth(eventHandler)).Methods("GET")
	r.HandleFunc("/games", requireAuth(gamesHandler)).Methods("GET", "POST")
	r.HandleFunc("/games/{id}", requireAuth(gameHandler)).Methods("GET")

	// Public routes
	r.HandleFunc("/{page}", pageHandler).Methods("GET")
	r.HandleFunc("/", pageHandler).Methods("GET")

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
