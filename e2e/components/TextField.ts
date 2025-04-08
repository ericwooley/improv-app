import { Page } from '@playwright/test'

export class TextField {
  private page: Page
  private selector: string

  constructor(page: Page, testId: string) {
    this.page = page
    this.selector = `[data-testid="${testId}"]`
  }

  async fill(value: string) {
    await this.page.fill(this.selector, value)
  }

  async clear() {
    await this.page.fill(this.selector, '')
  }

  async getValue() {
    return await this.page.inputValue(this.selector)
  }

  async isVisible() {
    return await this.page.isVisible(this.selector)
  }

  async isDisabled() {
    return await this.page.isDisabled(this.selector)
  }

  async hasError() {
    // This assumes error state is indicated by a specific class or data attribute
    // Adjust based on how your TextField component actually indicates errors
    const element = await this.page.locator(this.selector)
    const classAttr = await element.getAttribute('class')
    return classAttr ? classAttr.includes('error') : false
  }

  async getErrorMessage() {
    // This assumes error messages are rendered with a specific class or data attribute
    // Adjust based on how your TextField component actually renders error messages
    const errorMessageSelector = `${this.selector}-error-message`
    return await this.page.textContent(errorMessageSelector)
  }
}
