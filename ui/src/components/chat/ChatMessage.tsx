'use client'

import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownText } from './MarkdownText'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  text: string
  isLoading?: boolean
}

export function ChatMessage({ role, text, isLoading }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3 w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
          isUser ? 'bg-indigo-600' : 'bg-slate-800'
        )}
      >
        {isUser ? (
          <User size={15} className="text-white" />
        ) : (
          <Bot size={15} className="text-indigo-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 shadow-sm rounded-tl-sm'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : isUser ? (
          <p className="text-sm leading-relaxed text-white">{text}</p>
        ) : (
          <MarkdownText text={text} />
        )}
      </div>
    </div>
  )
}
