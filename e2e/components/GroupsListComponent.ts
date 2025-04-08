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

  /**
   * Check if there are any groups in the list
   */
  async hasGroups() {
    return !(await this.isEmpty()) && (await this.getGroupCount()) > 0
  }

  /**
   * Get all groups as an array of objects with name and description
   */
  async getGroups(): Promise<Array<{ name: string; description: string }>> {
    if ((await this.isEmpty()) || (await this.isLoading())) return []

    const groups = await this.container.locator('li').all()
    const result: Array<{ name: string; description: string }> = []

    for (let i = 0; i < groups.length; i++) {
      const name = (await groups[i].locator('div[class*="MuiListItemText-primary"]').textContent()) || ''
      const description = (await groups[i].locator('div[class*="MuiListItemText-secondary"]').textContent()) || ''

      result.push({ name, description })
    }

    return result
  }

  /**
   * Click on a group by its name
   */
  async clickGroupByName(name: string) {
    const groupItem = this.page.locator('li', {
      hasText: name,
    })

    await groupItem.click()
  }

  /**
   * Check if the empty state is displayed
   */
  async hasEmptyState() {
    return await this.isEmpty()
  }

  /**
   * Click the action button in the empty state
   */
  async clickEmptyStateAction() {
    await this.page.locator('button:has-text("Create Your First Group")').click()
  }
}
