import { Page, Locator } from '@playwright/test'
import { Button } from './Button'

export class InvitationsComponent {
  protected page: Page
  private container: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.locator('div:has(> div > [title="Pending Invitations"])')
  }

  async isVisible() {
    return await this.container.isVisible()
  }

  async isEmpty() {
    return !(await this.isVisible())
  }

  async isLoading() {
    return await this.container.locator('circle').isVisible()
  }

  async getInvitationCount() {
    if (await this.isEmpty()) return 0

    const invitations = await this.container.locator('div:has(> h6)').all()
    return invitations.length
  }

  async getInvitationGroupName(index = 0) {
    const invitations = await this.container.locator('div:has(> h6)').all()
    if (invitations.length <= index) return null

    return await invitations[index].locator('h6').textContent()
  }

  async acceptInvitation(index = 0) {
    const invitations = await this.container.locator('div:has(> h6)').all()
    if (invitations.length <= index) return

    await this.page.click(`button:has-text("Accept") >> nth=${index}`)
  }

  async rejectInvitation(index = 0) {
    const invitations = await this.container.locator('div:has(> h6)').all()
    if (invitations.length <= index) return

    await this.page.click(`button:has-text("Reject") >> nth=${index}`)
  }
}
