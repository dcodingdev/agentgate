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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef5ea] text-[#8a5314] border border-[#fae3cd]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse"></span>
          Status: Escalated · Approval needed
        </span>
      )
    }

    if (currentScreen === 'clarification') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef5ea] text-[#8a5314] border border-[#fae3cd]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse"></span>
          Status: Escalated · Clarification needed
        </span>
      )
    }

    if (currentScreen === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Status: Blocked · Safety rule
        </span>
      )
    }

    if (currentScreen === 'finished') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#e1f4ec] text-[#136340]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#136340]"></span>
          Status: Done · Completed
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#e1f4ec] text-[#136340]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#136340] animate-pulse"></span>
        Running · {statusText || formatTime(elapsedSeconds)}
      </span>
    )
  }

  return (
    <header className="border-b border-[#ece9e2] bg-[#faf9f5] px-6 py-3 flex items-center justify-between text-sm select-none">
      {/* Left side matching Image 1 & Image 2 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="font-bold text-base text-[#18533e] tracking-tight hover:opacity-90 transition min-h-[44px] flex items-center cursor-pointer"
        >
          DevPilot
        </button>

        {/* Safety Cue badge */}
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0f9f4] text-[#18533e] border border-[#cbe4d7]">
          Test repo only
        </span>

        {/* Breadcrumb / Context */}
        {currentScreen === 'setup' ? (
          <span className="text-[#68655e] text-xs font-normal">New run</span>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#5a5750]">
            <span className="text-slate-300">·</span>
            <span className="font-medium text-[#22211f]">{repo}</span>
            <span className="text-slate-300">·</span>
            <span className="text-[#68655e] truncate max-w-sm">
              Issue #{issueNumber} {issueTitle}
            </span>
          </div>
        )}
      </div>

      {/* Right side: Canvas screen selector & status */}
      <div className="flex items-center gap-3">
        {/* Integrated Canvas Switcher in single header */}
        <div className="flex items-center gap-1.5 bg-[#f0ede6] px-2.5 py-1.5 rounded-xl border border-[#e2dfd7] text-xs">
          <label htmlFor="canvas-screen-select" className="text-[#8c8980] text-[11px] font-medium hidden md:inline">
            Canvas screen:
          </label>
          <select
            id="canvas-screen-select"
            value={currentScreen}
            onChange={(e) => onSelectScreen(e.target.value as ScreenId)}
            className="bg-transparent text-xs font-semibold text-[#18533e] cursor-pointer focus:outline-none"
          >
            {SCREENS.map((s) => (
              <option key={s.id} value={s.id} className="bg-white text-[#1a1918]">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {renderStatus()}

        {currentScreen !== 'setup' && (
          <button
            onClick={onNavigateHome}
            className="min-h-[44px] px-3 rounded-lg text-xs font-medium text-[#52504a] hover:text-[#18533e] hover:bg-[#f0ede6] transition flex items-center cursor-pointer"
          >
            New run
          </button>
        )}
      </div>
    </header>
  )
}
