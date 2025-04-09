import { Page, Locator } from '@playwright/test'

export class GroupFormComponent {
  protected page: Page
  private nameInput: Locator
  private descriptionTextarea: Locator
  private submitButton: Locator
  private cancelButton: Locator
  private errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('input[id="name"]')
    this.descriptionTextarea = page.locator('textarea[id="description"]')
    this.submitButton = page.locator('button[data-testid="action-button-create-group"]')
    this.cancelButton = page.locator('button:has-text("Cancel")')
    this.errorAlert = page.locator('div.alert.alert-danger')
  }

  /**
   * Fill the name field
   */
  async fillName(name: string) {
    await this.nameInput.fill(name)
  }

  /**
   * Fill the description field
   */
  async fillDescription(description: string) {
    await this.descriptionTextarea.fill(description)
  }

  /**
   * Fill all form fields
   */
  async fillForm(name: string, description: string) {
    await this.fillName(name)
    await this.fillDescription(description)
  }

  /**
   * Submit the form by clicking the submit button
   */
  async submit() {
    await this.submitButton.click()
  }

  /**
   * Cancel the form by clicking the cancel button
   */
  async cancel() {
    await this.cancelButton.click()
  }

  /**
   * Check if the form is visible on the page
   */
  async isFormVisible() {
    return (await this.nameInput.isVisible()) && (await this.descriptionTextarea.isVisible())
  }

  /**
   * Check if there is a validation error displayed
   */
  async hasError() {
    return await this.errorAlert.isVisible()
  }

  /**
   * Get the error message text
   */
  async getErrorMessage() {
    if (await this.hasError()) {
      return await this.errorAlert.textContent()
    }
    return null
  }

  /**
   * Get the current name value
   */
  async getNameValue() {
    return await this.nameInput.inputValue()
  }

  /**
   * Get the current description value
   */
  async getDescriptionValue() {
    return await this.descriptionTextarea.inputValue()
  }

  /**
   * Check if any field is disabled
   */
  async isFormDisabled() {
    const nameDisabled = await this.nameInput.isDisabled()
    const descriptionDisabled = await this.descriptionTextarea.isDisabled()
    return nameDisabled && descriptionDisabled
  }

  /**
   * Wait for the form to load
   */
  async waitForForm() {
    await this.nameInput.waitFor({ state: 'visible' })
    await this.descriptionTextarea.waitFor({ state: 'visible' })
  }
}
