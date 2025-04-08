# E2E Test Clients

This directory contains client classes for interacting with external services during end-to-end tests.

## MailpitClient

The `MailpitClient` provides a TypeScript interface for interacting with the [Mailpit](https://github.com/axllent/mailpit) email testing tool. Mailpit is a local SMTP server that catches all outgoing emails during testing, allowing you to verify email content without actually sending emails.


### Usage

```typescript
import { MailpitClient } from '../clients/MailpitClient'

test('should send welcome email', async () => {
  // Initialize the client
  const mailpitClient = new MailpitClient()

  // Clear any existing emails
  await mailpitClient.deleteAllMessages()

  // Perform an action that sends an email
  await page.click('[data-testid="signup-button"]')

  // Wait for the email to arrive
  const email = await mailpitClient.waitForMessageByRecipient('user@example.com')

  // Verify the email content
  expect(email).not.toBeNull()
  if (email) {
    expect(email.Subject).toContain('Welcome')

    // Get full message details
    const messageDetails = await mailpitClient.getMessage(email.ID)
    expect(messageDetails.HTML).toContain('Welcome to our service')
  }
})
```

### Available Methods

- `getMessages()`: Get all messages in the mailbox
- `getMessage(messageId)`: Get a specific message by ID
- `findMessageBySubject(subject)`: Find a message by subject
- `findMessageByRecipient(email)`: Find a message by recipient email
- `getLatestMessage()`: Get the most recent message
- `deleteAllMessages()`: Delete all messages in the mailbox
- `deleteMessage(messageId)`: Delete a specific message by ID
- `waitForMessageBySubject(subject, timeoutMs)`: Wait for a message with the given subject
- `waitForMessageByRecipient(email, timeoutMs)`: Wait for a message sent to a specific email

### Best Practices

1. Always clear the mailbox before tests that involve email sending
2. Use the wait methods to handle asynchronous email delivery
3. Extract and verify important information from emails (like magic links)
4. Consider adding a helper method to your test setup to initialize MailpitClient

### Example: Testing Magic Link Authentication

```typescript
test('magic link authentication flow', async ({ page }) => {
  const mailpitClient = new MailpitClient()
  await mailpitClient.deleteAllMessages()

  // Request magic link
  await page.fill('[data-testid="email-input"]', 'user@example.com')
  await page.click('[data-testid="request-link-button"]')

  // Wait for and extract the magic link
  const email = await mailpitClient.waitForMessageByRecipient('user@example.com')
  expect(email).not.toBeNull()

  if (email) {
    const messageDetails = await mailpitClient.getMessage(email.ID)
    const magicLinkMatch = messageDetails.HTML.match(/href="([^"]+)"/)
    expect(magicLinkMatch).not.toBeNull()

    if (magicLinkMatch && magicLinkMatch[1]) {
      const magicLink = magicLinkMatch[1]

      // Navigate to the magic link
      await page.goto(magicLink)

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
    }
  }
})
```
