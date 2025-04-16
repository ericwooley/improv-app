import { Page } from '@playwright/test'

export class Tab {
  private page: Page
  private selector: string

  constructor(page: Page, testId: string) {
    this.page = page
    this.selector = `[data-testid="${testId}"]`
  }

  async click() {
    await this.page.click(this.selector)
  }

  async isSelected() {
    const tabElement = await this.page.locator(this.selector)
    const ariaSelected = await tabElement.getAttribute('aria-selected')
    return ariaSelected === 'true'
  }
}
