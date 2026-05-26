'use client'

import { AlertTriangle, CheckCircle2, Clock, HelpCircle, TrendingDown } from 'lucide-react'
import { AIReasoning } from '@/lib/types'
import { cn } from '@/lib/utils'

export function parseAIReasoning(raw: string | null): AIReasoning | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed.evidence && parsed.verdict) return parsed as AIReasoning
  } catch {}
  return null
}

const verdictConfig = {
  TO_MODIFY: { label: 'Approved for action', color: 'bg-green-100 text-green-700 ring-green-200', icon: CheckCircle2 },
  DO_NOT_MODIFY: { label: 'Do not modify', color: 'bg-slate-100 text-slate-600 ring-slate-200', icon: HelpCircle },
  NEEDS_DATA: { label: 'Needs more data', color: 'bg-amber-100 text-amber-700 ring-amber-200', icon: Clock },
}

const confidenceConfig = {
  High:   { color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  Medium: { color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  Low:    { color: 'bg-red-50 text-red-600 ring-red-200' },
}

interface AIReasoningPanelProps {
  reasoning: AIReasoning
  compact?: boolean
}

export function AIReasoningPanel({ reasoning, compact = false }: AIReasoningPanelProps) {
  const verdict = verdictConfig[reasoning.verdict] ?? verdictConfig.NEEDS_DATA
  const confidence = confidenceConfig[reasoning.confidence] ?? confidenceConfig.Medium
  const VerdictIcon = verdict.icon

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ring-1', verdict.color)}>
          <VerdictIcon size={11} />
          {verdict.label}
        </span>
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full font-medium ring-1', confidence.color)}>
          {reasoning.confidence} confidence
        </span>
        <span className="text-slate-400 flex items-center gap-1">
          <Clock size={11} />
          {reasoning.evaluation_days}d data
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row: verdict + confidence + evaluation window */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1', verdict.color)}>
          <VerdictIcon size={12} />
          {verdict.label}
        </span>
        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ring-1', confidence.color)}>
          {reasoning.confidence} Confidence
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full ring-1 ring-slate-200">
          <Clock size={11} />
          Based on {reasoning.evaluation_days} days of CloudWatch data
        </span>
        {reasoning.recommendation && (
          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full ring-1 ring-green-200 ml-auto">
            <TrendingDown size={11} />
            {reasoning.recommendation}
          </span>
        )}
      </div>

      {/* Evidence */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidence</p>
        <ul className="space-y-1">
          {reasoning.evidence.map((item, i) => {
            const isZero = /:\s*0$/.test(item.trim())
            const isUnattached = /unattached|available|no i\/o|attachment_count:\s*0/i.test(item)
            return (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={cn(
                  'mt-0.5 w-1.5 h-1.5 rounded-full shrink-0',
                  isZero || isUnattached ? 'bg-green-500' : 'bg-slate-300'
                )} />
                <span className="font-mono text-xs leading-5">{item}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Risk */}
      {reasoning.risk && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 mb-0.5">Risk</p>
            <p className="text-xs text-amber-700">{reasoning.risk}</p>
          </div>
        </div>
      )}
    </div>
  )
}
