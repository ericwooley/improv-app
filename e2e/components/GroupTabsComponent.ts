import { Page } from '@playwright/test'

export class GroupTabsComponent {
  private page: Page

  // Tab selectors
  private readonly tabsSelector = '[data-testid="group-details-tabs"]'
  private readonly tabInfoSelector = '[data-testid="group-details-tab-info"]'
  private readonly tabMembersSelector = '[data-testid="group-details-tab-members"]'
  private readonly tabGamesSelector = '[data-testid="group-details-tab-games"]'
  private readonly tabInvitesSelector = '[data-testid="group-details-tab-invites"]'

  // Tab panel selectors
  private readonly tabPanelInfoSelector = '[data-testid="group-details-tabpanel-info"]'
  private readonly tabPanelMembersSelector = '[data-testid="group-details-tabpanel-members"]'
  private readonly tabPanelGamesSelector = '[data-testid="group-details-tabpanel-games"]'
  private readonly tabPanelInvitesSelector = '[data-testid="group-details-tabpanel-invites"]'

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Select a tab by name
   * @param tabName The name of the tab to select
   */
  async selectTab(tabName: 'info' | 'members' | 'games' | 'invites') {
    const selectors = {
      info: this.tabInfoSelector,
      members: this.tabMembersSelector,
      games: this.tabGamesSelector,
      invites: this.tabInvitesSelector,
    }

    await this.page.click(selectors[tabName])

    // Wait for the tab panel to be visible
    const tabPanelSelectors = {
      info: this.tabPanelInfoSelector,
      members: this.tabPanelMembersSelector,
      games: this.tabPanelGamesSelector,
      invites: this.tabPanelInvitesSelector,
    }

    await this.page.waitForSelector(tabPanelSelectors[tabName], { state: 'visible' })
  }

  /**
   * Check if a tab is visible in the tab bar
   * @param tabName The name of the tab to check
   */
  async isTabVisible(tabName: 'info' | 'members' | 'games' | 'invites') {
    const selectors = {
      info: this.tabInfoSelector,
      members: this.tabMembersSelector,
      games: this.tabGamesSelector,
      invites: this.tabInvitesSelector,
    }

    return this.page.isVisible(selectors[tabName])
  }

  /**
   * Check if a tab panel is active (visible and not hidden)
   * @param tabName The name of the tab panel to check
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

  /**
   * Get the current active tab from the URL
   */
  async getCurrentTabFromUrl() {
    const url = this.page.url()
    const searchParams = new URL(url).searchParams
    return searchParams.get('tab') || 'info'
  }
}
