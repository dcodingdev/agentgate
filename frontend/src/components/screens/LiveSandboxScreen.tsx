import React, { useState } from 'react'
import {
  Clock,
  Coins,
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
  currentAttempt = 2,
  maxAttempts = 3,
  events = [],
  terminologyMode = 'both',
  repo = 'priya/shop-api',
  issueTitle = 'Support Ed25519 asymmetric signatures for client JWTs',
  elapsedSeconds = 222,
}) => {
  const [selectedAttemptTab, setSelectedAttemptTab] = useState<'attempt1' | 'attempt2'>('attempt2')

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`
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

  // Fallback logs if no live SSE events are streamed yet
  const defaultLogs: LogEntry[] = [
    { node: 'guardrail', message: 'Repository verified in allowlist.', time: '20:41:02' },
    { node: 'supervisor', message: 'Dispatched parallel research.', time: '20:41:03' },
    { node: 'research', message: 'Issue & code analysis complete.', time: '20:41:07' },
    { node: 'sandbox', message: 'Attempt 2 passed: 26/26 tests.', time: '20:41:15', isLatest: true },
  ]

  const displayLogs: LogEntry[] = events.length > 0
    ? events.map((ev, idx) => ({
        node: ev.data?.node || ev.event || 'agent',
        message: ev.data?.message || ev.data?.status || ev.event,
        time: ev.timestamp ? ev.timestamp.slice(11, 19) : new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        isLatest: idx === events.length - 1,
      }))
    : defaultLogs

  // Filter out stages that are already Done to keep the active pipeline uncluttered
  const activeStages = STAGES_CATALOG.filter(
    (stage) => stageStates[stage.step]?.status !== 'Done'
  )
  const completedStages = STAGES_CATALOG.filter(
    (stage) => stageStates[stage.step]?.status === 'Done'
  )

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* 1. Top Header: Title, LIVE badge, and Clean Abstraction Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist">
              Live Sandbox Execution
            </h1>
            <span className="bg-[#d31611] text-white text-[11px] font-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#18181b]">
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5 font-medium truncate max-w-2xl">
            Real-time test commands, patch iterations, and live event feed side-by-side · {issueTitle}
          </p>
        </div>

        {/* Right Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-white border border-[#18181b] text-[#18181b] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>Sandbox #{sandboxId}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-white border border-[#18181b] text-[#18181b] font-bold shadow-[1px_1px_0px_#18181b]">
            Isolated Linux
          </div>

          <div className="px-2.5 py-1 rounded bg-[#d31611] text-white border border-[#18181b] font-bold shadow-[1px_1px_0px_#18181b]">
            Network: Read-Only
          </div>

          <div className="px-2.5 py-1 rounded bg-[#fffdf8] border border-[#18181b] text-[#18181b] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-[#fffdf8] border border-[#18181b] text-[#18181b] font-bold shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#d97706]" />
            <span>$0.18</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Horizontal Pipeline Bar (Active & Pending Actions Only) */}
      <section aria-label="Workflow pipeline progression" className="w-full space-y-2">
        {completedStages.length > 0 && (
          <div className="flex items-center justify-between text-xs font-mono px-0.5">
            <div className="flex items-center gap-2 text-[#666666]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ebdbb7] text-[#18181b] font-bold text-[11px] border border-[#18181b] shadow-[1px_1px_0px_#18181b]">
                <span className="text-[#0d9488]">✓</span> {completedStages.length} Actions Completed
              </span>
              <span className="text-[11px] font-medium hidden sm:inline text-[#666666]">
                {completedStages.map((s) => s.plain).join(' · ')}
              </span>
            </div>
            <span className="text-[10px] text-[#666666] hidden md:inline">
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
                  <span className="font-extrabold text-[12px] leading-tight text-[#18181b]">
                    {stage.step.replace(/^0/, '')}. {primary}
                  </span>
                  {secondary && (
                    <span className="hidden xl:inline text-[9px] font-mono text-[#666666] ml-1">
                      ({secondary})
                    </span>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {isRunning ? (
                    <span className="font-bold text-[11px] text-[#d31611] px-1.5 py-0.5 bg-[#d31611]/10 rounded border border-[#d31611]">
                      {state?.meta}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold opacity-75">
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
        {/* COLUMN 1: Test Runner [Active] */}
        <section className="card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0d9488]" />
              <h2 className="text-xs font-extrabold text-[#18181b] font-geist">
                Test Runner
              </h2>
              <span className="badge-teal text-[10px]">Active</span>
            </div>

            {/* Attempts Pill Tabs */}
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
              <span className="px-1.5 py-0.5 rounded bg-[#ebdbb7] border border-[#18181b] text-[#18181b]">
                1/3 Done
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#d31611] text-white border border-[#18181b]">
                2/3 Active
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-[#e5e5e5] text-[#666666]">
                3/3 Queued
              </span>
            </div>
          </div>

          {/* Subheader */}
          <div className="h-7 flex items-center justify-between text-[11px] text-[#666666] font-mono shrink-0">
            <span>tty0 · /repo/{repo}</span>
            <span>pytest v9.1.1</span>
          </div>

          {/* Terminal Console */}
          <div className="flex-1 min-h-0 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-2">
            <div>
              <span className="text-[#f87171] font-bold">$ </span>
              <span className="text-slate-100">git apply patch_v2.diff &amp;&amp; pytest -q</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              running 26 tests across 4 test suites in isolated sandbox...
            </div>
            <div className="text-[#4ade80] font-bold text-xs pt-1">
              ✓ 26 passed in 3.1s <span className="text-slate-400 font-normal">(24 baseline + 2 regression)</span>
            </div>
            <div className="text-teal-300 text-[11px]">
              Coverage: +1.4% lines covered in src/auth/jwt_manager.py
            </div>
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
              # Sandbox isolation verified: read-only filesystem, zero leaked credentials.
            </div>
          </div>
        </section>

        {/* COLUMN 2: Patch Diff Synthesis */}
        <section className="card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#0d9488]" />
              <h2 className="text-xs font-extrabold text-[#18181b] font-geist">
                Patch Diff Synthesis
              </h2>
            </div>

            {/* Attempt Switcher Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedAttemptTab('attempt1')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  selectedAttemptTab === 'attempt1'
                    ? 'bg-[#18181b] text-white border border-[#18181b]'
                    : 'bg-white text-[#18181b] border border-[#18181b]'
                }`}
              >
                Att 1
              </button>
              <button
                type="button"
                onClick={() => setSelectedAttemptTab('attempt2')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  selectedAttemptTab === 'attempt2'
                    ? 'bg-[#d31611] text-white border border-[#18181b]'
                    : 'bg-white text-[#18181b] border border-[#18181b]'
                }`}
              >
                Att 2 (Passed)
              </button>
            </div>
          </div>

          {/* Subheader */}
          <div className="h-7 flex items-center justify-between text-[11px] text-[#666666] font-mono shrink-0">
            <span className="font-bold text-[#18181b]">src/auth/jwt_manager.py</span>
            <span className="text-[#0d9488] font-bold">+18 lines / -4 lines</span>
          </div>

          {/* Diff Box */}
          <div className="flex-1 min-h-0 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-1">
            {selectedAttemptTab === 'attempt2' ? (
              <>
                <div className="text-slate-500 text-[10px] pb-1">
                  # Attempt 2: Added RFC 8037 Ed25519 signature verification
                </div>
                <div className="text-[#60a5fa] text-[11px]">--- a/src/auth/jwt_manager.py</div>
                <div className="text-[#60a5fa] text-[11px]">+++ b/src/auth/jwt_manager.py</div>
                <div className="text-slate-500 text-[11px]">@@ -54,8 +54,14 @@ def verify_jwt_signature(token: str, key):</div>
                <div className="text-slate-400">     header = jwt.get_unverified_header(token)</div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +    if header.get("alg") == "EdDSA":
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +        public_key = Ed25519PublicKey.from_public_bytes(key)
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +        return jwt.decode(token, public_key, algorithms=["EdDSA"])
                </div>
                <div className="text-slate-400">     # Fallback to standard RSA/ECDSA verification</div>
                <div className="text-slate-400">     return jwt.decode(token, key, algorithms=["RS256"])</div>
              </>
            ) : (
              <>
                <div className="text-slate-500 text-[10px] pb-1">
                  # Attempt 1: naive decode threw InvalidKeyError on raw bytes
                </div>
                <div className="text-[#f87171] bg-[#f87171]/15 px-1 rounded font-bold">
                  -    return jwt.decode(token, key, algorithms=["EdDSA"])
                </div>
                <div className="text-slate-400 pt-2 text-[11px]">
                  # Result: Test suite failed with InvalidAlgorithmError.
                </div>
              </>
            )}
          </div>
        </section>

        {/* COLUMN 3: Live Stream */}
        <section className="card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <h2 className="text-xs font-extrabold text-[#18181b] font-geist">
              Live Stream
            </h2>
            <span className="text-[10px] font-mono text-[#666666]">
              Live Events
            </span>
          </div>

          {/* Subheader */}
          <div className="h-7 flex items-center justify-between text-[11px] text-[#666666] font-mono shrink-0">
            <span>Action</span>
            <span>Status</span>
          </div>

          {/* Events Log Cards Container */}
          <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5">
            {displayLogs.map((log, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border-2 border-[#18181b] transition ${
                  log.isLatest
                    ? 'bg-[#ebdbb7] shadow-[2px_2px_0px_#18181b]'
                    : 'bg-white shadow-[1px_1px_0px_#18181b]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-black text-[#d31611]">
                    [{getActionLabel(log.node)}]
                  </span>
                  <span className="text-[#666666] text-[10px]">{log.time}</span>
                </div>
                <p className="text-xs font-bold text-[#18181b] mt-0.5 leading-snug">
                  {log.message}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
