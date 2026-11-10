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
  description: string
}

export const LiveSandboxScreen: React.FC<LiveSandboxScreenProps> = ({
  sandboxId = 'sbx_8f21',
  currentAttempt = 2,
  maxAttempts = 3,
  events = [],
}) => {
  const [selectedAttemptTab, setSelectedAttemptTab] = useState<'attempt1' | 'attempt2'>('attempt2')

  // Seven-step pipeline bar
  const pipelineSteps: PipelineStep[] = [
    { name: '1. Guardrail', status: 'Done', description: 'Passed in 0.8s' },
    { name: '2. Supervisor', status: 'Done', description: 'Sandbox provisioned' },
    { name: '3. Research', status: 'Done', description: 'Target: auth/session.py' },
    { name: '4. Sandbox', status: 'Running', description: `Attempt ${currentAttempt}/${maxAttempts}` },
    { name: '5. Verify', status: 'Waiting', description: 'Queued after tests' },
    { name: '6. Reviewer', status: 'Waiting', description: 'Risk check' },
    { name: '7. Approval', status: 'Waiting', description: 'HITL Gate' },
  ]

  const getStepStyle = (status: StageStatus) => {
    switch (status) {
      case 'Done':
        return 'border-[#1b6348] bg-[#f0f9f4] text-[#136340]'
      case 'Running':
        return 'border-2 border-[#18533e] bg-white text-[#18533e] ring-2 ring-[#18533e]/20'
      case 'Escalated':
        return 'border-[#d97706] bg-[#fef5ea] text-[#8a5314]'
      case 'Waiting':
      default:
        return 'border-[#e8e6df] bg-[#faf8f5] text-[#8c8980]'
    }
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-6 py-8 space-y-7 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-medium text-[#1a1918]">Live Sandbox Execution</h1>
        <p className="text-xs text-[#706c64] mt-0.5">
          Real-time container execution, test suite runner, and patch iteration inspection.
        </p>
      </div>

      {/* 1. Seven-step pipeline bar */}
      <section
        aria-label="Seven-step pipeline progression"
        className="bg-white border border-[#e8e6df] rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        <div className="text-xs font-semibold text-[#1a1918] mb-3 flex items-center justify-between">
          <span>Seven-Step Workflow Pipeline</span>
          <span className="text-[11px] font-normal text-[#8c8980]">
            Stage status is always presented as explicit text and color
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {pipelineSteps.map((step) => (
            <div
              key={step.name}
              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between min-h-[64px] ${getStepStyle(
                step.status
              )}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{step.name}</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px]">
                <span className="font-bold uppercase tracking-wider">{step.status}</span>
                <span className="text-[#8c8980] truncate ml-1">{step.description}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Sandbox Container & Attempt Badges */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f2f0ea]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-[#1a1918]">Sandbox: E2B {sandboxId}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f0ede6] text-[#55524c]">
              Linux VM
            </span>
          </div>

          {/* Sandbox transparency: attempt badges and security notice */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8c8980] mr-1">Attempt badges:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#e1f4ec] text-[#136340] border border-[#c5e8d6]">
              1/3 Done
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#18533e] text-white shadow-xs">
              2/3 Active
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f0ede6] text-[#7a766e]">
              3/3 Queued
            </span>
          </div>
        </div>

        {/* Security statement */}
        <div className="bg-[#f0f9f4] border border-[#d2ecde] rounded-xl px-4 py-2 text-xs text-[#136340] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Security policy:</span>
            <span>No secrets or credentials are inside the sandbox. Stored strictly on server.</span>
          </div>
          <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-[#cbe4d7]">
            read_only_network
          </span>
        </div>

        {/* Live terminal box */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6e6a62] px-1">
            <span className="font-mono">tty0 · /repo/shop-api</span>
            <span className="text-[11px]">pytest v9.1.1</span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Live Sandbox Terminal"
            className="bg-[#18191c] text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed space-y-1.5 overflow-x-auto shadow-inner select-text"
          >
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[#4ade80] font-bold">$</span>
              <span className="text-slate-200">git apply patch_v2.diff &amp;&amp; pytest -q</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              running 26 tests across 4 test suites in isolated sandbox...
            </div>
            <div className="text-[#4ade80] flex items-center gap-3 pt-1">
              <span className="font-bold">26 passed in 3.1s</span>
              <span className="text-slate-500 font-normal">
                # baseline 24, plus 2 new regression tests
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Coverage report generated: +1.8% lines covered.
            </div>
          </div>
        </div>

        {/* 3. Patch change between attempts */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1a1918]">
              Patch change between attempts
            </span>
            <div className="flex items-center gap-1 bg-[#f0ede6] p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setSelectedAttemptTab('attempt1')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  selectedAttemptTab === 'attempt1'
                    ? 'bg-white text-[#1a1918] font-semibold shadow-xs'
                    : 'text-[#68655e]'
                }`}
              >
                Attempt 1 (Failed)
              </button>
              <button
                type="button"
                onClick={() => setSelectedAttemptTab('attempt2')}
                className={`px-3 py-1 rounded-md transition cursor-pointer ${
                  selectedAttemptTab === 'attempt2'
                    ? 'bg-white text-[#18533e] font-semibold shadow-xs'
                    : 'text-[#68655e]'
                }`}
              >
                Attempt 2 (Refined · Passed)
              </button>
            </div>
          </div>

          <div className="bg-[#18191c] rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-300">
            {selectedAttemptTab === 'attempt2' ? (
              <>
                <div className="text-slate-500 text-[11px] pb-1">
                  # Attempt 2 refinement: added UTC parsing &amp; null guard on token.expires_at
                </div>
                <div className="text-[#60a5fa]">--- a/src/auth/session.py</div>
                <div className="text-[#60a5fa]">+++ b/src/auth/session.py</div>
                <div className="text-slate-500">@@ -40,6 +40,9 @@ def verify_login_token(token: str):</div>
                <div className="text-slate-400">     session = get_session_context()</div>
                <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
                  +    if not token or token.is_expired():
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
                  +        raise AuthenticationError("Login token has expired")
                </div>
                <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
                  +    session.touch_activity(datetime.now(timezone.utc))
                </div>
                <div className="text-slate-400">     return decode_jwt(token)</div>
              </>
            ) : (
              <>
                <div className="text-slate-500 text-[11px] pb-1">
                  # Attempt 1: naive check raised AttributeError when token was None
                </div>
                <div className="text-[#f87171] bg-[#f87171]/10 px-1 rounded">
                  -    if token.expired: raise Error()
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 4. Timestamped Event Log */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-[#f2f0ea]">
          <h2 className="text-sm font-semibold text-[#1a1918]">Timestamped Execution Log</h2>
          <span className="text-xs text-[#8c8980]">
            {events.length > 0 ? `${events.length} live events received` : 'Real-time agent progression'}
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono max-h-64 overflow-y-auto">
          {events.length > 0 ? (
            events.map((evt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded-lg bg-[#faf9f5] border border-[#f0ede6]"
              >
                <span className="text-[#8c8980] shrink-0 font-medium">{evt.timestamp}</span>
                <span className="text-[#18533e] font-bold">
                  [{evt.data?.node || evt.event}]
                </span>
                <span className="text-[#302e2b]">
                  {evt.data?.message || evt.data?.status || JSON.stringify(evt.data)}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-[#faf9f5] border border-[#f0ede6]">
                <span className="text-[#8c8980] shrink-0 font-medium">10:41:02</span>
                <span className="text-[#1b6348] font-bold">[guardrail]</span>
                <span className="text-[#302e2b]">Repository authorization verified against allowed_repos policy.</span>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-[#faf9f5] border border-[#f0ede6]">
                <span className="text-[#8c8980] shrink-0 font-medium">10:41:03</span>
                <span className="text-[#1b6348] font-bold">[supervisor]</span>
                <span className="text-[#302e2b]">Proving isolated E2B container sbx_8f21 with base template.</span>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-[#faf9f5] border border-[#f0ede6]">
                <span className="text-[#8c8980] shrink-0 font-medium">10:41:07</span>
                <span className="text-[#1b6348] font-bold">[research]</span>
                <span className="text-[#302e2b]">Root cause identified: TTL check omitted in auth/session.py.</span>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-[#f0f9f4] border border-[#d2ecde]">
                <span className="text-[#8c8980] shrink-0 font-medium">10:41:15</span>
                <span className="text-[#18533e] font-bold">[sandbox]</span>
                <span className="text-[#136340]">Attempt 2/3 verified: 26 passed in 3.1s inside sandbox.</span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
