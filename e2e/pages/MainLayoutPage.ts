import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class MainLayoutPage extends BasePage {
  // Selectors
  private readonly navigationSelector = '[data-testid="main-navigation"]'
  private readonly mainContentSelector = '[data-testid="main-content"]'
  private readonly navMenuListSelector = '[data-testid="nav-menu-list"]'
  private readonly logoutButtonSelector = '[data-testid="logout-button"]'
  private readonly mobileMenuToggleSelector = '[data-testid="mobile-menu-toggle"]'

  // Get selector for a specific nav item
  private getNavItemSelector(itemName: string) {
    return `[data-testid="nav-menu-item-${itemName.toLowerCase()}"]`
  }

  constructor(page: Page) {
    super(page)
  }

  // Navigation methods
  async navigateToHome() {
    await this.clickNavItem('home')
  }

  async navigateToGroups() {
    await this.clickNavItem('groups')
  }

  async navigateToGames() {
    await this.clickNavItem('games')
  }

  async navigateToEvents() {
    await this.clickNavItem('events')
  }

  async navigateToProfile() {
    await this.clickNavItem('profile')
  }

  async clickNavItem(itemName: string) {
    // Check if mobile toggle is visible (mobile view)
    const isMobileView = await this.isVisible(this.mobileMenuToggleSelector)

    if (isMobileView) {
      // Check if the menu is already open
      const isMenuItemVisible = await this.isVisible(this.getNavItemSelector(itemName))
      if (!isMenuItemVisible) {
        // Open the mobile menu
        await this.page.click(this.mobileMenuToggleSelector)
        // Wait for animation
        await this.page.waitForTimeout(300)
      }
    }

    // Click the nav item
    await this.page.click(this.getNavItemSelector(itemName))

    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle')
  }

  // Logout
  async logout() {
    // Check if we can see the logout button directly (desktop)
    let isLogoutVisible = await this.isVisible(this.logoutButtonSelector)

    if (!isLogoutVisible && (await this.isVisible(this.mobileMenuToggleSelector))) {
      // On mobile, open the menu first
      await this.page.click(this.mobileMenuToggleSelector)
      await this.page.waitForTimeout(300)
    }

    // Now click the logout button
    await this.page.click(this.logoutButtonSelector)

    // Wait for navigation to login page
    await this.page.waitForURL(/login/)
  }

  // State checks
  async isAuthenticated() {
    await this.page.waitForLoadState('networkidle')
    try {
      await this.page.waitForSelector(this.navigationSelector, {
        state: 'visible',
        timeout: 100,
      })
      return true
    } catch (error) {
      return false
    }
  }

  async isNavMenuVisible() {
    return await this.isVisible(this.navMenuListSelector)
  }

  async getSelectedNavItem() {
    const selectedItemLocator = this.page.locator(`${this.navMenuListSelector} .Mui-selected`)
    if ((await selectedItemLocator.count()) === 0) {
      return null
    }
    return await selectedItemLocator.textContent()
  }

  // Helper to check if we're on a specific page
  async isOnPage(pageName: string) {
    const urlMapping = {
      home: '/',
      groups: '/groups',
      games: '/games',
      events: '/events',
      profile: '/profile',
    }

    const path = urlMapping[pageName.toLowerCase()]
    if (!path) return false

    const url = this.page.url()
    return url.endsWith(path)
  }

  // Get page objects
  getPage() {
    return this.page
  }
}
