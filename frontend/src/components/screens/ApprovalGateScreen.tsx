import React, { useState } from 'react'
import {
  CheckCircle2,
  FileCode2,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react'
import type { TerminologyMode } from '../../types'
import { formatDualTerm } from '../../utils/terminology'

interface ApprovalGateScreenProps {
  onApprove?: () => void
  onRequestChanges?: (feedback: string) => void
  onReject?: (reason: string) => void
  terminologyMode?: TerminologyMode
  repo?: string
  issueTitle?: string
}

export const ApprovalGateScreen: React.FC<ApprovalGateScreenProps> = ({
  onApprove,
  onRequestChanges,
  onReject,
  terminologyMode = 'both',
  repo = 'priya/shop-api',
  issueTitle = 'Support Ed25519 asymmetric signatures for client JWTs',
}) => {
  const [diffViewMode, setDiffViewMode] = useState<'unified' | 'split'>('unified')
  const [showSandboxEditor, setShowSandboxEditor] = useState<boolean>(false)
  const [actionType, setActionType] = useState<'idle' | 'edit' | 'reject'>('idle')
  const [feedback, setFeedback] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null)

  // Dual-vocabulary labels
  const { primary: signOffTitle, secondary: signOffTech } = formatDualTerm(
    'Human Sign-Off',
    'hitl',
    terminologyMode
  )
  const { primary: teamLeadTitle, secondary: teamLeadTech } = formatDualTerm(
    'Planning',
    'supervisor',
    terminologyMode
  )
  const { primary: riskInspectorTitle, secondary: riskInspectorTech } = formatDualTerm(
    'Risk Review',
    'reviewer',
    terminologyMode
  )

  const handleApprove = () => {
    setSubmittedStatus(
      'Approved! Dispatching PR creation to open upstream GitHub Pull Request #61...'
    )
    if (onApprove) onApprove()
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) {
      setErrorMessage('Please enter directives explaining the requested changes.')
      return
    }
    setSubmittedStatus(
      `Directives sent to ${teamLeadTitle} (${teamLeadTech})! Re-planning autonomous patch loop...`
    )
    if (onRequestChanges) onRequestChanges(feedback)
  }

  const handleSubmitReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedback.trim()) {
      setErrorMessage('Feedback is required to document why the patch was rejected.')
      return
    }
    setSubmittedStatus('Execution terminated. Isolated sandbox environment purged.')
    if (onReject) onReject(feedback)
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* 1. Emergency Intercept Alert Banner */}
      <section
        role="alert"
        aria-label="Human sign-off required alert"
        className="bg-[#fef3c7] border-2 border-[#d97706] rounded-xl p-3.5 text-[#18181b] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[3px_3px_0px_#d97706]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d97706] text-white flex items-center justify-center font-black text-sm shrink-0 border border-[#18181b]">
            !
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-[#18181b] font-geist">
                {signOffTitle} {signOffTech ? `(${signOffTech})` : ''} Required · Emergency Gate Triggered
              </h1>
              <span className="badge-red text-[10px]">
                Risk Score: 0.85 &gt; 0.70 Ceil
              </span>
            </div>
            <p className="text-xs text-[#92400e] font-medium mt-0.5">
              {riskInspectorTitle} ({riskInspectorTech}) intercepted modifications for <strong>{issueTitle}</strong> in module{' '}
              <code className="bg-white px-1 py-0.5 rounded font-mono font-bold text-[#18181b]">
                src/auth/jwt_manager.py
              </code>
              . Pausing for human authorization.
            </p>
          </div>
        </div>
      </section>

      {submittedStatus && (
        <div className="p-3 bg-[#ccfbf1] border-2 border-[#0d9488] rounded-lg text-xs font-bold text-[#0f766e] shadow-[2px_2px_0px_#0d9488]">
          {submittedStatus}
        </div>
      )}

      {/* 2. Main 2-Column Review Workspace (7 cols Code Review + 5 cols Dossier & Action Dock) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT COLUMN: Code Review Split & Sandbox Terminal (7 cols) */}
        <section className="lg:col-span-7 card-canvas-elevated p-4 flex flex-col h-[540px]">
          {/* Header with Unified/Split View Toggle & Edit in Sandbox Button */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#0d9488]" />
              <span className="text-xs font-extrabold text-[#18181b] font-geist truncate">
                Candidate Patch · {repo} · src/auth/jwt_manager.py
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Unified / Split Toggle */}
              <div className="flex items-center bg-[#fffdf8] border border-[#18181b] rounded text-[10px] font-bold overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDiffViewMode('unified')}
                  className={`px-2 py-0.5 ${
                    diffViewMode === 'unified'
                      ? 'bg-[#18181b] text-white'
                      : 'text-[#666666] hover:text-[#18181b]'
                  }`}
                >
                  Unified
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode('split')}
                  className={`px-2 py-0.5 ${
                    diffViewMode === 'split'
                      ? 'bg-[#18181b] text-white'
                      : 'text-[#666666] hover:text-[#18181b]'
                  }`}
                >
                  Split
                </button>
              </div>

              {/* Edit in Sandbox CTA */}
              <button
                type="button"
                onClick={() => setShowSandboxEditor(!showSandboxEditor)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff4da] text-[#18181b] border border-[#18181b] flex items-center gap-1 shadow-xs hover:bg-[#ebdbb7] transition"
              >
                <Terminal className="w-3 h-3 text-[#0d9488]" />
                <span>{showSandboxEditor ? 'View Diff' : 'Edit in Sandbox'}</span>
              </button>
            </div>
          </div>

          {/* Subheader info */}
          <div className="h-7 flex items-center justify-between text-[11px] text-[#666666] font-mono shrink-0">
            <span>RFC 8037 Ed25519 asymmetric verification</span>
            <span className="text-[#0d9488] font-bold">+18 lines / -4 lines</span>
          </div>

          {/* Code Viewer Container */}
          {showSandboxEditor ? (
            <div className="flex-1 min-h-0 mt-1 bg-[#18181b] rounded-lg p-3 font-mono text-xs overflow-y-auto text-slate-200 border-2 border-[#18181b] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
                <span>Interactive Sandbox Shell · tty0</span>
                <span className="text-[#0d9488] font-bold">● Active Sandbox</span>
              </div>
              <div className="space-y-1 text-slate-300">
                <div className="text-slate-500">
                  # You can inspect or test changes directly in the container:
                </div>
                <div>
                  <span className="text-[#0d9488] font-bold">$ </span>
                  <span>pytest tests/test_jwt.py -k test_ed25519_signature</span>
                </div>
                <div className="text-[#4ade80] text-[11px]">
                  tests/test_jwt.py::test_ed25519_signature PASSED [100%]
                </div>
                <div className="text-slate-500 pt-2">
                  # Sandbox modifications automatically sync with the review patch.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 mt-1 bg-[#18181b] rounded-lg p-3 font-mono text-xs overflow-y-auto text-slate-300 border-2 border-[#18181b] space-y-1">
              <div className="text-slate-500 text-[10px] pb-1">
                # Candidate Patch: RFC 8037 Ed25519 Signature Verification
              </div>
              <div className="text-[#60a5fa] text-[11px]">--- a/src/auth/jwt_manager.py</div>
              <div className="text-[#60a5fa] text-[11px]">+++ b/src/auth/jwt_manager.py</div>
              <div className="text-slate-500 text-[11px]">@@ -54,8 +54,14 @@ def verify_jwt_signature(token: str, key):</div>
              <div className="text-slate-400">     header = jwt.get_unverified_header(token)</div>
              
              {/* Inline Line Annotation */}
              <div className="p-1.5 rounded bg-[#0d9488]/20 border border-[#0d9488] text-[11px] my-1 text-teal-200 font-sans">
                <span className="font-bold text-white">Line 56 Annotation: </span>
                Validates 'EdDSA' algorithm &amp; resolves Ed25519 public key from JWKS payload.
              </div>

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
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Verification Dossier & Human Action Dock (5 cols) */}
        <section className="lg:col-span-5 card-canvas-elevated p-4 flex flex-col justify-between h-[540px]">
          <div>
            {/* Header */}
            <div className="h-10 flex items-center justify-between pb-2 border-b-2 border-[#18181b] shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
                <h2 className="text-xs font-extrabold text-[#18181b] font-geist">
                  Verification Dossier
                </h2>
              </div>
              <span className="badge-teal text-[10px]">Verified Clean</span>
            </div>

            {/* Dossier Items */}
            <div className="space-y-2.5 mt-2.5 text-xs">
              <div className="p-2 rounded-md bg-[#fffdf8] border border-[#e5e5e5] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#18181b]">1. Test Suite (pytest)</span>
                  <span className="text-[#0d9488] font-bold">26 / 26 Passed</span>
                </div>
                <p className="text-[10px] text-[#666666]">
                  24 existing unit tests + 2 new regression tests passed in 3.1s.
                </p>
              </div>

              <div className="p-2 rounded-md bg-[#fffdf8] border border-[#e5e5e5] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#18181b]">2. SAST Security Scan</span>
                  <span className="text-[#0d9488] font-bold">0 CVEs · Clean</span>
                </div>
                <p className="text-[10px] text-[#666666]">
                  Semgrep &amp; Bandit checked: no secret leakage or buffer vulnerabilities.
                </p>
              </div>

              <div className="p-2 rounded-md bg-[#fffdf8] border border-[#e5e5e5] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#18181b]">3. Sandbox Isolation</span>
                  <span className="text-[#0d9488] font-bold">Sealed</span>
                </div>
                <p className="text-[10px] text-[#666666]">
                  Ephemeral isolated container with read-only filesystem; zero leaked credentials.
                </p>
              </div>

              <div className="p-2 rounded-md bg-[#fff4da] border border-[#18181b] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#d31611]">4. Risk Evaluation</span>
                  <span className="badge-amber text-[10px]">0.85 High Risk</span>
                </div>
                <p className="text-[10px] text-[#18181b] font-medium">
                  Touches auth crypto; exceeds 0.70 threshold. Requires sign-off below.
                </p>
              </div>
            </div>
          </div>

          {/* HUMAN ACTION DOCK (BOTTOM PANEL) */}
          <div className="pt-2 border-t-2 border-[#18181b] space-y-2">
            {errorMessage && (
              <div className="p-2 bg-[#fee2e2] border border-[#dc2626] rounded text-xs text-[#991b1b] font-bold">
                {errorMessage}
              </div>
            )}

            {actionType === 'edit' ? (
              <form onSubmit={handleSubmitEdit} className="space-y-2 animate-in fade-in">
                <label className="block text-[11px] font-bold text-[#18181b]">
                  Sent to {teamLeadTitle} ({teamLeadTech}):
                </label>
                <textarea
                  required
                  rows={2}
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder="Explain requested changes for supervisor re-planning..."
                  className="w-full bg-white border border-[#18181b] rounded p-2 text-xs text-[#18181b] focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('idle')}
                    className="btn-outline-dark text-xs py-1 px-2.5"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-cta text-xs py-1 px-3">
                    Send to {teamLeadTitle} &rarr;
                  </button>
                </div>
              </form>
            ) : actionType === 'reject' ? (
              <form onSubmit={handleSubmitReject} className="space-y-2 animate-in fade-in">
                <label className="block text-[11px] font-bold text-[#d31611]">
                  Rejection Reason (Purges Sandbox):
                </label>
                <textarea
                  required
                  rows={2}
                  value={feedback}
                  onChange={(e) => {
                    setFeedback(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder="Explain why this run is rejected..."
                  className="w-full bg-white border border-[#dc2626] rounded p-2 text-xs text-[#18181b] focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('idle')}
                    className="btn-outline-dark text-xs py-1 px-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#dc2626] text-white border-2 border-[#18181b] rounded-md text-xs py-1 px-3 font-bold"
                  >
                    Confirm Purge
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {/* Primary Button: Approve and Open PR #61 */}
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full btn-cta py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve and Open PR #61 &rarr;</span>
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('edit')}
                    className="btn-warm text-xs py-1.5 text-center flex items-center justify-center gap-1 cursor-pointer"
                    title="Routes feedback back to supervisor for re-planning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('reject')}
                    className="btn-outline-dark text-xs py-1.5 text-[#d31611] text-center flex items-center justify-center gap-1 cursor-pointer"
                    title="Shuts down execution and instantly purges sandbox"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reject &amp; Purge</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
