import { test, expect } from '@playwright/test'
import { GroupsPage } from '../pages/GroupsPage'
import { loginWithMagicLink, generateUniqueEmail } from '../utils'

test.describe('Groups Page', () => {
  let groupsPage: GroupsPage
  let testEmail: string

  // Create a unique email to use for all tests in this suite
  test.beforeAll(() => {
    testEmail = generateUniqueEmail()
  })

  test.beforeEach(async ({ page }) => {
    // Perform full magic link authentication
    await loginWithMagicLink(page, testEmail)

    // Initialize groups page
    groupsPage = new GroupsPage(page)
    await groupsPage.goto()
  })

  test('should display the groups page title', async () => {
    const title = await groupsPage.getPageTitle()
    expect(title).toContain('Improv Groups')
  })

  test('should navigate to create group page when clicking the create group button', async ({ page }) => {
    await groupsPage.clickCreateGroupButton()

    // Verify we're on the create group page
    await expect(page).toHaveURL(/.*\/groups\/new.*/)
  })

  test('should display empty state when no groups exist', async ({ page }) => {
    // Check if the empty state is displayed
    const hasEmptyState = await groupsPage.hasEmptyState()
    expect(hasEmptyState).toBeTruthy()
  })

  test('should navigate to group details when clicking on a group', async ({ page }) => {
    // Check if there are groups
    const hasGroups = await groupsPage.hasGroups()

    // Skip test with a message if there are no groups
    if (!hasGroups) {
      console.log('Skipping test: No groups available to test with')
      return
    }

    // Get all groups and click on the first one
    const groups = await groupsPage.getGroupsList()
    if (groups.length > 0) {
      await groupsPage.clickGroupByName(groups[0].name)

      // Verify we're on the group details page
      await expect(page).toHaveURL(/.*\/groups\/\d+.*/)
    }
  })

  test('should create a new group', async ({ page }) => {
    // Click create group button
    await groupsPage.clickCreateGroupButton()

    // Verify we're on the create group page
    await expect(page).toHaveURL(/.*\/groups\/new.*/)

    // Fill in group details - assuming we have form fields for name and description
    const groupName = `Test Group ${Date.now()}`
    const groupDescription = 'This is a test group created by e2e tests'

    // Fill the form fields
    await page.fill('input[name="name"]', groupName)
    await page.fill('textarea[name="description"]', groupDescription)

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for navigation to complete
    await page.waitForURL(/.*\/groups\/\d+.*/)

    // Verify we're on the group details page
    await expect(page).toHaveURL(/.*\/groups\/\d+.*/)

    // Verify the group name is displayed
    await expect(page.locator('h1, h2, h3').filter({ hasText: groupName })).toBeVisible()
  })
})
