import { Page } from '@playwright/test'

export class PageHeaderComponent {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Get the page title text
   */
  async getTitle() {
    return await this.page.locator('h2').first().textContent()
  }

  /**
   * Get the page subtitle text
   */
  async getSubtitle() {
    return await this.page.locator('h5').first().textContent()
  }

  /**
   * Check if the header has actions
   */
  async hasActions() {
    const actionsContainer = this.page.locator('div > div:nth-child(2)')
    return await actionsContainer.isVisible()
  }
}
