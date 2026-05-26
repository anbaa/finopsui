'use client'

import { CheckCircle } from 'lucide-react'
import { useApprovals } from '@/hooks/useApprovals'
import { ApprovalCard } from '@/components/approvals/ApprovalCard'
import { Recommendation } from '@/lib/types'

function groupBySubmitter(
  recommendations: Recommendation[]
): Array<{
  submittedBy: string
  submittedAt: string
  recommendations: Recommendation[]
}> {
  const groups: Record<
    string,
    { submittedBy: string; submittedAt: string; recommendations: Recommendation[] }
  > = {}

  for (const rec of recommendations) {
    const key = rec.submitted_by ?? 'Unknown'
    if (!groups[key]) {
      groups[key] = {
        submittedBy: rec.submitted_by ?? 'Unknown',
        submittedAt: rec.created_at,
        recommendations: [],
      }
    }
    groups[key].recommendations.push(rec)

    // Use earliest date as group date
    if (rec.created_at < groups[key].submittedAt) {
      groups[key].submittedAt = rec.created_at
    }
  }

  return Object.values(groups)
}

export default function ApprovalsPage() {
  const { data: pending = [], isLoading, pendingCount } = useApprovals()

  const groups = groupBySubmitter(pending)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Count Badge in page header area */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                {[1, 2].map((j) => (
                  <div key={j} className="h-10 bg-slate-50 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && pending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-700">No pending approvals</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              All remediation requests have been reviewed. Submit new recommendations from the
              Remediation page.
            </p>
          </div>
          <a
            href="/remediation"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Remediation
          </a>
        </div>
      )}

      {/* Approval Cards */}
      {!isLoading && groups.length > 0 && (
        <div className="space-y-4">
          {groups.map((group) => (
            <ApprovalCard
              key={group.submittedBy}
              submittedBy={group.submittedBy}
              submittedAt={group.submittedAt}
              recommendations={group.recommendations}
            />
          ))}
        </div>
      )}
    </div>
  )
}
