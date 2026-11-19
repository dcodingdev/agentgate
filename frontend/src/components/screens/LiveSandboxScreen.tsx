import React from 'react'
import {
  Clock,
  Cpu,
  FileCode2,
  Terminal,
} from 'lucide-react'
import type {
  StageDefinition,
  StageStatus,
  StreamEventPayload,
  TerminologyMode,
} from '../../types'
import { STAGES_CATALOG, formatStageLabel } from '../../utils/terminology'

interface LiveSandboxScreenProps {
  sandboxId?: string
  currentAttempt?: number
  maxAttempts?: number
  events?: StreamEventPayload[]
  terminologyMode?: TerminologyMode
  repo?: string
  issueTitle?: string
  elapsedSeconds?: number
  hasActiveRun?: boolean
  onStartNewRun?: () => void
}

interface LogEntry {
  node: string
  message: string
  time: string
  isLatest?: boolean
}

const NODE_ACTION_MAP: Record<string, string> = {
  guardrail: 'Security Check',
  supervisor: 'Planning',
  issue_analysis: 'Issue Analysis',
  code_search: 'Code Search',
  docs_lookup: 'Docs Lookup',
  research: 'Code Research',
  aggregate_research: 'Code Research',
  fix_test: 'Patch & Test',
  sandbox: 'Patch & Test',
  verify: 'Verification',
  reviewer: 'Risk Review',
  hitl: 'Human Sign-Off',
  pr_agent: 'Publish PR',
}

const getActionLabel = (node: string): string => {
  return NODE_ACTION_MAP[node] || node.replace(/_/g, ' ')
}

export const LiveSandboxScreen: React.FC<LiveSandboxScreenProps> = ({
  sandboxId = 'sbx-8931a',
  currentAttempt = 1,
  maxAttempts = 3,
  events = [],
  terminologyMode = 'both',
  repo = '',
  issueTitle = '',
  elapsedSeconds = 0,
  hasActiveRun = false,
  onStartNewRun,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
  }

  if (!hasActiveRun) {
    return (
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-16 text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-[#fff4da] border-2 border-[#18181b] mx-auto flex items-center justify-center shadow-[4px_4px_0px_#18181b]">
          <Terminal className="w-8 h-8 text-[#0d9488]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#18181b] font-geist">
            No Active Sandbox Runs
          </h2>
          <p className="text-sm text-[#555555] max-w-md mx-auto">
            You don't have any autonomous agent runs executing right now. Launch an issue from Setup to watch sandbox test iterations and live code patch synthesis.
          </p>
        </div>
        {onStartNewRun && (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={onStartNewRun}
              className="btn-cta text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Start Autonomous Run &rarr;</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // 8-Stage Tracker status mapping
  const stageStates: Record<string, { status: StageStatus; meta: string }> = {
    '01': { status: 'Done', meta: '0.8s' },
    '02': { status: 'Done', meta: 'Plan' },
    '03': { status: 'Done', meta: 'Send' },
    '04': { status: 'Running', meta: `${currentAttempt}/${maxAttempts}` },
    '05': { status: 'Waiting', meta: 'Queued' },
    '06': { status: 'Waiting', meta: 'Risk' },
    '07': { status: 'Waiting', meta: 'HITL' },
    '08': { status: 'Waiting', meta: 'PR' },
  }

  // Live stream logs from real agent events
  const displayLogs: LogEntry[] = events.map((ev, idx) => ({
    node: ev.data?.node || ev.event || 'agent',
    message: ev.data?.message || ev.data?.status || ev.event,
    time: ev.timestamp ? ev.timestamp.slice(11, 19) : new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    isLatest: idx === events.length - 1,
  }))

  // Filter out stages that are already Done to keep the active pipeline uncluttered
  const activeStages = STAGES_CATALOG.filter(
    (stage) => stageStates[stage.step]?.status !== 'Done'
  )
  const completedStages = STAGES_CATALOG.filter(
    (stage) => stageStates[stage.step]?.status === 'Done'
  )

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* 1. Top Header: Title and Clean Abstraction Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] font-geist">
            Sandbox Execution
          </h1>
          <p className="text-sm text-[#555555] mt-0.5 font-medium truncate max-w-2xl">
            Real-time test commands, patch iterations, and live event feed side-by-side · {issueTitle}
          </p>
        </div>

        {/* Right Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-white border border-[#18181b] text-[#18181b] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>Sandbox #{sandboxId}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#fffdf8] border border-[#18181b] text-[#18181b] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#ecfdf5] border border-[#18181b] text-[#0d9488] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0d9488] animate-pulse"></span>
            <span>Active Run</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Horizontal Pipeline Bar (Active & Pending Actions Only) */}
      <section aria-label="Workflow pipeline progression" className="w-full space-y-2">
        {completedStages.length > 0 && (
          <div className="flex items-center justify-between text-xs font-mono px-0.5">
            <div className="flex items-center gap-2 text-[#666666]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ebdbb7] text-[#18181b] font-bold text-xs border border-[#18181b] shadow-[1px_1px_0px_#18181b]">
                <span className="text-[#0d9488]">✓</span> {completedStages.length} Actions Completed
              </span>
              <span className="text-xs font-medium hidden sm:inline text-[#666666]">
                {completedStages.map((s) => s.plain).join(' · ')}
              </span>
            </div>
            <span className="text-xs text-[#666666] hidden md:inline">
              Active &amp; pending pipeline
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {activeStages.map((stage: StageDefinition) => {
            const state = stageStates[stage.step]
            const isRunning = state?.status === 'Running'
            const { primary, secondary } = formatStageLabel(stage, terminologyMode)

            let cardStyle = 'border-2 border-[#e5e5e5] bg-white text-[#666666]'
            if (isRunning) {
              cardStyle =
                'border-2 border-[#18181b] bg-[#fffdf8] text-[#18181b] shadow-[2px_2px_0px_#d31611]'
            }

            return (
              <div
                key={stage.step}
                className={`p-2.5 rounded-lg text-xs flex items-center justify-between min-h-[46px] transition ${cardStyle}`}
              >
                <div className="truncate mr-1">
                  <span className="font-extrabold text-sm leading-tight text-[#18181b]">
                    {primary}
                  </span>
                  {secondary && (
                    <span className="hidden xl:inline text-xs font-mono text-[#666666] ml-1">
                      ({secondary})
                    </span>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {isRunning ? (
                    <span className="font-bold text-xs text-[#d31611] px-1.5 py-0.5 bg-[#d31611]/10 rounded border border-[#d31611]">
                      {state?.meta}
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold opacity-75">
                      {state?.meta}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Three Equal-Height Side-by-Side Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* COLUMN 1: Test Runner / Execution Terminal */}
        <section className="card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0d9488]" />
              <h2 className="text-sm font-extrabold text-[#18181b] font-geist">
                Test Runner
              </h2>
              <span className="badge-teal text-xs">Sandbox</span>
            </div>

            <div className="text-xs font-mono font-bold text-[#666666]">
              Attempt {currentAttempt}/{maxAttempts}
            </div>
          </div>

          {/* Subheader */}
          <div className="h-7 flex items-center justify-between text-xs text-[#666666] font-mono shrink-0">
            <span>{repo ? `/repo/${repo}` : 'sandbox environment'}</span>
            <span>live output</span>
          </div>

          {/* Terminal Console */}
          <div className="flex-1 min-h-0 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-2">
            {events.length > 0 ? (
              events.map((ev, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-[#0d9488] font-bold">[{ev.data?.node || ev.event || 'agent'}]</span>
                    <span>{ev.timestamp || ''}</span>
                  </div>
                  <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                    {typeof ev.data?.message === 'string'
                      ? ev.data.message
                      : ev.data?.status
                      ? `Status: ${ev.data.status}`
                      : JSON.stringify(ev.data || {})}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-10">
                <Terminal className="w-8 h-8 opacity-40 text-slate-400" />
                <p className="text-xs">Isolated sandbox runner active.</p>
                <p className="text-[11px] text-slate-600">Executing test commands and code generation...</p>
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 2: Patch Diff Synthesis */}
        <section className="card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#0d9488]" />
              <h2 className="text-sm font-extrabold text-[#18181b] font-geist">
                Patch Diff Synthesis
              </h2>
            </div>
          </div>

          {/* Subheader */}
          <div className="h-7 flex items-center justify-between text-xs text-[#666666] font-mono shrink-0">
            <span className="font-bold text-[#18181b] truncate max-w-[200px]">{repo || 'Target Repository'}</span>
            <span className="text-[#0d9488] font-bold">Code Patch</span>
          </div>

          {/* Diff Box */}
          <div className="flex-1 min-h-0 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-1">
            {events.some((e) => e.data?.pr_url || (typeof e.data?.message === 'string' && (e.data.message.includes('diff') || e.data.message.includes('Patch')))) ? (
              <div className="space-y-2 text-slate-200">
                <div className="text-xs text-[#0d9488] font-bold">Generated Patch:</div>
                <pre className="text-xs text-[#4ade80] whitespace-pre-wrap font-mono">
                  {events.find((e) => typeof e.data?.message === 'string' && (e.data.message.includes('diff') || e.data.message.includes('Patch')))?.data?.message || 'Patch verified and passing.'}
                </pre>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-10">
                <FileCode2 className="w-8 h-8 opacity-40 text-slate-400" />
                <p className="text-xs">No patch synthesized yet.</p>
                <p className="text-[11px] text-slate-600">The agent is analyzing the repository to craft the code patch.</p>
              </div>
            )}
          </div>
        </section>

        {/* COLUMN 3: Event Stream */}
        <section className="card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <h2 className="text-sm font-extrabold text-[#18181b] font-geist">
              Event Stream
            </h2>
            <span className="text-xs font-mono text-[#666666]">
              {events.length} Events
            </span>
          </div>

          {/* Subheader */}
          <div className="h-7 flex items-center justify-between text-xs text-[#666666] font-mono shrink-0">
            <span>Action</span>
            <span>Status</span>
          </div>

          {/* Events Log Cards Container */}
          <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5">
            {displayLogs.length > 0 ? (
              displayLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border-2 border-[#18181b] transition ${
                    log.isLatest
                      ? 'bg-[#ebdbb7] shadow-[2px_2px_0px_#18181b]'
                      : 'bg-white shadow-[1px_1px_0px_#18181b]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-black text-[#d31611]">
                      [{getActionLabel(log.node)}]
                    </span>
                    <span className="text-[#666666] text-xs">{log.time}</span>
                  </div>
                  <p className="text-sm font-bold text-[#18181b] mt-1 leading-snug">
                    {log.message}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#888888] space-y-2 py-10">
                <p className="text-xs">Awaiting real-time events...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
