'use client'

import { useSearchParams } from 'next/navigation'
import { AIAssistant } from './AIAssistant'

export function AIAssistantLauncher() {
  const searchParams = useSearchParams()
  const shouldOpen = searchParams.get('ai') === '1'
  const launchPrompt = searchParams.get('prompt')?.trim() || ''

  return <AIAssistant shouldOpen={shouldOpen} launchPrompt={launchPrompt} />
}
