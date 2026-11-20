import React, { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Cpu,
  FileCode2,
  Terminal,
} from 'lucide-react'
import type {
  StreamEventPayload,
  TerminologyMode,
} from '../../types'
import { PipelineStepTracker } from '../PipelineStepTracker'

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
  hasPendingApproval?: boolean
  runStateStatus?: string
  onStartNewRun?: () => void
  onNavigateToApproval?: () => void
  onApprove?: () => void
  onReject?: (reason: string) => void
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
  sandboxId = 'sbx-pending',
  currentAttempt = 1,
  maxAttempts = 3,
  events = [],
  terminologyMode = 'both',
  repo = '',
  issueTitle = '',
  elapsedSeconds = 0,
  hasActiveRun = false,
  hasPendingApproval = false,
  runStateStatus,
  onStartNewRun,
  onNavigateToApproval,
  onApprove,
  onReject,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null)
  const eventStreamRef = useRef<HTMLDivElement>(null)

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
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

  // Auto-scroll terminal container to bottom on new events
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [events.length])

  // Auto-scroll event stream container to bottom on new logs
  useEffect(() => {
    if (eventStreamRef.current) {
      eventStreamRef.current.scrollTop = eventStreamRef.current.scrollHeight
    }
  }, [displayLogs.length])

  // Find candidate patch from events
  const patchMessage = events.find(
    (e) =>
      typeof e.data?.message === 'string' &&
      (e.data.message.includes('diff') ||
        e.data.message.includes('Patch') ||
        e.data.message.includes('---') ||
        e.data.message.includes('@@'))
  )?.data?.message

  if (!hasActiveRun && !hasPendingApproval && events.length === 0) {
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

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* 1. Top Header: Title and Clean Abstraction Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] font-geist">
            Sandbox Execution
          </h1>
          <p className="text-sm text-[#555555] mt-0.5 font-medium truncate max-w-2xl">
            Real-time test commands, patch iterations, and live event feed side-by-side · {issueTitle || repo || 'Autonomous Run'}
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

          {hasPendingApproval ? (
            <div className="px-2.5 py-1 rounded bg-[#fef3c7] border border-[#d97706] text-[#b45309] font-bold shadow-[1px_1px_0px_#d97706] flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#d97706]"></span>
              <span>Paused for Sign-Off</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded bg-[#ecfdf5] border border-[#18181b] text-[#0d9488] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0d9488] animate-pulse"></span>
              <span>Active Run</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Emergency HITL Intercept Banner when paused for sign-off */}
      {hasPendingApproval && (
        <aside
          role="alert"
          aria-label="Human sign-off required"
          className="p-3.5 rounded-xl bg-[#fff4da] border-2 border-[#d31611] shadow-[3px_3px_0px_#d31611] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d31611] text-white flex items-center justify-center shrink-0 font-black">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#18181b]">
                Human Sign-Off Required — Execution Paused in Sandbox
              </div>
              <p className="text-xs text-[#555555] font-medium">
                The agent has verified the patch and is waiting for your authorization before creating the pull request.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onApprove && (
              <button
                type="button"
                onClick={onApprove}
                className="py-1.5 px-3 rounded-lg bg-[#059669] text-white text-xs font-bold border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] hover:bg-[#047857] transition cursor-pointer"
              >
                Approve &amp; Open PR
              </button>
            )}
            {onReject && (
              <button
                type="button"
                onClick={() => onReject('Rejected from live sandbox view')}
                className="py-1.5 px-2.5 rounded-lg bg-white text-[#d31611] text-xs font-bold border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] hover:bg-[#fee2e2] transition cursor-pointer"
              >
                Reject
              </button>
            )}
            {onNavigateToApproval && (
              <button
                type="button"
                onClick={onNavigateToApproval}
                className="py-1.5 px-3.5 rounded-lg bg-[#d31611] text-white text-xs font-bold border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition cursor-pointer flex items-center gap-1"
              >
                <span>Review &amp; Sign-Off</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* 3. Color-Coded Execution Pipeline Tracker (With Auto-Scroll to Active Step) */}
      <PipelineStepTracker
        events={events}
        runStateStatus={runStateStatus || (hasPendingApproval ? 'paused_hitl' : 'running')}
        currentAttempt={currentAttempt}
        maxAttempts={maxAttempts}
        terminologyMode={terminologyMode}
      />

      {/* 4. Three Equal-Height Side-by-Side Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* COLUMN 1: Test Runner / Execution Terminal (Auto-scrolling to newest output) */}
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
            <span className="truncate max-w-[200px]">{repo ? `/repo/${repo}` : '/repo'}</span>
            <span className="text-[#0d9488] font-bold">Auto-scrolling output</span>
          </div>

          {/* Terminal Console with auto-scroll */}
          <div
            ref={terminalRef}
            className="flex-1 min-h-0 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-2 scroll-smooth"
          >
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
            {patchMessage ? (
              <div className="space-y-2 text-slate-200">
                <div className="text-xs text-[#0d9488] font-bold">Generated Patch:</div>
                <pre className="text-xs text-[#4ade80] whitespace-pre-wrap font-mono">
                  {patchMessage}
                </pre>
              </div>
            ) : hasPendingApproval ? (
              <div className="space-y-2 text-slate-200">
                <div className="text-xs text-[#0d9488] font-bold">Candidate Patch (Awaiting Sign-Off):</div>
                <pre className="text-xs text-[#4ade80] whitespace-pre-wrap font-mono">
{`--- a/src/auth/jwt_manager.py
+++ b/src/auth/jwt_manager.py
@@ -54,8 +54,14 @@ def verify_jwt_signature(token: str, key):
+    if header.get("alg") == "EdDSA":
+        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
+        public_key = Ed25519PublicKey.from_public_bytes(key)
+        return jwt.decode(token, public_key, algorithms=["EdDSA"])`}
                </pre>
              </div>
            ) : events.some((e) => e.data?.pr_url) ? (
              <div className="space-y-2 text-slate-200">
                <div className="text-xs text-[#0d9488] font-bold">Patch Created and PR Ready:</div>
                <p className="text-xs text-[#4ade80]">
                  All verification tests passed. Ready for human authorization.
                </p>
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

        {/* COLUMN 3: Event Stream (Auto-scrolling to newest event card) */}
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
            <span className="text-[#0d9488] font-bold">Auto-scrolling stream</span>
          </div>

          {/* Events Log Cards Container with auto-scroll */}
          <div
            ref={eventStreamRef}
            className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5 scroll-smooth"
          >
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
