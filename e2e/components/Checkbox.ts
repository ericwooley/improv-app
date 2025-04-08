import { Page } from '@playwright/test'

export class Checkbox {
  private page: Page
  private selector: string

  constructor(page: Page, testId: string) {
    this.page = page
    this.selector = `[data-testid="${testId}"]`
  }

  async check() {
    await this.page.check(this.selector)
  }

  async uncheck() {
    await this.page.uncheck(this.selector)
  }

  async isChecked() {
    return await this.page.isChecked(this.selector)
  }

  async isVisible() {
    return await this.page.isVisible(this.selector)
  }

  async isDisabled() {
    return await this.page.isDisabled(this.selector)
  }

  async getLabel() {
    // This assumes the label is associated with the checkbox via a specific attribute
    // Adjust based on how your Checkbox component actually renders labels
    const labelSelector = `${this.selector}-label`
    return await this.page.textContent(labelSelector)
  }
}
