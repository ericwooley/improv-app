import { Page, Locator } from '@playwright/test'

export class GameCardComponent {
  protected page: Page
  private container: Locator

  constructor(page: Page, parentLocator?: Locator) {
    this.page = page

    if (parentLocator) {
      // If a parent locator is provided, use it to scope the card
      this.container = parentLocator.locator('div.MuiCard-root')
    } else {
      // Otherwise, look for all game cards
      this.container = page.locator('div.MuiCard-root')
    }
  }

  async isVisible() {
    return await this.container.isVisible()
  }

  async getGameName() {
    const header = await this.container.locator('div.MuiCardHeader-content').first()
    return await header.textContent()
  }

  async getGameDescription() {
    return await this.container.locator('div.MuiCardContent-root > p').first().textContent()
  }

  async getPlayerCount() {
    const playerText = await this.container.locator('div.MuiCardContent-root svg + div').textContent()
    return playerText ? playerText.trim() : null
  }

  async clickViewButton() {
    await this.container.locator('a:has-text("View")').click()
  }

  async setGameStatus(status: string) {
    // Click to open the dropdown
    await this.container.locator('div[role="button"]').click()

    // Select the option
    await this.page.locator(`li[role="option"]:has-text("${status}")`).click()
  }

  async getGameStatus() {
    const statusElement = await this.container.locator('div[role="button"]')
    return await statusElement.textContent()
  }
}
