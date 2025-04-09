import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class GroupDetailsPage extends BasePage {
  // Selectors
  private readonly pageSelector = '[data-testid="group-details-page"]'
  private readonly loadingSelector = '[data-testid="group-details-loading"]'
  private readonly errorSelector = '[data-testid="group-details-error"]'
  private readonly actionsButtonSelector = '[data-testid="group-details-actions-button"]'
  private readonly actionsMenuSelector = '[data-testid="group-details-actions-menu"]'
  private readonly tabsSelector = '[data-testid="group-details-tabs"]'
  private readonly tabInfoSelector = '[data-testid="group-details-tab-info"]'
  private readonly tabMembersSelector = '[data-testid="group-details-tab-members"]'
  private readonly tabGamesSelector = '[data-testid="group-details-tab-games"]'
  private readonly tabInvitesSelector = '[data-testid="group-details-tab-invites"]'
  private readonly leaveDialogSelector = '[data-testid="group-details-leave-dialog"]'
  private readonly leaveCancelSelector = '[data-testid="group-details-leave-cancel"]'
  private readonly leaveConfirmSelector = '[data-testid="group-details-leave-confirm"]'
  private readonly leaveWarningSelector = '[data-testid="group-details-leave-warning"]'
  private readonly tabPanelInfoSelector = '[data-testid="group-details-tabpanel-info"]'
  private readonly tabPanelMembersSelector = '[data-testid="group-details-tabpanel-members"]'
  private readonly tabPanelGamesSelector = '[data-testid="group-details-tabpanel-games"]'
  private readonly tabPanelInvitesSelector = '[data-testid="group-details-tabpanel-invites"]'

  // Action menu items
  private readonly createEventActionSelector = '[data-testid="group-details-create-event-action"]'
  private readonly createGameActionSelector = '[data-testid="group-details-create-game-action"]'
  private readonly editGroupActionSelector = '[data-testid="group-details-edit-group-action"]'
  private readonly manageMemebersActionSelector = '[data-testid="group-details-manage-members-action"]'
  private readonly leaveGroupActionSelector = '[data-testid="group-details-leave-group-action"]'

  constructor(page: Page) {
    super(page)
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
    await this.page.click(this.actionsButtonSelector)
    await this.page.waitForSelector(this.actionsMenuSelector, { state: 'visible' })
  }

  /**
   * Click on an action in the menu
   * @param action The action to click (create-event, create-game, edit-group, manage-members, leave-group)
   */
  async clickAction(action: 'create-event' | 'create-game' | 'edit-group' | 'manage-members' | 'leave-group') {
    const selectors = {
      'create-event': this.createEventActionSelector,
      'create-game': this.createGameActionSelector,
      'edit-group': this.editGroupActionSelector,
      'manage-members': this.manageMemebersActionSelector,
      'leave-group': this.leaveGroupActionSelector,
    }

    await this.page.click(selectors[action])
  }

  /**
   * Select a tab
   * @param tabName The name of the tab to select (info, members, games, invites)
   */
  async selectTab(tabName: 'info' | 'members' | 'games' | 'invites') {
    const selectors = {
      info: this.tabInfoSelector,
      members: this.tabMembersSelector,
      games: this.tabGamesSelector,
      invites: this.tabInvitesSelector,
    }

    await this.page.click(selectors[tabName])

    // Wait for the correct tab panel to be visible
    const tabPanelSelectors = {
      info: this.tabPanelInfoSelector,
      members: this.tabPanelMembersSelector,
      games: this.tabPanelGamesSelector,
      invites: this.tabPanelInvitesSelector,
    }

    await this.page.waitForSelector(tabPanelSelectors[tabName], { state: 'visible' })
  }

  /**
   * Check if the specified tab is visible
   * @param tabName The name of the tab to check (info, members, games, invites)
   */
  async isTabVisible(tabName: 'info' | 'members' | 'games' | 'invites') {
    const selectors = {
      info: this.tabInfoSelector,
      members: this.tabMembersSelector,
      games: this.tabGamesSelector,
      invites: this.tabInvitesSelector,
    }

    return await this.page.isVisible(selectors[tabName])
  }

  /**
   * Check if the leave group dialog is open
   */
  async isLeaveDialogOpen() {
    return await this.page.isVisible(this.leaveDialogSelector)
  }

  /**
   * Check if the leave warning is displayed (when user is last admin)
   */
  async hasLeaveWarning() {
    return await this.page.isVisible(this.leaveWarningSelector)
  }

  /**
   * Cancel leaving the group
   */
  async cancelLeaveGroup() {
    await this.page.click(this.leaveCancelSelector)
  }

  /**
   * Confirm leaving the group
   */
  async confirmLeaveGroup() {
    await this.page.click(this.leaveConfirmSelector)
  }

  /**
   * Open the leave group dialog from the actions menu
   */
  async openLeaveGroupDialog() {
    await this.openActionsMenu()
    await this.clickAction('leave-group')
    await this.page.waitForSelector(this.leaveDialogSelector, { state: 'visible' })
  }

  /**
   * Check if the specified tab panel is active
   * @param tabName The name of the tab panel to check (info, members, games, invites)
   */
  async isTabPanelActive(tabName: 'info' | 'members' | 'games' | 'invites') {
    const selectors = {
      info: this.tabPanelInfoSelector,
      members: this.tabPanelMembersSelector,
      games: this.tabPanelGamesSelector,
      invites: this.tabPanelInvitesSelector,
    }

    // Check if the panel has attribute 'hidden' set to false
    const isHidden = await this.page.getAttribute(selectors[tabName], 'hidden')
    return isHidden === null || isHidden === 'false'
  }
}
