import React, { useState } from 'react'

interface FinishedScreenProps {
  prUrl?: string | null
  prTitle?: string
  prNumber?: number | string
  repo?: string
  onStartNewRun?: () => void
}

export const FinishedScreen: React.FC<FinishedScreenProps> = ({
  prUrl = 'https://github.com/priya/shop-api/pull/42',
  prNumber = 42,
  repo = 'priya/shop-api',
  onStartNewRun,
}) => {
  const [copied, setCopied] = useState(false)

  const cleanPrUrl = (url?: string | null): string => {
    if (!url) return '#'
    let cleaned = url.trim()
    while (
      cleaned.startsWith('https://github.com/https://github.com/') ||
      cleaned.startsWith('https://github.com/http://github.com/') ||
      cleaned.startsWith('http://github.com/https://github.com/')
    ) {
      cleaned = cleaned.replace(/^https?:\/\/github\.com\//i, '')
    }
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `https://github.com/${cleaned.replace(/^\/+/, '')}`
    }
    return cleaned
  }

  const finalUrl = cleanPrUrl(prUrl)
  const matchedNumber = finalUrl.match(/pull\/(\d+)/)?.[1]
  const displayPrNumber = matchedNumber || prNumber

  const prBody = `## Summary of Changes
- Fixes #60: Session tokens now strictly invalidate after \`SESSION_MAX_AGE_SECONDS\` (default: 3600s).
- Added token creation timestamp validation in \`verify_session_token()\`.
- Added automated regression unit tests covering expired token replay attempts.

## Verification & Sandbox Results
- Sandbox ID: \`sbx_8f21\` (E2B isolated environment)
- Test Suite: 26 passed in 3.1s (\`pytest tests/test_session.py\`)
- Test Coverage: +1.8% delta (94.2% total auth coverage)
- Security Scan: Clean (0 CVEs, 0 secrets leaked)
- Reviewer Confidence: 92% (Risk score: 0.30 - Low Risk)

## Files Changed
- \`src/auth/session.py\` (+18 lines, -4 lines)
- \`tests/test_session.py\` (+32 lines, 0 lines)`

  const handleCopy = () => {
    navigator.clipboard.writeText(prBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Compact Top Horizontal Celebration Card with Metric Badges */}
      <section
        aria-labelledby="pr-success-heading"
        className="bg-[#fff4da] border-2 border-[#18181b] rounded-xl p-3.5 shadow-[3px_3px_0px_#18181b] flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[#d31611] text-white flex items-center justify-center font-black text-sm shrink-0 border border-[#18181b]">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="pr-success-heading" className="text-base sm:text-lg font-extrabold text-[#18181b] font-geist">
                Pull Request #{displayPrNumber} Published
              </h1>
              <span className="badge-warm text-[10px]">Status: Done</span>
            </div>
            <p className="text-[11px] text-[#666666] font-medium">
              Target: <span className="font-bold text-[#18181b]">{repo.replace(/^https?:\/\/github\.com\//i, '')}</span> &larr; merged from verified sandbox patch
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-white border border-[#18181b] text-[11px] font-bold">
            ✓ 26/26 Tests
          </span>
          <span className="px-2 py-1 rounded bg-white border border-[#18181b] text-[11px] font-bold">
            +1.8% Cov
          </span>
          <span className="px-2 py-1 rounded bg-white border border-[#18181b] text-[11px] font-bold">
            0.30 Low Risk
          </span>
          <a
            href={finalUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-cta text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 font-bold"
          >
            <span>View on GitHub</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* LEFT COLUMN: Pull Request Description Preview (7 cols) */}
        <section className="lg:col-span-7 card-canvas-elevated p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#18181b] font-geist">
                Pull Request Body Markdown
              </span>
              <span className="badge-warm text-[10px]">Ready for Review</span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="btn-outline-dark text-xs py-1 px-2.5 flex items-center gap-1"
            >
              {copied ? '✓ Copied' : 'Copy markdown'}
            </button>
          </div>

          <div className="flex-1 mt-2.5 bg-[#18181b] rounded-lg p-3.5 font-mono text-xs overflow-y-auto text-slate-300 leading-relaxed border-2 border-[#18181b] select-text">
            <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-200">
              {prBody}
            </pre>
          </div>
        </section>

        {/* RIGHT COLUMN: Pipeline Audit & Sandbox Cleanup (5 cols) */}
        <section className="lg:col-span-5 card-canvas-elevated p-4 flex flex-col h-[520px] justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#e5e5e5]">
              <span className="text-xs font-extrabold text-[#18181b] font-geist">
                Multi-Agent Pipeline Audit
              </span>
              <span className="text-[10px] font-bold text-[#666666]">
                Total: 72s
              </span>
            </div>

            <div className="space-y-2 mt-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-white border border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#18181b] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span className="font-bold text-[#18181b]">1. Guardrail</span>
                </div>
                <span className="text-[11px] text-[#666666]">Passed (0.8s)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-white border border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#18181b] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span className="font-bold text-[#18181b]">2. Supervisor &amp; Research</span>
                </div>
                <span className="text-[11px] text-[#666666]">Fan-out complete (4.2s)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-white border border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#18181b] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span className="font-bold text-[#18181b]">3. Sandbox &amp; Verification</span>
                </div>
                <span className="text-[11px] text-[#666666]">Attempt 2 passed (31.4s)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-white border border-[#e5e5e5]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#18181b] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span className="font-bold text-[#18181b]">4. HITL Approval Sign-Off</span>
                </div>
                <span className="text-[11px] text-[#666666]">Approved by engineer (18.2s)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#fff4da] border-2 border-[#18181b] shadow-[1px_1px_0px_#18181b]">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#d31611] text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                  <span className="font-bold text-[#18181b]">5. PR Published</span>
                </div>
                <span className="text-[11px] font-bold text-[#d31611]">PR #{displayPrNumber}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e5e5e5] space-y-2">
            <div className="p-2.5 rounded bg-[#fffdf8] border border-[#18181b] text-[11px] flex items-center justify-between">
              <span className="font-medium text-[#18181b]">Firecracker MicroVM</span>
              <span className="text-[#4ade80] font-bold font-mono">Cleaned up &amp; terminated</span>
            </div>

            {onStartNewRun && (
              <button
                type="button"
                onClick={onStartNewRun}
                className="w-full btn-outline-dark py-2 text-xs font-bold text-center block"
              >
                Launch another run &rarr;
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
