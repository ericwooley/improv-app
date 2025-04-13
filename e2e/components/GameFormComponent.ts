import { Page, Locator } from '@playwright/test'

export class GameFormComponent {
  protected page: Page
  private nameInput: Locator
  private descriptionTextarea: Locator
  private minPlayersInput: Locator
  private maxPlayersInput: Locator
  private tagsInput: Locator
  private publicSwitch: Locator
  private submitButton: Locator
  private cancelButton: Locator
  private errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.nameInput = page.locator('input[id="name"]')
    this.descriptionTextarea = page.locator('textarea[id="description"]')
    this.minPlayersInput = page.locator('input[id="minPlayers"]')
    this.maxPlayersInput = page.locator('input[id="maxPlayers"]')
    this.tagsInput = page.locator('[data-testid="game-form-tags-input"] input')
    this.publicSwitch = page.locator('[data-testid="game-form-public-switch"]')
    this.submitButton = page.locator('[data-testid="game-form-submit-button"]')
    this.cancelButton = page.locator('[data-testid="game-form-cancel-button"]')
    this.errorAlert = page.locator('[data-testid="game-form-error-alert"]')
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
   * Set minimum players
   */
  async setMinPlayers(count: number) {
    await this.minPlayersInput.fill(count.toString())
  }

  /**
   * Set maximum players
   */
  async setMaxPlayers(count: number) {
    await this.maxPlayersInput.fill(count.toString())
  }

  /**
   * Add a tag
   */
  async addTag(tag: string) {
    // Format the tag for matching with test IDs
    const formattedTag = tag.toLowerCase().replace(/\s+/g, '-')

    // Click the tags input
    await this.tagsInput.click()

    // Type the tag name to filter the dropdown
    await this.page.keyboard.type(tag)

    // Wait for suggestions to appear
    await this.page.waitForTimeout(500)

    try {
      // First try to find a suggestion using data-testid
      const tagOptionSelector = `[data-testid="tag-option-${formattedTag}"]`
      const hasSpecificTestId = await this.page.locator(tagOptionSelector).isVisible()

      if (hasSpecificTestId) {
        // If found with test ID, click it
        await this.page.locator(tagOptionSelector).click()
      } else {
        // Otherwise try to find it by text content in the dropdown
        const suggestion = this.page.locator('.MuiAutocomplete-popper li').filter({ hasText: tag }).first()

        if (await suggestion.isVisible()) {
          await suggestion.click()
        } else {
          // If tag not found in dropdown, clear the input since we can only use predefined tags
          await this.page.keyboard.press('Escape')
        }
      }
    } catch (error) {
      // If error occurs, clear the input by pressing Escape
      await this.page.keyboard.press('Escape')
    }

    // Wait for UI to update
    await this.page.waitForTimeout(300)
  }

  /**
   * Set game visibility
   */
  async setPublic(isPublic: boolean) {
    const isCurrentlyChecked = await this.publicSwitch.isChecked()
    if (isCurrentlyChecked !== isPublic) {
      await this.publicSwitch.click()
    }
  }

  /**
   * Fill all required form fields
   */
  async fillForm(data: {
    name: string
    description: string
    minPlayers?: number
    maxPlayers?: number
    tags?: string[]
    isPublic?: boolean
  }) {
    await this.fillName(data.name)
    await this.fillDescription(data.description)

    if (data.minPlayers !== undefined) {
      await this.setMinPlayers(data.minPlayers)
    }

    if (data.maxPlayers !== undefined) {
      await this.setMaxPlayers(data.maxPlayers)
    }

    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        await this.addTag(tag)
        await this.page.waitForTimeout(100)
      }
    }

    if (data.isPublic !== undefined) {
      await this.setPublic(data.isPublic)
    }
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
    return await this.nameInput.isVisible()
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
   * Check if the form is disabled (during loading)
   */
  async isFormDisabled() {
    return await this.submitButton.isDisabled()
  }

  /**
   * Wait for the form to load
   */
  async waitForForm() {
    await this.page.locator('[data-testid="game-form"]').waitFor({ state: 'visible' })
    await this.nameInput.waitFor({ state: 'visible' })
    await this.descriptionTextarea.waitFor({ state: 'visible' })
  }
}
