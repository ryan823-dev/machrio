'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface AIAssistantVisibilityContextType {
  shouldHideFloatingButton: boolean
  setShouldHideFloatingButton: (hide: boolean) => void
}

const AIAssistantVisibilityContext = createContext<AIAssistantVisibilityContextType>({
  shouldHideFloatingButton: false,
  setShouldHideFloatingButton: () => {},
})

export function AIAssistantVisibilityProvider({ children }: { children: ReactNode }) {
  const [shouldHideFloatingButton, setShouldHideFloatingButton] = useState(false)

  return (
    <AIAssistantVisibilityContext.Provider value={{ shouldHideFloatingButton, setShouldHideFloatingButton }}>
      {children}
    </AIAssistantVisibilityContext.Provider>
  )
}

export function useAIAssistantVisibility() {
  return useContext(AIAssistantVisibilityContext)
}
