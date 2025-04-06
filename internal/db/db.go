package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func InitDB() *sql.DB {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "improv.db"
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	// Create tables if they don't exist
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			first_name TEXT DEFAULT '',
			last_name TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS email_tokens (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			token TEXT NOT NULL,
			used BOOLEAN DEFAULT FALSE,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS improv_groups (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			created_by TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (created_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS group_members (
			group_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			role TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (group_id, user_id),
			FOREIGN KEY (group_id) REFERENCES improv_groups(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS group_followers (
			group_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (group_id, user_id),
			FOREIGN KEY (group_id) REFERENCES improv_groups(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS events (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT,
			location TEXT,
			start_time TIMESTAMP NOT NULL,
			end_time TIMESTAMP NOT NULL,
			created_by TEXT NOT NULL,
			visibility TEXT NOT NULL DEFAULT 'private',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES improv_groups(id),
			FOREIGN KEY (created_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS event_rsvps (
			event_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			status TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (event_id, user_id),
			FOREIGN KEY (event_id) REFERENCES events(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS games (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			min_players INTEGER NOT NULL,
			max_players INTEGER NOT NULL,
			created_by TEXT NOT NULL,
			group_id TEXT NOT NULL,
			public BOOLEAN NOT NULL DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (created_by) REFERENCES users(id),
			FOREIGN KEY (group_id) REFERENCES improv_groups(id)
		);

		CREATE TABLE IF NOT EXISTS game_tags (
			id TEXT PRIMARY KEY,
			name TEXT UNIQUE NOT NULL
		);

		CREATE TABLE IF NOT EXISTS game_tag_associations (
			game_id TEXT NOT NULL,
			tag_id TEXT NOT NULL,
			PRIMARY KEY (game_id, tag_id),
			FOREIGN KEY (game_id) REFERENCES games(id),
			FOREIGN KEY (tag_id) REFERENCES game_tags(id)
		);

		CREATE TABLE IF NOT EXISTS group_game_libraries (
			group_id TEXT NOT NULL,
			game_id TEXT NOT NULL,
			added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (group_id, game_id),
			FOREIGN KEY (group_id) REFERENCES improv_groups(id),
			FOREIGN KEY (game_id) REFERENCES games(id)
		);

		CREATE TABLE IF NOT EXISTS event_games (
			event_id TEXT NOT NULL,
			game_id TEXT NOT NULL,
			order_index INTEGER NOT NULL,
			PRIMARY KEY (event_id, game_id),
			FOREIGN KEY (event_id) REFERENCES events(id),
			FOREIGN KEY (game_id) REFERENCES games(id)
		);

		CREATE TABLE IF NOT EXISTS user_game_preferences (
			user_id TEXT NOT NULL,
			game_id TEXT NOT NULL,
			rating INTEGER NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, game_id),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (game_id) REFERENCES games(id)
		);

		CREATE TABLE IF NOT EXISTS group_invitations (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL,
			email TEXT NOT NULL,
			invited_by TEXT NOT NULL,
			role TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES improv_groups(id),
			FOREIGN KEY (invited_by) REFERENCES users(id)
		);

		-- Create virtual table for full text search on games
		CREATE VIRTUAL TABLE IF NOT EXISTS games_fts USING fts4(
			name,
			description,
			content='games'
		);

		-- Create triggers to keep the FTS table in sync with the games table
		CREATE TRIGGER IF NOT EXISTS games_ai AFTER INSERT ON games BEGIN
			INSERT INTO games_fts(docid, name, description) VALUES (new.id, new.name, new.description);
		END;

		CREATE TRIGGER IF NOT EXISTS games_ad AFTER DELETE ON games BEGIN
			DELETE FROM games_fts WHERE docid = old.id;
		END;

		CREATE TRIGGER IF NOT EXISTS games_au AFTER UPDATE ON games BEGIN
			DELETE FROM games_fts WHERE docid = old.id;
			INSERT INTO games_fts(docid, name, description) VALUES (new.id, new.name, new.description);
		END;
	`)
	if err != nil {
		log.Fatal(err)
	}

	// Add columns to existing tables if needed (for database schema evolution)
	db.Exec(`ALTER TABLE group_game_libraries ADD COLUMN added_by TEXT REFERENCES users(id);`)
	db.Exec(`ALTER TABLE events ADD COLUMN mc_id TEXT REFERENCES users(id);`)
	db.Exec(`ALTER TABLE user_game_preferences ADD COLUMN status TEXT;`)
	db.Exec(`ALTER TABLE user_game_preferences DROP COLUMN rating;`)
	// Ignore error - it will fail if column already exists, which is fine

	// Add group invite links table if it doesn't exist
	db.Exec(`
		CREATE TABLE IF NOT EXISTS group_invite_links (
			id TEXT PRIMARY KEY,
			group_id TEXT NOT NULL,
			description TEXT NOT NULL,
			code TEXT UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			active BOOLEAN NOT NULL DEFAULT TRUE,
			created_by TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_id) REFERENCES improv_groups(id),
			FOREIGN KEY (created_by) REFERENCES users(id)
		);
	`)
	// Ignore error - it will fail if table already exists, which is fine

	return db
}
