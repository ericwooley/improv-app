import { Page, Locator } from '@playwright/test'
import { GameCardComponent } from './GameCardComponent'
import { EmptyStateComponent } from './EmptyStateComponent'

export class GamesListComponent {
  private page: Page
  public container: Locator
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
  async getGameCard(gameId: string) {
    await this.page.waitForLoadState('networkidle')
    return new GameCardComponent(this.page, gameId)
  }

  /**
   * Check if a game with the specific name is visible
   */
  async isGameWithNameVisible(name: string) {
    // Look through all game cards to find one with this name
    const gameCards = await this.getAllGameCards()
    for (const card of gameCards) {
      const gameName = await card.getGameName()
      if (gameName === name) {
        return true
      }
    }
    return false
  }

  /**
   * Get all game cards
   */
  async getAllGameCards() {
    // First check how many game cards are on the page
    const count = await this.page.locator('[data-testid^="games-list-item-"]').count()
    const gameCards: GameCardComponent[] = []

    // Iterate through each index to get individual game cards
    for (let i = 0; i < count; i++) {
      // Get the game item at index i
      const item = this.page.locator('[data-testid^="games-list-item-"]').nth(i)

      // Get the testid attribute to extract the game ID
      const testId = await item.getAttribute('data-testid')
      if (testId) {
        const gameId = testId.replace('games-list-item-', '')

        gameCards.push(new GameCardComponent(this.page, gameId))
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
    const addButton = this.page.locator(`[data-testid="game-card-${gameId}"] [data-testid="game-card-add-button"]`)
    await addButton.click()
  }

  /**
   * View a game's details by clicking the view button
   */
  async viewGame(gameId: string) {
    const viewButton = this.page.locator(`[data-testid="game-card-${gameId}"] [data-testid="game-card-view-button"]`)
    await viewButton.click()
  }

  /**
   * Set a game's status
   */
  async setGameStatus(gameId: string, status: string) {
    // Format the status for the selector
    const formattedStatus = status.toLowerCase().replace(/\s+/g, '-')

    // Click on the status dropdown for this game
    await this.page.locator(`[data-testid="game-card-${gameId}"] [data-testid="game-card-status-select"]`).click()

    // Select the specified status
    await this.page.locator(`[data-testid="game-card-status-option-${formattedStatus}"]`).click()

    // Wait for the change to be applied
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get a game's current status
   */
  async getGameStatus(gameId: string) {
    const statusInput = this.page.locator(
      `[data-testid="game-card-${gameId}"] [data-testid="game-card-status-select"] input`
    )
    return await statusInput.inputValue()
  }

  /**
   * Select a tag filter
   */
  async selectTagFilter(tag: string) {
    // Format tag for selectors
    const formattedTag = tag.toLowerCase().replace(/\s+/g, '-')

    try {
      // Try multiple approaches to find the tag

      // Method 1: Try with data-testid
      const tagFilterTestId = `[data-testid="filter-tag-${formattedTag}"]`
      const hasSpecificTestId = await this.page
        .locator(tagFilterTestId)
        .isVisible()
        .catch(() => false)

      if (hasSpecificTestId) {
        // If found with test ID, click it
        await this.page.locator(tagFilterTestId).click()
      } else {
        // Method 2: Try to find by its text content in a chip/tag component
        const tagChip = this.page.locator('.MuiChip-root').filter({ hasText: tag }).first()

        if (await tagChip.isVisible()) {
          await tagChip.click()
        } else {
          // Method 3: Look for a filter dropdown if it exists
          const filterDropdown = this.page
            .locator('[data-testid="tag-filter-dropdown"], [aria-label="Filter by tag"]')
            .first()

          if (await filterDropdown.isVisible()) {
            await filterDropdown.click()

            // Wait for dropdown menu to appear
            await this.page.waitForTimeout(300)

            // Try to find and click the tag in the dropdown
            const dropdownItem = this.page.locator('li').filter({ hasText: tag }).first()
            if (await dropdownItem.isVisible()) {
              await dropdownItem.click()
            } else {
              throw new Error(`Tag "${tag}" not found in filter dropdown`)
            }
          } else {
            throw new Error(`Could not find tag filter for "${tag}"`)
          }
        }
      }

      // Wait for filter to be applied
      await this.page.waitForLoadState('networkidle')

      // Verify the filter was applied by checking for an active/selected state
      const isFilterApplied = await this.verifyTagFilterApplied(tag, formattedTag)

      if (!isFilterApplied) {
        console.log(`Warning: Tag filter for "${tag}" might not have been applied successfully`)
      }
    } catch (error) {
      console.error(`Error applying tag filter "${tag}": ${error}`)
      throw new Error(`Failed to apply tag filter "${tag}": ${error}`)
    }
  }

  /**
   * Verify that a tag filter has been applied
   */
  private async verifyTagFilterApplied(tag: string, formattedTag: string): Promise<boolean> {
    try {
      // Try various methods to confirm the filter is active

      // Method 1: Check for selected/active state in the tag filter element
      const activeTagSelector = `[data-testid="filter-tag-${formattedTag}-active"], [data-testid="filter-tag-${formattedTag}"][data-selected="true"]`
      const isActiveTagVisible = await this.page
        .locator(activeTagSelector)
        .isVisible()
        .catch(() => false)

      if (isActiveTagVisible) {
        return true
      }

      // Method 2: Check URL parameters for tag filter
      const url = this.page.url()
      if (url.includes(`tag=${encodeURIComponent(tag)}`) || url.includes(`tag=${encodeURIComponent(formattedTag)}`)) {
        return true
      }

      // Method 3: Check if any chip has a selected appearance
      const selectedChip = this.page
        .locator('.MuiChip-root.Mui-selected, .MuiChip-root[aria-selected="true"]')
        .filter({ hasText: tag })
        .first()

      if (await selectedChip.isVisible()) {
        return true
      }

      // If we can't positively verify the filter is applied, return false
      return false
    } catch (error) {
      console.log(`Error verifying tag filter: ${error}`)
      return false
    }
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
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForSelector(
      '[data-testid="games-list-container"], [data-testid="games-list-loading"], [data-testid="empty-state"]'
    )
    await this.page.waitForTimeout(1000)
  }
}
