import React from 'react'
import type { ScreenId } from '../types'

interface HeaderProps {
  currentScreen: ScreenId
  onSelectScreen: (screen: ScreenId) => void
  onNavigateHome: () => void
  repo?: string
  issueTitle?: string
  issueNumber?: string | number
  statusText?: string
  elapsedSeconds?: number
  showWorkflowGraph?: boolean
  onToggleWorkflowGraph?: () => void
}

const SCREENS: { id: ScreenId; label: string }[] = [
  { id: 'setup', label: '1. Setup' },
  { id: 'live-sandbox', label: '2. Live sandbox' },
  { id: 'every-stage', label: '3. Every stage' },
  { id: 'approval-gate', label: '4. Approval gate' },
  { id: 'clarification', label: '5. Clarification' },
  { id: 'blocked', label: '6. Blocked' },
  { id: 'finished', label: '7. Finished' },
]

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onSelectScreen,
  onNavigateHome,
  repo = 'priya/shop-api',
  issueTitle = 'Login tokens never expire',
  issueNumber = '60',
  statusText,
  elapsedSeconds = 72,
  showWorkflowGraph = false,
  onToggleWorkflowGraph,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
  }

  const renderStatus = () => {
    if (currentScreen === 'setup') {
      return null
    }

    if (currentScreen === 'approval-gate') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#fff4da] text-[#18181b] border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b]">
          <span className="w-2 h-2 rounded-full bg-[#d31611] animate-pulse"></span>
          Status: Escalated · Approval needed
        </span>
      )
    }

    if (currentScreen === 'clarification') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#fff4da] text-[#18181b] border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b]">
          <span className="w-2 h-2 rounded-full bg-[#d31611] animate-pulse"></span>
          Status: Escalated · Clarification needed
        </span>
      )
    }

    if (currentScreen === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#fffdf8] text-[#d31611] border-2 border-[#d31611] shadow-[2px_2px_0px_#d31611]">
          <span className="w-2 h-2 rounded-full bg-[#d31611]"></span>
          Status: Blocked · Safety rule
        </span>
      )
    }

    if (currentScreen === 'finished') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#ebdbb7] text-[#18181b] border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b]">
          <span className="w-2 h-2 rounded-full bg-[#18181b]"></span>
          Status: Done · Completed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#fff4da] text-[#18181b] border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b]">
        <span className="w-2 h-2 rounded-full bg-[#d31611] animate-ping"></span>
        Running · {statusText || formatTime(elapsedSeconds)}
      </span>
    )
  }

  return (
    <header className="border-b border-[#e5e5e5] bg-[#fffdf8] px-6 py-3.5 flex items-center justify-between text-sm select-none">
      {/* Left side: Brand with Geist 800 weight & tight tracking */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="font-extrabold text-lg text-[#18181b] tracking-[-0.04em] hover:opacity-90 transition min-h-[44px] flex items-center cursor-pointer font-geist"
        >
          <span>AgentGate</span>
          <span className="text-[#d31611]">.</span>
        </button>

        {/* GitReverse Style Tag */}
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#fff4da] text-[#18181b] border border-[#18181b]">
          SWE Agent
        </span>

        {/* Breadcrumb / Context */}
        {currentScreen === 'setup' ? (
          <span className="text-[#666666] text-xs font-medium">Configure run</span>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#666666]">
            <span>/</span>
            <span className="font-bold text-[#18181b]">{repo}</span>
            <span>/</span>
            <span className="text-[#666666] truncate max-w-sm">
              #{issueNumber} {issueTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right side: Canvas screen selector & status */}
      <div className="flex items-center gap-3">
        {/* Integrated Canvas Switcher in GitReverse Box */}
        <div className="flex items-center gap-2 bg-[#fffdf8] px-3 py-1.5 rounded-md border-2 border-[#18181b] text-xs shadow-[2px_2px_0px_#18181b]">
          <label htmlFor="canvas-screen-select" className="text-[#666666] text-[11px] font-bold hidden md:inline uppercase tracking-wider">
            Screen:
          </label>
          <select
            id="canvas-screen-select"
            value={currentScreen}
            onChange={(e) => onSelectScreen(e.target.value as ScreenId)}
            className="bg-transparent text-xs font-bold text-[#18181b] cursor-pointer focus:outline-none"
          >
            {SCREENS.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#fffdf8] text-[#18181b]">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {renderStatus()}

        {onToggleWorkflowGraph && (
          <button
            type="button"
            onClick={onToggleWorkflowGraph}
            className={`min-h-[38px] px-3.5 rounded-md text-xs font-bold border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#18181b] transition flex items-center gap-1.5 cursor-pointer ${
              showWorkflowGraph
                ? 'bg-[#fff4da] text-[#d31611]'
                : 'bg-[#fffdf8] text-[#18181b]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showWorkflowGraph ? 'bg-[#d31611]' : 'bg-[#18181b]'
              }`}
            />
            <span className="hidden sm:inline">Workflow Graph</span>
            <span className="sm:hidden">Graph</span>
          </button>
        )}

        {currentScreen !== 'setup' && (
          <button
            onClick={onNavigateHome}
            className="min-h-[38px] px-3.5 rounded-md text-xs font-bold text-[#18181b] bg-[#ebdbb7] border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#18181b] transition flex items-center cursor-pointer"
          >
            New run
          </button>
        )}
      </div>
    </header>
  )
}
