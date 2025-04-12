import { test, expect } from '@playwright/test'
import { loginWithMagicLink, generateUniqueEmail, createTestGroup, createTestGame } from '../utils'
import { GamesListComponent } from '../components/GamesListComponent'
import { GamesListWithFiltersComponent } from '../components/GamesListWithFiltersComponent'
import { GroupDetailsPage } from '../pages/GroupDetailsPage'
import { NewGamePage } from '../pages/NewGamePage'
import { GameDetailsPage } from '../pages/GameDetailsPage'
import { EmptyStateComponent } from '../components/EmptyStateComponent'
import { GamesPage } from '../pages/GamesPage'

test.describe('Games Functionality', () => {
  test('should show empty state when no games exist in a group', async ({ page }) => {
    // Create a unique user for this test
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a test group
    const groupDetails = await createTestGroup(page)

    // Navigate to the group details page
    await page.goto(`/groups/${groupDetails.id}`)

    // Initialize the group details page object
    const groupDetailsPage = new GroupDetailsPage(page)

    // Navigate to the games tab
    await groupDetailsPage.selectTab('games')

    // Check if games empty state is visible using the EmptyState component
    const emptyState = new EmptyStateComponent(page)
    expect(await emptyState.isVisible()).toBeTruthy()
  })

  test('should create a new game in a group', async ({ page }) => {
    // Create a unique user for this test
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a test group
    const groupDetails = await createTestGroup(page)

    // Create a unique game name
    const gameName = `Test Game ${Date.now()}`
    const gameDescription = 'This is a test game created by e2e tests'

    // Navigate to create game page
    await page.goto(`/games/new?groupId=${groupDetails.id}`)

    // Initialize the new game page
    const newGamePage = new NewGamePage(page)

    // Wait for the page to load
    await newGamePage.waitForPageLoad()

    // Check page title
    const pageTitle = await newGamePage.getPageTitle()
    expect(pageTitle).toContain('Create New Game')

    // Fill and submit the game form
    await newGamePage.fillGameForm({
      name: gameName,
      description: gameDescription,
      minPlayers: 3,
      maxPlayers: 6,
      isPublic: true,
    })
    await newGamePage.submitGameForm()

    // Wait for navigation to complete to group details page
    await page.goto(`/groups/${groupDetails.id}`)

    // Verify the game appears in the group's game list
    const groupDetailsPage = new GroupDetailsPage(page)
    await groupDetailsPage.selectTab('games')

    // Initialize games list component
    const gamesListComponent = new GamesListComponent(page)
    await gamesListComponent.waitForList()

    // Check that the game is visible in the list
    expect(await gamesListComponent.isGameWithNameVisible(gameName)).toBeTruthy()
  })

  test('should display game list with multiple games and support pagination', async ({ page }) => {
    // Create a unique user for this test
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a test group
    const groupDetails = await createTestGroup(page)

    // Create 6 test games to test pagination (default pageSize is 5)
    const gameNames: string[] = []
    for (let i = 0; i < 6; i++) {
      const game = await createTestGame(page, groupDetails.id, {
        name: `Pagination Test Game ${i + 1}`,
        description: `Test game ${i + 1} for pagination testing`,
      })
      gameNames.push(game.name)
    }

    // Navigate to the group details page
    await page.goto(`/groups/${groupDetails.id}`)

    // Initialize page objects
    const groupDetailsPage = new GroupDetailsPage(page)

    // Navigate to the games tab
    await groupDetailsPage.selectTab('games')

    // Initialize games list component
    const gamesListComponent = new GamesListComponent(page)

    // Wait for the games list to load
    await gamesListComponent.waitForList()

    // Check that we have games displayed
    const gameCount = await gamesListComponent.getGameCount()
    expect(gameCount).toBeGreaterThan(0)

    // Check for pagination if more than 5 games
    const hasPagination = await gamesListComponent.hasPagination()
    expect(hasPagination).toBeTruthy()
    // Get current page
    const currentPage = await gamesListComponent.getCurrentPage()
    expect(currentPage).toBe(1)
    let foundGames: string[] = []
    for (const gameName of gameNames) {
      if (await gamesListComponent.isGameWithNameVisible(gameName)) {
        foundGames.push(gameName)
      }
    }
    expect(foundGames.length).toEqual(gameNames.length - 1)
    // Navigate to next page
    await gamesListComponent.goToNextPage()

    // Verify we're on page 2
    const newPage = await gamesListComponent.getCurrentPage()
    expect(newPage).toBe(2)
    await page.waitForLoadState('networkidle')
    // wait for animations to finish
    await page.waitForTimeout(1500)
    for (const gameName of gameNames) {
      const isVisible = await gamesListComponent.isGameWithNameVisible(gameName)
      if (isVisible && foundGames.includes(gameName)) {
        throw new Error(`Game found in both pages: ${gameName}`)
      } else if (isVisible) {
        foundGames.push(gameName)
      }
    }
    expect(foundGames.length).toEqual(gameNames.length)
  })

  test('should update game status', async ({ page }) => {
    // Create a unique user for this test
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a test group
    const groupDetails = await createTestGroup(page)

    // Create a test game
    const gameDetails = await createTestGame(page, groupDetails.id)

    // Navigate to the group details page
    await page.goto(`/groups/${groupDetails.id}`)

    // Initialize page objects
    const groupDetailsPage = new GroupDetailsPage(page)

    // Navigate to the games tab
    await groupDetailsPage.selectTab('games')

    // Initialize games list component
    const gamesListComponent = new GamesListComponent(page)

    // Wait for the games list to load
    await gamesListComponent.waitForList()
    // Get the game card for our created game
    const gameCard = await gamesListComponent.getGameCard(gameDetails.id)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500) // This seems to take a while sometimes
    await gameCard.scrollIntoView()
    // Set the game status
    await gameCard.setGameStatus('I Love playing this')

    // Refresh the page to verify the status persisted
    await page.reload()

    // Navigate back to the games tab
    await groupDetailsPage.selectTab('games')

    // Wait for the games list to load
    await gamesListComponent.waitForList()

    // Check the status value
    const statusValue = await gameCard.getGameStatus()
    expect(statusValue).toBe('I Love playing this')
  })

  test('should navigate to game details page', async ({ page }) => {
    // Create a unique user for this test
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a test group
    const groupDetails = await createTestGroup(page)

    // Create a test game
    const gameDetails = await createTestGame(page, groupDetails.id)

    // Navigate to the group details page
    await page.goto(`/groups/${groupDetails.id}`)

    // Initialize page objects
    const groupDetailsPage = new GroupDetailsPage(page)

    // Navigate to the games tab
    await groupDetailsPage.selectTab('games')

    // Initialize games list component
    const gamesListComponent = new GamesListComponent(page)

    // Wait for the games list to load
    await gamesListComponent.waitForList()

    // Get the game card and click the view button
    const gameCard = await gamesListComponent.getGameCard(gameDetails.id)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500) // This seems to take a while sometimes
    await gameCard.clickViewButton()

    // Wait for navigation to complete
    await page.waitForURL(/\/games\/.*/)

    // Initialize the game details page
    const gameDetailsPage = new GameDetailsPage(page, gameDetails.id)
    await gameDetailsPage.waitForPageLoad()

    // Verify we're on the game details page
    const url = page.url()
    expect(url).toContain(`/games/${gameDetails.id}`)

    // Check that the game name is displayed
    expect(await gameDetailsPage.isGameNameVisible(gameDetails.name)).toBeTruthy()
  })

  test('should filter games by tag', async ({ page }) => {
    // Create a unique user for this test
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a test group
    const groupDetails = await createTestGroup(page)

    // Create a game with tag "Warm-up"
    const gameWithTag = await createTestGame(page, groupDetails.id, {
      name: `Game With Tag ${Date.now()}`,
      tags: ['Warm-up'],
    })

    // Create another game without the tag
    const gameWithoutTag = await createTestGame(page, groupDetails.id, {
      name: `Game Without Tag ${Date.now()}`,
    })

    // Navigate to the group details page
    await page.goto(`/groups/${groupDetails.id}`)

    // Initialize page objects
    const groupDetailsPage = new GroupDetailsPage(page)

    // Navigate to the games tab
    await groupDetailsPage.selectTab('games')

    // Initialize games list with filters component
    const gamesWithFilters = new GamesListWithFiltersComponent(page)
    await gamesWithFilters.waitForComponent()

    // Try to filter by tag
    await gamesWithFilters.selectTagFilter('Warm-up')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // exit animations

    // Check that the game with the tag is visible
    expect(await gamesWithFilters.isGameWithNameVisible(gameWithTag.name)).toBeTruthy()

    // Check that the game without the tag is not visible
    expect(await gamesWithFilters.isGameWithNameVisible(gameWithoutTag.name)).toBeFalsy()

    // Clear the filters
    await gamesWithFilters.clearFilters()
    await page.waitForLoadState('networkidle')
    // Verify both games are now visible again
    expect(await gamesWithFilters.isGameWithNameVisible(gameWithTag.name)).toBeTruthy()
    expect(await gamesWithFilters.isGameWithNameVisible(gameWithoutTag.name)).toBeTruthy()
  })
})

// New test suite for testing games on the main Games page
test.describe('Games Page Functionality', () => {
  test('should search for games and find specific results', async ({ page }) => {
    // Create a user for this test
    const userEmail = generateUniqueEmail()
    await loginWithMagicLink(page, userEmail)

    // Create a group
    const groupDetails = await createTestGroup(page)

    // Create games with distinctive names using a timestamp to ensure uniqueness
    const uniqueId = Date.now().toString()

    // Create 3 games with unique identifiable names
    const gameNames = [`SearchTest_Apple_${uniqueId}`, `SearchTest_Banana_${uniqueId}`, `SearchTest_Cherry_${uniqueId}`]

    // Create the games
    for (const name of gameNames) {
      await createTestGame(page, groupDetails.id, {
        name,
        description: `This is a test game for search functionality: ${name}`,
        isPublic: true,
      })
    }

    // Go to the games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.waitForPageLoad()

    // Test specific search for Apple
    await gamesPage.searchForGame(`Apple_${uniqueId}`)
    await page.waitForLoadState('networkidle')

    // Verify only Apple game is visible
    expect(await gamesPage.isGameWithNameVisible(gameNames[0])).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(gameNames[1])).toBeFalsy()
    expect(await gamesPage.isGameWithNameVisible(gameNames[2])).toBeFalsy()

    // Clear search and verify all games are visible again
    await gamesPage.clearFilters()
    await page.waitForLoadState('networkidle')

    for (const name of gameNames) {
      expect(await gamesPage.isGameWithNameVisible(name)).toBeTruthy()
    }

    // Search for Banana
    await gamesPage.searchForGame(`Banana_${uniqueId}`)
    await page.waitForLoadState('networkidle')

    // Verify only Banana game is visible
    expect(await gamesPage.isGameWithNameVisible(gameNames[0])).toBeFalsy()
    expect(await gamesPage.isGameWithNameVisible(gameNames[1])).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(gameNames[2])).toBeFalsy()

    // Test partial search with just the common prefix
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(`SearchTest_`)
    await page.waitForLoadState('networkidle')

    // Verify all test games are visible with partial match
    for (const name of gameNames) {
      expect(await gamesPage.isGameWithNameVisible(name)).toBeTruthy()
    }

    // Test search with unique timestamp to ensure all our test games show up
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(uniqueId)
    await page.waitForLoadState('networkidle')

    // Verify all our test games are visible
    for (const name of gameNames) {
      expect(await gamesPage.isGameWithNameVisible(name)).toBeTruthy()
    }
  })

  test('should display public games to all users', async ({ page }) => {
    // Create two users
    const user1Email = generateUniqueEmail()
    await loginWithMagicLink(page, user1Email)

    // Create a group for the first user
    const groupDetails = await createTestGroup(page, {
      name: `Group for Public Games ${Date.now()}`,
    })

    // Create a public game in the group
    const publicGame = await createTestGame(page, groupDetails.id, {
      name: `Public Game ${Date.now()}`,
      isPublic: true,
    })

    // Create a non-public game in the group
    const privateGame = await createTestGame(page, groupDetails.id, {
      name: `Private Game ${Date.now()}`,
      isPublic: false,
    })

    // Logout and login as a new user who is not in any groups
    await page.goto('/logout')
    await page.waitForURL('/login')

    const user2Email = generateUniqueEmail()
    await loginWithMagicLink(page, user2Email)

    // Go to the games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Wait for the page to load
    await gamesPage.waitForPageLoad()

    // Check that public game is visible
    expect(await gamesPage.isGameWithNameVisible(publicGame.name)).toBeTruthy()

    // Check that private game is not visible to this user
    expect(await gamesPage.isGameWithNameVisible(privateGame.name)).toBeFalsy()
  })

  test('should show private games to group members only', async ({ page, browser }) => {
    // Setup: Create first user and group with both public and private games
    const user1Email = generateUniqueEmail()
    await loginWithMagicLink(page, user1Email)

    // Create a group for the first user
    const groupDetails = await createTestGroup(page, {
      name: `Group for Testing Visibility ${Date.now()}`,
    })

    // Create a public game in the group
    const publicGame = await createTestGame(page, groupDetails.id, {
      name: `Public Group Game ${Date.now()}`,
      isPublic: true,
    })

    // Create a non-public game in the group
    const privateGame = await createTestGame(page, groupDetails.id, {
      name: `Private Group Game ${Date.now()}`,
      isPublic: false,
    })

    // Go to the games page and verify the user can see both games
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.waitForPageLoad()

    // Group member should see both public and private games
    expect(await gamesPage.isGameWithNameVisible(publicGame.name)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(privateGame.name)).toBeTruthy()

    // Create a second context and page for user 2
    const secondContext = await browser.newContext()
    const secondPage = await secondContext.newPage()

    // Login as user 2 (not a group member)
    const user2Email = generateUniqueEmail()
    await loginWithMagicLink(secondPage, user2Email)

    // Go to the games page
    const user2GamesPage = new GamesPage(secondPage)
    await user2GamesPage.goto()
    await user2GamesPage.waitForPageLoad()

    // Non-group member should see only public games
    expect(await user2GamesPage.isGameWithNameVisible(publicGame.name)).toBeTruthy()
    expect(await user2GamesPage.isGameWithNameVisible(privateGame.name)).toBeFalsy()

    // Clean up
    await secondContext.close()
  })

  test('should show games from all groups a user belongs to', async ({ page }) => {
    // Create a user for this test
    const userEmail = generateUniqueEmail()
    await loginWithMagicLink(page, userEmail)

    // Create two groups
    const group1Details = await createTestGroup(page, { name: `Group 1 ${Date.now()}` })
    const group2Details = await createTestGroup(page, { name: `Group 2 ${Date.now()}` })

    // Create a game in group 1
    const game1 = await createTestGame(page, group1Details.id, {
      name: `Game from Group 1 ${Date.now()}`,
      isPublic: false, // Private to ensure it's only visible due to membership
    })

    // Create a game in group 2
    const game2 = await createTestGame(page, group2Details.id, {
      name: `Game from Group 2 ${Date.now()}`,
      isPublic: false, // Private to ensure it's only visible due to membership
    })

    // Go to the games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Check that games from both groups are visible
    expect(await gamesPage.isGameWithNameVisible(game1.name)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(game2.name)).toBeTruthy()
  })

  test('should search for games correctly', async ({ page }) => {
    // Create a user for this test
    const userEmail = generateUniqueEmail()
    await loginWithMagicLink(page, userEmail)

    // Create a group
    const groupDetails = await createTestGroup(page)

    // Create games with distinctive names
    const uniqueId = Date.now()
    await createTestGame(page, groupDetails.id, {
      name: `Banana Game ${uniqueId}`,
      isPublic: true,
    })

    await createTestGame(page, groupDetails.id, {
      name: `Apple Game ${uniqueId}`,
      isPublic: true,
    })

    await createTestGame(page, groupDetails.id, {
      name: `Orange Game ${uniqueId}`,
      isPublic: true,
    })

    // Go to the games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Search for "Banana"
    await gamesPage.searchForGame(`Banana ${uniqueId}`)

    // Verify only Banana game is visible
    expect(await gamesPage.isGameWithNameVisible(`Banana Game ${uniqueId}`)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(`Apple Game ${uniqueId}`)).toBeFalsy()
    expect(await gamesPage.isGameWithNameVisible(`Orange Game ${uniqueId}`)).toBeFalsy()

    // Clear filters and search for another term
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(`Apple ${uniqueId}`)

    // Verify only Apple game is visible
    expect(await gamesPage.isGameWithNameVisible(`Banana Game ${uniqueId}`)).toBeFalsy()
    expect(await gamesPage.isGameWithNameVisible(`Apple Game ${uniqueId}`)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(`Orange Game ${uniqueId}`)).toBeFalsy()
  })

  test('should filter games by tag on the main games page', async ({ page }) => {
    // Create a user for this test
    const userEmail = generateUniqueEmail()
    await loginWithMagicLink(page, userEmail)

    // Create a group
    const groupDetails = await createTestGroup(page)

    // Create games with different tags
    const uniqueId = Date.now()

    // Game with Energizer tag
    await createTestGame(page, groupDetails.id, {
      name: `Energizer Game ${uniqueId}`,
      tags: ['Energizer'],
      isPublic: true,
    })

    // Game with Performance tag
    await createTestGame(page, groupDetails.id, {
      name: `Performance Game ${uniqueId}`,
      tags: ['Performance'],
      isPublic: true,
    })

    // Game with multiple tags
    await createTestGame(page, groupDetails.id, {
      name: `Multi-tag Game ${uniqueId}`,
      tags: ['Energizer', 'Performance'],
      isPublic: true,
    })

    // Go to the games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    // Filter by Energizer tag
    await gamesPage.selectTagFilter('Energizer')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Wait for animations/filtering

    // Check that games with Energizer tag are visible
    expect(await gamesPage.isGameWithNameVisible(`Energizer Game ${uniqueId}`)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(`Multi-tag Game ${uniqueId}`)).toBeTruthy()

    // Check that game with only Performance tag is not visible
    expect(await gamesPage.isGameWithNameVisible(`Performance Game ${uniqueId}`)).toBeFalsy()

    // Clear filters and apply Performance tag filter
    await gamesPage.clearFilters()
    await gamesPage.selectTagFilter('Performance')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // Wait for animations/filtering

    // Check that games with Performance tag are visible
    expect(await gamesPage.isGameWithNameVisible(`Performance Game ${uniqueId}`)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(`Multi-tag Game ${uniqueId}`)).toBeTruthy()

    // Check that game with only Energizer tag is not visible
    expect(await gamesPage.isGameWithNameVisible(`Energizer Game ${uniqueId}`)).toBeFalsy()
  })
})
