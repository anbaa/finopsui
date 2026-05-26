'use client'

import { TrendingDown, BarChart2, Users, AlertCircle, Lightbulb, Calendar } from 'lucide-react'

const SUGGESTIONS = [
  { label: 'Top cost savings opportunities', icon: TrendingDown },
  { label: 'Weekly spend trends', icon: Calendar },
  { label: 'Savings by team', icon: Users },
  { label: 'Pipeline health status', icon: BarChart2 },
  { label: 'Savings by environment', icon: Lightbulb },
  { label: 'Exempted resources', icon: AlertCircle },
]

interface SuggestionChipsProps {
  onSelect: (text: string) => void
  disabled?: boolean
}

export function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTIONS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          onClick={() => onSelect(label)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Icon size={12} className="flex-shrink-0" />
          {label}
        </button>
      ))}
    </div>
  )
}
