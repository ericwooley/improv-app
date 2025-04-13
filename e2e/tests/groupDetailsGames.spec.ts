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
