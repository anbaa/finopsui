'use client'

import { Github, Sparkles, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 flex-shrink-0">
      <div className="flex-1 flex items-center gap-2">
        <Sparkles size={15} className="text-indigo-500" />
        <h1 className="text-slate-900 font-semibold text-sm">AI Script Generator</h1>
        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded uppercase tracking-wide">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="https://github.com/anbaa/scriptgeneratoragent"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Github size={13} />
          anbaa/scriptgeneratoragent
        </a>

        {user && (
          <>
            <span className="text-xs text-slate-400 hidden sm:block">{user.email}</span>
            <button
              onClick={signOut}
              title="Sign out"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
