'use client'

import React from 'react'
import { cn } from '@/lib/utils'

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\*(.+?)\*)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2] !== undefined) {
      parts.push(<strong key={match.index} className="font-semibold text-slate-900">{match[2]}</strong>)
    } else if (match[3] !== undefined) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[12px]">{match[3]}</code>)
    } else if (match[4] !== undefined) {
      parts.push(<em key={match.index}>{match[4]}</em>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function TableBlock({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((l) => !l.replace(/[\s|:-]/g, ''))  // skip separator rows
    .map((l) =>
      l
        .split('|')
        .map((c) => c.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    )
  if (rows.length === 0) return null
  const [header, ...body] = rows
  return (
    <div className="overflow-x-auto my-2">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left">
            {header.map((h, i) => (
              <th key={i} className="px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider border border-slate-200">
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-xs text-slate-700 border border-slate-200">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MarkdownText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line — skip
    if (!line.trim()) { i++; continue }

    // Table block — collect all adjacent table lines
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      blocks.push(<TableBlock key={`table-${i}`} lines={tableLines} />)
      continue
    }

    // Heading
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={i} className="text-sm font-semibold text-slate-800 mt-4 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      )
      i++; continue
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={i} className="text-sm font-bold text-slate-900 mt-4 mb-1 border-b border-slate-200 pb-1">
          {parseInline(line.slice(3))}
        </h2>
      )
      i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={i} className="my-3 border-slate-200" />)
      i++; continue
    }

    // Unordered list — collect consecutive list items
    if (line.trim().match(/^[-*]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''))
        i++
      }
      blocks.push(
        <ul key={`ul-${i}`} className="space-y-1 my-2 pl-4">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-slate-700 flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (line.trim().match(/^\d+\.\s/)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++; num++
      }
      blocks.push(
        <ol key={`ol-${i}`} className="space-y-1 my-2 pl-4 list-none">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-slate-700 flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Regular paragraph
    blocks.push(
      <p key={i} className="text-sm text-slate-700 leading-relaxed">
        {parseInline(line)}
      </p>
    )
    i++
  }

  return <div className={cn('space-y-1', className)}>{blocks}</div>
}
