'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown, ChevronUp, Code2 } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface CodeViewProps {
  filename: string
  language: string
  content: string
}

export function CodeView({ filename, language, content }: CodeViewProps) {
  const [collapsed, setCollapsed] = useState(false)
  const lineCount = content.split('\n').length
  const editorHeight = Math.min(Math.max(lineCount * 19 + 16, 80), 500)

  return (
    <div className="my-2 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800 text-slate-100 text-sm font-mono hover:bg-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Code2 size={14} className="text-indigo-400" />
          {filename}
          <span className="text-slate-400 text-xs font-sans">{language}</span>
        </span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <MonacoEditor
          height={editorHeight}
          language={language}
          value={content}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
          }}
        />
      )}
    </div>
  )
}
