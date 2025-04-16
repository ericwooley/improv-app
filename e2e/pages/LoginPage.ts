import { BasePage } from './BasePage'
import { Page } from '@playwright/test'
import { TextField } from '../components/TextField'
import { Checkbox } from '../components/Checkbox'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'
import { Tab } from '../components/Tab'
import { ToggleButton } from '../components/ToggleButton'

export class LoginPage extends BasePage {
  // Component objects for login tab
  private emailInput: TextField
  private passwordInput: TextField
  private termsCheckbox: Checkbox
  private submitButton: Button
  private errorAlert: Alert

  // Component objects for registration tab
  private registerEmailInput: TextField
  private registerPasswordInput: TextField
  private registerConfirmPasswordInput: TextField
  private registerTermsCheckbox: Checkbox
  private registerSubmitButton: Button

  // Component objects for tabs and login method toggle
  private loginTab: Tab
  private registerTab: Tab
  private magicLinkToggle: ToggleButton
  private passwordToggle: ToggleButton

  // Selectors for auth tabs
  private readonly authTabsSelector = '[data-testid="auth-tabs"]'
  private readonly loginTabSelector = '[data-testid="login-tab"]'
  private readonly registerTabSelector = '[data-testid="register-tab"]'

  // Selectors for login method toggle
  private readonly loginMethodToggleSelector = '[data-testid="login-method-toggle"]'
  private readonly magicLinkLoginButtonSelector = '[data-testid="magic-link-login-button"]'
  private readonly passwordLoginButtonSelector = '[data-testid="password-login-button"]'

  // Selectors for login form
  private readonly emailInputSelector = '[data-testid="login-email-input"]'
  private readonly passwordInputSelector = '[data-testid="login-password-input"]'
  private readonly termsCheckboxSelector = '[data-testid="login-terms-checkbox"]'
  private readonly submitButtonSelector = '[data-testid="login-submit-button"]'

  // Selectors for register form
  private readonly registerEmailInputSelector = '[data-testid="register-email-input"]'
  private readonly registerPasswordInputSelector = '[data-testid="register-password-input"]'
  private readonly registerConfirmPasswordInputSelector = '[data-testid="register-confirm-password-input"]'
  private readonly registerTermsCheckboxSelector = '[data-testid="register-terms-checkbox"]'
  private readonly registerSubmitButtonSelector = '[data-testid="register-submit-button"]'

  // Selectors for links and alerts
  private readonly errorAlertSelector = '[data-testid="auth-error-alert"]'
  private readonly loginPrivacyPolicyLinkSelector = '[data-testid="login-privacy-policy-link"]'
  private readonly loginTermsOfServiceLinkSelector = '[data-testid="login-terms-of-service-link"]'
  private readonly registerPrivacyPolicyLinkSelector = '[data-testid="register-privacy-policy-link"]'
  private readonly registerTermsOfServiceLinkSelector = '[data-testid="register-terms-of-service-link"]'
  private readonly browseGamesLinkSelector = '[data-testid="browse-games-link"]'

  constructor(page: Page) {
    super(page)

    // Initialize login form components
    this.emailInput = new TextField(page, 'login-email-input')
    this.passwordInput = new TextField(page, 'login-password-input')
    this.termsCheckbox = new Checkbox(page, 'login-terms-checkbox')
    this.submitButton = new Button(page, 'login-submit-button')

    // Initialize register form components
    this.registerEmailInput = new TextField(page, 'register-email-input')
    this.registerPasswordInput = new TextField(page, 'register-password-input')
    this.registerConfirmPasswordInput = new TextField(page, 'register-confirm-password-input')
    this.registerTermsCheckbox = new Checkbox(page, 'register-terms-checkbox')
    this.registerSubmitButton = new Button(page, 'register-submit-button')

    // Initialize tab and toggle components
    this.loginTab = new Tab(page, 'login-tab')
    this.registerTab = new Tab(page, 'register-tab')
    this.magicLinkToggle = new ToggleButton(page, 'magic-link-login-button')
    this.passwordToggle = new ToggleButton(page, 'password-login-button')

    // Initialize error alert
    this.errorAlert = new Alert(page, 'auth-error-alert')
  }

  // Method to access page property (for compatibility with existing tests)
  getPage(): Page {
    return this.page
  }

  // Legacy methods for backward compatibility with existing tests
  getEmailInput() {
    return this.page.locator(this.emailInputSelector)
  }

  getTermsCheckbox() {
    return this.page.locator(this.termsCheckboxSelector)
  }

  getSubmitButton() {
    return this.page.locator(this.submitButtonSelector)
  }

  getErrorAlert() {
    return this.page.locator(this.errorAlertSelector)
  }

  async enterEmail(email: string) {
    await this.enterLoginEmail(email)
  }

  async checkTermsAgreement() {
    await this.checkLoginTermsAgreement()
  }

  async uncheckTermsAgreement() {
    await this.uncheckLoginTermsAgreement()
  }

  async isTermsChecked() {
    return await this.isLoginTermsChecked()
  }

  async clickSubmitButton(force = false) {
    await this.clickLoginSubmitButton(force)
  }

  async isSubmitButtonDisabled() {
    return await this.isLoginSubmitButtonDisabled()
  }

  async clickPrivacyPolicyLink() {
    await this.clickLoginPrivacyPolicyLink()
  }

  async clickTermsOfServiceLink() {
    await this.clickLoginTermsOfServiceLink()
  }

  // Legacy login method for backward compatibility
  async login(email: string, agreeToTerms: boolean = true) {
    await this.loginWithMagicLink(email, agreeToTerms)
  }

  // Tab selection methods
  async selectLoginTab() {
    await this.loginTab.click()
  }

  async selectRegisterTab() {
    await this.registerTab.click()
  }

  // Login method toggle methods
  async selectMagicLinkLogin() {
    await this.magicLinkToggle.click()
  }

  async selectPasswordLogin() {
    await this.passwordToggle.click()
  }

  // Login form methods
  async enterLoginEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async enterLoginPassword(password: string) {
    await this.passwordInput.fill(password)
  }

  async checkLoginTermsAgreement() {
    await this.termsCheckbox.check()
  }

  async uncheckLoginTermsAgreement() {
    await this.termsCheckbox.uncheck()
  }

  async isLoginTermsChecked() {
    return await this.termsCheckbox.isChecked()
  }

  async clickLoginSubmitButton(force = false) {
    await this.submitButton.click(force)
  }

  async isLoginSubmitButtonDisabled() {
    return await this.submitButton.isDisabled()
  }

  // Register form methods
  async enterRegisterEmail(email: string) {
    await this.registerEmailInput.fill(email)
  }

  async enterRegisterPassword(password: string) {
    await this.registerPasswordInput.fill(password)
  }

  async enterRegisterConfirmPassword(confirmPassword: string) {
    await this.registerConfirmPasswordInput.fill(confirmPassword)
  }

  async checkRegisterTermsAgreement() {
    await this.registerTermsCheckbox.check()
  }

  async uncheckRegisterTermsAgreement() {
    await this.registerTermsCheckbox.uncheck()
  }

  async isRegisterTermsChecked() {
    return await this.registerTermsCheckbox.isChecked()
  }

  async clickRegisterSubmitButton(force = false) {
    await this.registerSubmitButton.click(force)
  }

  async isRegisterSubmitButtonDisabled() {
    return await this.registerSubmitButton.isDisabled()
  }

  // Error handling methods
  async isErrorAlertVisible() {
    return await this.errorAlert.isVisible()
  }

  async getErrorAlertText() {
    return await this.errorAlert.getText()
  }

  // Link methods
  async clickLoginPrivacyPolicyLink() {
    await this.page.click(this.loginPrivacyPolicyLinkSelector)
  }

  async clickLoginTermsOfServiceLink() {
    await this.page.click(this.loginTermsOfServiceLinkSelector)
  }

  async clickRegisterPrivacyPolicyLink() {
    await this.page.click(this.registerPrivacyPolicyLinkSelector)
  }

  async clickRegisterTermsOfServiceLink() {
    await this.page.click(this.registerTermsOfServiceLinkSelector)
  }

  async clickBrowseGamesLink() {
    await this.page.click(this.browseGamesLinkSelector)
  }

  // Helper method for magic link login flow
  async loginWithMagicLink(email: string, agreeToTerms: boolean = true) {
    await this.selectLoginTab()
    await this.selectMagicLinkLogin()
    await this.enterLoginEmail(email)

    if (agreeToTerms) {
      await this.checkLoginTermsAgreement()
    }

    await this.clickLoginSubmitButton()
  }

  // Helper method for password login flow
  async loginWithPassword(email: string, password: string, agreeToTerms: boolean = true) {
    await this.selectLoginTab()
    await this.selectPasswordLogin()
    await this.enterLoginEmail(email)
    await this.enterLoginPassword(password)

    if (agreeToTerms) {
      await this.checkLoginTermsAgreement()
    }

    await this.clickLoginSubmitButton()
  }

  // Helper method for registration flow
  async register(email: string, password: string, confirmPassword: string, agreeToTerms: boolean = true) {
    await this.selectRegisterTab()
    await this.enterRegisterEmail(email)
    await this.enterRegisterPassword(password)
    await this.enterRegisterConfirmPassword(confirmPassword)

    if (agreeToTerms) {
      await this.checkRegisterTermsAgreement()
    }

    await this.clickRegisterSubmitButton()
  }
}
