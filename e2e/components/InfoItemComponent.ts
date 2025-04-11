import { Page, Locator } from '@playwright/test'

export class InfoItemComponent {
  private page: Page
  private container: Locator

  constructor(page: Page, parentLocator?: Locator) {
    this.page = page
    if (parentLocator) {
      this.container = parentLocator.locator('[data-testid="info-item"]')
    } else {
      this.container = page.locator('[data-testid="info-item"]')
    }
  }

  /**
   * Check if the info item is visible
   */
  async isVisible() {
    return await this.container.isVisible()
  }

  /**
   * Get the content text
   */
  async getContentText() {
    const content = this.container.locator('[data-testid="info-item-content"]')
    return await content.textContent()
  }

  /**
   * Check if the info item has an icon
   */
  async hasIcon() {
    const icon = this.container.locator('[data-testid="info-item-icon"]')
    return await icon.isVisible()
  }
}
