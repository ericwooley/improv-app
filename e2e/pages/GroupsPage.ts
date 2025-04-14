import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { ActionButtonComponent } from '../components/ActionButtonComponent'
import { GroupsListComponent } from '../components/GroupsListComponent'

export class GroupsPage extends BasePage {
  // Selectors
  private readonly pageTitle = 'Improv Groups'
  private readonly createGroupButtonText = 'create-group-button'

  // Page objects
  private readonly groupsList: GroupsListComponent

  constructor(page: Page) {
    super(page)
    this.groupsList = new GroupsListComponent(page)
  }

  /**
   * Navigate to the groups page
   */
  async goto() {
    await this.page.goto('/groups')
  }

  /**
   * Get the page title text
   */
  async getPageTitle() {
    const headerText = await this.page.textContent('h2')
    return headerText
  }

  /**
   * Click the create group button
   */
  async clickCreateGroupButton() {
    const createButton = new ActionButtonComponent(this.page, this.createGroupButtonText)
    await createButton.click()
  }

  /**
   * Check if the page has groups
   */
  async hasGroups() {
    return await this.groupsList.hasGroups()
  }

  /**
   * Get the list of groups
   */
  async getGroupsList() {
    return await this.groupsList.getGroups()
  }

  /**
   * Click on a group by name
   */
  async clickGroupByName(name: string) {
    await this.groupsList.clickGroupByName(name)
  }

  /**
   * Check if the empty state is displayed
   */
  async hasEmptyState() {
    return await this.groupsList.hasEmptyState()
  }

  /**
   * Get the number of group elements
   */
  async getGroupElementsCount() {
    return await this.groupsList.getGroupCount()
  }

  /**
   * Check if the empty message is visible
   */
  async isEmptyMessageVisible() {
    return await this.groupsList.isEmptyMessageVisible()
  }

  /**
   * Click on the empty state action button
   */
  async clickEmptyStateAction() {
    await this.groupsList.clickEmptyStateAction()
  }

  /**
   * Navigate to create group page, works whether in empty state or with existing groups
   */
  async navigateToCreateGroup() {
    // First check if the main create button exists
    const mainButtonExists = await this.page.isVisible('[data-testid="create-group-button"]')

    if (mainButtonExists) {
      // Click the main create button if it exists
      await this.page.click('[data-testid="create-group-button"]')
    } else {
      // Fallback to empty state button if it exists
      const emptyStateButtonExists = await this.page.isVisible('[data-testid="empty-state-action-button"]')
      if (emptyStateButtonExists) {
        await this.clickEmptyStateAction()
      } else {
        // As a last resort, just navigate directly to the create group page
        await this.page.goto('/groups/new')
      }
    }

    // Wait for navigation to complete
    await this.page.waitForURL(/.*\/groups\/new.*/, { timeout: 5000 })
  }
}
