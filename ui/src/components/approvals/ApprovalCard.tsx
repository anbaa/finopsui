'use client'

import { useState } from 'react'
import { HardDrive, Server, Database, Zap, FileCode, Check, X } from 'lucide-react'
import { Recommendation } from '@/lib/types'
import { cn, formatSavings, getInitials, timeAgo } from '@/lib/utils'
import { ScriptPreviewModal } from './ScriptPreviewModal'
import { useApproveRemediation, useDenyRemediation } from '@/hooks/useApprovals'

const resourceTypeIcon = {
  EbsVolume: HardDrive,
  Ec2Instance: Server,
  RdsDbInstance: Database,
  LambdaFunction: Zap,
}

const envColors: Record<string, string> = {
  Mekong: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Yarra: 'bg-blue-100 text-blue-700 ring-blue-200',
  Congo: 'bg-orange-100 text-orange-700 ring-orange-200',
  'Non-Production': 'bg-slate-100 text-slate-600 ring-slate-200',
}

interface ApprovalCardProps {
  submittedBy: string
  submittedAt: string
  recommendations: Recommendation[]
}

export function ApprovalCard({ submittedBy, submittedAt, recommendations }: ApprovalCardProps) {
  const [previewRec, setPreviewRec] = useState<Recommendation | null>(null)
  const [executingId, setExecutingId] = useState<string | null>(null)

  const { mutateAsync: approve } = useApproveRemediation()
  const { mutateAsync: deny } = useDenyRemediation()

  const totalSavings = recommendations.reduce((sum, r) => sum + Number(r.estimated_savings), 0)
  const initials = getInitials(submittedBy)

  const handleApprove = async (id: string) => {
    setExecutingId(id)
    try {
      await approve({ id, approvedBy: 'Jane Doe' })
      setPreviewRec(null)
    } finally {
      setExecutingId(null)
    }
  }

  const handleDeny = async (id: string) => {
    setExecutingId(id)
    try {
      await deny({ id, approvedBy: 'Jane Doe' })
      setPreviewRec(null)
    } finally {
      setExecutingId(null)
    }
  }

  const handleApproveAll = async () => {
    for (const rec of recommendations) {
      await handleApprove(rec.recommendation_id)
    }
  }

  const handleDenyAll = async () => {
    for (const rec of recommendations) {
      await handleDeny(rec.recommendation_id)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 text-xs font-bold">{initials}</span>
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{submittedBy}</div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="font-medium text-slate-500">{recommendations.length}</span>
                <span>resource{recommendations.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span className="font-semibold text-green-700">
                  ${totalSavings.toFixed(2)}/mo savings
                </span>
                <span>•</span>
                <span>{timeAgo(submittedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Awaiting Review
            </span>
          </div>
        </div>

        {/* Resource List */}
        <div className="divide-y divide-slate-50">
          {recommendations.map((rec) => {
            const Icon = resourceTypeIcon[rec.resource_type] ?? HardDrive
            const envColor = envColors[rec.processed_env_tag] ?? envColors['Non-Production']

            return (
              <div
                key={rec.recommendation_id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/60 transition-colors group"
              >
                {/* Icon */}
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-slate-500" />
                </div>

                {/* Resource ID */}
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono font-semibold text-slate-900">
                    {rec.resource_id}
                  </code>
                  <div className="text-[10px] text-slate-400 mt-0.5">{rec.recommended_action}</div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ring-1',
                      envColor
                    )}
                  >
                    {rec.processed_env_tag}
                  </span>
                  <span className="text-xs font-semibold text-green-700">
                    {formatSavings(rec.estimated_savings)}
                  </span>
                </div>

                {/* Review Script Button */}
                <button
                  onClick={() => setPreviewRec(rec)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all',
                    'text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700',
                    'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <FileCode size={12} />
                  Review Script
                </button>
              </div>
            )
          })}
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/30">
          <button
            onClick={handleDenyAll}
            disabled={executingId !== null}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all',
              'text-red-600 ring-1 ring-red-200 bg-white hover:bg-red-50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <X size={14} />
            Deny All
          </button>
          <button
            onClick={handleApproveAll}
            disabled={executingId !== null}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all',
              'bg-green-600 text-white hover:bg-green-700 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {executingId ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={14} />
                Approve All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Script Preview Modal */}
      <ScriptPreviewModal
        recommendation={previewRec}
        open={previewRec !== null}
        onClose={() => setPreviewRec(null)}
        onApprove={handleApprove}
        onDeny={handleDeny}
        isExecuting={previewRec ? executingId === previewRec.recommendation_id : false}
      />
    </>
  )
}
