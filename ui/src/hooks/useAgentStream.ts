'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

export type AgentEventType = 'text' | 'tool_use' | 'tool_result'

export interface AgentTextEvent {
  type: 'text'
  content: string
}

export interface AgentToolUseEvent {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface AgentToolResultEvent {
  type: 'tool_result'
  tool_use_id: string
  output: string
}

export type AgentEvent = AgentTextEvent | AgentToolUseEvent | AgentToolResultEvent

export interface StreamMessage {
  id: string
  role: 'user' | 'assistant'
  /** For assistant messages, the accumulated events */
  events: AgentEvent[]
  /** Convenience: plain text content */
  text: string
  /** Pending blocking input from request_human_help */
  awaitingInput?: { toolUseId: string; question: string; context: string }
}

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? ''
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? ''

export function useAgentStream() {
  const { getIdToken } = useAuth()
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionId = useRef(crypto.randomUUID())
  const wsRef = useRef<WebSocket | null>(null)

  const _appendEvent = (msgId: string, event: AgentEvent) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m
        const events = [...m.events, event]
        const text = events
          .filter((e): e is AgentTextEvent => e.type === 'text')
          .map((e) => e.content)
          .join('')
        const awaitingInput =
          event.type === 'tool_use' && event.name === 'request_human_help'
            ? {
                toolUseId: event.id,
                question: String((event.input as Record<string, unknown>).question ?? ''),
                context: String((event.input as Record<string, unknown>).context ?? ''),
              }
            : m.awaitingInput
        return { ...m, events, text, awaitingInput }
      })
    )
  }

  const send = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return

      const userMsg: StreamMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        events: [{ type: 'text', content: userText.trim() }],
        text: userText.trim(),
      }
      const assistantId = `assistant-${Date.now()}`
      const assistantMsg: StreamMessage = {
        id: assistantId,
        role: 'assistant',
        events: [],
        text: '',
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsStreaming(true)
      setError(null)

      if (WS_URL) {
        // WebSocket path — no timeout cap
        try {
          // Attach the JWT so API Gateway / BFF can validate the caller.
          // WebSocket upgrade requests can't carry custom headers, so we pass
          // the token as a query param and validate it server-side.
          const token = await getIdToken().catch(() => '')
          const wsUrlWithAuth = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL
          const ws = new WebSocket(wsUrlWithAuth)
          wsRef.current = ws

          ws.onopen = () => {
            ws.send(
              JSON.stringify({
                prompt: userText.trim(),
                session_id: sessionId.current,
              })
            )
          }

          ws.onmessage = (msgEvent) => {
            try {
              const event = JSON.parse(msgEvent.data as string)
              if (event.type === 'done') {
                setIsStreaming(false)
                ws.close()
                return
              }
              if (event.type === 'error') {
                setError(event.content ?? 'Agent error')
                setIsStreaming(false)
                ws.close()
                return
              }
              _appendEvent(assistantId, event as AgentEvent)
            } catch {
              // ignore parse errors on individual frames
            }
          }

          ws.onerror = () => {
            setError('WebSocket connection error')
            setIsStreaming(false)
          }

          ws.onclose = (e) => {
            // Abnormal closure without a done/error message
            if (e.code !== 1000 && e.code !== 1001) {
              setIsStreaming(false)
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'WebSocket error')
          setIsStreaming(false)
        }
        return
      }

      // Fallback: HTTP SSE path (used when NEXT_PUBLIC_WS_URL is not set)
      try {
        const token = await getIdToken().catch(() => '')
        const resp = await fetch(`${BFF_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            prompt: userText.trim(),
            session_id: sessionId.current,
          }),
        })

        if (!resp.ok) {
          throw new Error(`BFF error: ${resp.status} ${resp.statusText}`)
        }

        const reader = resp.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const event: AgentEvent = JSON.parse(raw)
              _appendEvent(assistantId, event)
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Stream error')
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming]
  )

  const reset = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    setMessages([])
    setError(null)
    sessionId.current = crypto.randomUUID()
  }, [])

  return { messages, isStreaming, error, send, reset }
}
