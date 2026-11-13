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
  prTitle = 'fix(auth): enforce session token expiration and refresh verification',
  prNumber = 42,
  repo = 'priya/shop-api',
  onStartNewRun,
}) => {
  const [copied, setCopied] = useState(false)

  // Clean URL to prevent duplicate https://github.com/ prefixes
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
    <div className="max-w-3xl w-full mx-auto px-6 py-8 space-y-7 animate-in fade-in duration-200">
      {/* 1. PR Link Card / Success Header */}
      <section
        aria-labelledby="pr-success-heading"
        className="bg-[#f0f9f4] border-2 border-[#cbe4d7] rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#18533e] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-xs">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e1f4ec] text-[#136340]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#136340]"></span>
                  Status: Done · Completed
                </span>
                <span className="text-xs text-[#52504a]">Branch: <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-[#cbe4d7]">agent/fix-session-expiration</code></span>
              </div>
              <h1 id="pr-success-heading" className="text-lg font-bold text-[#1a1918] mt-1.5">
                Pull Request #{displayPrNumber} Published
              </h1>
              <p className="text-xs text-[#52504a] mt-0.5">
                Target: <span className="font-medium text-[#1a1918]">{repo.replace(/^https?:\/\/github\.com\//i, '')}</span> &larr; merged from verified sandbox patch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={finalUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] px-5 bg-[#18533e] text-white rounded-xl text-xs font-semibold hover:bg-[#124231] transition flex items-center justify-center gap-2 shadow-xs"
            >
              <span>View on GitHub</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Stat Tiles */}
      <section aria-label="Run Metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-medium text-[#8c8980] uppercase tracking-wider">Duration</p>
          <p className="text-xl font-bold text-[#1a1918] mt-1">1m 24s</p>
          <p className="text-[11px] text-[#136340] font-medium mt-0.5">Total pipeline time</p>
        </div>

        <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-medium text-[#8c8980] uppercase tracking-wider">Sandbox attempts</p>
          <p className="text-xl font-bold text-[#1a1918] mt-1">2 / 3</p>
          <p className="text-[11px] text-[#52504a] mt-0.5">Resolved in attempt 2</p>
        </div>

        <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-medium text-[#8c8980] uppercase tracking-wider">Test Suite</p>
          <p className="text-xl font-bold text-[#1a1918] mt-1">26 / 26</p>
          <p className="text-[11px] text-[#136340] font-medium mt-0.5">100% passed (+2 new)</p>
        </div>

        <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] font-medium text-[#8c8980] uppercase tracking-wider">Risk Score</p>
          <p className="text-xl font-bold text-[#136340] mt-1">0.30</p>
          <p className="text-[11px] text-[#136340] font-medium mt-0.5">Status: Low Risk · Approved</p>
        </div>
      </section>

      {/* 3. Pipeline Recap */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1a1918]">Pipeline Recap</h2>
          <span className="text-xs text-[#8c8980]">7 of 7 stages completed</span>
        </div>

        <ol className="divide-y divide-[#f2f0ea] text-xs">
          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">1. Guardrail safety validation</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f4ef] text-[#716e66] border border-[#e8e6df]">
                Background
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">0.8s</span>
              <span className="font-semibold text-[#136340]">Status: Done</span>
            </div>
          </li>

          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">2. Codebase research & root cause analysis</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f4ef] text-[#716e66] border border-[#e8e6df]">
                Background
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">14.2s</span>
              <span className="font-semibold text-[#136340]">Status: Done</span>
            </div>
          </li>

          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">3. Sandbox execution (attempt 2 of 3)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">32.1s</span>
              <span className="font-semibold text-[#136340]">Status: Done</span>
            </div>
          </li>

          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">4. Verification & security scan</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">18.4s</span>
              <span className="font-semibold text-[#136340]">Status: Done</span>
            </div>
          </li>

          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">5. PR quality review & risk scoring</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">8.9s</span>
              <span className="font-semibold text-[#136340]">Status: Done</span>
            </div>
          </li>

          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">6. Human approval gate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">Manual</span>
              <span className="font-semibold text-[#136340]">Status: Done · Approved</span>
            </div>
          </li>

          <li className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#e1f4ec] text-[#136340] flex items-center justify-center font-bold text-[10px]">
                ✓
              </span>
              <span className="font-medium text-[#1a1918]">7. PR agent creation & branch push</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#8c8980]">9.6s</span>
              <span className="font-semibold text-[#136340]">Status: Done</span>
            </div>
          </li>
        </ol>
      </section>

      {/* 4. PR Description Preview */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#1a1918]">Pull Request Description Preview</h2>
            <p className="text-xs text-[#8c8980] mt-0.5">{prTitle}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[44px] px-3 rounded-lg border border-[#e2dfd7] bg-[#fdfcf9] hover:bg-[#f0ede6] text-xs font-semibold text-[#18533e] transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? '✓ Copied' : 'Copy markdown'}
          </button>
        </div>

        <div className="bg-[#fcfbf9] border border-[#ece9e2] rounded-xl p-4 text-xs font-mono text-[#383633] whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {prBody}
        </div>
      </section>

      {/* 5. Next Steps / Actions */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-[#8c8980]">
          Cleaned up sandbox environment <code className="font-mono bg-white px-1 py-0.5 rounded border border-[#e8e6df]">sbx_8f21</code>. No active lingering containers.
        </span>

        {onStartNewRun && (
          <button
            type="button"
            onClick={onStartNewRun}
            className="min-h-[44px] px-5 bg-[#18533e] text-white rounded-xl text-xs font-semibold hover:bg-[#124231] transition cursor-pointer"
          >
            Start another run
          </button>
        )}
      </div>
    </div>
  )
}

