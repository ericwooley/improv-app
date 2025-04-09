import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { GroupFormComponent } from '../components/GroupFormComponent'

export class NewGroupPage extends BasePage {
  // Components
  private groupForm: GroupFormComponent

  constructor(page: Page) {
    super(page)
    this.groupForm = new GroupFormComponent(page)
  }

  /**
   * Navigate to the new group page
   */
  async goto() {
    await this.page.goto('/groups/new')
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForURL(/.*\/groups\/new.*/)
    await this.groupForm.waitForForm()
  }

  /**
   * Create a new group with the provided name and description
   * Uses the GroupFormComponent to interact with the form
   */
  async createGroup(
    name: string = `Test Group ${Date.now()}`,
    description: string = 'This is a test group created by e2e tests'
  ): Promise<{ id: string; name: string; description: string }> {
    try {
      // Navigate directly to the new group page
      await this.goto()

      // Wait for the form to load
      await this.groupForm.waitForForm()

      // Fill the form fields
      await this.groupForm.fillForm(name, description)

      // Submit the form
      await this.groupForm.submit()

      // Wait for navigation to complete or timeout
      try {
        await this.page.waitForURL(/groups/, { timeout: 10000 })
        await this.page.locator('a:has-text("' + name + '")').click()
      } catch (e) {
        console.log('Navigation did not complete, but continuing')
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }

    // Extract the group ID from the URL if possible
    let id = ''
    try {
      const url = this.page.url()
      const match = url.match(/\/groups\/(.*)/)
      if (match && match[1]) {
        id = match[1].split(/\/|\?/)[0]
      }
    } catch (error) {
      console.error('Error extracting group ID:', error)
    }

    // Return the group details including ID
    return { id, name, description }
  }

  /**
   * Fill the group form but don't submit
   */
  async fillGroupForm(name: string, description: string) {
    await this.groupForm.fillForm(name, description)
  }

  /**
   * Submit the group form
   */
  async submitGroupForm() {
    await this.groupForm.submit()
  }

  /**
   * Cancel group creation and return to groups page
   */
  async cancelGroupCreation() {
    await this.groupForm.cancel()
    await this.page.waitForURL(/.*\/groups$/)
  }

  /**
   * Check if there is a validation error
   */
  async hasValidationError() {
    return await this.groupForm.hasError()
  }

  /**
   * Get validation error message
   */
  async getValidationErrorMessage() {
    return await this.groupForm.getErrorMessage()
  }

  /**
   * Check if the form is in a loading state
   */
  async isFormLoading() {
    return await this.groupForm.isFormDisabled()
  }
}
