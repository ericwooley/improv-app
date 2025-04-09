import { Page } from '@playwright/test'

export class GroupActionsMenuComponent {
  private page: Page

  // Menu selectors
  private readonly actionsButtonSelector = '[data-testid="group-details-actions-button"]'
  private readonly actionsMenuSelector = '[data-testid="group-details-actions-menu"]'

  // Action items
  private readonly createEventActionSelector = '[data-testid="group-details-create-event-action"]'
  private readonly createGameActionSelector = '[data-testid="group-details-create-game-action"]'
  private readonly editGroupActionSelector = '[data-testid="group-details-edit-group-action"]'
  private readonly manageMemebersActionSelector = '[data-testid="group-details-manage-members-action"]'
  private readonly leaveGroupActionSelector = '[data-testid="group-details-leave-group-action"]'

  // Leave dialog selectors
  private readonly leaveDialogSelector = '[data-testid="group-details-leave-dialog"]'
  private readonly leaveCancelSelector = '[data-testid="group-details-leave-cancel"]'
  private readonly leaveConfirmSelector = '[data-testid="group-details-leave-confirm"]'
  private readonly leaveWarningSelector = '[data-testid="group-details-leave-warning"]'

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Open the actions menu
   */
  async openMenu() {
    await this.page.click(this.actionsButtonSelector)
    await this.page.waitForSelector(this.actionsMenuSelector, { state: 'visible' })
  }

  /**
   * Close the actions menu if it's open
   */
  async closeMenu() {
    if (await this.page.isVisible(this.actionsMenuSelector)) {
      // Click outside the menu to close it
      await this.page.click('body', { position: { x: 10, y: 10 } })
      await this.page.waitForSelector(this.actionsMenuSelector, { state: 'hidden' })
    }
  }

  /**
   * Click on an action in the menu
   * @param action The action to click
   */
  async clickAction(action: 'create-event' | 'create-game' | 'edit-group' | 'manage-members' | 'leave-group') {
    const selectors = {
      'create-event': this.createEventActionSelector,
      'create-game': this.createGameActionSelector,
      'edit-group': this.editGroupActionSelector,
      'manage-members': this.manageMemebersActionSelector,
      'leave-group': this.leaveGroupActionSelector,
    }

    // Make sure the menu is open
    if (!(await this.page.isVisible(this.actionsMenuSelector))) {
      await this.openMenu()
    }

    await this.page.click(selectors[action])
  }

  /**
   * Check if an action is visible in the menu
   * @param action The action to check
   */
  async isActionVisible(action: 'create-event' | 'create-game' | 'edit-group' | 'manage-members' | 'leave-group') {
    // Make sure the menu is open
    if (!(await this.page.isVisible(this.actionsMenuSelector))) {
      await this.openMenu()
    }

    const selectors = {
      'create-event': this.createEventActionSelector,
      'create-game': this.createGameActionSelector,
      'edit-group': this.editGroupActionSelector,
      'manage-members': this.manageMemebersActionSelector,
      'leave-group': this.leaveGroupActionSelector,
    }

    return this.page.isVisible(selectors[action])
  }

  /**
   * Open the leave group dialog
   */
  async openLeaveGroupDialog() {
    await this.clickAction('leave-group')
    await this.page.waitForSelector(this.leaveDialogSelector, { state: 'visible' })
  }

  /**
   * Check if the leave dialog is open
   */
  async isLeaveDialogOpen() {
    return this.page.isVisible(this.leaveDialogSelector)
  }

  /**
   * Cancel leaving the group
   */
  async cancelLeaveGroup() {
    if (await this.isLeaveDialogOpen()) {
      await this.page.click(this.leaveCancelSelector)
      await this.page.waitForSelector(this.leaveDialogSelector, { state: 'hidden' })
    }
  }

  /**
   * Confirm leaving the group
   */
  async confirmLeaveGroup() {
    if (await this.isLeaveDialogOpen()) {
      await this.page.click(this.leaveConfirmSelector)
      await this.page.waitForSelector(this.leaveDialogSelector, { state: 'hidden' })
    }
  }

  /**
   * Check if the leave warning is displayed
   */
  async hasLeaveWarning() {
    return this.page.isVisible(this.leaveWarningSelector)
  }
}
