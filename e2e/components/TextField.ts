import { Page } from '@playwright/test'

export class TextField {
  private page: Page
  private selector: string

  constructor(page: Page, testId: string) {
    this.page = page
    this.selector = `[data-testid="${testId}"] input`
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
    const parent = this.page.locator(
      `[data-testid="${this.selector.split(' ')[0].replace('[data-testid="', '').replace('"]', '')}"]`
    )
    return (await parent.getAttribute('aria-invalid')) === 'true'
  }

  async getErrorMessage() {
    const parent = this.page.locator(
      `[data-testid="${this.selector.split(' ')[0].replace('[data-testid="', '').replace('"]', '')}"]`
    )
    const errorMessage = await parent.locator('.MuiFormHelperText-root').textContent()
    return errorMessage
  }
}
