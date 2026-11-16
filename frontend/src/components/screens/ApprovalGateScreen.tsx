import React, { useState } from 'react'

interface ApprovalGateScreenProps {
  onApprove?: () => void
  onRequestChanges?: (feedback: string) => void
  onReject?: (reason: string) => void
}

export const ApprovalGateScreen: React.FC<ApprovalGateScreenProps> = ({
  onApprove,
  onRequestChanges,
  onReject,
}) => {
  const [actionType, setActionType] = useState<'idle' | 'edit' | 'reject'>('idle')
  const [feedback, setFeedback] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null)

  const handleApprove = () => {
    setSubmittedStatus('Approved! Resuming agent to publish Pull Request...')
    if (onApprove) onApprove()
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) {
      setErrorMessage('Please enter feedback explaining the requested changes.')
      return
    }
    setSubmittedStatus('Revision feedback sent! Routing back to fix & test node...')
    if (onRequestChanges) onRequestChanges(feedback)
  }

  const handleSubmitReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) {
      setErrorMessage('Feedback is required when rejecting so the agent understands why.')
      return
    }
    setSubmittedStatus('Run rejected and terminated. Sandbox cleaned up.')
    if (onReject) onReject(feedback)
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Compact Top Attention Header with Integrated Outcome Chips */}
      <div className="bg-[#fff4da] border-2 border-[#18181b] rounded-xl p-3.5 text-[#18181b] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[3px_3px_0px_#18181b]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#d31611] text-white flex items-center justify-center font-black text-xs shrink-0 border border-[#18181b]">
            !
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#18181b] tracking-tight font-geist flex items-center gap-2">
              <span>Human Approval Required</span>
              <span className="badge-accent text-[10px]">Risk Score: 0.85 (High)</span>
            </h1>
            <p className="text-[11px] text-[#666666] font-medium">
              LangGraph checkpointer paused before PR. Changes touch core session authentication logic.
            </p>
          </div>
        </div>

        {/* 4 Outcome Metrics Inline Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="px-2 py-1 rounded-md bg-white border border-[#18181b] text-[11px] font-bold text-[#18181b]">
            ✓ 26/26 Tests
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-[#18181b] text-[11px] font-bold text-[#18181b]">
            +1.8% Cov
          </span>
          <span className="px-2 py-1 rounded-md bg-white border border-[#18181b] text-[11px] font-bold text-[#18181b]">
            0 CVEs SAST
          </span>
          <span className="badge-warm text-[11px] font-mono">priya/shop-api #60</span>
        </div>
      </div>

      {submittedStatus && (
        <div className="p-3 bg-[#ebdbb7] border-2 border-[#18181b] rounded-lg text-xs font-bold text-[#18181b] shadow-[2px_2px_0px_#18181b]">
          {submittedStatus}
        </div>
      )}

      {/* Main 2-Column Horizontal Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* LEFT COLUMN: Candidate Patch Diff & Context (7 cols) */}
        <section className="lg:col-span-7 card-canvas-elevated p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#18181b] font-geist">
                Candidate Patch Diff
              </span>
              <span className="font-mono text-[11px] font-bold text-[#18181b] bg-[#fff4da] px-1.5 py-0.5 rounded border border-[#18181b]">
                src/auth/session.py
              </span>
            </div>
            <span className="text-[11px] text-[#666666] font-medium truncate max-w-[220px]">
              #60 Login tokens never expire
            </span>
          </div>

          {/* Compact Resolution Plan Bar */}
          <div className="py-2 text-[11px] text-[#666666] border-b border-[#e5e5e5] bg-[#fffdf8] px-2 rounded mt-1 flex items-center justify-between">
            <span className="font-medium">
              <strong className="text-[#18181b]">Fix:</strong> Enforces UTC expiration validation &amp; adds regression test.
            </span>
            <span className="text-[#4ade80] font-bold font-mono">+4 lines / 0 errors</span>
          </div>

          {/* Unified Diff View */}
          <div className="flex-1 mt-2 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 select-text leading-relaxed border-2 border-[#18181b]">
            <div className="text-[#60a5fa] text-[11px]">--- a/src/auth/session.py</div>
            <div className="text-[#60a5fa] text-[11px]">+++ b/src/auth/session.py</div>
            <div className="text-slate-500 text-[11px]">@@ -39,6 +39,10 @@ def verify_login_token(token: str) -&gt; UserSession:</div>
            <div className="text-slate-400">     session = get_session_context()</div>
            <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
              +    now_utc = datetime.now(timezone.utc)
            </div>
            <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
              +    if not token or token.expires_at &lt; now_utc:
            </div>
            <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
              +        raise AuthenticationError("Login token has expired. Please re-authenticate.")
            </div>
            <div className="text-[#4ade80] bg-[#4ade80]/15 px-1 rounded font-bold">
              +    session.last_active_at = now_utc
            </div>
            <div className="text-slate-400">     return decode_jwt(token)</div>
            <div className="pt-3 text-slate-500 text-[11px] border-t border-slate-800">
              # Verified in Firecracker MicroVM: pytest passed, zero regressions.
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Sign-Off Decision & Revision Panel (5 cols) */}
        <section className="lg:col-span-5 card-canvas-elevated p-4 flex flex-col h-[520px]">
          <div className="border-b-2 border-[#18181b] pb-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#d31611]">
                Human Decision
              </span>
              <span className="badge-warm text-[10px]">Gate Active</span>
            </div>
            <h2 className="text-base font-extrabold text-[#18181b] font-geist mt-0.5">
              Engineer Sign-Off Gate
            </h2>
            <p className="text-xs text-[#666666] mt-0.5 font-medium">
              Verify patch and authorize Pull Request creation.
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-[#fff4da] border-2 border-[#d31611] rounded-md text-xs text-[#d31611] font-bold my-2">
              {errorMessage}
            </div>
          )}

          {/* Dynamic Revision Form or Action Buttons */}
          <div className="flex-1 flex flex-col justify-between py-2">
            {actionType !== 'idle' ? (
              <form
                onSubmit={actionType === 'edit' ? handleSubmitEdit : handleSubmitReject}
                className="p-3 bg-[#fffdf8] border-2 border-[#18181b] rounded-lg space-y-2.5 shadow-[2px_2px_0px_#18181b] flex-1 flex flex-col"
              >
                <label htmlFor="gate-feedback-input" className="block text-xs font-bold text-[#18181b]">
                  {actionType === 'edit'
                    ? 'Enter requested changes for the agent:'
                    : 'Rejection reason (Required):'}
                </label>
                <textarea
                  id="gate-feedback-input"
                  required
                  rows={3}
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder={
                    actionType === 'edit'
                      ? 'E.g., Also update token refresh endpoint to issue new expiry timestamps.'
                      : 'Explain why this patch is unacceptable...'
                  }
                  className="w-full flex-1 bg-white border-2 border-[#18181b] rounded-md p-2 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611]"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType('idle')
                      setErrorMessage(null)
                    }}
                    className="btn-outline-dark text-xs py-1 px-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-cta text-xs py-1 px-3"
                  >
                    {actionType === 'edit' ? 'Send revision' : 'Confirm reject'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2.5 my-auto">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full btn-cta py-3 text-sm text-center block font-extrabold"
                >
                  Approve &amp; Open GitHub PR &rarr;
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('edit')}
                    className="btn-warm text-xs py-2 text-center"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('reject')}
                    className="btn-outline-dark text-xs py-2 text-[#d31611] text-center"
                  >
                    Reject Run
                  </button>
                </div>
              </div>
            )}

            {/* Risk factors list */}
            <div className="pt-2.5 border-t border-[#e5e5e5] space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-[#18181b] uppercase tracking-wider block">
                Risk Review Factors:
              </span>
              <ul className="text-[11px] text-[#666666] space-y-1 list-disc list-inside">
                <li>Modifies sensitive security authentication module (<code className="text-[#18181b]">auth/session.py</code>)</li>
                <li>Diff size: +4 lines, 0 deletions across 1 file</li>
                <li>Regression suite verified: 26/26 tests passed in microVM</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
