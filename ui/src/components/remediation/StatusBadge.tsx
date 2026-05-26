import { ProcessingStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: ProcessingStatus
  className?: string
}

const statusConfig: Record<
  ProcessingStatus,
  { label: string; className: string }
> = {
  TO_MODIFY: {
    label: 'Ready',
    className: 'bg-green-100 text-green-700 ring-green-200',
  },
  TO_PROCESS: {
    label: 'Queued',
    className: 'bg-purple-100 text-purple-700 ring-purple-200',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    className: 'bg-amber-100 text-amber-700 ring-amber-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-700 ring-blue-200',
  },
  DENIED: {
    label: 'Denied',
    className: 'bg-red-100 text-red-700 ring-red-200',
  },
  EXEMPTED: {
    label: 'Exempt',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
  DO_NOT_PROCESS: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-600 ring-red-200',
  },
  NEEDS_DATA: {
    label: 'Needs Data',
    className: 'bg-orange-100 text-orange-700 ring-orange-200',
  },
  THROTTLED: {
    label: 'Throttled',
    className: 'bg-slate-100 text-slate-500 ring-slate-200',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 whitespace-nowrap',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
