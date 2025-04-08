import { Page } from '@playwright/test'

export class Alert {
  private page: Page
  private selector: string

  constructor(page: Page, testId: string) {
    this.page = page
    this.selector = `[data-testid="${testId}"]`
  }

  async isVisible() {
    return await this.page.isVisible(this.selector)
  }

  async getText() {
    return await this.page.textContent(this.selector)
  }

  async getSeverity() {
    // This assumes the severity is stored as a data attribute or class
    // Adjust based on how your Alert component actually stores severity
    const element = await this.page.locator(this.selector)
    const severity = (await element.getAttribute('data-severity')) || (await element.getAttribute('class'))
    return severity
  }
}
