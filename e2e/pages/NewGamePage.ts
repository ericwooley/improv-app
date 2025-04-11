import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { GameFormComponent } from '../components/GameFormComponent'
import { BreadcrumbComponent } from '../components/BreadcrumbComponent'
import { PageHeaderComponent } from '../components/PageHeaderComponent'

export class NewGamePage extends BasePage {
  // Components
  private gameForm: GameFormComponent
  private breadcrumb: BreadcrumbComponent
  private pageHeader: PageHeaderComponent

  constructor(page: Page) {
    super(page)
    this.gameForm = new GameFormComponent(page)
    this.breadcrumb = new BreadcrumbComponent(page)
    this.pageHeader = new PageHeaderComponent(page)
  }

  /**
   * Navigate to the new game page with optional group ID
   */
  async goto(groupId?: string) {
    const url = groupId ? `/games/new?groupId=${groupId}` : '/games/new'
    await this.page.goto(url)
  }

  /**
   * Wait for the page to load
   */
  async waitForPageLoad() {
    await this.page.waitForURL(/.*\/games\/new.*/)
    await this.gameForm.waitForForm()
  }

  /**
   * Create a new game with the provided details
   */
  async createGame(data: {
    name?: string
    description?: string
    minPlayers?: number
    maxPlayers?: number
    tags?: string[]
    isPublic?: boolean
  }) {
    const defaultData = {
      name: `Test Game ${Date.now()}`,
      description: 'This is a test game created by e2e tests',
      minPlayers: 2,
      maxPlayers: 8,
      tags: [],
      isPublic: true,
    }

    const gameData = {
      ...defaultData,
      ...data,
    }

    try {
      // Wait for the form to load
      await this.gameForm.waitForForm()

      // Fill the form fields
      await this.gameForm.fillForm(gameData)

      // Submit the form
      await this.gameForm.submit()

      // Wait for navigation to complete
      await this.page.waitForURL(/\/groups\/.*/, { timeout: 10000 })
    } catch (error) {
      console.error('Error creating game:', error)
    }
  }

  /**
   * Fill the game form but don't submit
   */
  async fillGameForm(data: {
    name: string
    description: string
    minPlayers?: number
    maxPlayers?: number
    tags?: string[]
    isPublic?: boolean
  }) {
    await this.gameForm.fillForm(data)
  }

  /**
   * Submit the game form
   */
  async submitGameForm() {
    await this.gameForm.submit()
  }

  /**
   * Cancel game creation and return to group page
   */
  async cancelGameCreation() {
    await this.gameForm.cancel()
  }

  /**
   * Check if there is a validation error
   */
  async hasValidationError() {
    return await this.gameForm.hasError()
  }

  /**
   * Get validation error message
   */
  async getValidationErrorMessage() {
    return await this.gameForm.getErrorMessage()
  }

  /**
   * Check if the form is in a loading state
   */
  async isFormLoading() {
    return await this.gameForm.isFormDisabled()
  }

  /**
   * Get the page title
   */
  async getPageTitle() {
    return await this.pageHeader.getTitle()
  }

  /**
   * Get the page subtitle
   */
  async getPageSubtitle() {
    return await this.pageHeader.getSubtitle()
  }

  /**
   * Check if we're on the correct breadcrumb path
   */
  async checkBreadcrumbPath() {
    const items = await this.breadcrumb.getItems()
    return items.includes('Groups') && items.includes('Create Game')
  }
}
