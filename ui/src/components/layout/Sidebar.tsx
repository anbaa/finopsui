'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Plus, Code2, Clock, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export interface ChatSession {
  id: string
  title: string
  createdAt: string
}

const STORAGE_KEY = 'scriptgen-sessions'

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSessions(JSON.parse(raw))
    } catch {}
  }, [])

  function saveSession(id: string, title: string) {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === id)
      if (existing) return prev
      const next = [{ id, title, createdAt: new Date().toISOString() }, ...prev].slice(0, 20)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function deleteSession(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { sessions, saveSession, deleteSession }
}

export function Sidebar() {
  const pathname = usePathname()
  const { sessions, deleteSession } = useSessions()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div
      className="flex flex-col h-full bg-[#0f172a] border-r border-slate-800"
      style={{ width: 240, minWidth: 240 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600">
          <Code2 size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-white font-semibold text-[15px] tracking-tight">ScriptGen AI</span>
          <div className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">
            AI Script Generator
          </div>
        </div>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-4 pb-2">
        <Link
          href="/chat"
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          New conversation
        </Link>
      </div>

      {/* Session history */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {sessions.length > 0 ? (
          <>
            <div className="px-2 mb-2">
              <span className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={9} />
                Recent
              </span>
            </div>
            <div className="space-y-0.5">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer',
                    'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  )}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <MessageSquare size={13} className="flex-shrink-0 text-slate-600" />
                  <span className="flex-1 text-xs truncate">{session.title}</span>
                  {hoveredId === session.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                      className="flex-shrink-0 p-0.5 rounded text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-3 py-6 text-center">
            <MessageSquare size={20} className="text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-xs">No conversations yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-semibold">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-300 text-xs font-medium truncate">Script Generator</div>
            <div className="text-slate-600 text-[10px]">Claude · Bedrock AgentCore</div>
          </div>
        </div>
      </div>
    </div>
  )
}
