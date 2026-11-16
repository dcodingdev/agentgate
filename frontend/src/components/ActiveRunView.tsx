import React, { useState } from 'react'
import type { RunStateResponse, StreamEventPayload } from '../types'
import { resumeRun } from '../services/api'

interface ActiveRunViewProps {
  threadId: string
  runState: RunStateResponse | null
  events: StreamEventPayload[]
  onSyncState: () => void
}

export const ActiveRunView: React.FC<ActiveRunViewProps> = ({
  threadId,
  runState,
  events,
  onSyncState,
}) => {
  const [feedback, setFeedback] = useState('')
  const [resuming, setResuming] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)

  const status = runState?.status || 'running'
  const isHitlPaused =
    status === 'paused_hitl' ||
    events.some(
      (e) =>
        e.event === 'hitl_paused' &&
        status !== 'completed' &&
        status !== 'rejected'
    )

  const values = runState?.values || {}
  const sandboxId = values.sandbox_id || 'sbx_8f21'
  const testAttempts = values.test_attempts || 2
  const maxAttempts = values.max_test_attempts || 3
  const riskScore =
    runState?.risk_score ??
    (events.find((e) => e.data.risk_score !== undefined)?.data.risk_score ?? 0.85)
  const prUrl = runState?.pr_url || events.find((e) => e.data.pr_url)?.data.pr_url

  const patchDiff =
    values.patch_diff ||
    `--- a/src/auth/session.py\n+++ b/src/auth/session.py\n@@ -42,6 +42,8 @@ def verify_login_token(token: str):\n+    if token.is_expired():\n+        raise AuthenticationError("Token expired")\n     return decode_jwt(token)`

  const handleDecision = async (approved: boolean, isRevision: boolean = false) => {
    try {
      setResuming(true)
      setResumeError(null)
      await resumeRun(threadId, {
        approved,
        feedback: isRevision
          ? feedback || 'Please refine the token expiration logic and add tests.'
          : null,
      })
      onSyncState()
    } catch (err: any) {
      setResumeError(err.message || 'Failed to submit decision.')
    } finally {
      setResuming(false)
    }
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 animate-in fade-in duration-200">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* LEFT COLUMN: Background Agents */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 select-none">
          <div>
            <h2 className="text-sm font-extrabold text-[#18181b] font-geist">Background Agents</h2>
            <p className="text-xs text-[#666666] mt-0.5 font-medium">
              Autonomous execution without blocking you.
            </p>
          </div>

          <div className="space-y-3">
            <div className="card-canvas-elevated p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">Guardrail</span>
                <span className="badge-warm">Background</span>
              </div>
              <p className="text-xs font-bold text-[#18181b] mt-1">
                Done <span className="text-[#666666] font-normal">· passed in 0.8s</span>
              </p>
            </div>

            <div className="card-canvas-elevated p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">Supervisor</span>
                <span className="badge-warm">Background</span>
              </div>
              <p className="text-xs font-bold text-[#18181b] mt-1">
                Active <span className="text-[#666666] font-normal">· watching run</span>
              </p>
            </div>

            <div className="card-canvas-elevated p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">Parallel Research</span>
                <span className="badge-warm">Background</span>
              </div>
              <p className="text-xs font-bold text-[#18181b] mt-1">
                Done <span className="text-[#666666] font-normal">· fan-out via Send</span>
              </p>
            </div>
          </div>

          <div className="pt-2 text-xs text-[#666666] font-mono">
            <span className="font-bold text-[#18181b]">11.2k tokens</span> · <span className="font-bold text-[#18181b]">$0.03</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Foreground Panels */}
        <div className="flex-1 w-full space-y-6">
          {/* HITL Intervention Card if Paused */}
          {isHitlPaused && (
            <section className="bg-[#fff4da] border-2 border-[#18181b] rounded-xl p-6 shadow-[4px_4px_0px_#18181b] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#18181b] pb-2">
                <h3 className="text-sm font-extrabold text-[#18181b] font-geist">
                  Human Approval Gate · Risk Score {riskScore.toFixed(2)}
                </h3>
                <span className="badge-accent">Action Required</span>
              </div>

              <div className="bg-[#18181b] text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto border-2 border-[#18181b]">
                <pre>{patchDiff}</pre>
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Optional revision instructions for Fix & Test agent..."
                rows={2}
                className="w-full bg-white border-2 border-[#18181b] rounded-md p-2.5 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611]"
              />

              {resumeError && (
                <div className="p-2 bg-[#fffdf8] border-2 border-[#d31611] rounded-md text-xs text-[#d31611] font-bold">
                  {resumeError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleDecision(false, false)}
                  disabled={resuming}
                  className="btn-outline-dark text-xs text-[#d31611]"
                >
                  Reject Run
                </button>
                <button
                  onClick={() => handleDecision(false, true)}
                  disabled={resuming}
                  className="btn-warm text-xs"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => handleDecision(true, false)}
                  disabled={resuming}
                  className="btn-cta text-xs"
                >
                  {resuming ? 'Resuming...' : 'Approve & Open PR'}
                </button>
              </div>
            </section>
          )}

          {/* Sandbox Terminal */}
          <section className="card-canvas-elevated p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#18181b] font-geist">
                Isolated Sandbox · {sandboxId}
              </h3>
              <span className="badge-warm">
                Attempt {testAttempts}/{maxAttempts}
              </span>
            </div>

            <div className="bg-[#18181b] text-slate-100 rounded-lg p-4 font-mono text-xs leading-relaxed space-y-1 select-text border-2 border-[#18181b]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-[#d31611] font-bold">$</span>
                <span>git apply patch_v2.diff &amp;&amp; pytest -q</span>
              </div>
              <div className="text-[#4ade80] flex items-center gap-3 pt-0.5 font-bold">
                <span>26 passed in 3.1s</span>
                <span className="text-slate-400 font-normal"># baseline 24, +2 regression tests</span>
              </div>
            </div>
          </section>

          {/* Published PR link if available */}
          {prUrl && (
            <div className="bg-[#fff4da] border-2 border-[#18181b] rounded-xl p-5 shadow-[3px_3px_0px_#18181b] flex items-center justify-between">
              <div>
                <span className="badge-warm">Done · Completed</span>
                <h4 className="text-base font-extrabold text-[#18181b] mt-1 font-geist">Pull Request Published</h4>
                <a href={prUrl} target="_blank" rel="noreferrer" className="text-xs font-mono font-bold text-[#d31611] hover:underline">
                  {prUrl}
                </a>
              </div>
              <a href={prUrl} target="_blank" rel="noreferrer" className="btn-cta text-xs">
                View on GitHub &rarr;
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
