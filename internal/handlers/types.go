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
