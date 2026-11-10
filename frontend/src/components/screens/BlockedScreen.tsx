import React, { useState } from 'react'

interface BlockedScreenProps {
  onRetryWithRepo?: (repo: string) => void
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({ onRetryWithRepo }) => {
  const [retryRepo, setRetryRepo] = useState('priya/shop-api')
  const [retryNotice, setRetryNotice] = useState<string | null>(null)

  const handleRetry = (e: React.FormEvent) => {
    e.preventDefault()
    setRetryNotice(`Re-validating guardrail rules for '${retryRepo}'...`)
    if (onRetryWithRepo) {
      onRetryWithRepo(retryRepo)
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-8 space-y-7 animate-in fade-in duration-200">
      {/* 1. Red Alert Banner with "Nothing ran" safety guarantee */}
      <section
        role="alert"
        aria-labelledby="blocked-alert-title"
        className="bg-[#fef2f2] border-2 border-[#fecaca] rounded-2xl p-6 shadow-sm space-y-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            ✕
          </div>
          <div>
            <h1 id="blocked-alert-title" className="text-base font-bold text-rose-900">
              Execution Blocked by Safety Guardrail
            </h1>
            <p className="text-xs font-semibold text-rose-800 mt-1">
              Safety Guarantee: Nothing ran. No sandbox container was created, and no commands were executed.
            </p>
          </div>
        </div>

        <div className="pt-2 pl-9">
          <p className="text-xs text-rose-700 leading-relaxed">
            <strong>Reason for block:</strong> Target repository <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">org/internal-tools</code> is not registered on the organization allowlist (<code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">ALLOWED_REPOS</code>). Autonomous execution was aborted at entry point.
          </p>
        </div>
      </section>

      {retryNotice && (
        <div className="p-3 bg-[#f0f9f4] border border-[#cbe4d7] rounded-xl text-xs text-[#18533e] font-semibold">
          {retryNotice}
        </div>
      )}

      {/* 2. Original Request Details */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <h2 className="text-sm font-semibold text-[#1a1918]">Original Request</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-[#f2f0ea]">
            <span className="text-[#8c8980]">Submitted repository:</span>
            <span className="font-mono text-rose-700 font-semibold">org/internal-tools</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#f2f0ea]">
            <span className="text-[#8c8980]">Issue URL:</span>
            <span className="font-mono text-[#302e2b]">https://github.com/org/internal-tools/issues/5</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#f2f0ea]">
            <span className="text-[#8c8980]">Policy check:</span>
            <span className="text-rose-700 font-semibold">Rejected by Guardrail Node</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#8c8980]">Timestamp:</span>
            <span className="text-[#302e2b]">10:41:02 UTC</span>
          </div>
        </div>
      </section>

      {/* 3. Retry Field */}
      <section className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#1a1918]">
            Retry with Permitted Repository
          </h2>
          <p className="text-xs text-[#8c8980] mt-0.5">
            Switch to an authorized repository on your allowlist to re-attempt execution.
          </p>
        </div>

        <form onSubmit={handleRetry} className="space-y-4">
          <div>
            <label htmlFor="retry-repo-input" className="block text-xs font-medium text-[#302e2b] mb-1.5">
              Authorized Repository Name:
            </label>
            <input
              id="retry-repo-input"
              type="text"
              required
              value={retryRepo}
              onChange={(e) => setRetryRepo(e.target.value)}
              placeholder="priya/shop-api"
              className="w-full bg-white border border-[#e5e2db] rounded-lg px-3.5 py-2.5 text-xs text-[#201e1b] focus:outline-none focus:border-[#18533e] min-h-[44px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#18533e] hover:bg-[#134433] shadow-sm transition cursor-pointer"
            >
              Retry workflow with allowed repo
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

