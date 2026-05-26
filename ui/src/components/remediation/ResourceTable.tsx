'use client'

import { useState, Fragment } from 'react'
import {
  HardDrive,
  Server,
  Database,
  Zap,
  Copy,
  Check,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  BrainCircuit,
} from 'lucide-react'
import { Recommendation } from '@/lib/types'
import { cn, formatSavings } from '@/lib/utils'
import { StatusBadge } from './StatusBadge'
import { GoNoGoToggle } from './GoNoGoToggle'
import { AIReasoningPanel, parseAIReasoning } from './AIReasoningPanel'
import { useUpdateGoNogo } from '@/hooks/useRecommendations'

interface ResourceTableProps {
  recommendations: Recommendation[]
  isLoading?: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 ml-1.5 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-all"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={11} className="text-green-500" />
      ) : (
        <Copy size={11} />
      )}
    </button>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(11)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-200 rounded" style={{ width: i <= 1 ? 16 : '100%' }} />
        </td>
      ))}
    </tr>
  )
}

function ActionCell({ rec }: { rec: Recommendation }) {
  const { processing_status, go_nogo } = rec

  if (processing_status === 'TO_MODIFY') {
    if (go_nogo === 'GO') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-indigo-600 ring-1 ring-indigo-200 rounded-full bg-indigo-50">
          Ready to submit
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200 rounded-full bg-slate-50 cursor-not-allowed">
        Set GO first
      </span>
    )
  }

  if (processing_status === 'PENDING_APPROVAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 rounded-full bg-amber-50">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Pending...
      </span>
    )
  }

  if (processing_status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-green-700 ring-1 ring-green-200 rounded-full bg-green-50">
        <Check size={10} strokeWidth={3} />
        Completed
      </span>
    )
  }

  if (processing_status === 'DENIED') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-red-200 rounded-full bg-red-50">
        Denied
      </span>
    )
  }

  if (processing_status === 'EXEMPTED') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 rounded-full bg-slate-50">
        Exempt
      </span>
    )
  }

  return null
}

export function ResourceTable({
  recommendations,
  isLoading,
  selectedIds,
  onSelectionChange,
}: ResourceTableProps) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { mutate: updateGoNogo, isPending: goNogoLoading } = useUpdateGoNogo()

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedRecs = [...recommendations].sort((a, b) => {
    if (!sortField) return 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aVal = (a as any)[sortField]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bVal = (b as any)[sortField]
    const dir = sortDir === 'asc' ? 1 : -1
    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })

  const allSelectable = recommendations.filter(
    (r) => r.processing_status === 'TO_MODIFY' && r.go_nogo === 'GO'
  )
  const allSelectableIds = allSelectable.map((r) => r.recommendation_id)
  const allSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selectedIds.includes(id))
  const someSelected = allSelectableIds.some((id) => selectedIds.includes(id))

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !allSelectableIds.includes(id)))
    } else {
      onSelectionChange([...new Set([...selectedIds, ...allSelectableIds])])
    }
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const SortIcon = ({ field }: { field: string }) => (
    <span className="inline-flex flex-col ml-1 opacity-40">
      <ChevronUp
        size={8}
        className={cn(sortField === field && sortDir === 'asc' && 'opacity-100 text-indigo-500')}
      />
      <ChevronDown
        size={8}
        className={cn(sortField === field && sortDir === 'desc' && 'opacity-100 text-indigo-500')}
      />
    </span>
  )

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {/* Expand chevron */}
              <th className="w-8 px-2 py-3" />
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected
                  }}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('resource_id')}
              >
                Resource <SortIcon field="resource_id" />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('processed_env_tag')}
              >
                Environment <SortIcon field="processed_env_tag" />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Config Change
              </th>
              <th
                className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                onClick={() => handleSort('estimated_savings')}
              >
                Savings <SortIcon field="estimated_savings" />
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                GO / NO-GO
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

            {!isLoading && sortedRecs.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <Database size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">
                        No recommendations match your filters
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Try adjusting your search or filter criteria
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              sortedRecs.map((rec, idx) => {
                const Icon = resourceTypeIcon[rec.resource_type] ?? HardDrive
                const isSelected = selectedIds.includes(rec.recommendation_id)
                const isSelectable =
                  rec.processing_status === 'TO_MODIFY' && rec.go_nogo === 'GO'
                const envColor = envColors[rec.processed_env_tag] ?? envColors['Non-Production']
                const isExpanded = expandedRows.has(rec.recommendation_id)
                const reasoning = parseAIReasoning(rec.ai_reasoning ?? null)
                const rowBg = isSelected
                  ? 'bg-indigo-50'
                  : idx % 2 === 0
                  ? 'bg-white hover:bg-indigo-50/30'
                  : 'bg-slate-50/50 hover:bg-indigo-50/30'

                return (
                  <Fragment key={rec.recommendation_id}>
                  <tr
                    className={cn('transition-colors', rowBg)}
                  >
                    {/* Expand chevron */}
                    <td className="px-2 py-3 w-8">
                      {reasoning ? (
                        <button
                          onClick={() => toggleExpand(rec.recommendation_id)}
                          className={cn(
                            'flex items-center justify-center w-5 h-5 rounded transition-colors',
                            isExpanded
                              ? 'text-indigo-600 bg-indigo-100'
                              : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'
                          )}
                          title="View AI reasoning"
                        >
                          <ChevronRight
                            size={13}
                            strokeWidth={2.5}
                            className={cn('transition-transform', isExpanded && 'rotate-90')}
                          />
                        </button>
                      ) : (
                        <span className="w-5 h-5 block" />
                      )}
                    </td>

                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isSelectable}
                        onChange={() => isSelectable && toggleOne(rec.recommendation_id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Resource */}
                    <td className="px-4 py-3">
                      <div className="group flex items-center">
                        <span className="font-mono text-xs font-medium text-slate-900 truncate max-w-[160px]">
                          {rec.resource_id}
                        </span>
                        <CopyButton text={rec.resource_id} />
                      </div>
                      <div
                        className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5 font-mono"
                        title={rec.resource_arn}
                      >
                        {rec.resource_arn.length > 50
                          ? `${rec.resource_arn.slice(0, 50)}…`
                          : rec.resource_arn}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-600 whitespace-nowrap">
                          {rec.resource_type}
                        </span>
                      </div>
                    </td>

                    {/* Environment */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1',
                          envColor
                        )}
                      >
                        {rec.processed_env_tag}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 whitespace-nowrap">
                        {rec.owner_tag}
                      </span>
                    </td>

                    {/* Config Change */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 max-w-[80px] truncate" title={rec.current_config}>
                          {rec.current_config}
                        </span>
                        <ArrowRight size={11} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-700 font-medium max-w-[80px] truncate" title={rec.recommended_config}>
                          {rec.recommended_config}
                        </span>
                      </div>
                    </td>

                    {/* Savings */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-green-700 tabular-nums">
                        {formatSavings(rec.estimated_savings)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={rec.processing_status} />
                    </td>

                    {/* GO/NO-GO */}
                    <td className="px-4 py-3">
                      <GoNoGoToggle
                        value={rec.go_nogo}
                        disabled={rec.processing_status !== 'TO_MODIFY'}
                        loading={goNogoLoading}
                        onChange={(decision) =>
                          updateGoNogo({
                            id: rec.recommendation_id,
                            decision,
                          })
                        }
                      />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <ActionCell rec={rec} />
                    </td>
                  </tr>

                  {/* Expandable AI Reasoning row */}
                  {isExpanded && reasoning && (
                    <tr className="bg-indigo-50/40 border-b border-indigo-100">
                      <td colSpan={11} className="px-6 pb-5 pt-0">
                        <div className="pl-7 border-l-2 border-indigo-200 ml-1">
                          <div className="flex items-center gap-2 py-3 mb-2">
                            <BrainCircuit size={14} className="text-indigo-500" />
                            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                              AI Reasoning — why this action is recommended
                            </span>
                          </div>
                          <AIReasoningPanel reasoning={reasoning} />
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!isLoading && recommendations.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
          </span>
          {selectedIds.length > 0 && (
            <span className="text-xs font-medium text-indigo-600">
              {selectedIds.length} selected
            </span>
          )}
        </div>
      )}
    </div>
  )
}
