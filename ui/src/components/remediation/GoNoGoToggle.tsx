'use client'

import { Check, X, HelpCircle } from 'lucide-react'
import { GoNoGo } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GoNoGoToggleProps {
  value: GoNoGo
  onChange: (value: GoNoGo) => void
  disabled?: boolean
  loading?: boolean
}

export function GoNoGoToggle({ value, onChange, disabled, loading }: GoNoGoToggleProps) {
  const handleClick = () => {
    if (disabled || loading) return
    if (value === null) onChange('GO')
    else if (value === 'GO') onChange('NO_GO')
    else onChange('GO')
  }

  if (disabled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 text-[11px] font-medium cursor-not-allowed select-none">
        <span>—</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 animate-pulse">
        <div className="w-12 h-3 bg-slate-200 rounded" />
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1',
        value === 'GO' && [
          'bg-green-100 text-green-700 ring-1 ring-green-200 hover:bg-green-200',
          'focus:ring-green-400',
        ],
        value === 'NO_GO' && [
          'bg-red-100 text-red-700 ring-1 ring-red-200 hover:bg-red-200',
          'focus:ring-red-400',
        ],
        value === null && [
          'bg-slate-100 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-200',
          'focus:ring-slate-400',
        ]
      )}
      title={
        value === null
          ? 'Click to set GO'
          : value === 'GO'
          ? 'Click to set NO GO'
          : 'Click to set GO'
      }
    >
      {value === 'GO' && (
        <>
          <Check size={10} strokeWidth={3} />
          <span>GO</span>
        </>
      )}
      {value === 'NO_GO' && (
        <>
          <X size={10} strokeWidth={3} />
          <span>NO GO</span>
        </>
      )}
      {value === null && (
        <>
          <HelpCircle size={10} />
          <span>Set Decision</span>
        </>
      )}
    </button>
  )
}
