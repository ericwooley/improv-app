import { Page } from '@playwright/test'

export class Button {
  private page: Page
  private selector: string

  constructor(page: Page, testId: string) {
    this.page = page
    this.selector = `[data-testid="${testId}"]`
  }

  async click(force = false) {
    if (force) {
      await this.page.click(this.selector, { force: true })
    } else {
      await this.page.click(this.selector)
    }
  }

  async isVisible() {
    return await this.page.isVisible(this.selector)
  }

  async isDisabled() {
    const button = await this.page.locator(this.selector)
    return await button.isDisabled()
  }

  async getText() {
    return await this.page.textContent(this.selector)
  }

  async hasIcon(iconName: string) {
    // This assumes icons are rendered with a specific class or data attribute
    // Adjust based on how your Button component actually renders icons
    const iconSelector = `${this.selector} [data-testid="button-icon-${iconName}"]`
    return await this.page.isVisible(iconSelector)
  }
}
