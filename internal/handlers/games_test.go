package handlers

import (
	"context"
	"encoding/json"
	"improv-app/internal/middleware"
	"improv-app/internal/models"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestGameHandler_List(t *testing.T) {
	// Setup
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error creating mock database: %v", err)
	}
	defer db.Close()

	handler := NewGameHandler(db)

	// Create test user
	testUser := &models.User{
		ID:        uuid.New().String(),
		Email:     "test@example.com",
		FirstName: "Test",
		LastName:  "User",
	}

	// Test cases
	tests := []struct {
		name          string
		queryParams   url.Values
		mockSetup     func(mock sqlmock.Sqlmock)
		expectedCode  int
		expectedGames int
	}{
		{
			name:        "Basic list with no parameters",
			queryParams: url.Values{},
			mockSetup: func(mock sqlmock.Sqlmock) {
				// Mock count query
				countRows := sqlmock.NewRows([]string{"count"}).AddRow(0)
				mock.ExpectQuery(`SELECT COUNT\(DISTINCT g.id\)`).
					WillReturnRows(countRows)

				// Mock data query
				mock.ExpectQuery(`SELECT g.id, g.name, g.description, g.min_players, g.max_players`).
					WillReturnRows(sqlmock.NewRows([]string{
						"id", "name", "description", "min_players", "max_players",
						"created_at", "created_by", "group_id", "public", "tags", "event_count",
					}))
			},
			expectedCode:  http.StatusOK,
			expectedGames: 0,
		},
		{
			name: "List with search parameter",
			queryParams: url.Values{
				"search": []string{"test"},
			},
			mockSetup: func(mock sqlmock.Sqlmock) {
				// Mock count query for search
				countRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
				mock.ExpectQuery(`SELECT COUNT\(DISTINCT g.id\)`).
					WillReturnRows(countRows)

				// Use time.Time for created_at field instead of string
				createdAt := time.Now()

				// Mock data query for search
				dataRows := sqlmock.NewRows([]string{
					"id", "name", "description", "min_players", "max_players",
					"created_at", "created_by", "group_id", "public", "tags", "relevance_score", "event_count",
				}).AddRow(
					uuid.New().String(), "Test Game", "A test game", 2, 6,
					createdAt, testUser.ID, uuid.New().String(), true, "tag1,tag2", 3, 0,
				)
				mock.ExpectQuery(`SELECT g.id, g.name, g.description, g.min_players, g.max_players`).
					WillReturnRows(dataRows)
			},
			expectedCode:  http.StatusOK,
			expectedGames: 1,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Setup mock expectations
			tc.mockSetup(mock)

			// Create request
			req, err := http.NewRequest(http.MethodGet, "/games", nil)
			if err != nil {
				t.Fatalf("Error creating request: %v", err)
			}
			req.URL.RawQuery = tc.queryParams.Encode()

			// Add user to context
			ctx := context.WithValue(req.Context(), middleware.UserContextKey, testUser)
			req = req.WithContext(ctx)

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call handler
			handler.List(rr, req)

			// Check response
			assert.Equal(t, tc.expectedCode, rr.Code)

			// Parse response
			var response ApiResponse
			err = json.Unmarshal(rr.Body.Bytes(), &response)
			if err != nil {
				t.Fatalf("Error parsing response: %v", err)
			}

			// Check success flag
			assert.True(t, response.Success)

			// Check data
			games, ok := response.Data.([]interface{})
			if !ok {
				t.Fatalf("Expected data to be an array of games")
			}
			assert.Equal(t, tc.expectedGames, len(games))

			// Check if there are any unfulfilled expectations
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Errorf("Unfulfilled mock expectations: %s", err)
			}
		})
	}
}

func TestGameHandler_ParsePaginationParams(t *testing.T) {
	handler := NewGameHandler(nil)

	tests := []struct {
		name            string
		query           url.Values
		expectedPage    int
		expectedPageSize int
	}{
		{
			name:            "No parameters",
			query:           url.Values{},
			expectedPage:    1,
			expectedPageSize: 0,
		},
		{
			name: "Valid page and pageSize",
			query: url.Values{
				"page":     []string{"2"},
				"pageSize": []string{"10"},
			},
			expectedPage:    2,
			expectedPageSize: 10,
		},
		{
			name: "Invalid page",
			query: url.Values{
				"page":     []string{"invalid"},
				"pageSize": []string{"10"},
			},
			expectedPage:    1,
			expectedPageSize: 10,
		},
		{
			name: "Invalid pageSize",
			query: url.Values{
				"page":     []string{"2"},
				"pageSize": []string{"invalid"},
			},
			expectedPage:    2,
			expectedPageSize: 0,
		},
		{
			name: "Zero page",
			query: url.Values{
				"page":     []string{"0"},
				"pageSize": []string{"10"},
			},
			expectedPage:    1,
			expectedPageSize: 10,
		},
		{
			name: "Negative page",
			query: url.Values{
				"page":     []string{"-1"},
				"pageSize": []string{"10"},
			},
			expectedPage:    1,
			expectedPageSize: 10,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			page, pageSize := handler.parsePaginationParams(tc.query)
			assert.Equal(t, tc.expectedPage, page)
			assert.Equal(t, tc.expectedPageSize, pageSize)
		})
	}
}

func TestGameHandler_ApplyFilters(t *testing.T) {
	handler := NewGameHandler(nil)

	baseQueryStr := "SELECT * FROM games g"
	baseCountQueryStr := "SELECT COUNT(*) FROM games g"
	baseParams := []interface{}{}
	baseCountParams := []interface{}{}
	userID := uuid.New().String()

	testCases := []struct {
		name              string
		tagFilter         string
		libraryFilter     string
		ownedByGroupFilter string
		expectedQueryContains []string
		expectedParamsLen  int
	}{
		{
			name:          "No filters",
			expectedQueryContains: []string{
				"public = TRUE",
				"group_id IN (SELECT group_id FROM group_members WHERE user_id = ?",
			},
			expectedParamsLen: 1, // Just userID
		},
		{
			name:          "With tag filter",
			tagFilter:     "Test Tag",
			expectedQueryContains: []string{
				"public = TRUE",
				"group_id IN (SELECT group_id FROM group_members WHERE user_id = ?",
				"AND g.id IN",
				"SELECT game_id FROM game_tag_associations gta",
				"JOIN game_tags t ON gta.tag_id = t.id",
				"WHERE t.name = ?",
			},
			expectedParamsLen: 2, // userID and tag
		},
		{
			name:          "With library filter",
			libraryFilter: uuid.New().String(),
			expectedQueryContains: []string{
				"JOIN group_game_libraries ggl ON g.id = ggl.game_id AND ggl.group_id = ?",
				"public = TRUE",
				"group_id IN (SELECT group_id FROM group_members WHERE user_id = ?",
			},
			expectedParamsLen: 2, // libraryID and userID
		},
		{
			name:              "With owned by group filter",
			ownedByGroupFilter: uuid.New().String(),
			expectedQueryContains: []string{
				"public = TRUE",
				"group_id IN (SELECT group_id FROM group_members WHERE user_id = ?",
				"AND g.group_id = ?",
			},
			expectedParamsLen: 2, // userID and groupID
		},
		{
			name:              "With all filters",
			tagFilter:         "Test Tag",
			libraryFilter:     uuid.New().String(),
			ownedByGroupFilter: uuid.New().String(),
			expectedQueryContains: []string{
				"JOIN group_game_libraries ggl ON g.id = ggl.game_id AND ggl.group_id = ?",
				"public = TRUE",
				"group_id IN (SELECT group_id FROM group_members WHERE user_id = ?",
				"AND g.id IN",
				"SELECT game_id FROM game_tag_associations gta",
				"JOIN game_tags t ON gta.tag_id = t.id",
				"WHERE t.name = ?",
				"AND g.group_id = ?",
			},
			expectedParamsLen: 4, // libraryID, userID, tag, and groupID
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			queryStr, countQueryStr, params, countParams := handler.applyFilters(
				baseQueryStr, baseCountQueryStr, baseParams, baseCountParams,
				userID, tc.tagFilter, tc.libraryFilter, tc.ownedByGroupFilter,
			)

			// Check params length
			assert.Equal(t, tc.expectedParamsLen, len(params))
			assert.Equal(t, tc.expectedParamsLen, len(countParams))

			// Check query contains expected clauses
			for _, expectedClause := range tc.expectedQueryContains {
				assert.Contains(t, queryStr, expectedClause)
				assert.Contains(t, countQueryStr, expectedClause)
			}
		})
	}
}

func TestGameHandler_SearchGames(t *testing.T) {
	// Setup
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error creating mock database: %v", err)
	}
	defer db.Close()

	handler := NewGameHandler(db)

	// Create test user
	testUserID := uuid.New().String()
	testUser := &models.User{
		ID:        testUserID,
		Email:     "test@example.com",
		FirstName: "Test",
		LastName:  "User",
	}

	// Setup request
	req, err := http.NewRequest(http.MethodGet, "/games", nil)
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}

	// Add query params
	q := req.URL.Query()
	q.Add("search", "test")
	req.URL.RawQuery = q.Encode()

	// Add user to context
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, testUser)
	req = req.WithContext(ctx)

	// Create response recorder
	rr := httptest.NewRecorder()

	// Setup mock expectations
	// Mock count query
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
	mock.ExpectQuery("SELECT COUNT\\(DISTINCT g.id\\)").
		WillReturnRows(countRows)

	// Use time.Time for created_at field
	createdAt1 := time.Now().AddDate(0, 0, -1) // yesterday
	createdAt2 := time.Now()                   // today

	// Mock data query
	dataRows := sqlmock.NewRows([]string{
		"id", "name", "description", "min_players", "max_players",
		"created_at", "created_by", "group_id", "public", "tags", "relevance_score", "event_count",
	}).
		AddRow(uuid.New().String(), "Test Game 1", "Description 1", 2, 6,
			  createdAt1, testUserID, uuid.New().String(), true, "tag1,tag2", 3, 1).
		AddRow(uuid.New().String(), "Test Game 2", "Description 2", 3, 8,
			  createdAt2, testUserID, uuid.New().String(), true, "tag2,tag3", 1, 0)

	mock.ExpectQuery("SELECT g.id, g.name, g.description, g.min_players, g.max_players").
		WillReturnRows(dataRows)

	// Call handler
	handler.searchGames(rr, req, testUserID, "test", req.URL.Query(), 1, 0)

	// Check response code
	assert.Equal(t, http.StatusOK, rr.Code)

	// Parse response
	var response ApiResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Error parsing response: %v", err)
	}

	// Check success flag
	assert.True(t, response.Success)

	// Check pagination info - might be nil if there was an error, so add nil checks
	if assert.NotNil(t, response.Pagination, "Pagination should not be nil") {
		assert.Equal(t, 1, response.Pagination.Page)
		assert.Equal(t, 0, response.Pagination.PageSize)
		assert.Equal(t, 2, response.Pagination.TotalItems)
		assert.Equal(t, 1, response.Pagination.TotalPages)
	}

	// Check if there are any unfulfilled expectations
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled mock expectations: %s", err)
	}
}

func TestGameHandler_ListGamesBasic(t *testing.T) {
	// Setup
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error creating mock database: %v", err)
	}
	defer db.Close()

	handler := NewGameHandler(db)

	// Create test user
	testUserID := uuid.New().String()
	testUser := &models.User{
		ID:        testUserID,
		Email:     "test@example.com",
		FirstName: "Test",
		LastName:  "User",
	}

	// Setup request
	req, err := http.NewRequest(http.MethodGet, "/games", nil)
	if err != nil {
		t.Fatalf("Error creating request: %v", err)
	}

	// Add query params for filtering by tag
	q := req.URL.Query()
	q.Add("tag", "test-tag")
	req.URL.RawQuery = q.Encode()

	// Add user to context
	ctx := context.WithValue(req.Context(), middleware.UserContextKey, testUser)
	req = req.WithContext(ctx)

	// Create response recorder
	rr := httptest.NewRecorder()

	// Setup mock expectations
	// Mock count query
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery("SELECT COUNT\\(DISTINCT g.id\\)").
		WillReturnRows(countRows)

	// Use time.Time for created_at field
	createdAt := time.Now()

	// Mock data query
	dataRows := sqlmock.NewRows([]string{
		"id", "name", "description", "min_players", "max_players",
		"created_at", "created_by", "group_id", "public", "tags", "event_count",
	}).
		AddRow(uuid.New().String(), "Test Game", "A game with the test-tag", 2, 6,
			  createdAt, testUserID, uuid.New().String(), true, "test-tag", 1)

	mock.ExpectQuery("SELECT g.id, g.name, g.description, g.min_players, g.max_players").
		WillReturnRows(dataRows)

	// Call handler
	handler.listGamesBasic(rr, req, testUserID, req.URL.Query(), 1, 0)

	// Check response code
	assert.Equal(t, http.StatusOK, rr.Code)

	// Parse response
	var response ApiResponse
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Error parsing response: %v", err)
	}

	// Check success flag
	assert.True(t, response.Success)

	// Check data
	assert.NotNil(t, response.Data)

	// Check if there are any unfulfilled expectations
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled mock expectations: %s", err)
	}
}

func TestGameHandler_ExecuteQueryAndRespond(t *testing.T) {
	// Setup
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error creating mock database: %v", err)
	}
	defer db.Close()

	handler := NewGameHandler(db)

	// Create response recorder
	rr := httptest.NewRecorder()

	// Test query - need to match the actual column structure expected by the handler
	queryStr := `
		SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public,
				GROUP_CONCAT(DISTINCT t.name) as tags,
				COUNT(DISTINCT eg.event_id) AS event_count
		FROM games g
		WHERE g.id IN ('test-id-1', 'test-id-2', 'test-id-3')
		GROUP BY g.id
	`
	countQueryStr := "SELECT COUNT(*) FROM games g WHERE g.id IN ('test-id-1', 'test-id-2', 'test-id-3')"
	params := []interface{}{}
	countParams := []interface{}{}

	// Setup mock expectations
	// Mock count query
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(3)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM games g").
		WillReturnRows(countRows)

	// Use time.Time for created_at field
	now := time.Now()

	// Mock data query - need to include all fields that the code expects to scan
	dataRows := sqlmock.NewRows([]string{
		"id", "name", "description", "min_players", "max_players",
		"created_at", "created_by", "group_id", "public", "tags", "event_count",
	}).
		AddRow("test-id-1", "Game 1", "Description 1", 2, 6, now, "user-1", "group-1", true, "tag1,tag2", 1).
		AddRow("test-id-2", "Game 2", "Description 2", 3, 8, now, "user-1", "group-1", true, "tag2,tag3", 0).
		AddRow("test-id-3", "Game 3", "Description 3", 4, 10, now, "user-2", "group-2", false, "tag3,tag4", 2)

	mock.ExpectQuery(`SELECT g.id, g.name, g.description, g.min_players, g.max_players, g.created_at, g.created_by, g.group_id, g.public`).
		WillReturnRows(dataRows)

	// Call handler with isSearch=false
	handler.executeQueryAndRespond(rr, queryStr, countQueryStr, params, countParams, 1, 0, false)

	// Check response code
	assert.Equal(t, http.StatusOK, rr.Code)

	// Parse response to verify it's a valid JSON
	var response map[string]interface{}
	err = json.Unmarshal(rr.Body.Bytes(), &response)
	assert.NoError(t, err, "Response should be valid JSON")

	// Check if success flag is true
	success, ok := response["success"].(bool)
	assert.True(t, ok && success, "Response should have success=true")

	// Check if there are any unfulfilled expectations
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled mock expectations: %s", err)
	}
}
