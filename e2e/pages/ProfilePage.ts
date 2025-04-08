import { BasePage } from './BasePage'
import { Page } from '@playwright/test'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'

export class ProfilePage extends BasePage {
  // Text fields
  private firstNameField: TextField
  private lastNameField: TextField

  // Buttons
  private cancelButton: Button
  private updateProfileButton: Button

  constructor(page: Page) {
    super(page)

    // Initialize components
    this.firstNameField = new TextField(page, 'profile-first-name-input')
    this.lastNameField = new TextField(page, 'profile-last-name-input')
    this.cancelButton = new Button(page, 'profile-cancel-button')
    this.updateProfileButton = new Button(page, 'profile-update-button')
  }

  // Navigation
  async navigateToProfile() {
    await this.goto('/profile')
  }

  // Form interactions
  async fillFirstName(firstName: string) {
    await this.firstNameField.fill(firstName)
  }

  async fillLastName(lastName: string) {
    await this.lastNameField.fill(lastName)
  }

  async fillForm(firstName: string, lastName: string) {
    await this.fillFirstName(firstName)
    await this.fillLastName(lastName)
  }

  async clickCancel() {
    await this.cancelButton.click()
  }

  async clickUpdate() {
    await this.updateProfileButton.click()
  }

  // State verification
  async isLoading() {
    return await this.page.isVisible('[data-testid="profile-loading"]')
  }

  async isSuccessAlertVisible() {
    return await this.page.isVisible('[data-testid="profile-success-alert"]')
  }

  async isErrorAlertVisible() {
    return await this.page.isVisible('[data-testid="profile-error-alert"]')
  }

  async getErrorMessage() {
    const errorAlert = this.page.locator('[data-testid="profile-error-alert"]')
    return await errorAlert.textContent()
  }

  async getFirstNameValue() {
    return await this.firstNameField.getValue()
  }

  async getLastNameValue() {
    return await this.lastNameField.getValue()
  }
}
