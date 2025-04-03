# Improv App

A web application for organizing and managing improv activities, built with Go and modern web technologies.

## Features

- User authentication and authorization
- Dynamic page routing
- Template-based UI
- PostgreSQL database
- Hot-reloading development environment with Air

## Prerequisites

- Go 1.16 or higher
- PostgreSQL
- Docker and Docker Compose (optional, for containerized development)

## Project Structure

```
improv-app/
├── main.go           # Main application entry point
├── database.go       # Database connection and operations
├── templates/        # HTML templates
├── schema.sql        # Database schema
├── .air.toml         # Air configuration for hot-reloading
├── docker-compose.yml # Docker configuration
└── .env              # Environment variables
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd improv-app
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install dependencies:
   ```bash
   go mod download
   ```

4. Set up the database:
   ```bash
   # Using Docker
   docker-compose up -d

   # Or manually create a PostgreSQL database and run:
   psql -d your_database_name -f schema.sql
   ```

5. Start the development server:
   ```bash
   # Install Air if you haven't already
   go install github.com/cosmtrek/air@latest

   # Start the server with hot-reloading
   air
   ```

The application will be available at `http://localhost:4080`.

## Development

This project uses [Air](https://github.com/cosmtrek/air) for hot-reloading during development. Air will automatically rebuild and restart the application when you make changes to your Go files.

### Key Components

- **Templates**: HTML templates are stored in the `templates/` directory and are automatically loaded at startup.
- **Database**: PostgreSQL is used for data storage. The schema is defined in `schema.sql`.
- **Routing**: The application uses Gorilla Mux for routing and supports dynamic page loading.

## Planned Features

### Improv Groups
- Create and manage improv troupes or practice groups
- Group membership with different roles (admin, member)
- Group description and details

### Events
- Schedule improv events for specific improv groups (all events must belong to a group)
- Event location management
- RSVP system for tracking attendance
- Ability to organize games for each event

### Game Catalog
- Comprehensive database of improv games
- Game details including description, minimum and maximum players
- Tagging system for categorizing games (e.g., warmup, short-form, long-form)
- User rating system for games

### Game Planning
- Assign games to specific events
- Order games within an event
- Track user preferences for game selection
- Filter games by tags, player count, or popularity
- MCs can manage games for their events, selecting them from the group library

## Database Schema

```mermaid
erDiagram
    users {
        string id PK
        string email
        string first_name
        string last_name
        timestamp created_at
    }

    email_tokens {
        string id PK
        string user_id FK
        string token
        boolean used
        timestamp expires_at
        timestamp created_at
    }

    improv_groups {
        string id PK
        string name
        string description
        string created_by FK
        timestamp created_at
    }

    group_members {
        string group_id PK,FK
        string user_id PK,FK
        string role
        timestamp created_at
    }

    group_followers {
        string group_id PK,FK
        string user_id PK,FK
        timestamp created_at
    }

    events {
        string id PK
        string group_id FK
        string title
        string description
        string location
        timestamp start_time
        timestamp end_time
        string created_by FK
        string mc_id FK
        string visibility
        timestamp created_at
    }

    event_rsvps {
        string event_id PK,FK
        string user_id PK,FK
        string status
        timestamp created_at
    }

    games {
        string id PK
        string name
        string description
        integer min_players
        integer max_players
        string created_by FK
        string group_id FK
        boolean public
        timestamp created_at
    }

    game_tags {
        string id PK
        string name
    }

    game_tag_associations {
        string game_id PK,FK
        string tag_id PK,FK
    }

    group_game_libraries {
        string group_id PK,FK
        string game_id PK,FK
        string added_by FK
        timestamp added_at
    }

    event_games {
        string event_id PK,FK
        string game_id PK,FK
        integer order_index
    }

    user_game_preferences {
        string user_id PK,FK
        string game_id PK,FK
        integer rating
        timestamp created_at
    }

    group_invitations {
        string id PK
        string group_id FK
        string email
        string invited_by FK
        string role
        string status
        timestamp expires_at
        timestamp created_at
    }

    users ||--o{ email_tokens : "authenticates"
    users ||--o{ improv_groups : "creates"
    users ||--o{ group_members : "joins"
    users ||--o{ group_followers : "follows"
    users ||--o{ group_invitations : "sends"
    improv_groups ||--o{ group_members : "has"
    improv_groups ||--o{ group_followers : "followed by"
    improv_groups ||--o{ group_invitations : "has"
    improv_groups ||--|{ events : "schedules"
    users ||--o{ events : "creates"
    users ||--o{ events : "MCs"
    events ||--o{ event_rsvps : "receives"
    users ||--o{ event_rsvps : "submits"
    users ||--o{ games : "creates"
    improv_groups ||--o{ games : "owns"
    games ||--o{ game_tag_associations : "categorized by"
    game_tags ||--o{ game_tag_associations : "applied to"
    improv_groups ||--o{ group_game_libraries : "has in library"
    games ||--o{ group_game_libraries : "included in"
    users ||--o{ group_game_libraries : "adds to library"
    events ||--o{ event_games : "includes"
    games ||--o{ event_games : "featured in"
    users ||--o{ user_game_preferences : "rates"
    games ||--o{ user_game_preferences : "rated by"
```
