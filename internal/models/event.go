package models

import "time"

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
