import { MailpitClient } from './clients/MailpitClient'
import { Page } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

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

/**
 * Performs the complete login flow including waiting for and using the magic link
 */
export async function loginWithMagicLink(page: Page, email?: string): Promise<void> {
  // Initialize necessary objects
  const loginPage = new LoginPage(page)
  const mailpitClient = new MailpitClient()

  // Generate a unique email if none provided
  const testEmail = email || generateUniqueEmail()

  // Clear any existing emails
  await mailpitClient.deleteAllMessages()

  // Go to login page and submit email
  await loginPage.goto('/login')
  await loginPage.login(testEmail, true)

  // Wait for the email to arrive
  const emailMessage = await mailpitClient.waitForMessageByRecipient(testEmail, 10000)
  if (!emailMessage) {
    throw new Error('Login email not received')
  }

  // Extract and use the magic link
  const magicLink = await extractMagicLinkFromEmail(mailpitClient, emailMessage.ID)
  await mailpitClient.deleteMessage(emailMessage.ID)
  await page.goto(magicLink)
}
