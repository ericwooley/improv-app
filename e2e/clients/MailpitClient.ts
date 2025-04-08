import axios from 'axios'

interface Address {
  Name: string
  Address: string
}

interface Attachment {
  ContentID: string
  ContentType: string
  FileName: string
  PartID: string
  Size: number
}

interface MessageSummary {
  Attachments: number
  Bcc: Address[]
  Cc: Address[]
  Created: string
  From: Address
  ID: string
  MessageID: string
  Read: boolean
  ReplyTo: Address[]
  Size: number
  Snippet: string
  Subject: string
  Tags: string[]
  To: Address[]
}

interface MessageListResponse {
  messages: MessageSummary[]
  messages_count: number
  start: number
  tags: string[]
  total: number
  unread: number
}

interface MessageDetail {
  Attachments: Attachment[]
  Bcc: Address[]
  Cc: Address[]
  Date: string
  From: Address
  HTML: string
  ID: string
  Inline: Attachment[]
  MessageID: string
  ReplyTo: Address[]
  ReturnPath: string
  Size: number
  Subject: string
  Tags: string[]
  Text: string
  To: Address[]
}

export class MailpitClient {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:8030') {
    this.baseUrl = baseUrl
  }

  /**
   * Get a list of all messages in the mailbox
   */
  async getMessages(): Promise<MessageListResponse> {
    const response = await axios.get(`${this.baseUrl}/api/v1/messages`, {
      headers: {
        accept: 'application/json',
      },
    })
    return response.data
  }

  /**
   * Get a specific message by ID
   * @param messageId The ID of the message to retrieve
   */
  async getMessage(messageId: string): Promise<MessageDetail> {
    const response = await axios.get(`${this.baseUrl}/api/v1/message/${messageId}`, {
      headers: {
        accept: 'application/json',
      },
    })
    return response.data
  }

  /**
   * Find a message by subject
   * @param subject The subject to search for
   * @returns The first message matching the subject or null if not found
   */
  async findMessageBySubject(subject: string): Promise<MessageSummary | null> {
    const messages = await this.getMessages()
    return messages.messages.find((msg) => msg.Subject === subject) || null
  }

  /**
   * Find a message by recipient email
   * @param email The email address to search for
   * @returns The first message sent to the email or null if not found
   */
  async findMessageByRecipient(email: string): Promise<MessageSummary | null> {
    const messages = await this.getMessages()
    return messages.messages.find((msg) => msg.To.some((recipient) => recipient.Address === email)) || null
  }

  /**
   * Get the latest message
   * @returns The most recent message or null if mailbox is empty
   */
  async getLatestMessage(): Promise<MessageSummary | null> {
    const messages = await this.getMessages()
    return messages.messages.length > 0 ? messages.messages[0] : null
  }

  /**
   * Delete all messages in the mailbox
   */
  async deleteAllMessages(): Promise<void> {
    await axios.delete(`${this.baseUrl}/api/v1/messages`)
  }

  /**
   * Delete a specific message by ID
   * @param messageId The ID of the message to delete
   */
  async deleteMessage(messageId: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/api/v1/message/${messageId}`)
  }

  /**
   * Wait for a message with the given subject to arrive
   * @param subject The subject to wait for
   * @param timeoutMs Maximum time to wait in milliseconds (default: 10000)
   * @returns The message when found or null if timeout
   */
  async waitForMessageBySubject(subject: string, timeoutMs: number = 10000): Promise<MessageSummary | null> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const message = await this.findMessageBySubject(subject)
      if (message) {
        return message
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return null
  }

  /**
   * Wait for a message sent to a specific email to arrive
   * @param email The email address to wait for
   * @param timeoutMs Maximum time to wait in milliseconds (default: 10000)
   * @returns The message when found or null if timeout
   */
  async waitForMessageByRecipient(email: string, timeoutMs: number = 10000): Promise<MessageSummary | null> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      const message = await this.findMessageByRecipient(email)
      if (message) {
        return message
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return null
  }
}
