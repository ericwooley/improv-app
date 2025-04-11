import { Page, Locator } from '@playwright/test'
import { GameCardComponent } from './GameCardComponent'
import { EmptyStateComponent } from './EmptyStateComponent'

export class GamesListComponent {
  private page: Page
  private container: Locator
  private gridContainer: Locator
  private paginationContainer: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('[data-testid="games-list-container"]')
    this.gridContainer = page.locator('[data-testid="games-list-grid"]')
    this.paginationContainer = page.locator('[data-testid="games-list-pagination"]')
  }

  /**
   * Check if the games list is visible
   */
  async isVisible() {
    return await this.container.isVisible()
  }

  /**
   * Check if the games list is in a loading state
   */
  async isLoading() {
    return await this.page.isVisible('[data-testid="games-list-loading"]')
  }

  /**
   * Check if the games list is showing an error
   */
  async hasError() {
    return await this.page.isVisible('[data-testid="games-list-error"]')
  }

  /**
   * Get the error message
   */
  async getErrorMessage() {
    const errorContainer = this.page.locator('[data-testid="games-list-error"]')
    return await errorContainer.textContent()
  }

  /**
   * Check if the games list is empty
   */
  async isEmpty() {
    return await this.page.isVisible('[data-testid="empty-state"]')
  }

  /**
   * Get the empty state component
   */
  getEmptyState() {
    return new EmptyStateComponent(this.page)
  }

  /**
   * Get the number of games displayed in the list
   */
  async getGameCount() {
    return await this.page.locator('[data-testid^="games-list-item-"]').count()
  }

  /**
   * Get a game card by its ID
   */
  getGameCard(gameId: string) {
    const gameLocator = this.page.locator(`[data-testid="game-card-${gameId}"]`)
    return new GameCardComponent(this.page, gameLocator)
  }

  /**
   * Get all game cards
   */
  async getAllGameCards() {
    const gameItems = await this.page.locator('[data-testid^="games-list-item-"]').all()
    const gameCards: GameCardComponent[] = []

    for (const item of gameItems) {
      const gameId = await item.getAttribute('data-testid')
      if (gameId) {
        const id = gameId.replace('games-list-item-', '')
        gameCards.push(this.getGameCard(id))
      }
    }

    return gameCards
  }

  /**
   * Select a game by ID
   */
  async selectGame(gameId: string) {
    await this.page.locator(`[data-testid="game-card-${gameId}"]`).click()
  }

  /**
   * Add a game to the event (if add button is present)
   */
  async addGameToEvent(gameId: string) {
    const gameCard = this.getGameCard(gameId)
    const addButton = this.page.locator(`[data-testid="game-card-${gameId}"] [data-testid="game-card-add-button"]`)
    await addButton.click()
  }

  /**
   * Check if pagination is visible
   */
  async hasPagination() {
    return await this.paginationContainer.isVisible()
  }

  /**
   * Get the current page number
   */
  async getCurrentPage() {
    const currentPageElement = this.paginationContainer.locator('[data-current="true"]')
    const pageElement = await currentPageElement.locator('div[data-page-number]')
    const pageNumber = await pageElement.getAttribute('data-page-number')
    return pageNumber ? parseInt(pageNumber, 10) : 1
  }

  /**
   * Get the total number of pages
   */
  async getTotalPages() {
    const pageButtons = await this.paginationContainer.locator('[data-testid^="games-list-page-"]').all()
    let maxPage = 1

    for (const button of pageButtons) {
      const pageElement = await button.locator('div[data-page-number]')
      const pageNumber = await pageElement.getAttribute('data-page-number')
      if (pageNumber) {
        const pageNum = parseInt(pageNumber, 10)
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum
        }
      }
    }

    return maxPage
  }

  /**
   * Go to a specific page
   */
  async goToPage(pageNumber: number) {
    await this.paginationContainer.locator(`[data-testid="games-list-page-${pageNumber}"]`).click()
    // Wait for the page to update
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Go to the next page
   */
  async goToNextPage() {
    await this.paginationContainer.locator('[data-testid="games-list-next-page"]').click()
    // Wait for the page to update
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Go to the previous page
   */
  async goToPreviousPage() {
    await this.paginationContainer.locator('[data-testid="games-list-previous-page"]').click()
    // Wait for the page to update
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Go to the first page
   */
  async goToFirstPage() {
    await this.paginationContainer.locator('[data-testid="games-list-first-page"]').click()
    // Wait for the page to update
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Go to the last page
   */
  async goToLastPage() {
    await this.paginationContainer.locator('[data-testid="games-list-last-page"]').click()
    // Wait for the page to update
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Wait for the games list to load
   */
  async waitForList() {
    await this.page.waitForSelector(
      '[data-testid="games-list-container"], [data-testid="games-list-loading"], [data-testid="empty-state"]'
    )

    // Wait for any loading state to disappear
    if (await this.isLoading()) {
      await this.page.waitForSelector('[data-testid="games-list-loading"]', { state: 'hidden' })
    }
  }
}
