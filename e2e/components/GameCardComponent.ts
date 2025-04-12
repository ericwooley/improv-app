import { Page, Locator } from '@playwright/test'

export class GameCardComponent {
  protected page: Page
  private container: Locator
  private gameId: string

  constructor(page: Page, gameId: string) {
    this.page = page

    this.gameId = gameId
    this.container = page.locator(`[data-testid="game-card-${this.gameId}"]`)
  }
  async isVisible() {
    return await this.container.isVisible()
  }

  async getGameName() {
    return await this.container.locator('[data-testid="game-card-header"]').textContent()
  }

  async getGameDescription() {
    return await this.container.locator('[data-testid="game-card-description"]').textContent()
  }

  async getPlayerCount() {
    const playerText = await this.container.locator('[data-testid="game-card-players"]').textContent()
    return playerText ? playerText.trim() : null
  }

  async isPublic() {
    return await this.container.locator('[data-testid="game-card-public"]').isVisible()
  }

  async isOwnedByGroup() {
    return await this.container.locator('[data-testid="game-card-owned"]').isVisible()
  }

  async clickViewButton() {
    await this.container.locator('[data-testid="game-card-view-button"]').click()
  }

  async setGameStatus(status: string) {
    // Format the status for the selector
    const formattedStatus = status.toLowerCase().replace(/\s+/g, '-')

    // Click to open the dropdown
    await this.container.locator('[data-testid="game-card-status-select"]').click()

    // Select the option
    await this.page.locator(`[data-testid="game-card-status-option-${formattedStatus}"]`).click()

    // Wait for the network request to complete
    await this.page.waitForLoadState('networkidle')
  }

  async getGameStatus() {
    await this.container.scrollIntoViewIfNeeded()
    await this.page.waitForLoadState('networkidle')
    const statusInput = this.container.locator('[data-testid="game-card-status-select"] input')
    return await statusInput.inputValue()
  }

  async getTags() {
    const tagElements = await this.container.locator('[data-testid="game-card-tags"] [data-testid^="tag-"]').all()
    const tags: string[] = []

    for (const tagElement of tagElements) {
      const tag = await tagElement.textContent()
      if (tag) {
        tags.push(tag.trim())
      }
    }

    return tags
  }

  async hasTag(tag: string) {
    const tags = await this.getTags()
    return tags.includes(tag)
  }

  async showDescription() {
    const toggle = this.container.locator('[data-testid="game-card-description-toggle"]')
    const isVisible = await toggle.isVisible()

    if (isVisible) {
      const buttonText = await toggle.textContent()
      if (buttonText && buttonText.includes('Show description')) {
        await toggle.click()
      }
    }
  }

  async hideDescription() {
    const toggle = this.container.locator('[data-testid="game-card-description-toggle"]')
    const isVisible = await toggle.isVisible()

    if (isVisible) {
      const buttonText = await toggle.textContent()
      if (buttonText && buttonText.includes('Hide description')) {
        await toggle.click()
      }
    }
  }
}
