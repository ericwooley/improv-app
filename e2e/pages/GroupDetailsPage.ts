import { Page } from '@playwright/test'
import { BasePage } from './BasePage'
import { GroupTabsComponent } from '../components/GroupTabsComponent'
import { GroupActionsMenuComponent } from '../components/GroupActionsMenuComponent'

export class GroupDetailsPage extends BasePage {
  // Selectors
  private readonly pageSelector = '[data-testid="group-details-page"]'
  private readonly loadingSelector = '[data-testid="group-details-loading"]'
  private readonly errorSelector = '[data-testid="group-details-error"]'

  // Component instances
  private readonly tabs: GroupTabsComponent
  private readonly actionsMenu: GroupActionsMenuComponent

  constructor(page: Page) {
    super(page)
    this.tabs = new GroupTabsComponent(page)
    this.actionsMenu = new GroupActionsMenuComponent(page)
  }

  /**
   * Navigate to a specific group details page
   * @param groupId The ID of the group
   */
  async goto(groupId: string) {
    await this.page.goto(`/groups/${groupId}`)
    await this.page.waitForSelector(this.pageSelector, { state: 'visible' })
  }

  /**
   * Get the group name from the page header
   */
  async getGroupName() {
    return await this.page.textContent('h2')
  }

  /**
   * Check if the page is in a loading state
   */
  async isLoading() {
    return await this.page.isVisible(this.loadingSelector)
  }

  /**
   * Check if the page is in an error state
   */
  async hasError() {
    return await this.page.isVisible(this.errorSelector)
  }

  /**
   * Open the actions menu
   */
  async openActionsMenu() {
    await this.actionsMenu.openMenu()
  }

  /**
   * Close the actions menu
   */
  async closeActionsMenu() {
    await this.actionsMenu.closeMenu()
  }

  /**
   * Click on an action in the menu
   * @param action The action to click
   */
  async clickAction(action: 'create-event' | 'create-game' | 'edit-group' | 'manage-members' | 'leave-group') {
    await this.actionsMenu.clickAction(action)
  }

  /**
   * Check if an action is visible in the menu
   * @param action The action to check
   */
  async isActionVisible(action: 'create-event' | 'create-game' | 'edit-group' | 'manage-members' | 'leave-group') {
    return await this.actionsMenu.isActionVisible(action)
  }

  /**
   * Select a tab
   * @param tabName The name of the tab to select
   */
  async selectTab(tabName: 'info' | 'members' | 'games' | 'invites') {
    await this.tabs.selectTab(tabName)
  }

  /**
   * Check if a tab is visible
   * @param tabName The name of the tab to check
   */
  async isTabVisible(tabName: 'info' | 'members' | 'games' | 'invites') {
    return await this.tabs.isTabVisible(tabName)
  }

  /**
   * Check if a tab panel is active (visible)
   * @param tabName The name of the tab panel to check
   */
  async isTabPanelActive(tabName: 'info' | 'members' | 'games' | 'invites') {
    return await this.tabs.isTabPanelActive(tabName)
  }

  /**
   * Get the current tab from the URL
   */
  async getCurrentTabFromUrl() {
    return await this.tabs.getCurrentTabFromUrl()
  }

  /**
   * Open the leave group dialog
   */
  async openLeaveGroupDialog() {
    await this.actionsMenu.openLeaveGroupDialog()
  }

  /**
   * Check if the leave dialog is open
   */
  async isLeaveDialogOpen() {
    return await this.actionsMenu.isLeaveDialogOpen()
  }

  /**
   * Check if the leave warning is displayed
   */
  async hasLeaveWarning() {
    return await this.actionsMenu.hasLeaveWarning()
  }

  /**
   * Cancel leaving the group
   */
  async cancelLeaveGroup() {
    await this.actionsMenu.cancelLeaveGroup()
  }

  /**
   * Confirm leaving the group
   */
  async confirmLeaveGroup() {
    await this.actionsMenu.confirmLeaveGroup()
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    await this.page.waitForSelector(this.pageSelector, { state: 'visible' })
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get the current URL
   */
  async getCurrentUrl() {
    return this.page.url()
  }
}
