package query

// GameQueryBuilder is a builder for constructing game queries with various filters
type GameQueryBuilder struct {
	searchTerm         string
	userID             string
	tagFilter          string
	libraryFilter      string
	ownedByGroupFilter string
	publicOnly         bool
	page               int
	pageSize           int
}

// QueryResult contains the built query and its parameters
type QueryResult struct {
	Query          string
	CountQuery     string
	Params         []interface{}
	CountParams    []interface{}
	Page           int
	PageSize       int
	IsSearchQuery  bool
}

// NewGameQueryBuilder creates a new query builder
func NewGameQueryBuilder() *GameQueryBuilder {
	return &GameQueryBuilder{
		page:      1,
		pageSize:  0, // 0 means no pagination
	}
}

// WithSearchTerm adds a search term filter
func (b *GameQueryBuilder) WithSearchTerm(term string) *GameQueryBuilder {
	b.searchTerm = term
	return b
}

// WithUser adds a user context
func (b *GameQueryBuilder) WithUser(userID string) *GameQueryBuilder {
	b.userID = userID
	return b
}

// WithTag adds a tag filter
func (b *GameQueryBuilder) WithTag(tag string) *GameQueryBuilder {
	b.tagFilter = tag
	return b
}

// WithLibrary adds a library filter
func (b *GameQueryBuilder) WithLibrary(libraryID string) *GameQueryBuilder {
	b.libraryFilter = libraryID
	return b
}

// WithGroupOwner adds a group ownership filter
func (b *GameQueryBuilder) WithGroupOwner(groupID string) *GameQueryBuilder {
	b.ownedByGroupFilter = groupID
	return b
}

// PublicOnly restricts results to public games
func (b *GameQueryBuilder) PublicOnly() *GameQueryBuilder {
	b.publicOnly = true
	return b
}

// WithPagination adds pagination
func (b *GameQueryBuilder) WithPagination(page, pageSize int) *GameQueryBuilder {
	if page > 0 {
		b.page = page
	}
	if pageSize > 0 {
		b.pageSize = pageSize
	}
	return b
}

// Build constructs and returns the query strings and parameters
func (b *GameQueryBuilder) Build() QueryResult {
	var queryStr, countQueryStr string
	var params, countParams []interface{}

	// Build base query
	if b.searchTerm != "" {
		// Use FTS search with relevance
		likePattern := "%" + b.searchTerm + "%"
		searchTermWithWildcard := b.searchTerm + "*"

		queryStr = `
			SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
				GROUP_CONCAT(DISTINCT t.name) as tags,
				(CASE
					WHEN g.name LIKE ? THEN 3
					WHEN g.description LIKE ? THEN 1
					ELSE 0
				END) AS relevance_score,
				COUNT(DISTINCT eg.event_id) AS event_count
			FROM games g
			JOIN games_fts ON games_fts.docid = g.rowid
			LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
			LEFT JOIN game_tags t ON gta.tag_id = t.id
			LEFT JOIN event_games eg ON g.id = eg.game_id
			WHERE games_fts MATCH ?
		`

		countQueryStr = `
			SELECT COUNT(DISTINCT g.id)
			FROM games g
			JOIN games_fts ON games_fts.docid = g.rowid
			WHERE games_fts MATCH ?
		`

		params = []interface{}{likePattern, likePattern, searchTermWithWildcard}
		countParams = []interface{}{searchTermWithWildcard}
	} else {
		// Use standard query without search
		queryStr = `
			SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
				GROUP_CONCAT(DISTINCT t.name) as tags,
				COUNT(DISTINCT eg.event_id) AS event_count
			FROM games g
			LEFT JOIN game_tag_associations gta ON g.id = gta.game_id
			LEFT JOIN game_tags t ON gta.tag_id = t.id
			LEFT JOIN event_games eg ON g.id = eg.game_id
		`

		countQueryStr = `
			SELECT COUNT(DISTINCT g.id)
			FROM games g
		`

		params = []interface{}{}
		countParams = []interface{}{}
	}

	// Apply public only filter if no user is specified
	if b.publicOnly {
		if len(params) > 0 {
			queryStr += " AND g.public = TRUE"
			countQueryStr += " AND g.public = TRUE"
		} else {
			queryStr += " WHERE g.public = TRUE"
			countQueryStr += " WHERE g.public = TRUE"
		}
	}

	// Apply user context filter
	if b.userID != "" {
		if len(params) > 0 || b.publicOnly {
			queryStr += `
				AND (g.public = TRUE
				 OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))
			`
			countQueryStr += `
				AND (g.public = TRUE
				 OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))
			`
		} else {
			queryStr += `
				WHERE (g.public = TRUE
				   OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))
			`
			countQueryStr += `
				WHERE (g.public = TRUE
				   OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))
			`
		}
		params = append(params, b.userID)
		countParams = append(countParams, b.userID)
	}

	// Apply library filter
	if b.libraryFilter != "" {
		if len(params) > 0 || b.publicOnly {
			queryStr += `
				AND g.id IN (
					SELECT game_id FROM group_game_libraries WHERE group_id = ?
				)
			`
			countQueryStr += `
				AND g.id IN (
					SELECT game_id FROM group_game_libraries WHERE group_id = ?
				)
			`
		} else {
			queryStr += `
				WHERE g.id IN (
					SELECT game_id FROM group_game_libraries WHERE group_id = ?
				)
			`
			countQueryStr += `
				WHERE g.id IN (
					SELECT game_id FROM group_game_libraries WHERE group_id = ?
				)
			`
		}
		params = append(params, b.libraryFilter)
		countParams = append(countParams, b.libraryFilter)
	}

	// Apply tag filter
	if b.tagFilter != "" {
		if len(params) > 0 || b.publicOnly {
			queryStr += `
				AND g.id IN (
					SELECT game_id FROM game_tag_associations gta
					JOIN game_tags t ON gta.tag_id = t.id
					WHERE t.name = ?
				)
			`
			countQueryStr += `
				AND g.id IN (
					SELECT game_id FROM game_tag_associations gta
					JOIN game_tags t ON gta.tag_id = t.id
					WHERE t.name = ?
				)
			`
		} else {
			queryStr += `
				WHERE g.id IN (
					SELECT game_id FROM game_tag_associations gta
					JOIN game_tags t ON gta.tag_id = t.id
					WHERE t.name = ?
				)
			`
			countQueryStr += `
				WHERE g.id IN (
					SELECT game_id FROM game_tag_associations gta
					JOIN game_tags t ON gta.tag_id = t.id
					WHERE t.name = ?
				)
			`
		}
		params = append(params, b.tagFilter)
		countParams = append(countParams, b.tagFilter)
	}

	// Apply group owner filter
	if b.ownedByGroupFilter != "" {
		if len(params) > 0 || b.publicOnly {
			queryStr += `
				AND g.group_id = ?
			`
			countQueryStr += `
				AND g.group_id = ?
			`
		} else {
			queryStr += `
				WHERE g.group_id = ?
			`
			countQueryStr += `
				WHERE g.group_id = ?
			`
		}
		params = append(params, b.ownedByGroupFilter)
		countParams = append(countParams, b.ownedByGroupFilter)
	}

	// Add grouping and ordering
	queryStr += `
		GROUP BY g.id
	`

	// Add ordering
	if b.searchTerm != "" {
		queryStr += `
			ORDER BY relevance_score DESC, event_count DESC, g.created_at DESC
		`
	} else {
		queryStr += `
			ORDER BY event_count DESC, g.created_at DESC
		`
	}

	// Return the queries and parameters
	return QueryResult{
		Query:          queryStr,
		CountQuery:     countQueryStr,
		Params:         params,
		CountParams:    countParams,
		Page:           b.page,
		PageSize:       b.pageSize,
		IsSearchQuery:  b.searchTerm != "",
	}
}
