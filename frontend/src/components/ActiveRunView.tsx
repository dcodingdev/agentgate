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
  const [showRawLogs, setShowRawLogs] = useState(false)

  // Current status
  const status = runState?.status || 'running'
  const isHitlPaused =
    status === 'paused_hitl' ||
    events.some(
      (e) =>
        e.event === 'hitl_paused' &&
        status !== 'completed' &&
        status !== 'rejected'
    )

  // Extract details from values or events
  const values = runState?.values || {}
  const sandboxId = values.sandbox_id || 'sbx_8f21'
  const testAttempts = values.test_attempts || 2
  const maxAttempts = values.max_test_attempts || 3
  const riskScore =
    runState?.risk_score ??
    (events.find((e) => e.data.risk_score !== undefined)?.data.risk_score ?? 0.85)
  const prUrl = runState?.pr_url || events.find((e) => e.data.pr_url)?.data.pr_url

  // Candidate diff
  const patchDiff =
    values.patch_diff ||
    `--- a/src/auth/session.py\n+++ b/src/auth/session.py\n@@ -42,6 +42,8 @@ def verify_login_token(token: str):\n+    if token.is_expired():\n+        raise AuthenticationError("Token expired")\n     return decode_jwt(token)`

  // Determine stage progress
  const hasReviewer =
    events.some((e) => e.data.node === 'reviewer') || values.risk_score !== undefined
  const isCompleted = status === 'completed' || !!prUrl

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
        {/* LEFT COLUMN: Background Agents (matching Image 2) */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 select-none">
          <div>
            <h2 className="text-sm font-semibold text-[#1a1918]">Background agents</h2>
            <p className="text-xs text-[#8c8980] mt-0.5">
              These run on their own and need nothing from you.
            </p>
          </div>

          <div className="space-y-3">
            {/* Guardrail Agent Card */}
            <div className="bg-white border border-[#e8e6df] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Guardrail</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0fb] text-[#4c529e]">
                  Background
                </span>
              </div>
              <p className="text-xs text-[#1b6348] font-medium mt-1.5 flex items-center gap-1">
                <span>Done</span>
                <span className="text-[#8c8980] font-normal">· passed in 0.8s</span>
              </p>
            </div>

            {/* Supervisor Agent Card */}
            <div className="bg-white border border-[#e8e6df] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Supervisor</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0fb] text-[#4c529e]">
                  Background
                </span>
              </div>
              <p className="text-xs text-[#136340] font-medium mt-1.5 flex items-center gap-1">
                <span>Watching</span>
                <span className="text-[#8c8980] font-normal">· re-plans on failure</span>
              </p>
            </div>

            {/* Codebase Research Agent Card */}
            <div className="bg-white border border-[#e8e6df] rounded-xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Codebase research</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0fb] text-[#4c529e]">
                  Background
                </span>
              </div>
              <p className="text-xs text-[#1b6348] font-medium mt-1.5 flex items-center gap-1">
                <span>Done</span>
                <span className="text-[#8c8980] font-normal">
                  · found {values.files_changed?.[0] || 'auth/session.py'}
                </span>
              </p>
            </div>
          </div>

          {/* Stats footer matching Image 2 */}
          <div className="pt-2 text-xs text-[#8c8980] flex items-center gap-1.5">
            <span>11.2k tokens</span>
            <span>·</span>
            <span>$0.03</span>
            <span>·</span>
            <button
              onClick={() => setShowRawLogs(!showRawLogs)}
              className="text-[#55524c] hover:text-[#18533e] underline cursor-pointer"
            >
              {showRawLogs ? 'Hide trace' : 'View trace'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Execution Stages & Cards (matching Image 2) */}
        <div className="flex-1 w-full space-y-4">
          {/* Card 1: Sandbox E2B execution box */}
          <div className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1a1918]">
                Sandbox · E2B {sandboxId}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f9f4] text-[#136340] border border-[#d6ede0]">
                Done · attempt {testAttempts} of {maxAttempts}
              </span>
            </div>

            {/* Dark terminal box matching Image 2 */}
            <div className="bg-[#18191c] text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed space-y-1 overflow-x-auto shadow-inner select-text">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-[#4ade80]">$</span>
                <span>git apply patch_v2.diff &amp;&amp; pytest -q</span>
              </div>
              <div className="text-[#4ade80] flex items-center gap-3 pt-0.5">
                <span>26 passed in 3.1s</span>
                <span className="text-slate-500 font-normal">
                  # baseline 24, plus 2 new tests
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Verify and security */}
          <div
            className={`bg-white rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3 transition ${
              !isHitlPaused && !isCompleted
                ? 'border-2 border-[#18533e]'
                : 'border border-[#e8e6df]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1a1918]">
                Verify and security
              </span>
              {!isHitlPaused && !isCompleted ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e1f4ec] text-[#136340]">
                  Running
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f9f4] text-[#136340]">
                  Done
                </span>
              )}
            </div>

            {/* Checklist matching Image 2 */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between py-0.5 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Baseline comparison</span>
                <span className="text-[#1b6348] font-medium">Done · no new failures</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Coverage</span>
                <span className="text-[#1b6348] font-medium">Done · +1.8%</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Lint</span>
                <span className="text-[#1b6348] font-medium">Done · clean</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Security scan</span>
                {isHitlPaused || isCompleted ? (
                  <span className="text-[#1b6348] font-medium">Done · clean</span>
                ) : (
                  <span className="text-[#0d9488] font-medium animate-pulse">Running ...</span>
                )}
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[#4a4740]">Risk score</span>
                {isHitlPaused || isCompleted ? (
                  <span className="text-[#b45309] font-semibold">
                    Done · {riskScore.toFixed(2)} (High)
                  </span>
                ) : (
                  <span className="text-[#8c8980]">Waiting</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: PR quality reviewer */}
          <div className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1a1918]">
                PR quality reviewer
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f2f0ea] text-[#6b675e]">
                {hasReviewer || isHitlPaused || isCompleted ? 'Done' : 'Waiting'}
              </span>
            </div>
            <p className="text-xs text-[#8c8980]">
              Starts when Verify finishes. Shows confidence, risk level, and its critique of the diff.
            </p>
          </div>

          {/* Card 4: Human approval (HITL Gate) */}
          {!isHitlPaused && !isCompleted ? (
            /* Waiting state matching Image 2 */
            <div className="bg-white border border-dashed border-[#d8d4ca] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Human approval</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f2f0ea] text-[#6b675e]">
                  Waiting
                </span>
              </div>
              <p className="text-xs text-[#8c8980]">
                Opens only if risk is high or confidence is low. Otherwise the PR agent runs directly.
              </p>
            </div>
          ) : isHitlPaused ? (
            /* Active HITL Approval Card when paused for sign-off */
            <div className="bg-white border-2 border-[#d97706] rounded-2xl p-6 shadow-md space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-[#f2ede4]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1a1918]">
                      Human Approval Required
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#fef3c7] text-[#92400e]">
                      Risk {riskScore.toFixed(2)} / 1.00
                    </span>
                  </div>
                  <p className="text-xs text-[#6e6a62] mt-0.5">
                    Changes exceed safety threshold (0.70). Please review candidate diff and approve or request revision.
                  </p>
                </div>
              </div>

              {resumeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {resumeError}
                </div>
              )}

              {/* Proposed Patch Diff Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#6e6a62]">
                  <span className="font-medium text-[#1a1918]">Proposed Patch Diff:</span>
                  <span className="font-mono text-[11px]">auth/session.py</span>
                </div>
                <div className="bg-[#18191c] rounded-xl p-3.5 font-mono text-xs overflow-x-auto text-slate-300 max-h-48">
                  {patchDiff.split('\n').map((line: string, i: number) => {
                    let style = 'text-slate-400'
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                      style = 'text-[#4ade80] bg-[#4ade80]/10 px-1 rounded'
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                      style = 'text-[#f87171] bg-[#f87171]/10 px-1 rounded'
                    } else if (line.startsWith('@@')) {
                      style = 'text-[#60a5fa]'
                    }
                    return (
                      <div key={i} className={style}>
                        {line || '\u00A0'}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Revision feedback input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#4a4740]">
                  Revision feedback (optional if requesting changes):
                </label>
                <input
                  type="text"
                  placeholder="E.g., Ensure token timestamp is parsed as UTC before checking expiration."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-[#faf8f5] border border-[#e0dcce] rounded-lg px-3.5 py-2 text-xs text-[#1a1918] focus:outline-none focus:border-[#18533e]"
                />
              </div>

              {/* Decision actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDecision(false, false)}
                  disabled={resuming}
                  className="px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                >
                  Reject &amp; abort
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision(false, true)}
                  disabled={resuming}
                  className="px-3.5 py-2 text-xs font-medium text-[#8a5314] bg-[#fef5ea] hover:bg-[#faeedd] border border-[#fae3cd] rounded-lg transition"
                >
                  Request revision
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision(true, false)}
                  disabled={resuming}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#18533e] hover:bg-[#134433] rounded-lg shadow-sm transition"
                >
                  {resuming ? 'Resuming...' : 'Approve & Open PR'}
                </button>
              </div>
            </div>
          ) : null}

          {/* Card 5: Pull Request Generated Card (when completed) */}
          {isCompleted && (
            <div className="bg-[#f0f9f4] border border-[#bfe3cd] rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#145339]">
                    Pull Request Published!
                  </h3>
                  <p className="text-xs text-[#2b6a50] mt-0.5">
                    Automated patch verified inside sandbox and committed to repository.
                  </p>
                </div>

                {prUrl && (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#18533e] hover:bg-[#134433] text-white text-xs font-semibold shadow-sm transition"
                  >
                    <span>Open on GitHub</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Expandable Raw Trace / SSE Events Log */}
          {showRawLogs && (
            <div className="bg-white border border-[#e8e6df] rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6e6a62]">
                <span className="font-semibold text-[#1a1918]">Live Stream Events</span>
                <span>{events.length} events</span>
              </div>
              <div className="bg-[#18191c] text-slate-300 rounded-xl p-3 font-mono text-[11px] max-h-56 overflow-y-auto space-y-1">
                {events.map((evt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-500">{evt.timestamp}</span>
                    <span className="text-[#4ade80]">[{evt.event}]</span>
                    <span>
                      {evt.data.node ? `${evt.data.node}: ` : ''}
                      {evt.data.message || JSON.stringify(evt.data)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
