import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { MailpitClient } from '../clients/MailpitClient'
import { env } from '../env'

// Helper function to generate unique email addresses
function generateUniqueEmail() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `test-${timestamp}-${random}@example.com`
}

test.describe('Login Page', () => {
  let loginPage: LoginPage
  let mailpitClient: MailpitClient

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    mailpitClient = new MailpitClient()
    await loginPage.goto('/login')
    // Clear any existing emails in the mailbox before each test
    await mailpitClient.deleteAllMessages()
  })

  test('should display login form', async () => {
    // Verify email input is visible
    await expect(loginPage.getPage().locator('[data-testid="login-email-input"]')).toBeVisible()

    // Verify terms checkbox is visible
    await expect(loginPage.getPage().locator('[data-testid="login-terms-checkbox"]')).toBeVisible()

    // Verify submit button is visible
    await expect(loginPage.getPage().locator('[data-testid="login-submit-button"]')).toBeVisible()
  })

  test('should require terms agreement to submit', async () => {
    // Enter email but don't check terms
    const uniqueEmail = generateUniqueEmail()
    await loginPage.enterEmail(uniqueEmail)

    // Submit button should be disabled
    expect(await loginPage.isSubmitButtonDisabled()).toBeTruthy()

    // Check terms agreement
    await loginPage.checkTermsAgreement()

    // Submit button should now be enabled
    expect(await loginPage.isSubmitButtonDisabled()).toBeFalsy()
  })

  test('should show error when submitting without terms agreement', async () => {
    // Enter email
    const uniqueEmail = generateUniqueEmail()
    await loginPage.enterEmail(uniqueEmail)

    // Set up alert handler
    loginPage.getPage().on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Please agree to the Privacy Policy and Terms of Service to continue.')
      await dialog.accept()
    })

    // Try to submit without checking terms (force click since button is disabled)
    await loginPage.clickSubmitButton(true)
  })

  test('should navigate to privacy policy when clicking link', async () => {
    // Click privacy policy link
    await loginPage.clickPrivacyPolicyLink()

    // Should navigate to privacy policy page
    await expect(loginPage.getPage()).toHaveURL(/.*privacy-policy/)
  })

  test('should navigate to terms of service when clicking link', async () => {
    // Click terms of service link
    await loginPage.clickTermsOfServiceLink()

    // Should navigate to terms of service page
    await expect(loginPage.getPage()).toHaveURL(/.*terms-of-service/)
  })

  test('should send magic link when submitting login form', async () => {
    const uniqueEmail = generateUniqueEmail()

    // Set up alert handler
    loginPage.getPage().on('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Magic link has been sent to your email. Please check your inbox.')
      await dialog.accept()
    })

    // Complete login flow
    await loginPage.login(uniqueEmail, true)

    // Verify the API response
    const response = await loginPage.getPage().evaluate(async (email) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      return res.json()
    }, uniqueEmail)

    expect(response.success).toBe(true)
    expect(response.message).toBe('Magic link sent! Check your email.')

    // Wait for the email to arrive in Mailpit
    const emailMessage = await mailpitClient.waitForMessageByRecipient(uniqueEmail, 10000)

    // Verify the email was received
    expect(emailMessage).not.toBeNull()
    expect(emailMessage?.To.some((recipient) => recipient.Address === uniqueEmail)).toBe(true)

    // Get the full email details to verify content
    if (emailMessage) {
      const emailDetails = await mailpitClient.getMessage(emailMessage.ID)

      // Verify the email contains a magic link
      expect(emailDetails.Text).toContain('Click the link below')
      expect(emailDetails.Text).toContain(env.API_URL + '/api/auth/verify?token=')
    }
  })
})
