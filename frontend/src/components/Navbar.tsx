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
        <span className="badge-warm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d31611] animate-pulse"></span>
          HITL Review Required
        </span>
      )
    }

    if (status === 'completed') {
      return (
        <span className="badge-warm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#18181b]"></span>
          Completed
        </span>
      )
    }

    if (status === 'rejected' || status === 'failed') {
      return (
        <span className="badge-accent flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          Rejected
        </span>
      )
    }

    return (
      <span className="badge-warm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d31611] animate-ping"></span>
        Running · {formatTime(elapsedSeconds)}
      </span>
    )
  }

  return (
    <nav className="border-b-2 border-[#18181b] bg-[#fffdf8] px-6 py-3.5 flex items-center justify-between text-sm select-none">
      <div className="flex items-center gap-4">
        <button
          onClick={onNavigateSetup}
          className="font-black text-lg text-[#18181b] tracking-[-0.04em] hover:opacity-90 transition font-geist cursor-pointer"
        >
          <span>AgentGate</span>
          <span className="text-[#d31611]">.</span>
        </button>

        <span className="badge-warm text-[10px]">
          SWE Agent
        </span>

        {activeThreadId && (
          <div className="hidden md:flex items-center gap-2 text-xs text-[#666666]">
            <span>/</span>
            <span className="font-bold text-[#18181b]">{repo}</span>
            <span>/</span>
            <span className="text-[#666666] truncate max-w-xs">
              #{issueNumber} {issueTitle}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeThreadId && getStatusBadge()}

        {activeThreadId && onNavigateRun && currentView === 'setup' && (
          <button
            onClick={onNavigateRun}
            className="btn-warm text-xs"
          >
            Active Run &rarr;
          </button>
        )}

        <button
          onClick={onNavigateSetup}
          className="btn-outline-dark text-xs"
        >
          New Run
        </button>
      </div>
    </nav>
  )
}
