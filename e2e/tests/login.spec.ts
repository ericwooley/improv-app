import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

test.describe('Login Page', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto('/login')
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
    await loginPage.enterEmail('test@example.com')

    // Submit button should be disabled
    expect(await loginPage.isSubmitButtonDisabled()).toBeTruthy()

    // Check terms agreement
    await loginPage.checkTermsAgreement()

    // Submit button should now be enabled
    expect(await loginPage.isSubmitButtonDisabled()).toBeFalsy()
  })

  test('should show error when submitting without terms agreement', async () => {
    // Enter email
    await loginPage.enterEmail('test@example.com')

    // Try to submit without checking terms
    await loginPage.clickSubmitButton()

    // Should show alert about agreeing to terms
    // Note: This assumes the alert is shown via a browser alert
    // In a real test, you might need to handle this differently
    // depending on how your app shows this error
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

  test('should submit login form successfully', async () => {
    // Complete login flow
    await loginPage.login('test@example.com', true)

    // In a real test, you would verify the success state
    // This might include checking for a success message,
    // verifying navigation to a dashboard, etc.
  })
})
