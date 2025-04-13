package query

import (
	"strings"
	"testing"
)

func TestGameQueryBuilder_Build_BasicQuery(t *testing.T) {
	// Test a basic query with no filters
	builder := NewGameQueryBuilder()
	result := builder.Build()

	// Verify basic query structure
	if !strings.Contains(result.Query, "SELECT g.id, g.name, g.description") {
		t.Errorf("Expected basic SELECT statement, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "ORDER BY event_count DESC") {
		t.Errorf("Expected ordering by event_count, got: %s", result.Query)
	}

	// Should have no parameters for basic query
	if len(result.Params) != 0 {
		t.Errorf("Expected 0 parameters, got %d", len(result.Params))
	}

	// Should not be a search query
	if result.IsSearchQuery {
		t.Errorf("Expected IsSearchQuery to be false")
	}
}

func TestGameQueryBuilder_Build_SearchQuery(t *testing.T) {
	// Test search query
	builder := NewGameQueryBuilder().WithSearchTerm("improv")
	result := builder.Build()

	// Verify search query structure
	if !strings.Contains(result.Query, "JOIN games_fts ON games_fts.docid = g.rowid") {
		t.Errorf("Expected FTS join for search, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "WHERE games_fts MATCH ?") {
		t.Errorf("Expected MATCH clause, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "ORDER BY relevance_score DESC") {
		t.Errorf("Expected ordering by relevance_score, got: %s", result.Query)
	}

	// Should have 3 parameters for search query (likePattern twice and wildcard term)
	if len(result.Params) != 3 {
		t.Errorf("Expected 3 parameters, got %d", len(result.Params))
	}

	// Should be a search query
	if !result.IsSearchQuery {
		t.Errorf("Expected IsSearchQuery to be true")
	}

	// Check parameters
	if result.Params[0] != "%improv%" {
		t.Errorf("Expected first param to be '%%improv%%', got '%v'", result.Params[0])
	}

	if result.Params[2] != "improv*" {
		t.Errorf("Expected third param to be 'improv*', got '%v'", result.Params[2])
	}
}

func TestGameQueryBuilder_Build_PublicOnly(t *testing.T) {
	// Test public only filter
	builder := NewGameQueryBuilder().PublicOnly()
	result := builder.Build()

	// Verify public filter
	if !strings.Contains(result.Query, "WHERE g.public = TRUE") {
		t.Errorf("Expected public filter, got: %s", result.Query)
	}

	// Should have no parameters for public filter
	if len(result.Params) != 0 {
		t.Errorf("Expected 0 parameters, got %d", len(result.Params))
	}
}

func TestGameQueryBuilder_Build_WithUser(t *testing.T) {
	// Test user filter
	builder := NewGameQueryBuilder().WithUser("user123")
	result := builder.Build()

	// Verify user filter contains the essential parts, but don't check exact whitespace/formatting
	if !strings.Contains(result.Query, "WHERE (g.public = TRUE") {
		t.Errorf("Expected user filter with public=TRUE clause, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)") {
		t.Errorf("Expected user filter with group membership check, got: %s", result.Query)
	}

	// Should have 1 parameter for user filter
	if len(result.Params) != 1 {
		t.Errorf("Expected 1 parameter, got %d", len(result.Params))
	}

	// Check parameter
	if result.Params[0] != "user123" {
		t.Errorf("Expected param to be 'user123', got '%v'", result.Params[0])
	}
}

func TestGameQueryBuilder_Build_WithTag(t *testing.T) {
	// Test tag filter
	builder := NewGameQueryBuilder().WithTag("warmup")
	result := builder.Build()

	// Verify tag filter
	if !strings.Contains(result.Query, "SELECT game_id FROM game_tag_associations gta") {
		t.Errorf("Expected tag filter with game_tag_associations join, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "JOIN game_tags t ON gta.tag_id = t.id") {
		t.Errorf("Expected tag filter with game_tags join, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "WHERE t.name = ?") {
		t.Errorf("Expected tag filter with name condition, got: %s", result.Query)
	}

	// Should have 1 parameter for tag filter
	if len(result.Params) != 1 {
		t.Errorf("Expected 1 parameter, got %d", len(result.Params))
	}

	// Check parameter
	if result.Params[0] != "warmup" {
		t.Errorf("Expected param to be 'warmup', got '%v'", result.Params[0])
	}
}

func TestGameQueryBuilder_Build_WithLibrary(t *testing.T) {
	// Test library filter
	builder := NewGameQueryBuilder().WithLibrary("lib123")
	result := builder.Build()

	// Verify library filter
	if !strings.Contains(result.Query, "SELECT game_id FROM group_game_libraries WHERE group_id = ?") {
		t.Errorf("Expected library filter, got: %s", result.Query)
	}

	// Should have 1 parameter for library filter
	if len(result.Params) != 1 {
		t.Errorf("Expected 1 parameter, got %d", len(result.Params))
	}

	// Check parameter
	if result.Params[0] != "lib123" {
		t.Errorf("Expected param to be 'lib123', got '%v'", result.Params[0])
	}
}

func TestGameQueryBuilder_Build_WithGroupOwner(t *testing.T) {
	// Test group owner filter
	builder := NewGameQueryBuilder().WithGroupOwner("group123")
	result := builder.Build()

	// Verify group owner filter
	expectedClause := "WHERE g.group_id = ?"
	if !strings.Contains(result.Query, expectedClause) {
		t.Errorf("Expected group owner filter, got: %s", result.Query)
	}

	// Should have 1 parameter for group owner filter
	if len(result.Params) != 1 {
		t.Errorf("Expected 1 parameter, got %d", len(result.Params))
	}

	// Check parameter
	if result.Params[0] != "group123" {
		t.Errorf("Expected param to be 'group123', got '%v'", result.Params[0])
	}
}

func TestGameQueryBuilder_Build_WithPagination(t *testing.T) {
	// Test pagination
	builder := NewGameQueryBuilder().WithPagination(2, 10)
	result := builder.Build()

	// Verify pagination settings are stored
	if result.Page != 2 {
		t.Errorf("Expected page to be 2, got %d", result.Page)
	}

	if result.PageSize != 10 {
		t.Errorf("Expected pageSize to be 10, got %d", result.PageSize)
	}
}

func TestGameQueryBuilder_Build_CombinedFilters(t *testing.T) {
	// Test combined filters
	builder := NewGameQueryBuilder().
		WithUser("user123").
		WithTag("warmup").
		WithLibrary("lib123").
		WithSearchTerm("improv")

	result := builder.Build()

	// Verify all filters are present without checking exact whitespace/formatting
	if !strings.Contains(result.Query, "WHERE games_fts MATCH ?") {
		t.Errorf("Expected search filter, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "AND (g.public = TRUE") &&
	   !strings.Contains(result.Query, "OR g.group_id IN (SELECT group_id FROM group_members WHERE user_id = ?)") {
		t.Errorf("Expected user filter, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "SELECT game_id FROM group_game_libraries WHERE group_id = ?") {
		t.Errorf("Expected library filter, got: %s", result.Query)
	}

	if !strings.Contains(result.Query, "SELECT game_id FROM game_tag_associations gta") &&
	   !strings.Contains(result.Query, "JOIN game_tags t ON gta.tag_id = t.id") &&
	   !strings.Contains(result.Query, "WHERE t.name = ?") {
		t.Errorf("Expected tag filter, got: %s", result.Query)
	}

	// Should have 6 parameters:
	// 1-2: likePattern for search (twice)
	// 3: wildcard for search
	// 4: user ID
	// 5: library ID
	// 6: tag name
	if len(result.Params) != 6 {
		t.Errorf("Expected 6 parameters, got %d", len(result.Params))
	}

	// Should be a search query
	if !result.IsSearchQuery {
		t.Errorf("Expected IsSearchQuery to be true")
	}

	// Check some parameters
	if result.Params[3] != "user123" {
		t.Errorf("Expected user param to be 'user123', got '%v'", result.Params[3])
	}

	if result.Params[4] != "lib123" {
		t.Errorf("Expected library param to be 'lib123', got '%v'", result.Params[4])
	}

	if result.Params[5] != "warmup" {
		t.Errorf("Expected tag param to be 'warmup', got '%v'", result.Params[5])
	}
}
