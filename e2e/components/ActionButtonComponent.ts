import { Page } from '@playwright/test'

export class ActionButtonComponent {
  private page: Page
  private text: string
  private testId: string

  constructor(page: Page, text: string, testId?: string) {
    this.page = page
    this.text = text
    this.testId = testId || `action-button-${text.toLowerCase().replace(/\s+/g, '-')}`
  }

  /**
   * Get the selector for this button
   */
  getSelector() {
    return `[data-testid="${this.testId}"]`
  }

  /**
   * Click on the button
   */
  async click() {
    await this.page.click(this.getSelector())
  }

  /**
   * Check if the button is visible
   */
  async isVisible() {
    return await this.page.isVisible(this.getSelector())
  }

  /**
   * Get the text of the button
   */
  async getText() {
    return await this.page.textContent(this.getSelector())
  }

  /**
   * Check if the button is disabled
   */
  async isDisabled() {
    const button = await this.page.locator(this.getSelector())
    return (await button.getAttribute('disabled')) !== null
  }
}
