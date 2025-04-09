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
    console.log('isVisible', await createButton.isVisible())
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
   * Click on the empty state action button
   */
  async clickEmptyStateAction() {
    await this.groupsList.clickEmptyStateAction()
  }
}
