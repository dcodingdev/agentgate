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
    // PRD requirement: Feedback is strictly required for rejection!
    if (!feedback.trim()) {
      setErrorMessage('Feedback is required when rejecting so the agent understands why.')
      return
    }
    setSubmittedStatus('Run rejected and terminated. Sandbox cleaned up.')
    if (onReject) onReject(feedback)
  }

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-7 animate-in fade-in duration-200">
      {/* Top Alert Banner for Attention (Amber) */}
      <div className="bg-[#fef5ea] border-2 border-[#fae3cd] rounded-2xl p-4 text-[#8a5314] flex items-start gap-3 shadow-sm">
        <div className="w-5 h-5 rounded-full bg-[#d97706] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          !
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#8a5314]">
            Human Approval Gate · Risk Score 0.85 (High)
          </h2>
          <p className="text-xs text-[#7d5019] mt-0.5 leading-relaxed">
            LangGraph checkpointer paused execution before committing. Changes modify core session authentication logic.
          </p>
        </div>
      </div>

      {submittedStatus && (
        <div className="p-4 bg-[#f0f9f4] border border-[#cbe4d7] rounded-xl text-xs font-semibold text-[#18533e]">
          {submittedStatus}
        </div>
      )}

      {/* 1. Issue Information */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
        <div className="flex items-center justify-between text-xs text-[#8c8980]">
          <span>Target Issue</span>
          <span className="font-mono">priya/shop-api #60</span>
        </div>
        <h3 className="text-base font-semibold text-[#1a1918]">
          Login tokens never expire
        </h3>
        <p className="text-xs text-[#6e6a62] leading-relaxed">
          Reported by engineering: Authentication session tokens remain valid indefinitely after initial login. The system fails to validate UTC expiration timestamps during request verification.
        </p>
      </section>

      {/* 2. Research Plan Summary */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
        <div className="text-xs font-semibold text-[#1a1918]">Agent Resolution Plan</div>
        <p className="text-xs text-[#6e6a62] leading-relaxed">
          1. Trace authentication lifecycle in <code className="bg-[#f2f0ea] px-1 py-0.5 rounded text-[11px] font-mono">src/auth/session.py</code>.<br />
          2. Inject strict UTC expiration verification and raise <code className="bg-[#f2f0ea] px-1 py-0.5 rounded text-[11px] font-mono">AuthenticationError</code> when expired.<br />
          3. Author regression tests in <code className="bg-[#f2f0ea] px-1 py-0.5 rounded text-[11px] font-mono">tests/test_auth.py</code> covering expired and valid tokens.
        </p>
      </section>

      {/* 3. Four Result Tiles */}
      <section aria-label="Verification Outcomes" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: Tests */}
        <div className="bg-white border border-[#e8e6df] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-[11px] text-[#8c8980] uppercase tracking-wider font-semibold">1. Tests</span>
          <div className="text-sm font-bold text-[#1b6348]">26 / 26 passed</div>
          <p className="text-[11px] text-[#6e6a62]">2 new regression tests</p>
        </div>

        {/* Tile 2: Coverage */}
        <div className="bg-white border border-[#e8e6df] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-[11px] text-[#8c8980] uppercase tracking-wider font-semibold">2. Coverage</span>
          <div className="text-sm font-bold text-[#1b6348]">+1.8% delta</div>
          <p className="text-[11px] text-[#6e6a62]">Auth path 100% covered</p>
        </div>

        {/* Tile 3: Security Scan */}
        <div className="bg-white border border-[#e8e6df] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-[11px] text-[#8c8980] uppercase tracking-wider font-semibold">3. Scan</span>
          <div className="text-sm font-bold text-[#1b6348]">0 vulnerabilities</div>
          <p className="text-[11px] text-[#6e6a62]">Clean bandit/SAST pass</p>
        </div>

        {/* Tile 4: Risk */}
        <div className="bg-white border-2 border-[#d97706] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-1 bg-[#fefdfb]">
          <span className="text-[11px] text-[#8a5314] uppercase tracking-wider font-semibold">4. Risk</span>
          <div className="text-sm font-bold text-[#b45309]">0.85 High</div>
          <p className="text-[11px] text-[#8a5314]">Touches core auth/jwt</p>
        </div>
      </section>

      {/* 4. The Candidate Patch Diff */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#1a1918]">Candidate Patch Diff</span>
          <span className="font-mono text-[11px] text-[#8c8980]">src/auth/session.py</span>
        </div>

        <div className="bg-[#18191c] rounded-xl p-4 font-mono text-xs overflow-x-auto text-slate-300 select-text leading-relaxed">
          <div className="text-[#60a5fa]">--- a/src/auth/session.py</div>
          <div className="text-[#60a5fa]">+++ b/src/auth/session.py</div>
          <div className="text-slate-500">@@ -39,6 +39,10 @@ def verify_login_token(token: str) -&gt; UserSession:</div>
          <div className="text-slate-400">     session = get_session_context()</div>
          <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
            +    now_utc = datetime.now(timezone.utc)
          </div>
          <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
            +    if not token or token.expires_at &lt; now_utc:
          </div>
          <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
            +        raise AuthenticationError("Login token has expired. Please re-authenticate.")
          </div>
          <div className="text-[#4ade80] bg-[#4ade80]/10 px-1 rounded">
            +    session.last_active_at = now_utc
          </div>
          <div className="text-slate-400">     return decode_jwt(token)</div>
        </div>
      </section>

      {/* 5. The Approval Card (Approve, Edit, Reject with required feedback) */}
      <section className="bg-white border-2 border-[#18533e] rounded-2xl p-6 shadow-md space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#1a1918]">
            Engineer Sign-Off Decision
          </h2>
          <p className="text-xs text-[#706c64] mt-0.5">
            Approve to publish the GitHub Pull Request, request revision feedback, or reject with a required reason.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {errorMessage}
          </div>
        )}

        {/* Dynamic form for Edit or Reject */}
        {actionType !== 'idle' && (
          <form
            onSubmit={actionType === 'edit' ? handleSubmitEdit : handleSubmitReject}
            className="p-4 bg-[#faf9f5] border border-[#e5e2db] rounded-xl space-y-3 animate-in fade-in"
          >
            <label htmlFor="gate-feedback-input" className="block text-xs font-semibold text-[#1a1918]">
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
                  : 'Explain why this patch is unacceptable (required)...'
              }
              className="w-full bg-white border border-[#dcd8ce] rounded-lg p-2.5 text-xs text-[#1a1918] focus:outline-none focus:border-[#18533e]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActionType('idle')
                  setErrorMessage(null)
                }}
                className="min-h-[44px] px-4 rounded-lg text-xs font-medium text-[#6e6a62] hover:bg-[#eae7df]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`min-h-[44px] px-5 rounded-lg text-xs font-semibold text-white shadow-xs transition ${
                  actionType === 'edit'
                    ? 'bg-[#d97706] hover:bg-[#b45309]'
                    : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {actionType === 'edit' ? 'Send revision request' : 'Confirm rejection'}
              </button>
            </div>
          </form>
        )}

        {/* Main Action Buttons (Min 44px height for accessibility) */}
        {actionType === 'idle' && (
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#f2f0ea]">
            <button
              type="button"
              onClick={() => setActionType('reject')}
              className="min-h-[44px] px-5 py-2.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
            >
              Reject (feedback required)
            </button>

            <button
              type="button"
              onClick={() => setActionType('edit')}
              className="min-h-[44px] px-5 py-2.5 rounded-lg text-xs font-medium text-[#8a5314] bg-[#fef5ea] hover:bg-[#fde9d2] border border-[#fae3cd] transition cursor-pointer"
            >
              Edit / Request changes
            </button>

            <button
              type="button"
              onClick={handleApprove}
              className="min-h-[44px] px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-[#18533e] hover:bg-[#134433] shadow-sm transition cursor-pointer"
            >
              Approve &amp; open PR
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

