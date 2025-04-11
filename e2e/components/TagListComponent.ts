import { Page, Locator } from '@playwright/test'

export class TagListComponent {
  private page: Page
  private container: Locator

  constructor(page: Page, parentLocator?: Locator) {
    this.page = page
    if (parentLocator) {
      this.container = parentLocator.locator('[data-testid="tag-list"]')
    } else {
      this.container = page.locator('[data-testid="tag-list"]')
    }
  }

  /**
   * Check if the tag list is visible
   */
  async isVisible() {
    return await this.container.isVisible()
  }

  /**
   * Get all tags in the list
   */
  async getTags() {
    const tagItems = await this.container.locator('[data-testid^="tag-list-item-"]').all()
    const tags: string[] = []

    for (const tag of tagItems) {
      const text = await tag.textContent()
      if (text) {
        tags.push(text.trim())
      }
    }

    return tags
  }

  /**
   * Check if a specific tag exists in the list
   */
  async hasTag(tagName: string) {
    const tagId = tagName.toLowerCase().replace(/\s+/g, '-')
    return await this.container.locator(`[data-testid="tag-list-item-${tagId}"]`).isVisible()
  }

  /**
   * Get the number of tags in the list
   */
  async getTagCount() {
    return await this.container.locator('[data-testid^="tag-list-item-"]').count()
  }
}
