package handlers

import "time"

type ImprovGroup struct {
	ID          string
	Name        string
	Description string
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


// Event represents an event in the database
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
	MCID        *string
}
