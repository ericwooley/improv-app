import { test, expect } from '@playwright/test'
import { MailpitClient } from '../clients/MailpitClient'
import { LoginPage } from '../pages/LoginPage'

test.describe('Email Verification', () => {
  let mailpitClient: MailpitClient
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    // Initialize the MailpitClient
    mailpitClient = new MailpitClient()

    // Clear any existing emails in Mailpit
    await mailpitClient.deleteAllMessages()

    // Initialize the login page
    loginPage = new LoginPage(page)
    await loginPage.goto('/login')
  })

  test('should send magic link email when logging in', async ({ page }) => {
    const testEmail = 'test@example.com'

    // Complete the login form
    await loginPage.enterEmail(testEmail)
    await loginPage.checkTermsAgreement()

    // Set up alert handler for the success message
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Magic link has been sent to your email. Please check your inbox.')
      await dialog.accept()
    })

    // Submit the form
    await loginPage.clickSubmitButton()

    // Wait for the email to arrive in Mailpit
    const email = await mailpitClient.waitForMessageByRecipient(testEmail)

    // Verify the email was received
    expect(email).not.toBeNull()
    if (email) {
      expect(email.To.some((recipient) => recipient.Address === testEmail)).toBeTruthy()

      // Get the full message details
      const messageDetails = await mailpitClient.getMessage(email.ID)

      // Verify the email content
      expect(messageDetails.Subject).toContain('Magic Link')
      expect(messageDetails.HTML).toContain('magic link')

      // You can also extract the magic link URL from the email content
      // This would depend on how your email is formatted
      const magicLinkMatch = messageDetails.HTML.match(/href="([^"]+)"/)
      expect(magicLinkMatch).not.toBeNull()

      if (magicLinkMatch && magicLinkMatch[1]) {
        const magicLink = magicLinkMatch[1]

        // You could navigate to the magic link to complete the login
        // await page.goto(magicLink)
        // Then verify the user is logged in
      }
    }
  })
})
