import React from 'react'

interface NavbarProps {
  currentView: 'setup' | 'run'
  onNavigateSetup: () => void
  onNavigateRun?: () => void
  activeThreadId?: string | null
  repo?: string
  issueTitle?: string
  issueNumber?: string | number
  status?: string
  elapsedSeconds?: number
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateSetup,
  onNavigateRun,
  activeThreadId,
  repo = 'priya/shop-api',
  issueTitle = 'Login tokens never expire',
  issueNumber = '60',
  status = 'running',
  elapsedSeconds = 72,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
  }

  const getStatusBadge = () => {
    if (status === 'paused_hitl') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#fef5ea] text-[#8a5314] border border-[#fae3cd]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse"></span>
          HITL Review Required
        </span>
      )
    }

    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#e1f4ec] text-[#136340]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#136340]"></span>
          Completed
        </span>
      )
    }

    if (status === 'rejected' || status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Rejected
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#e1f4ec] text-[#136340]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#136340] animate-pulse"></span>
        Running · {formatTime(elapsedSeconds)}
      </span>
    )
  }

  return (
    <header className="border-b border-[#ece9e2] bg-[#faf9f5] px-8 py-3.5 flex items-center justify-between text-sm select-none">
      <div className="flex items-center gap-4">
        {/* Brand Logo matching inspiration */}
        <button
          onClick={onNavigateSetup}
          className="font-bold text-base text-[#18533e] tracking-tight hover:opacity-90 transition cursor-pointer"
        >
          DevPilot
        </button>

        {/* Breadcrumb or View Title */}
        {currentView === 'setup' ? (
          <span className="text-[#68655e] text-sm">New run</span>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[#5a5750]">
            <span className="text-slate-400">·</span>
            <span className="font-medium text-[#22211f]">{repo}</span>
            <span>·</span>
            <span className="text-[#68655e] truncate max-w-md">
              Issue #{issueNumber} {issueTitle}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {currentView === 'run' ? (
          <>
            {getStatusBadge()}
            <button
              onClick={onNavigateSetup}
              className="text-xs text-[#52504a] hover:text-[#18533e] font-medium px-2.5 py-1 rounded hover:bg-[#f0ede6] transition"
            >
              + New run
            </button>
          </>
        ) : (
          activeThreadId && onNavigateRun && (
            <button
              onClick={onNavigateRun}
              className="text-xs text-[#18533e] font-medium px-3 py-1 rounded-lg border border-[#cbe4d7] bg-[#f0f9f4] hover:bg-[#e4f4ec] transition"
            >
              Back to active run ({activeThreadId.slice(0, 10)}...)
            </button>
          )
        )}
      </div>
    </header>
  )
}

