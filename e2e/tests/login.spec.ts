import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { MailpitClient } from '../clients/MailpitClient'
import { env } from '../env'
import { ProfilePage } from '../pages/ProfilePage'
import { HomePage } from '../pages/HomePage'
import { MainLayoutPage } from '../pages/MainLayoutPage'
import { generateUniqueEmail, extractMagicLinkFromEmail } from '../utils'

test.describe('Login Page', () => {
  let loginPage: LoginPage
  let mailpitClient: MailpitClient

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    mailpitClient = new MailpitClient()
    await loginPage.goto('/login')
  })

  test('should display login form', async () => {
    // Verify email input is visible
    await expect(loginPage.getEmailInput()).toBeVisible()

    // Verify terms checkbox is visible
    await expect(loginPage.getTermsCheckbox()).toBeVisible()

    // Verify submit button is visible
    await expect(loginPage.getSubmitButton()).toBeVisible()
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

  test('should show profile completion banner on first login and the home page on subsequent logins', async ({
    page,
  }) => {
    // Create unique email for this test
    const uniqueEmail = generateUniqueEmail()

    // First login
    await loginPage.login(uniqueEmail, true)

    // Wait for the email to arrive
    const emailMessage = await mailpitClient.waitForMessageByRecipient(uniqueEmail, 10000)
    expect(emailMessage).not.toBeNull()

    // Fail test if email wasn't received
    if (!emailMessage) {
      test.fail(true, 'Email not received')
      return
    }

    // Extract the magic link from the email
    const magicLink = await extractMagicLinkFromEmail(mailpitClient, emailMessage.ID)

    // Click the magic link (first time login)
    await page.goto(magicLink)

    // Should be redirected to home page with profile completion banner
    await page.waitForLoadState('networkidle')
    const mainLayoutPage = new MainLayoutPage(page)
    await expect(page).toHaveURL('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(100)
    // Verify profile completion banner is visible
    expect(await mainLayoutPage.isProfileCompletionBannerVisible()).toBeTruthy()

    // Click on the complete profile button
    await mainLayoutPage.clickCompleteProfileButton()

    // Should now be on profile page
    const profilePage = new ProfilePage(page)
    await expect(page).toHaveURL(/.*profile/)

    // Fill out the profile form
    await profilePage.fillForm('Test', 'User')
    await profilePage.clickUpdate()

    // Log out using MainLayoutPage
    await mainLayoutPage.logout()

    // Delete the first email message to ensure we don't pick it up in the next step
    await mailpitClient.deleteMessage(emailMessage.ID)

    // Go back to login page for second login attempt
    await loginPage.goto('/login')
    await loginPage.login(uniqueEmail, true)

    // Wait for the second email to arrive
    const secondEmailMessage = await mailpitClient.waitForMessageByRecipient(uniqueEmail, 10000)
    expect(secondEmailMessage).not.toBeNull()

    // Fail the rest of the test if the second email wasn't received
    if (!secondEmailMessage) {
      test.fail(true, 'Second email not received')
      return
    }

    // Extract the magic link from the second email
    const secondMagicLink = await extractMagicLinkFromEmail(mailpitClient, secondEmailMessage.ID)

    // Click the magic link (second login)
    await page.goto(secondMagicLink)

    // Add explicit waiting for navigation to complete and page to stabilize
    await page.waitForLoadState('networkidle')

    // Should redirect to home page for returning user
    const homePage = new HomePage(page)
    await expect(page).toHaveURL('/')

    // Verify we're on the home page using MainLayoutPage to check
    const mainLayoutForSecondLogin = new MainLayoutPage(page)
    expect(await mainLayoutForSecondLogin.isOnPage('home')).toBeTruthy()

    // Profile completion banner should NOT be visible
    expect(await mainLayoutForSecondLogin.isProfileCompletionBannerVisible()).toBeFalsy()

    // Add retry logic for authentication check to handle potential race conditions
    let isAuthenticated = false
    for (let i = 0; i < 3; i++) {
      isAuthenticated = await mainLayoutForSecondLogin.isAuthenticated()
      if (isAuthenticated) break
      await page.waitForTimeout(500)
    }
    expect(isAuthenticated).toBeTruthy()
  })

  test('should display error flash message when redirected with error parameter', async ({ page }) => {
    // Initialize login page
    const loginPage = new LoginPage(page)

    // Test each error type
    const errorTests = [
      { errorCode: 'missing_token', expectedMessage: 'The verification link is invalid or missing a required token.' },
      {
        errorCode: 'invalid_token',
        expectedMessage: 'The verification link has expired or is invalid. Please request a new one.',
      },
      { errorCode: 'unknown_error', expectedMessage: 'An error occurred during sign in. Please try again.' },
    ]

    for (const { errorCode, expectedMessage } of errorTests) {
      // Navigate to login page with error parameter
      await loginPage.goto(`/login?error=${errorCode}`)

      // Verify the error alert is visible
      const errorAlert = loginPage.getErrorAlert()
      await expect(errorAlert).toBeVisible()

      // Verify the correct error message is displayed
      await expect(errorAlert).toContainText(expectedMessage)
    }
  })
})
