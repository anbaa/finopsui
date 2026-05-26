'use client'

import { useState, useCallback } from 'react'
import { sendChatMessage, ChatMessage } from '@/lib/api'

export interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return

      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: userText.trim(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)
      setError(null)

      try {
        const result = await sendChatMessage(userText.trim(), history)

        const assistantMsg: DisplayMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: result.response,
        }

        setMessages((prev) => [...prev, assistantMsg])
        setHistory(result.history)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, history]
  )

  const reset = useCallback(() => {
    setMessages([])
    setHistory([])
    setError(null)
  }, [])

  return { messages, isLoading, error, send, reset }
}
