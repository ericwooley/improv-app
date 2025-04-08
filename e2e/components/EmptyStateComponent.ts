import { Page } from '@playwright/test'

export class EmptyStateComponent {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Check if the empty state is visible
   */
  async isVisible() {
    const paper = this.page.locator('div[class*="MuiPaper-root"]').filter({
      hasText: /You haven't created any|No items found/,
    })
    return await paper.isVisible()
  }

  /**
   * Get the message displayed in the empty state
   */
  async getMessage() {
    const paper = this.page.locator('div[class*="MuiPaper-root"]').filter({
      hasText: /You haven't created any|No items found/,
    })

    const message = await paper.locator('p').first().textContent()
    return message
  }

  /**
   * Click the action button in the empty state
   */
  async clickActionButton() {
    const paper = this.page.locator('div[class*="MuiPaper-root"]').filter({
      hasText: /You haven't created any|No items found/,
    })

    await paper.locator('button').click()
  }

  /**
   * Get the action button text
   */
  async getActionButtonText() {
    const paper = this.page.locator('div[class*="MuiPaper-root"]').filter({
      hasText: /You haven't created any|No items found/,
    })

    const buttonText = await paper.locator('button').textContent()
    return buttonText
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
