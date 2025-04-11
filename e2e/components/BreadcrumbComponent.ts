import { Page, Locator } from '@playwright/test'

export class BreadcrumbComponent {
  private page: Page
  private breadcrumbContainer: Locator

  constructor(page: Page) {
    this.page = page
    this.breadcrumbContainer = page.locator('nav[aria-label="breadcrumb"]')
  }

  /**
   * Get all breadcrumb items
   */
  async getItems() {
    const items = await this.breadcrumbContainer.locator('a, p').all()
    const texts: string[] = []

    for (const item of items) {
      const text = await item.textContent()
      if (text !== null) {
        texts.push(text)
      }
    }

    return texts
  }

  /**
   * Check if a specific breadcrumb item exists
   */
  async hasItem(text: string) {
    const items = await this.getItems()
    return items.some((item) => item.includes(text))
  }

  /**
   * Click on a breadcrumb link by text
   */
  async clickItem(text: string) {
    await this.breadcrumbContainer.locator(`a:has-text("${text}")`).click()
  }

  /**
   * Get the active breadcrumb item (the last one)
   */
  async getActiveItem() {
    const items = await this.getItems()
    return items[items.length - 1]
  }
}
