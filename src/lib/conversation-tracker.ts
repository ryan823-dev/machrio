/**
 * AI Conversation Tracker
 * 
 * Saves AI assistant conversations to the admin backend for analysis
 * and customer requirement extraction.
 */

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  products?: Array<{
    id: string
    name: string
    sku: string
    price?: string
  }>
}

interface UserData {
  userId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  userCompany?: string
}

interface ConversationData {
  sessionId: string
  messages: ConversationMessage[]
  user?: UserData
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

/**
 * Get user data from session/context if available
 */
export function getUserData(): UserData {
  if (typeof window === 'undefined') {
    return {}
  }
  
  // Try to get user data from various sources
  const userData: UserData = {}
  
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
 * Detect conversation type from messages
 */
export function detectConversationType(messages: ConversationMessage[]): string {
  if (messages.length === 0) return 'general'
  
  const lastUserMessage = messages
    .filter(m => m.role === 'user')
    .pop()
  
  if (!lastUserMessage) return 'general'
  
  const content = lastUserMessage.content.toLowerCase()
  
  // Check for product inquiries
  if (content.includes('product') || content.includes('item') || content.includes('buy') || 
      content.includes('price') || content.includes('cost') || content.includes('quote')) {
    return 'product_inquiry'
  }
  
  // Check for RFQ/bulk orders
  if (content.includes('bulk') || content.includes('rfq') || content.includes('wholesale') || 
      content.includes('large quantity') || content.includes('b2b')) {
    return 'rfq_inquiry'
  }
  
  // Check for shipping questions
  if (content.includes('shipping') || content.includes('delivery') || content.includes('track')) {
    return 'shipping_inquiry'
  }
  
  // Check for returns
  if (content.includes('return') || content.includes('refund') || content.includes('exchange')) {
    return 'returns_support'
  }
  
  // Check for technical support
  if (content.includes('how to') || content.includes('help') || content.includes('issue') || 
      content.includes('problem')) {
    return 'technical_support'
  }
  
  return 'general'
}

/**
 * Save conversation to admin backend
 * 
 * @param data - Conversation data to save
 * @returns Promise with save result
 */
export async function saveConversation(
  data: ConversationData
): Promise<SaveConversationResponse | null> {
  const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL
  
  // Skip if admin API URL is not configured
  if (!adminApiUrl) {
    console.warn('[Conversation Tracker] Admin API URL not configured. Skipping conversation save.')
    return null
  }
  
  try {
    const { sourcePage, sourceUrl } = getPageInfo()
    const userData = getUserData()
    
    const payload = {
      sessionId: data.sessionId,
      messages: data.messages.map(m => ({
        role: m.role,
        content: m.content,
        contentType: 'text',
        contextData: m.products ? { products: m.products } : undefined,
      })),
      user: {
        ...userData,
        ...data.user,
      },
      sourcePage: data.sourcePage || sourcePage,
      sourceUrl: data.sourceUrl || sourceUrl,
      conversationType: data.conversationType || detectConversationType(data.messages),
      metadata: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        referrer: typeof window !== 'undefined' ? document.referrer : undefined,
        timestamp: new Date().toISOString(),
        ...data.metadata,
      },
    }
    
    const response = await fetch(`${adminApiUrl}/api/ai-conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add API key if configured
        ...(process.env.NEXT_PUBLIC_ADMIN_API_KEY && {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
        }),
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Conversation Tracker] Failed to save conversation:', response.status, errorText)
      return null
    }
    
    const result = await response.json()
    console.log('[Conversation Tracker] Conversation saved successfully:', result.id)
    
    return result
  } catch (error) {
    console.error('[Conversation Tracker] Error saving conversation:', error)
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
  const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL
  
  if (!adminApiUrl) {
    return false
  }
  
  try {
    const payload = {
      messageType: message.role,
      content: message.content,
      contentType: 'text',
      contextData: message.products ? { products: message.products } : undefined,
    }
    
    const response = await fetch(`${adminApiUrl}/api/ai-conversations/session/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_ADMIN_API_KEY && {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
        }),
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      console.error('[Conversation Tracker] Failed to save message:', response.status)
      return false
    }
    
    return true
  } catch (error) {
    console.error('[Conversation Tracker] Error saving message:', error)
    return false
  }
}

/**
 * Batch save conversations (for offline sync)
 */
export async function batchSaveConversations(
  conversations: ConversationData[]
): Promise<number> {
  const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL
  
  if (!adminApiUrl) {
    return 0
  }
  
  try {
    const response = await fetch(`${adminApiUrl}/api/ai-conversations/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NEXT_PUBLIC_ADMIN_API_KEY && {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
        }),
      },
      body: JSON.stringify({ conversations }),
    })
    
    if (!response.ok) {
      console.error('[Conversation Tracker] Batch save failed:', response.status)
      return 0
    }
    
    const result = await response.json()
    return result.saved || 0
  } catch (error) {
    console.error('[Conversation Tracker] Batch save error:', error)
    return 0
  }
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
    this.messages.push(message)
    
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
