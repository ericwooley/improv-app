package models

import "time"

type ImprovGroup struct {
	ID          string
	Name        string
	Description string
	CreatedAt   time.Time
	CreatedBy   string
}
