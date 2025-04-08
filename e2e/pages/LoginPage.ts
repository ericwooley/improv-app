import { BasePage } from './BasePage'
import { Page } from '@playwright/test'
import { TextField } from '../components/TextField'
import { Checkbox } from '../components/Checkbox'
import { Button } from '../components/Button'
import { Alert } from '../components/Alert'

export class LoginPage extends BasePage {
  // Component objects
  private emailInput: TextField
  private termsCheckbox: Checkbox
  private submitButton: Button
  private errorAlert: Alert

  constructor(page: Page) {
    super(page)

    // Initialize component objects
    this.emailInput = new TextField(page, 'login-email-input')
    this.termsCheckbox = new Checkbox(page, 'login-terms-checkbox')
    this.submitButton = new Button(page, 'login-submit-button')
    this.errorAlert = new Alert(page, 'login-error-alert')
  }

  // Methods to access page property
  getPage(): Page {
    return this.page
  }

  // Actions
  async enterEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async checkTermsAgreement() {
    await this.termsCheckbox.check()
  }

  async uncheckTermsAgreement() {
    await this.termsCheckbox.uncheck()
  }

  async isTermsChecked() {
    return await this.termsCheckbox.isChecked()
  }

  async clickSubmitButton() {
    await this.submitButton.click()
  }

  async isSubmitButtonDisabled() {
    return await this.submitButton.isDisabled()
  }

  async isErrorAlertVisible() {
    return await this.errorAlert.isVisible()
  }

  async getErrorAlertText() {
    return await this.errorAlert.getText()
  }

  async clickPrivacyPolicyLink() {
    await this.page.click('[data-testid="login-privacy-policy-link"]')
  }

  async clickTermsOfServiceLink() {
    await this.page.click('[data-testid="login-terms-of-service-link"]')
  }

  // Helper method to perform the complete login flow
  async login(email: string, agreeToTerms: boolean = true) {
    await this.enterEmail(email)

    if (agreeToTerms) {
      await this.checkTermsAgreement()
    }

    await this.clickSubmitButton()
  }
}
