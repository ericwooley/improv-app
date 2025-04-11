import { MailpitClient } from './clients/MailpitClient'
import { Page } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import sqlite3 from 'sqlite3'
import path from 'path'
import { NewGroupPage } from './pages/NewGroupPage'
import { NewGamePage } from './pages/NewGamePage'

/**
 * Generates a unique email address for testing
 */
export function generateUniqueEmail(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `test-${timestamp}-${random}@example.com`
}

/**
 * Extracts the magic link from an email
 */
export async function extractMagicLinkFromEmail(mailpitClient: MailpitClient, emailId: string): Promise<string> {
  const emailDetails = await mailpitClient.getMessage(emailId)

  // Use the MAGIC_LINK marker to extract the link
  const magicLinkRegex = /MAGIC_LINK: (.*?)(\s|$)/
  const matches = emailDetails.Text.match(magicLinkRegex)

  if (!matches || matches.length < 2) {
    throw new Error('Magic link not found in email')
  }

  return matches[1].trim()
}

export async function addProfileToDB(
  email: string,
  {
    firstName = 'Test',
    lastName = 'User',
  }: {
    firstName?: string
    lastName?: string
  } = {}
): Promise<void> {
  const sqlClient = new sqlite3.Database(path.resolve(__dirname, process.env.DATABASE_URL || ''))
  await new Promise((resolve, reject) =>
    sqlClient.run(
      `
    update users set first_name = ?, last_name = ? where email = ?
  `,
      [firstName, lastName, email],
      (err) => {
        if (err) reject(err)
        else resolve(true)
      }
    )
  )
}

/**
 * Performs the complete login flow including waiting for and using the magic link
 */
export async function loginWithMagicLink(
  page: Page,
  email?: string,
  { deleteEmail = true, setupProfileWithSQL = true }: { deleteEmail?: boolean; setupProfileWithSQL?: boolean } = {}
): Promise<void> {
  // Initialize necessary objects
  const loginPage = new LoginPage(page)
  const mailpitClient = new MailpitClient()

  // Generate a unique email if none provided
  const testEmail = email || generateUniqueEmail()

  // Go to login page and submit email
  await loginPage.goto('/login')
  await loginPage.login(testEmail, true)

  // Wait for the email to arrive
  const emailMessage = await mailpitClient.waitForMessageByRecipient(testEmail, 10000)
  if (!emailMessage) {
    throw new Error('Login email not received')
  }

  if (setupProfileWithSQL) {
    await addProfileToDB(testEmail)
  }

  // Extract and use the magic link
  const magicLink = await extractMagicLinkFromEmail(mailpitClient, emailMessage.ID)
  if (deleteEmail) {
    await mailpitClient.deleteMessage(emailMessage.ID)
  }

  await page.goto(magicLink)
}

/**
 * Creates a test group for use in tests
 * @returns Object containing the created group's id, name, and description
 */
export async function createTestGroup(
  page: Page,
  options: {
    name?: string
    description?: string
  } = {}
): Promise<{ id: string; name: string; description: string }> {
  // Initialize the new group page
  const newGroupPage = new NewGroupPage(page)

  // Create a group with either provided or generated details
  const groupName = options.name || `Test Group ${Date.now()}`
  const groupDescription = options.description || 'This is a test group created for e2e testing'

  // Navigate to new group page and create the group
  await page.goto('/groups/new')
  const groupDetails = await newGroupPage.createGroup(groupName, groupDescription)

  return groupDetails
}

/**
 * Creates a test game within a group for use in tests
 * @returns Object containing the created game details
 */
export async function createTestGame(
  page: Page,
  groupId: string,
  options: {
    name?: string
    description?: string
    minPlayers?: number
    maxPlayers?: number
    tags?: string[]
    isPublic?: boolean
  } = {}
): Promise<{ id: string; name: string; description: string }> {
  // Initialize the new game page
  const newGamePage = new NewGamePage(page)

  // Default game data with either provided values or defaults
  const gameData = {
    name: options.name || `Test Game ${Date.now()}`,
    description: options.description || 'This is a test game created for e2e testing',
    minPlayers: options.minPlayers || 2,
    maxPlayers: options.maxPlayers || 8,
    tags: options.tags || [],
    isPublic: options.isPublic !== undefined ? options.isPublic : true,
  }

  // Navigate to new game page with the group ID
  await page.goto(`/games/new?groupId=${groupId}`)

  // Wait for page to load
  await newGamePage.waitForPageLoad()

  // Fill the form with game data
  await newGamePage.fillGameForm(gameData)

  // Submit the form
  await newGamePage.submitGameForm()

  // Wait for navigation to complete
  await page.waitForURL(/\/groups\/.*/, { timeout: 10000 })

  // Extract the game ID from the URL
  const url = page.url()
  const match = url.match(/\/games\/(.*)/)
  const gameId = match && match[1] ? match[1].split(/\/|\?/)[0] : ''

  return {
    id: gameId,
    name: gameData.name,
    description: gameData.description,
  }
}
