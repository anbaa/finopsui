'use client'

import { useState } from 'react'
import { AlertCircle, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HumanHelpInputProps {
  question: string
  context: string
  onSubmit: (answer: string) => void
  disabled?: boolean
}

export function HumanHelpInput({ question, context, onSubmit, disabled }: HumanHelpInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    const answer = value.trim()
    if (!answer || disabled) return
    setValue('')
    onSubmit(answer)
  }

  return (
    <div className="my-3 border border-amber-200 rounded-xl overflow-hidden bg-amber-50">
      <div className="flex items-start gap-2 px-4 py-3 border-b border-amber-200">
        <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">{question}</p>
          {context && <p className="text-xs text-amber-600 mt-0.5">{context}</p>}
        </div>
      </div>
      <div className="flex items-end gap-2 p-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Type your answer…"
          rows={2}
          disabled={disabled}
          className="flex-1 resize-none text-sm bg-white border border-amber-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
            value.trim() && !disabled
              ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
