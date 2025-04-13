import { Page } from '@playwright/test'
import { GamesListWithFiltersComponent } from '../components/GamesListWithFiltersComponent'

export class GamesPage {
  private page: Page
  private gamesListWithFilters: GamesListWithFiltersComponent
  private pageTitleSelector = '[data-testid="improv-games-page-title"]'

  constructor(page: Page) {
    this.page = page
    this.gamesListWithFilters = new GamesListWithFiltersComponent(page)
  }

  async goto() {
    await this.page.goto('/games')
    await this.waitForPageLoad()
  }

  async waitForPageLoad() {
    // Wait for the page title to be visible using the data-testid
    await this.page.waitForSelector(this.pageTitleSelector)
    await this.gamesListWithFilters.waitForComponent()
  }

  async getPageTitle() {
    return await this.page.locator(this.pageTitleSelector).innerText()
  }

  getGamesListWithFilters() {
    return this.gamesListWithFilters
  }

  async searchForGame(searchTerm: string) {
    await this.gamesListWithFilters.searchForGame(searchTerm)
  }

  async selectTagFilter(tag: string) {
    await this.gamesListWithFilters.selectTagFilter(tag)
  }

  async clearFilters() {
    await this.gamesListWithFilters.clearFilters()
  }

  async isGameWithNameVisible(name: string) {
    return await this.gamesListWithFilters.isGameWithNameVisible(name)
  }
}
