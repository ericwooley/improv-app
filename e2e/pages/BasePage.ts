import { Page } from '@playwright/test'

export class BasePage {
  protected page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto(path: string) {
    await this.page.goto(path)
  }

  async waitForSelector(selector: string) {
    await this.page.waitForSelector(selector)
  }

  async isVisible(selector: string) {
    return await this.page.isVisible(selector)
  }

  async getText(selector: string) {
    return await this.page.textContent(selector)
  }

  /**
   * Check if the current URL matches a pattern
   */
  async hasUrlPattern(pattern: RegExp): Promise<boolean> {
    const url = this.page.url()
    return pattern.test(url)
  }
}
