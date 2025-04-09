import { test, expect } from '@playwright/test'
import { GroupsPage } from '../pages/GroupsPage'
import { GroupDetailsPage } from '../pages/GroupDetailsPage'
import { NewGroupPage } from '../pages/NewGroupPage'
import { loginWithMagicLink, generateUniqueEmail } from '../utils'

test.describe('Group Details Page', () => {
  let groupsPage: GroupsPage
  let groupDetailsPage: GroupDetailsPage
  let newGroupPage: NewGroupPage
  let testEmail: string
  let testGroupName: string
  let testGroupDescription: string
  let groupId: string

  // Create a unique email to use for all tests in this suite
  test.beforeAll(() => {
    testEmail = generateUniqueEmail()
    testGroupName = `Test Group ${Date.now()}`
    testGroupDescription = 'This is a test group created for group details e2e tests'
  })

  test.beforeEach(async ({ page }) => {
    // Initialize pages
    groupsPage = new GroupsPage(page)
    groupDetailsPage = new GroupDetailsPage(page)
    newGroupPage = new NewGroupPage(page)

    // Login with magic link
    await loginWithMagicLink(page, testEmail)

    // Create a group if it doesn't exist yet
    if (!groupId) {
      const { id, name } = await newGroupPage.createGroup(testGroupName, testGroupDescription)
      groupId = id
      // Verify the group was created with correct name
      expect(name).toBe(testGroupName)
    }

    // Navigate to the group details page and wait for it to load
    await groupDetailsPage.waitForPageLoad()
  })

  test('should display the group details page with correct group name', async () => {
    // Check if the group name is displayed correctly
    const displayedName = await groupDetailsPage.getGroupName()
    expect(displayedName).toBe(testGroupName)
  })

  test('should display and navigate between tabs', async () => {
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

  test('should open actions menu and verify admin options', async () => {
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
    // Open the actions menu
    await groupDetailsPage.openActionsMenu()

    // Click the edit group action
    await groupDetailsPage.clickAction('edit-group')

    // Wait for navigation to edit page
    await page.waitForURL(`/groups/${groupId}/edit`)

    // Verify we're on the edit page
    const url = await groupDetailsPage.getCurrentUrl()
    expect(url).toContain(`/groups/${groupId}/edit`)
  })

  test('should show invites tab for admin users', async () => {
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
