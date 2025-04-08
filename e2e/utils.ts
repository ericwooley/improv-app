import { MailpitClient } from './clients/MailpitClient'
import { Page } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import sqlite3 from 'sqlite3'
import path from 'path'
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
