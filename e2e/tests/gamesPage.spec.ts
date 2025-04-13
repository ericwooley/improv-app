import { test, expect } from '@playwright/test'
import { loginWithMagicLink, generateUniqueEmail, createTestGroup, createTestGame } from '../utils'
import { GamesPage } from '../pages/GamesPage'

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

    // Test search with unique timestamp to ensure all our test games show up
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(uniqueId)
    await page.waitForLoadState('networkidle')
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

    // Search for the public game by name
    await gamesPage.searchForGame(publicGame.name)
    await page.waitForLoadState('networkidle')

    // Check that public game is visible
    expect(await gamesPage.isGameWithNameVisible(publicGame.name)).toBeTruthy()

    // Search for the private game by name
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(privateGame.name)
    await page.waitForLoadState('networkidle')

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

    // Search for the public game
    await gamesPage.searchForGame(publicGame.name)
    await page.waitForLoadState('networkidle')

    // Group member should see the public game
    expect(await gamesPage.isGameWithNameVisible(publicGame.name)).toBeTruthy()

    // Now search for the private game
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(privateGame.name)
    await page.waitForLoadState('networkidle')

    // Group member should see the private game
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

    // Search for the public game
    await user2GamesPage.searchForGame(publicGame.name)
    await secondPage.waitForLoadState('networkidle')

    // Non-group member should see public game
    expect(await user2GamesPage.isGameWithNameVisible(publicGame.name)).toBeTruthy()

    // Now search for the private game
    await user2GamesPage.clearFilters()
    await user2GamesPage.searchForGame(privateGame.name)
    await secondPage.waitForLoadState('networkidle')

    // Non-group member should not see private game
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

    // Search for game 1
    await gamesPage.searchForGame(game1.name)
    await page.waitForLoadState('networkidle')

    // Check that game 1 is visible
    expect(await gamesPage.isGameWithNameVisible(game1.name)).toBeTruthy()

    // Search for game 2
    await gamesPage.clearFilters()
    await gamesPage.searchForGame(game2.name)
    await page.waitForLoadState('networkidle')

    // Check that game 2 is visible
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

    // Using valid tags that exist in the system
    const tagA = 'High-energy'
    const tagB = 'Character'
    const commonTag = 'Warm-up'

    // Create games with unique identifiable names and valid tags
    const gameWithTagA = await createTestGame(page, groupDetails.id, {
      name: `Tag Test Game A ${uniqueId}`,
      isPublic: true,
      tags: [tagA, commonTag],
    })

    const gameWithTagB = await createTestGame(page, groupDetails.id, {
      name: `Tag Test Game B ${uniqueId}`,
      isPublic: true,
      tags: [tagB, commonTag],
    })

    // Go to the games page
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()
    await gamesPage.waitForPageLoad()

    // First search for both games to confirm they exist
    await gamesPage.searchForGame(uniqueId.toString())
    await page.waitForLoadState('networkidle')

    // Verify both games are found when searching by the unique ID
    expect(await gamesPage.isGameWithNameVisible(gameWithTagA.name)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(gameWithTagB.name)).toBeTruthy()

    // Clear the search and filter by tagA
    await gamesPage.clearFilters()
    await gamesPage.selectTagFilter(tagA)

    // Search for the games again with the tag filter applied
    await gamesPage.searchForGame(uniqueId.toString())
    await page.waitForLoadState('networkidle')

    // Verify only the game with tagA is visible
    expect(await gamesPage.isGameWithNameVisible(gameWithTagA.name)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(gameWithTagB.name)).toBeFalsy()

    // Clear filters and try with tagB
    await gamesPage.clearFilters()
    await gamesPage.selectTagFilter(tagB)

    // Search for the games again with the tag filter applied
    await gamesPage.searchForGame(uniqueId.toString())
    await page.waitForLoadState('networkidle')

    // Verify only the game with tagB is visible
    expect(await gamesPage.isGameWithNameVisible(gameWithTagA.name)).toBeFalsy()
    expect(await gamesPage.isGameWithNameVisible(gameWithTagB.name)).toBeTruthy()

    // Clear filters and filter by the common tag
    await gamesPage.clearFilters()
    await gamesPage.selectTagFilter(commonTag)

    // Search for the games again with the tag filter applied
    await gamesPage.searchForGame(uniqueId.toString())
    await page.waitForLoadState('networkidle')

    // Verify both games are visible when filtering by the common tag
    expect(await gamesPage.isGameWithNameVisible(gameWithTagA.name)).toBeTruthy()
    expect(await gamesPage.isGameWithNameVisible(gameWithTagB.name)).toBeTruthy()
  })
})
