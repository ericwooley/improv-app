import { test, expect } from '@playwright/test'
import { MainLayoutPage } from '../pages/MainLayoutPage'
import { loginWithMagicLink } from '../utils'

test.describe('Main Navigation', () => {
  let mainLayoutPage: MainLayoutPage

  test.beforeEach(async ({ page }) => {
    mainLayoutPage = new MainLayoutPage(page)

    // Log in using the utility function
    await loginWithMagicLink(page)
  })

  test('should navigate to all main pages', async () => {
    // Verify we're authenticated
    expect(await mainLayoutPage.isAuthenticated()).toBeTruthy()

    // Test navigation to Groups
    await mainLayoutPage.navigateToGroups()
    expect(await mainLayoutPage.isOnPage('groups')).toBeTruthy()

    // Test navigation to Games
    await mainLayoutPage.navigateToGames()
    expect(await mainLayoutPage.isOnPage('games')).toBeTruthy()

    // Test navigation to Events
    await mainLayoutPage.navigateToEvents()
    expect(await mainLayoutPage.isOnPage('events')).toBeTruthy()

    // Test navigation to Profile
    await mainLayoutPage.navigateToProfile()
    expect(await mainLayoutPage.isOnPage('profile')).toBeTruthy()

    // Test navigation back to Home
    await mainLayoutPage.navigateToHome()
    expect(await mainLayoutPage.isOnPage('home')).toBeTruthy()
  })

  test('should show selected item in navigation', async () => {
    // Navigate to Groups and check selected item
    await mainLayoutPage.navigateToGroups()
    const selectedItem = await mainLayoutPage.getSelectedNavItem()
    expect(selectedItem).toContain('Groups')
  })

  test('should log out successfully', async () => {
    // Perform logout
    await mainLayoutPage.logout()
    await mainLayoutPage.getPage().waitForLoadState('networkidle')
    await mainLayoutPage.getPage().goto('/')
    await mainLayoutPage.getPage().waitForURL('/login')

    // Verify we're not authenticated
    expect(await mainLayoutPage.isAuthenticated()).toBeFalsy()
  })
})
