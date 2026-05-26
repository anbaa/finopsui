'use client'

import { useState } from 'react'
import {
  Wrench,
  Clock,
  CheckCircle2,
  Shield,
  TrendingDown,
  Send,
} from 'lucide-react'
import { FilterState } from '@/lib/types'
import { FilterBar } from '@/components/remediation/FilterBar'
import { ResourceTable } from '@/components/remediation/ResourceTable'
import { useRecommendations, useSubmitForApproval } from '@/hooks/useRecommendations'
import { cn } from '@/lib/utils'

const DEFAULT_FILTERS: FilterState = {
  environment: [],
  team: [],
  resourceType: [],
  status: [],
  goNogo: 'all',
  search: '',
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  bgColor: string
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 font-medium mt-0.5">{label}</div>
      </div>
    </div>
  )
}

export default function RemediationPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: recommendations = [], isLoading } = useRecommendations(filters)
  const { mutateAsync: submitForApproval } = useSubmitForApproval()

  // Calculate stats from unfiltered data
  const { data: allRecs = [] } = useRecommendations({})

  const statsToModify = allRecs.filter((r) => r.processing_status === 'TO_MODIFY').length
  const statsPending = allRecs.filter((r) => r.processing_status === 'PENDING_APPROVAL').length
  const statsCompleted = allRecs.filter((r) => r.processing_status === 'COMPLETED').length
  const statsExempted = allRecs.filter((r) => r.processing_status === 'EXEMPTED').length
  const totalSavings = allRecs.reduce((sum, r) => sum + Number(r.estimated_savings), 0)

  const goItems = recommendations.filter(
    (r) => r.processing_status === 'TO_MODIFY' && r.go_nogo === 'GO'
  )
  const selectedGoItems = selectedIds.filter((id) =>
    goItems.some((r) => r.recommendation_id === id)
  )

  const handleSubmit = async () => {
    if (selectedGoItems.length === 0) return
    setIsSubmitting(true)
    try {
      await submitForApproval({
        ids: selectedGoItems,
        submittedBy: 'Jane Doe',
      })
      setSelectedIds([])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 ring-1 ring-green-200">
              <TrendingDown size={12} />
              ${totalSavings.toFixed(2)}/mo potential savings
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedGoItems.length === 0 || isSubmitting}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
            selectedGoItems.length > 0
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            'disabled:opacity-60 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={15} />
              Submit{selectedGoItems.length > 0 ? ` ${selectedGoItems.length} Selected` : ' for Approval'}
            </>
          )}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ready to Action"
          value={statsToModify}
          icon={Wrench}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          label="Pending Approval"
          value={statsPending}
          icon={Clock}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          label="Completed"
          value={statsCompleted}
          icon={CheckCircle2}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Exempted"
          value={statsExempted}
          icon={Shield}
          color="text-slate-500"
          bgColor="bg-slate-100"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      <ResourceTable
        recommendations={recommendations}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  )
}
