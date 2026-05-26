'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, RotateCcw, Bot, Sparkles, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useAgentStream,
  StreamMessage,
  AgentEvent,
  AgentToolUseEvent,
  AgentToolResultEvent,
} from '@/hooks/useAgentStream'
import { CodeView } from '@/components/chat/CodeView'
import { ToolPill } from '@/components/chat/ToolPill'
import { HumanHelpInput } from '@/components/chat/HumanHelpInput'
import { MarkdownText } from '@/components/chat/MarkdownText'

const EXAMPLE_PROMPTS = [
  {
    title: 'Embeddings to Parquet',
    description: 'Generate text embeddings with Titan v2, save as Parquet',
    prompt:
      'Write a script that uses amazon.titan-embed-text-v2:0 to generate embeddings for a list of text strings and saves them to a local Parquet file. Push to anbaa/scriptgeneratoragent.',
  },
  {
    title: 'RAG ingestion pipeline',
    description: 'Chunk a PDF, embed it, store in ChromaDB',
    prompt:
      'Build a RAG ingestion pipeline: chunk a PDF into 512-token segments, embed each with Titan, and store in a local ChromaDB collection. Push to anbaa/scriptgeneratoragent.',
  },
  {
    title: 'Prompt benchmarker',
    description: 'Compare two Claude prompts against a test CSV',
    prompt:
      'Write a benchmarking script that tests two Claude prompts against a test set from a CSV file (columns: input, expected_output) and reports accuracy and latency. Push to anbaa/scriptgeneratoragent.',
  },
  {
    title: 'Bedrock streaming inference',
    description: 'Streaming Claude calls with retry and backoff',
    prompt:
      'Create a Bedrock inference script with streaming responses from Claude, exponential backoff on throttling, and a CLI --prompt argument. Push to anbaa/scriptgeneratoragent.',
  },
]

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

type GroupedEvent =
  | { type: 'text'; content: string }
  | AgentToolUseEvent
  | AgentToolResultEvent

function groupEvents(events: AgentEvent[]): GroupedEvent[] {
  const grouped: GroupedEvent[] = []
  for (const ev of events) {
    if (ev.type === 'text') {
      const last = grouped[grouped.length - 1]
      if (last?.type === 'text') {
        last.content += ev.content
      } else {
        grouped.push({ type: 'text', content: ev.content })
      }
    } else {
      grouped.push(ev as AgentToolUseEvent | AgentToolResultEvent)
    }
  }
  return grouped
}

function AssistantMessage({
  msg,
  onHumanAnswer,
}: {
  msg: StreamMessage
  onHumanAnswer: (answer: string) => void
}) {
  const resultMap: Record<string, string> = {}
  for (const ev of msg.events) {
    if (ev.type === 'tool_result') {
      resultMap[(ev as AgentToolResultEvent).tool_use_id] = (ev as AgentToolResultEvent).output
    }
  }

  const isEmpty = msg.events.length === 0
  const grouped = groupEvents(msg.events)

  return (
    <div className="flex gap-3 w-full">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mt-0.5">
        <Bot size={14} className="text-indigo-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {isEmpty && <ThinkingDots />}

        {grouped.map((ev, i) => {
          if (ev.type === 'text') {
            if (!ev.content.trim()) return null
            return (
              <div
                key={i}
                className="bg-white rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm px-4 py-3"
              >
                <MarkdownText text={ev.content} />
              </div>
            )
          }

          if (ev.type === 'tool_use') {
            const toolEv = ev as AgentToolUseEvent

            if (toolEv.name === 'code_view') {
              const inp = toolEv.input as {
                filename?: string
                language?: string
                content?: string
              }
              return (
                <CodeView
                  key={i}
                  filename={inp.filename ?? 'output.py'}
                  language={inp.language ?? 'python'}
                  content={inp.content ?? ''}
                />
              )
            }

            if (toolEv.name === 'push_to_github') {
              const inp = toolEv.input as { repo?: string; branch?: string }
              const result = resultMap[toolEv.id]
              let commitUrl: string | undefined
              let state: 'pending' | 'done' | 'error' = 'pending'
              if (result) {
                try {
                  const parsed = JSON.parse(result)
                  commitUrl = parsed.html_url
                  state = 'done'
                } catch {
                  state = 'error'
                }
              }
              return (
                <div key={i}>
                  <ToolPill
                    repo={inp.repo ?? ''}
                    branch={inp.branch ?? ''}
                    state={state}
                    commitUrl={commitUrl}
                  />
                </div>
              )
            }

            if (toolEv.name === 'request_human_help') {
              const inp = toolEv.input as { question?: string; context?: string }
              return (
                <HumanHelpInput
                  key={i}
                  question={inp.question ?? 'The agent needs your input'}
                  context={inp.context ?? ''}
                  onSubmit={onHumanAnswer}
                />
              )
            }
          }

          return null
        })}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { messages, isStreaming, error, send, reset } = useAgentStream()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    send(text)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Welcome / empty state */
          <div className="flex flex-col items-center justify-center h-full gap-10 px-6 text-center max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center">
                <Code2 size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">AI Script Generator</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed max-w-md">
                  Describe any AI/ML task in plain English. I&apos;ll generate a runnable Python
                  script, show you the code, and push it directly to GitHub.
                </p>
              </div>
            </div>

            {/* Example prompt cards */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {EXAMPLE_PROMPTS.map((ep) => (
                <button
                  key={ep.title}
                  onClick={() => send(ep.prompt)}
                  disabled={isStreaming}
                  className="flex flex-col items-start gap-1.5 p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm hover:bg-indigo-50/40 transition-all text-left group disabled:opacity-40"
                >
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {ep.title}
                  </span>
                  <span className="text-xs text-slate-500 leading-relaxed">{ep.description}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles size={11} />
              Powered by Claude on AWS Bedrock AgentCore
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                /* User bubble */
                <div key={msg.id} className="flex gap-3 flex-row-reverse">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mt-0.5">
                    <span className="text-white text-[11px] font-bold">U</span>
                  </div>
                  <div className="max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ) : (
                <AssistantMessage
                  key={msg.id}
                  msg={msg}
                  onHumanAnswer={(answer) => send(answer)}
                />
              )
            )}

            {error && (
              <div className="flex justify-center">
                <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {error}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {!isEmpty && (
            <div className="flex justify-end mb-2">
              <button
                onClick={reset}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
              >
                <RotateCcw size={11} />
                New conversation
              </button>
            </div>
          )}

          <div
            className={cn(
              'flex items-end gap-3 bg-slate-50 rounded-2xl border transition-shadow',
              isStreaming
                ? 'border-slate-200'
                : 'border-slate-200 focus-within:border-indigo-300 focus-within:shadow-md focus-within:bg-white'
            )}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe an AI/ML task — e.g. 'Build a RAG pipeline with Bedrock embeddings and ChromaDB'…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none px-4 py-3.5 text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400 max-h-40 overflow-y-auto disabled:opacity-50"
              style={{ lineHeight: '1.5' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={cn(
                'flex-shrink-0 m-2 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !isStreaming
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Shift+Enter for new line · Enter to send · Scripts are pushed directly to GitHub
          </p>
        </div>
      </div>
    </div>
  )
}
