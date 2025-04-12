import { Page, Locator } from '@playwright/test'
import { GamesListComponent } from './GamesListComponent'

export class GamesListWithFiltersComponent {
  private page: Page
  private container: Locator
  private searchInput: Locator
  private searchButton: Locator
  private clearSearchButton: Locator
  private filtersContainer: Locator
  private tagSelect: Locator
  private gamesList: GamesListComponent

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('form').first().locator('..') // Parent of the form
    this.searchInput = page.locator('input[placeholder="Search games..."]')
    this.searchButton = page.locator('button[type="submit"]').filter({ hasText: 'Search' })
    this.clearSearchButton = page.locator('button').filter({ has: page.locator('svg[data-testid="ClearIcon"]') })
    this.filtersContainer = page.locator('[data-testid="game-filters-container"]')
    this.tagSelect = page.locator('[data-testid="game-filters-tag-select"]')
    this.gamesList = new GamesListComponent(page)
  }

  /**
   * Search for games by name
   */
  async searchForGame(searchTerm: string) {
    // Clear existing search first if there is text
    if (await this.searchInput.inputValue()) {
      await this.clearSearch()
    }

    // Type the search term
    await this.searchInput.fill(searchTerm)

    // Submit the search
    await this.searchButton.click()

    // Wait for search results to load
    await this.gamesList.waitForList()
  }

  /**
   * Clear the search input
   */
  async clearSearch() {
    const hasText = await this.searchInput.inputValue()

    if (hasText) {
      // Check if the clear button is visible
      if (await this.clearSearchButton.isVisible()) {
        await this.clearSearchButton.click()
      } else {
        // Alternative: clear the input directly
        await this.searchInput.clear()
      }

      // Submit the empty search to reset
      await this.searchButton.click()

      // Wait for results to update
      await this.gamesList.waitForList()
    }
  }

  /**
   * Select a tag from the filters
   */
  async selectTagFilter(tag: string) {
    const formattedTag = tag.toLowerCase().replace(/\s+/g, '-')

    // Click on the tag select dropdown
    await this.tagSelect.click()

    // Wait for dropdown to open
    await this.page.waitForTimeout(300)

    // Click on the tag option
    const tagOption = this.page.locator(`[data-testid="game-filters-tag-option-${formattedTag}"]`)

    if (await tagOption.isVisible()) {
      await tagOption.click()

      // Wait for the filter to be applied
      await this.page.waitForLoadState('networkidle')
      await this.gamesList.waitForList()
    } else {
      throw new Error(`Tag filter "${tag}" not found in dropdown`)
    }
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    // First check if we have any active filters
    const url = this.page.url()
    if (url.includes('tag=') || url.includes('search=')) {
      // There are active filters, select "All Tags" filter
      await this.selectTagFilter('All Tags')

      // Clear any search
      await this.clearSearch()
    }
  }

  /**
   * Get the games list component to interact with the results
   */
  getGamesList() {
    return this.gamesList
  }

  /**
   * Check if a game with the given name is visible in the results
   */
  async isGameWithNameVisible(name: string) {
    return await this.gamesList.isGameWithNameVisible(name)
  }

  /**
   * Get a game card by ID
   */
  getGameCard(gameId: string) {
    return this.gamesList.getGameCard(gameId)
  }

  /**
   * Wait for the component to load
   */
  async waitForComponent() {
    await this.searchInput.waitFor({ state: 'visible' })
    await this.searchButton.waitFor({ state: 'visible' })
    await this.gamesList.waitForList()
  }
}
