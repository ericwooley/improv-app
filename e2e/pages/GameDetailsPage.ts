import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { GameCardComponent } from '../components/GameCardComponent'

export class GameDetailsPage extends BasePage {
  private gameId: string

  constructor(page: Page, gameId: string) {
    super(page)
    this.gameId = gameId
  }

  /**
   * Get the game title
   */
  async getGameTitle() {
    const gameCard = new GameCardComponent(this.page, this.gameId)
    return await gameCard.getGameName()
  }

  /**
   * Get the game description
   */
  async getGameDescription() {
    return await this.page.locator('[data-testid="game-details-description"]').textContent()
  }

  /**
   * Check if a game with specific name is visible on the page
   */
  async isGameNameVisible(name: string) {
    const title = await this.getGameTitle()
    return title === name
  }

  /**
   * Get player count information
   */
  async getPlayerCount() {
    return await this.page.locator('[data-testid="game-details-players"]').textContent()
  }

  /**
   * Check if game is marked as public
   */
  async isPublicGame() {
    return await this.page.locator('[data-testid="game-details-public"]').isVisible()
  }

  /**
   * Get tags for the game
   */
  async getTags() {
    const tagElements = await this.page.locator('[data-testid="game-details-tags"] [data-testid^="tag-"]').all()
    const tags: string[] = []

    for (const element of tagElements) {
      const tag = await element.textContent()
      if (tag) {
        tags.push(tag.trim())
      }
    }

    return tags
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }
}
