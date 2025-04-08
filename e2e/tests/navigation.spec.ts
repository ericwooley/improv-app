import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { MainLayoutPage } from '../pages/MainLayoutPage'
import { MailpitClient } from '../clients/MailpitClient'

// Helper function to generate unique email addresses
function generateUniqueEmail() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `test-${timestamp}-${random}@example.com`
}

// Helper function to extract magic link from email
async function extractMagicLinkFromEmail(mailpitClient: MailpitClient, emailId: string): Promise<string> {
  const emailDetails = await mailpitClient.getMessage(emailId)

  // Use the MAGIC_LINK marker to extract the link
  const magicLinkRegex = /MAGIC_LINK: (.*?)(\s|$)/
  const matches = emailDetails.Text.match(magicLinkRegex)

  if (!matches || matches.length < 2) {
    throw new Error('Magic link not found in email')
  }

  return matches[1].trim()
}

test.describe('Main Navigation', () => {
  let loginPage: LoginPage
  let mainLayoutPage: MainLayoutPage
  let mailpitClient: MailpitClient

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    mainLayoutPage = new MainLayoutPage(page)
    mailpitClient = new MailpitClient()


    // Log in a test user
    await loginPage.goto('/login')
    const uniqueEmail = generateUniqueEmail()
    await loginPage.login(uniqueEmail, true)

    // Get magic link and use it
    const emailMessage = await mailpitClient.waitForMessageByRecipient(uniqueEmail, 10000)
    if (!emailMessage) {
      test.fail(true, 'Email not received')
      return
    }

    const magicLink = await extractMagicLinkFromEmail(mailpitClient, emailMessage.ID)
    await page.goto(magicLink)

    // If profile completion is needed, do it
    const url = page.url()
    if (url.includes('/profile')) {
      await page.fill('[data-testid="profile-firstname-input"]', 'Test')
      await page.fill('[data-testid="profile-lastname-input"]', 'User')
      await page.click('[data-testid="profile-update-button"]')
      // Wait for navigation after profile update
      await page.waitForNavigation()
    }
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

    // Verify we're on the login page
    expect(mainLayoutPage.getPage().url()).toContain('/login')

    // Verify we're not authenticated
    expect(await mainLayoutPage.isAuthenticated()).toBeFalsy()
  })
})
