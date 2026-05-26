'use client'

import { Github, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type PillState = 'pending' | 'done' | 'error'

interface ToolPillProps {
  repo: string
  branch: string
  state: PillState
  commitUrl?: string
}

export function ToolPill({ repo, branch, state, commitUrl }: ToolPillProps) {
  const label =
    state === 'done'
      ? `pushed: ${repo}@${branch}`
      : state === 'error'
        ? `push failed: ${repo}`
        : `pushing to ${repo}/${branch}…`

  return (
    <a
      href={commitUrl ?? '#'}
      target={commitUrl ? '_blank' : undefined}
      rel="noreferrer"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
        state === 'done'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          : state === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-slate-100 text-slate-600 border-slate-200 cursor-default'
      )}
    >
      <Github size={12} />
      {state === 'pending' && <Loader2 size={11} className="animate-spin" />}
      {state === 'done' && <CheckCircle2 size={11} className="text-emerald-600" />}
      {state === 'error' && <XCircle size={11} className="text-red-600" />}
      {label}
    </a>
  )
}
