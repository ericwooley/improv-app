import { BasePage } from './BasePage'
import { Page } from '@playwright/test'
import { Button } from '../components/Button'
import { InvitationsComponent } from '../components/InvitationsComponent'
import { GroupsListComponent } from '../components/GroupsListComponent'
import { GameCardComponent } from '../components/GameCardComponent'

export class HomePage extends BasePage {
  // Component objects
  private invitations: InvitationsComponent
  private groupsList: GroupsListComponent
  private unratedGamesList: GameCardComponent[]

  constructor(page: Page) {
    super(page)

    // Initialize component objects
    this.invitations = new InvitationsComponent(page)
    this.groupsList = new GroupsListComponent(page)
    this.unratedGamesList = []
  }

  // Navigation methods
  async navigateToHome() {
    await this.goto('/')
  }

  // Auth state methods
  async isAuthenticated() {
    return await this.page.isVisible('text=Dashboard')
  }

  // Action methods for logged out state
  async clickSignIn() {
    await this.page.click('text=Sign In')
  }

  async clickCreateAccount() {
    await this.page.click('text=Create Account')
  }

  // Action methods for logged in state
  async clickViewAllGroups() {
    await this.page.click('text=View All >> nth=0')
  }

  async clickViewAllEvents() {
    await this.page.click('text=View All >> nth=1')
  }

  // Helper methods
  async hasUnratedGames() {
    return await this.page.isVisible('text=Games with no play preference')
  }

  async loadUnratedGames() {
    if (await this.hasUnratedGames()) {
      const gameElements = await this.page.$$('[data-unrated-games-list="true"] > div')
      this.unratedGamesList = []

      for (let i = 0; i < gameElements.length; i++) {
        // Create a locator for each game card
        const gameLocator = this.page.locator('[data-unrated-games-list="true"] > div').nth(i)
        const gameId = await gameLocator.getAttribute('data-testid')
        if (gameId) {
          this.unratedGamesList.push(new GameCardComponent(this.page, gameId))
        }
      }
    }
    return this.unratedGamesList
  }

  // Component access methods
  getInvitations() {
    return this.invitations
  }

  getGroupsList() {
    return this.groupsList
  }

  getUnratedGamesList() {
    return this.unratedGamesList
  }
}
