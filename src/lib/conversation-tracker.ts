/**
 * AI Conversation Tracker
 *
 * Saves AI assistant conversations to the admin backend for analysis
 * and customer requirement extraction.
 */

import {
  detectConversationType,
  normalizeConversationMessage,
  type ConversationMessage,
  type ConversationUserData,
} from '@/lib/ai-conversation-insights'

const LOCAL_CONVERSATION_SYNC_PATH = '/api/ai-conversation-sync'

type ConversationSyncTarget = {
  kind: 'local'
  url: string
}

interface ConversationData {
  sessionId: string
  messages: ConversationMessage[]
  user?: ConversationUserData
  sourcePage?: string
  sourceUrl?: string
  conversationType?: string
  metadata?: Record<string, unknown>
}

interface SaveConversationResponse {
  id: string
  sessionId: string
  status: string
  message?: string
}

/**
 * Generate a unique session ID for conversation tracking
 */
export function generateSessionId(): string {
  // Check if we already have a session ID in sessionStorage
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('machrio_conversation_session_id')

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      sessionStorage.setItem('machrio_conversation_session_id', sessionId)
    }

    return sessionId
  }

  // Server-side fallback
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('machrio_conversation_session_id') || generateSessionId()
  }
  return generateSessionId()
}

/**
 * Reset session ID (call when user logs out or starts fresh)
 */
export function resetSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('machrio_conversation_session_id')
  }
}

function getConversationSyncTargets(): ConversationSyncTarget[] {
  return [
    {
      kind: 'local',
      url: LOCAL_CONVERSATION_SYNC_PATH,
    },
  ]
}

async function parseSaveConversationResponse(
  response: Response,
  sessionId: string,
): Promise<SaveConversationResponse> {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const json = (await response.json().catch(() => null)) as Partial<SaveConversationResponse> | null

    return {
      id: typeof json?.id === 'string' && json.id ? json.id : sessionId,
      sessionId: typeof json?.sessionId === 'string' && json.sessionId ? json.sessionId : sessionId,
      status: typeof json?.status === 'string' && json.status ? json.status : 'saved',
      message: typeof json?.message === 'string' ? json.message : undefined,
    }
  }

  const text = await response.text().catch(() => '')

  return {
    id: sessionId,
    sessionId,
    status: 'saved',
    message: text || undefined,
  }
}

async function readErrorResponse(response: Response): Promise<string> {
  return (await response.text().catch(() => '')) || response.statusText || 'Unknown error'
}

/**
 * Get user data from session/context if available
 */
export function getUserData(): ConversationUserData {
  if (typeof window === 'undefined') {
    return {}
  }

  // Try to get user data from various sources
  const userData: ConversationUserData = {}

  // Check for stored user info (if your app has this)
  try {
    const storedUser = localStorage.getItem('machrio_user_info')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      userData.userId = parsed.id
      userData.userName = parsed.name
      userData.userEmail = parsed.email
      userData.userPhone = parsed.phone
      userData.userCompany = parsed.company
    }
  } catch {
    // Ignore errors
  }

  return userData
}

/**
 * Get current page information
 */
export function getPageInfo(): { sourcePage: string; sourceUrl: string } {
  if (typeof window === 'undefined') {
    return {
      sourcePage: 'unknown',
      sourceUrl: 'unknown',
    }
  }

  const path = window.location.pathname
  const title = document.title || 'Machrio'

  return {
    sourcePage: `${title} - ${path}`,
    sourceUrl: window.location.href,
  }
}

/**
 * Save conversation to the configured backend.
 *
 * The browser always sends snapshots to the same-origin sync route so the site
 * can forward them server-side without depending on NEXT_PUBLIC_* build-time
 * env vars in production.
 *
 * @param data - Conversation data to save
 * @returns Promise with save result
 */
export async function saveConversation(
  data: ConversationData
): Promise<SaveConversationResponse | null> {
  const normalizedMessages = data.messages
    .map((message) => normalizeConversationMessage(message))
    .filter((message): message is ConversationMessage => Boolean(message))

  if (normalizedMessages.length === 0) {
    return null
  }

  try {
    const { sourcePage, sourceUrl } = getPageInfo()
    const userData = getUserData()

    const payload = {
      sessionId: data.sessionId,
      messages: normalizedMessages.map((message) => ({
        role: message.role,
        content: message.content,
        products: message.products,
        timestamp: message.timestamp,
      })),
      user: {
        ...userData,
        ...data.user,
      },
      sourcePage: data.sourcePage || sourcePage,
      sourceUrl: data.sourceUrl || sourceUrl,
      conversationType: data.conversationType || detectConversationType(normalizedMessages),
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        timestamp: new Date().toISOString(),
        ...data.metadata,
      },
    }

    const syncTargets = getConversationSyncTargets()
    let lastError: { status?: number; text: string; url: string } | null = null

    for (const target of syncTargets) {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_ADMIN_API_KEY && {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
          }),
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })

      if (response.ok) {
        const result = await parseSaveConversationResponse(response, data.sessionId)
        console.log('[Conversation Tracker] Conversation saved successfully:', {
          id: result.id,
          target: target.url,
          kind: target.kind,
        })
        return result
      }

      const errorText = await readErrorResponse(response)
      lastError = {
        status: response.status,
        text: errorText,
        url: target.url,
      }

      console.error(
        '[Conversation Tracker] Failed to save conversation snapshot:',
        response.status,
        target.url,
        errorText,
      )
    }

    console.error('[Conversation Tracker] Failed to save conversation snapshot after trying all targets.', {
      sessionId: data.sessionId,
      targets: syncTargets.map((target) => target.url),
      lastError,
    })
    return null
  } catch (error) {
    console.error('[Conversation Tracker] Error saving conversation snapshot:', error)
    return null
  }
}

/**
 * Save a single message to an existing conversation
 *
 * @param sessionId - Session ID of the conversation
 * @param message - Message to save
 * @returns Promise with save result
 */
export async function saveMessage(
  sessionId: string,
  message: ConversationMessage
): Promise<boolean> {
  const result = await saveConversation({
    sessionId,
    messages: [message],
  })

  return Boolean(result)
}

/**
 * Batch save conversations (for offline sync)
 */
export async function batchSaveConversations(
  conversations: ConversationData[]
): Promise<number> {
  const results = await Promise.all(conversations.map((conversation) => saveConversation(conversation)))
  return results.filter(Boolean).length
}

/**
 * Hook-friendly wrapper for saving conversations
 * Can be used in React components
 */
export class ConversationTracker {
  private sessionId: string
  private messages: ConversationMessage[] = []
  private saveTimeout: NodeJS.Timeout | null = null
  private autoSaveEnabled: boolean = false

  constructor(sessionId?: string) {
    this.sessionId = sessionId || generateSessionId()
  }

  /**
   * Add a message to the tracker
   */
  addMessage(message: ConversationMessage): void {
    const normalizedMessage = normalizeConversationMessage(message)

    if (!normalizedMessage) {
      return
    }

    this.messages.push(normalizedMessage)

    // Auto-save if enabled
    if (this.autoSaveEnabled) {
      this.scheduleAutoSave()
    }
  }

  /**
   * Enable auto-save with debounce
   */
  enableAutoSave(debounceMs: number = 5000): void {
    this.autoSaveEnabled = true

    if (this.messages.length > 0) {
      this.scheduleAutoSave(debounceMs)
    }
  }

  /**
   * Disable auto-save
   */
  disableAutoSave(): void {
    this.autoSaveEnabled = false
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
  }

  /**
   * Schedule an auto-save
   */
  private scheduleAutoSave(debounceMs: number = 5000): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      this.save()
    }, debounceMs)
  }

  /**
   * Save the conversation
   */
  async save(): Promise<SaveConversationResponse | null> {
    if (this.messages.length === 0) {
      return null
    }

    const result = await saveConversation({
      sessionId: this.sessionId,
      messages: [...this.messages],
    })

    // Clear messages after successful save
    if (result) {
      this.messages = []
    }

    return result
  }

  /**
   * Get current message count
   */
  getMessageCount(): number {
    return this.messages.length
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Reset the tracker
   */
  reset(): void {
    this.messages = []
    this.disableAutoSave()
  }
}
