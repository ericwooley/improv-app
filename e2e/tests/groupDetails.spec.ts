import { test, expect } from '@playwright/test'
import { GroupsPage } from '../pages/GroupsPage'
import { GroupDetailsPage } from '../pages/GroupDetailsPage'
import { NewGroupPage } from '../pages/NewGroupPage'
import { loginWithMagicLink, generateUniqueEmail, createTestGroup } from '../utils'

test.describe('Group Details Page', () => {
  let groupsPage: GroupsPage
  let groupDetailsPage: GroupDetailsPage
  let newGroupPage: NewGroupPage

  test.beforeEach(async ({ page }) => {
    // Initialize pages
    groupsPage = new GroupsPage(page)
    groupDetailsPage = new GroupDetailsPage(page)
    newGroupPage = new NewGroupPage(page)
  })

  test('should display the group details page with correct group name', async ({ page }) => {
    // Generate a unique email and login
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a new group specifically for this test
    const testGroupName = `Test Group ${Date.now()}`
    const testGroupDescription = 'This is a test group created for group details e2e tests'
    const { id } = await createTestGroup(page, {
      name: testGroupName,
      description: testGroupDescription,
    })

    // Navigate to the group details page and wait for it to load
    await groupDetailsPage.goto(id)
    await groupDetailsPage.waitForPageLoad()

    // Check if the group name is displayed correctly
    const displayedName = await groupDetailsPage.getGroupName()
    expect(displayedName).toBe(testGroupName)
  })

  test('should display and navigate between tabs', async ({ page }) => {
    // Generate a unique email and login
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a new group specifically for this test
    const testGroupName = `Test Group ${Date.now()}`
    const testGroupDescription = 'This is a test group created for group details e2e tests'
    const { id } = await createTestGroup(page, {
      name: testGroupName,
      description: testGroupDescription,
    })

    // Navigate to the group details page and wait for it to load
    await groupDetailsPage.goto(id)
    await groupDetailsPage.waitForPageLoad()

    // Verify the default tab (info) is active
    expect(await groupDetailsPage.isTabPanelActive('info')).toBeTruthy()

    // Navigate to Members tab
    await groupDetailsPage.selectTab('members')
    expect(await groupDetailsPage.isTabPanelActive('members')).toBeTruthy()
    expect(await groupDetailsPage.isTabPanelActive('info')).toBeFalsy()

    // Navigate to Games tab
    await groupDetailsPage.selectTab('games')
    expect(await groupDetailsPage.isTabPanelActive('games')).toBeTruthy()
    expect(await groupDetailsPage.isTabPanelActive('members')).toBeFalsy()
  })

  test('should open actions menu and verify admin options', async ({ page }) => {
    // Generate a unique email and login
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a new group specifically for this test
    const testGroupName = `Test Group ${Date.now()}`
    const testGroupDescription = 'This is a test group created for group details e2e tests'
    const { id } = await createTestGroup(page, {
      name: testGroupName,
      description: testGroupDescription,
    })

    // Navigate to the group details page and wait for it to load
    await groupDetailsPage.goto(id)
    await groupDetailsPage.waitForPageLoad()

    // Open the actions menu
    await groupDetailsPage.openActionsMenu()

    // Verify admin options are visible (user who creates a group is an admin)
    expect(await groupDetailsPage.isActionVisible('create-event')).toBeTruthy()
    expect(await groupDetailsPage.isActionVisible('create-game')).toBeTruthy()
    expect(await groupDetailsPage.isActionVisible('edit-group')).toBeTruthy()
    expect(await groupDetailsPage.isActionVisible('manage-members')).toBeTruthy()

    // Leave option should not be visible for admin
    expect(await groupDetailsPage.isActionVisible('leave-group')).toBeFalsy()

    // Close the actions menu
    await groupDetailsPage.closeActionsMenu()
  })

  test('should navigate to edit group page when clicking edit action', async ({ page }) => {
    // Generate a unique email and login
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a new group specifically for this test
    const testGroupName = `Test Group ${Date.now()}`
    const testGroupDescription = 'This is a test group created for group details e2e tests'
    const { id } = await createTestGroup(page, {
      name: testGroupName,
      description: testGroupDescription,
    })

    // Navigate to the group details page and wait for it to load
    await groupDetailsPage.goto(id)
    await groupDetailsPage.waitForPageLoad()

    // Open the actions menu
    await groupDetailsPage.openActionsMenu()

    // Click the edit group action
    await groupDetailsPage.clickAction('edit-group')

    // Wait for navigation to edit page
    await page.waitForURL(`/groups/${id}/edit`)

    // Verify we're on the edit page
    const url = await groupDetailsPage.getCurrentUrl()
    expect(url).toContain(`/groups/${id}/edit`)
  })

  test('should show invites tab for admin users', async ({ page }) => {
    // Generate a unique email and login
    const testEmail = generateUniqueEmail()
    await loginWithMagicLink(page, testEmail)

    // Create a new group specifically for this test
    const testGroupName = `Test Group ${Date.now()}`
    const testGroupDescription = 'This is a test group created for group details e2e tests'
    const { id } = await createTestGroup(page, {
      name: testGroupName,
      description: testGroupDescription,
    })

    // Navigate to the group details page and wait for it to load
    await groupDetailsPage.goto(id)
    await groupDetailsPage.waitForPageLoad()

    // Verify the invites tab is visible (as creator is admin)
    expect(await groupDetailsPage.isTabVisible('invites')).toBeTruthy()

    // Navigate to invites tab
    await groupDetailsPage.selectTab('invites')

    // Verify we're on the invites tab
    expect(await groupDetailsPage.isTabPanelActive('invites')).toBeTruthy()

    // Check URL parameter
    const tabValue = await groupDetailsPage.getCurrentTabFromUrl()
    expect(tabValue).toBe('invites')
  })
})
