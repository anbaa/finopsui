'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { FilterState } from '@/lib/types'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const ENVIRONMENTS = ['Mekong', 'Yarra', 'Congo', 'Non-Production']
const TEAMS = ['Platform/Digital', 'Retail', 'Core Wagering']
const RESOURCE_TYPES = ['EbsVolume', 'Ec2Instance', 'RdsDbInstance', 'LambdaFunction']
const STATUSES = [
  'TO_MODIFY',
  'TO_PROCESS',
  'PENDING_APPROVAL',
  'COMPLETED',
  'DENIED',
  'EXEMPTED',
  'DO_NOT_PROCESS',
  'NEEDS_DATA',
]

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors',
          'bg-white hover:bg-slate-50',
          open || selected.length > 0
            ? 'border-indigo-300 text-slate-900'
            : 'border-slate-200 text-slate-600'
        )}
      >
        <span className="font-medium">
          {selected.length > 0 ? `${label} (${selected.length})` : label}
        </span>
        <ChevronDown
          size={14}
          className={cn('text-slate-400 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 z-30 py-1.5 animate-fade-in">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">{option}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => { onChange([]); setOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Clear selection
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const hasActiveFilters =
    filters.environment.length > 0 ||
    filters.team.length > 0 ||
    filters.resourceType.length > 0 ||
    filters.status.length > 0 ||
    filters.goNogo !== 'all' ||
    filters.search !== ''

  const clearAll = () => {
    onChange({
      environment: [],
      team: [],
      resourceType: [],
      status: [],
      goNogo: 'all',
      search: '',
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-[320px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by resource ID or ARN..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Multi-selects */}
      <MultiSelect
        label="Environment"
        options={ENVIRONMENTS}
        selected={filters.environment}
        onChange={(v) => onChange({ ...filters, environment: v })}
      />
      <MultiSelect
        label="Team"
        options={TEAMS}
        selected={filters.team}
        onChange={(v) => onChange({ ...filters, team: v })}
      />
      <MultiSelect
        label="Type"
        options={RESOURCE_TYPES}
        selected={filters.resourceType}
        onChange={(v) => onChange({ ...filters, resourceType: v })}
      />
      <MultiSelect
        label="Status"
        options={STATUSES}
        selected={filters.status}
        onChange={(v) => onChange({ ...filters, status: v })}
      />

      {/* GO/NO-GO 3-way toggle */}
      <div className="flex items-center gap-0 rounded-lg border border-slate-200 bg-white overflow-hidden">
        {(['all', 'GO', 'NO_GO'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => onChange({ ...filters, goNogo: opt })}
            className={cn(
              'px-3 py-2 text-xs font-semibold transition-colors',
              filters.goNogo === opt
                ? opt === 'GO'
                  ? 'bg-green-600 text-white'
                  : opt === 'NO_GO'
                  ? 'bg-red-600 text-white'
                  : 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-50',
              opt !== 'NO_GO' && 'border-r border-slate-200'
            )}
          >
            {opt === 'all' ? 'All' : opt === 'NO_GO' ? 'NO GO' : opt}
          </button>
        ))}
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <X size={12} />
          Clear all
        </button>
      )}
    </div>
  )
}
