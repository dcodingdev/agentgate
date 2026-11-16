import React, { useState } from 'react'
import type { StageStatus, StreamEventPayload } from '../../types'

interface LiveSandboxScreenProps {
  sandboxId?: string
  currentAttempt?: number
  maxAttempts?: number
  events?: StreamEventPayload[]
}

interface PipelineStep {
  name: string
  status: StageStatus
  meta: string
}

export const LiveSandboxScreen: React.FC<LiveSandboxScreenProps> = ({
  sandboxId = 'sbx_8f21',
  currentAttempt = 2,
  maxAttempts = 3,
  events = [],
}) => {
  const [selectedAttemptTab, setSelectedAttemptTab] = useState<'attempt1' | 'attempt2'>('attempt2')

  // Slim 7-step pipeline progression
  const pipelineSteps: PipelineStep[] = [
    { name: '1. Guardrail', status: 'Done', meta: '0.8s' },
    { name: '2. Supervisor', status: 'Done', meta: 'Plan' },
    { name: '3. Research', status: 'Done', meta: 'Send' },
    { name: '4. Sandbox', status: 'Running', meta: `${currentAttempt}/${maxAttempts}` },
    { name: '5. Verify', status: 'Waiting', meta: 'Queued' },
    { name: '6. Reviewer', status: 'Waiting', meta: 'Risk' },
    { name: '7. Approval', status: 'Waiting', meta: 'HITL' },
  ]

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Compact Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist leading-tight">
              Live Sandbox Execution
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#d31611] text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              LIVE
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">
            Real-time microVM commands, patch iterations, and event feed side-by-side.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="badge-warm font-mono text-[11px]">MicroVM: {sandboxId}</span>
          <span className="badge-warm text-[11px]">Firecracker Linux</span>
          <span className="badge-accent text-[11px]">Network: Read-Only</span>
        </div>
      </div>

      {/* Slim Single-Line Progression Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {pipelineSteps.map((step) => {
          let style = 'border-2 border-[#e5e5e5] bg-white text-[#666666]'
          if (step.status === 'Done') {
            style = 'border-2 border-[#18181b] bg-[#ebdbb7] text-[#18181b] shadow-[1px_1px_0px_#18181b]'
          } else if (step.status === 'Running') {
            style = 'border-2 border-[#18181b] bg-[#fff4da] text-[#d31611] shadow-[2px_2px_0px_#18181b]'
          }
          return (
            <div
              key={step.name}
              className={`px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition ${style}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {step.status === 'Running' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d31611] animate-ping shrink-0" />
                )}
                <span className="font-extrabold truncate">{step.name}</span>
              </div>
              <span className="text-[10px] font-bold opacity-80 shrink-0 ml-1">
                {step.meta}
              </span>
            </div>
          )
        })}
      </div>

      {/* 3-Column True Horizontal Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* COLUMN 1: Live MicroVM Terminal (5 cols) */}
        <section className="lg:col-span-5 card-canvas-elevated p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#18181b] font-geist">
                MicroVM Runner
              </span>
              <span className="badge-warm text-[10px]">Active</span>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ebdbb7] text-[#18181b] border border-[#18181b]">
                1/3 Done
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d31611] text-white border border-[#18181b]">
                2/3 Active
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-[#666666] border border-[#e5e5e5]">
                3/3 Queued
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#666666] py-1.5 font-mono">
            <span className="font-bold text-[#18181b]">tty0 · /repo/shop-api</span>
            <span>pytest v9.1.1</span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Live Sandbox Terminal"
            className="flex-1 bg-[#18181b] text-slate-100 rounded-lg p-3.5 font-mono text-xs leading-relaxed overflow-y-auto shadow-inner select-text border-2 border-[#18181b] space-y-2"
          >
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[#d31611] font-bold">$</span>
              <span className="text-slate-200">git apply patch_v2.diff &amp;&amp; pytest -q</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              running 26 tests across 4 test suites in isolated sandbox...
            </div>
            <div className="text-[#4ade80] flex items-center gap-2 pt-1 font-bold">
              <span>✓ 26 passed in 3.1s</span>
              <span className="text-slate-500 font-normal text-[11px]">
                (24 baseline + 2 regression)
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Coverage: +1.8% lines covered in <code className="text-slate-200">src/auth/session.py</code>
            </div>
            <div className="pt-2 border-t border-slate-800 text-slate-500 text-[11px]">
              # MicroVM isolation verified: read-only rootfs, zero leaked credentials.
            </div>
          </div>
        </section>

        {/* COLUMN 2: Patch Diff Synthesis (4 cols) */}
        <section className="lg:col-span-4 card-canvas-elevated p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5]">
            <span className="text-xs font-extrabold text-[#18181b] font-geist">
              Patch Diff Synthesis
            </span>
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
                Att. 1
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
                Att. 2 (Passed)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#666666] py-1.5 font-mono">
            <span className="font-bold text-[#18181b]">src/auth/session.py</span>
            <span className="text-[#4ade80] font-bold">+3 lines</span>
          </div>

          <div className="flex-1 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-1">
            {selectedAttemptTab === 'attempt2' ? (
              <>
                <div className="text-slate-500 text-[10px] pb-1">
                  # Attempt 2: UTC parsing &amp; null guard on token.expires_at
                </div>
                <div className="text-[#60a5fa] text-[11px]">--- a/src/auth/session.py</div>
                <div className="text-[#60a5fa] text-[11px]">+++ b/src/auth/session.py</div>
                <div className="text-slate-500 text-[11px]">@@ -40,6 +40,9 @@ def verify_login_token(token: str):</div>
                <div className="text-slate-400">     session = get_session_context()</div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +    if not token or token.is_expired():
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +        raise AuthenticationError("Token expired")
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
                  +    session.touch(datetime.now(timezone.utc))
                </div>
                <div className="text-slate-400">     return decode_jwt(token)</div>
              </>
            ) : (
              <>
                <div className="text-slate-500 text-[10px] pb-1">
                  # Attempt 1: naive check raised AttributeError
                </div>
                <div className="text-[#f87171] bg-[#f87171]/15 px-1 rounded font-bold">
                  -    if token.expired: raise Error()
                </div>
                <div className="text-slate-400 pt-2 text-[11px]">
                  Result: AttributeError when token was None.
                </div>
              </>
            )}
          </div>
        </section>

        {/* COLUMN 3: Live Event Stream Feed (3 cols) */}
        <section className="lg:col-span-3 card-canvas-elevated p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5]">
            <h2 className="text-xs font-extrabold text-[#18181b] tracking-tight font-geist">
              Live Stream
            </h2>
            <span className="text-[10px] text-[#666666] font-bold font-mono">
              {events.length > 0 ? `${events.length} events` : 'SSE Feed'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#666666] py-1.5 font-mono">
            <span>Node Activity</span>
            <span>Status</span>
          </div>

          <div className="flex-1 space-y-1.5 text-xs font-mono overflow-y-auto pr-1">
            {events.length > 0 ? (
              events.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-[#fffdf8] border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[#d31611] font-bold">
                      [{evt.data?.node || evt.event}]
                    </span>
                    <span className="text-[#666666] font-medium text-[10px]">{evt.timestamp}</span>
                  </div>
                  <p className="text-[#18181b] font-medium truncate">
                    {evt.data?.message || evt.data?.status || JSON.stringify(evt.data)}
                  </p>
                </div>
              ))
            ) : (
              <>
                <div className="p-2 rounded bg-[#fffdf8] border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#18181b] font-bold">[guardrail]</span>
                    <span className="text-[#666666] text-[10px]">10:41:02</span>
                  </div>
                  <p className="text-[#18181b] truncate">Repository verified in allowlist.</p>
                </div>
                <div className="p-2 rounded bg-[#fffdf8] border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#18181b] font-bold">[supervisor]</span>
                    <span className="text-[#666666] text-[10px]">10:41:03</span>
                  </div>
                  <p className="text-[#18181b] truncate">Dispatched parallel research.</p>
                </div>
                <div className="p-2 rounded bg-[#fffdf8] border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#d31611] font-bold">[research]</span>
                    <span className="text-[#666666] text-[10px]">10:41:07</span>
                  </div>
                  <p className="text-[#18181b] truncate">Issue &amp; code analysis complete.</p>
                </div>
                <div className="p-2 rounded bg-[#fff4da] border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b] text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#d31611] font-bold">[sandbox]</span>
                    <span className="text-[#666666] text-[10px]">10:41:15</span>
                  </div>
                  <p className="text-[#18181b] font-bold truncate">Attempt 2 passed: 26/26 tests.</p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
