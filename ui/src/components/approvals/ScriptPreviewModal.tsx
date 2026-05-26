'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { X, AlertTriangle, Play, Ban, BrainCircuit, Code2 } from 'lucide-react'
import { Recommendation } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/remediation/StatusBadge'
import { AIReasoningPanel, parseAIReasoning } from '@/components/remediation/AIReasoningPanel'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] bg-slate-50 rounded-lg flex items-center justify-center animate-pulse">
      <div className="text-sm text-slate-400">Loading editor...</div>
    </div>
  ),
})

const envColors: Record<string, string> = {
  Mekong: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Yarra: 'bg-blue-100 text-blue-700 ring-blue-200',
  Congo: 'bg-orange-100 text-orange-700 ring-orange-200',
  'Non-Production': 'bg-slate-100 text-slate-600 ring-slate-200',
}

type Tab = 'evidence' | 'script'

interface ScriptPreviewModalProps {
  recommendation: Recommendation | null
  open: boolean
  onClose: () => void
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  isExecuting?: boolean
}

export function ScriptPreviewModal({
  recommendation,
  open,
  onClose,
  onApprove,
  onDeny,
  isExecuting,
}: ScriptPreviewModalProps) {
  const rec = recommendation
  const [activeTab, setActiveTab] = useState<Tab>('evidence')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
      // Start on evidence tab if reasoning is available, otherwise script
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Reset tab when a new recommendation is opened
  useEffect(() => {
    if (open && rec) {
      setActiveTab(rec.ai_reasoning ? 'evidence' : 'script')
    }
  }, [open, rec?.recommendation_id])

  if (!open || !rec) return null

  const envColor = envColors[rec.processed_env_tag] ?? envColors['Non-Production']
  const script =
    rec.full_ai_output ??
    rec.generated_script ??
    `# No script generated yet.\n# This recommendation is pending AI analysis.\nprint("No script available")`

  const reasoning = parseAIReasoning(rec.ai_reasoning ?? null)
  const hasEvidence = !!reasoning

  const tabs: { id: Tab; label: string; icon: React.ElementType; disabled?: boolean }[] = [
    { id: 'evidence', label: 'AI Evidence', icon: BrainCircuit, disabled: !hasEvidence },
    { id: 'script',   label: 'Boto3 Script', icon: Code2 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3 flex-wrap">
            <code className="font-mono text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              {rec.resource_id}
            </code>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">{rec.resource_type}</span>
            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1', envColor)}>
              {rec.processed_env_tag}
            </span>
            <StatusBadge status={rec.processing_status} />
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info row */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span>
              <span className="font-medium text-slate-700">Submitted by</span>{' '}
              {rec.submitted_by ?? 'analyst'}
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <span className="font-medium text-slate-700">Action</span>{' '}
              {rec.recommended_action}
            </span>
            <span className="text-slate-300">|</span>
            <span>
              <span className="font-medium text-slate-700">Team</span>{' '}
              {rec.owner_tag}
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-green-700">
              ${Number(rec.estimated_savings).toFixed(2)}/mo savings
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 px-6 border-b border-slate-200 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : tab.disabled
                    ? 'border-transparent text-slate-300 cursor-not-allowed'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                )}
              >
                <Icon size={14} />
                {tab.label}
                {tab.id === 'evidence' && !hasEvidence && (
                  <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">
                    Not available
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* AI Evidence tab */}
          {activeTab === 'evidence' && reasoning && (
            <div className="px-6 py-5">
              <p className="text-xs text-slate-400 mb-4">
                The planning agent collected these CloudWatch metrics to determine whether this action is safe to take.
              </p>
              <AIReasoningPanel reasoning={reasoning} />
            </div>
          )}

          {/* Boto3 Script tab */}
          {activeTab === 'script' && (
            <div className="px-6 py-4">
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-slate-400 text-xs font-mono">
                    remediation_{rec.resource_id}.py
                  </span>
                  <div />
                </div>
                <MonacoEditor
                  height="360px"
                  language="python"
                  theme="vs-light"
                  value={script}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    lineNumbersMinChars: 3,
                    wordWrap: 'on',
                    renderLineHighlight: 'gutter',
                    scrollbar: { vertical: 'auto', horizontal: 'hidden' },
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Warning banner */}
        <div className="mx-6 mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Warning:</span> Approving will permanently delete{' '}
            <code className="font-mono font-semibold">{rec.resource_id}</code>. Review both the{' '}
            <strong>AI Evidence</strong> and the <strong>Boto3 Script</strong> tabs before approving.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={() => onDeny(rec.recommendation_id)}
            disabled={isExecuting}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all',
              'text-red-600 ring-1 ring-red-200 bg-white hover:bg-red-50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Ban size={15} />
            Deny
          </button>
          <button
            onClick={() => onApprove(rec.recommendation_id)}
            disabled={isExecuting}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all',
              'bg-green-600 text-white hover:bg-green-700 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play size={15} />
                Approve & Execute
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
