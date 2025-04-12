import { Page, Locator } from '@playwright/test'

export class EmptyStateComponent {
  private page: Page
  private container: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('[data-testid="empty-state"]')
  }

  /**
   * Check if the empty state is visible
   */
  async isVisible() {
    return await this.container.isVisible()
  }

  /**
   * Get the empty state message
   */
  async getMessage() {
    const messageElement = this.container.locator('[data-testid="empty-state-message"]')
    return await messageElement.textContent()
  }

  /**
   * Check if the empty state has an action button
   */
  async hasActionButton() {
    return await this.container.locator('[data-testid="empty-state-action"]').isVisible()
  }

  /**
   * Get the action button text
   */
  async getActionButtonText() {
    const actionButton = this.container.locator('[data-testid="empty-state-action"]')
    return await actionButton.textContent()
  }

  /**
   * Click the action button
   */
  async clickActionButton() {
    await this.container.locator('[data-testid="empty-state-action"]').click()
  }

  /**
   * Get the secondary message if present
   */
  async getSecondaryMessage() {
    const paper = this.page.locator('div[class*="MuiPaper-root"]').filter({
      hasText: /You haven't created any|No items found/,
    })

    const messages = await paper.locator('p').all()
    if (messages.length > 1) {
      return await messages[1].textContent()
    }
    return null
  }
}
