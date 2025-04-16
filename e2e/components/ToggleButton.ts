import { Page } from '@playwright/test'

export class ToggleButton {
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
    const toggleElement = await this.page.locator(this.selector)
    const ariaPressed = await toggleElement.getAttribute('aria-pressed')
    return ariaPressed === 'true'
  }

  async isVisible() {
    return await this.page.isVisible(this.selector)
  }
}
