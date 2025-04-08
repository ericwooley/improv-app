import { Page, Locator } from '@playwright/test'

export class GroupsListComponent {
  protected page: Page
  private container: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('div:has(> div > [title="Recent Groups"])')
  }

  async isVisible() {
    return await this.container.isVisible()
  }

  async isLoading() {
    return await this.container.locator('circle').isVisible()
  }

  async isEmpty() {
    if (await this.isLoading()) return false
    return await this.container.locator("text=You haven't created any groups yet.").isVisible()
  }

  async getGroupCount() {
    if ((await this.isEmpty()) || (await this.isLoading())) return 0

    const groups = await this.container.locator('li').all()
    return groups.length
  }

  async getGroupName(index = 0) {
    const groups = await this.container.locator('li').all()
    if (groups.length <= index) return null

    const primaryText = await groups[index].locator('div[class*="MuiListItemText-primary"]').textContent()
    return primaryText
  }

  async clickGroup(index = 0) {
    const groups = await this.container.locator('li').all()
    if (groups.length <= index) return

    await groups[index].click()
  }

  async clickViewAllButton() {
    await this.container.locator('button:has-text("View All")').click()
  }
}
