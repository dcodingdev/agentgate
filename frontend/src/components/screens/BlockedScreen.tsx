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
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* 1. Red Alert Banner with "Nothing ran" safety guarantee */}
      <section
        role="alert"
        aria-labelledby="blocked-alert-title"
        className="bg-[#fffdf8] border-2 border-[#d31611] rounded-xl p-4 shadow-[3px_3px_0px_#d31611] space-y-2"
      >
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-md bg-[#d31611] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-[#18181b]">
            ✕
          </div>
          <div>
            <h1 id="blocked-alert-title" className="text-base sm:text-lg font-extrabold text-[#d31611] font-geist">
              Execution Blocked by Safety Guardrail
            </h1>
            <p className="text-xs font-bold text-[#18181b]">
              Safety Guarantee: Zero commands executed. No sandbox container was spun up.
            </p>
          </div>
        </div>

        <div className="pt-1 pl-10">
          <p className="text-xs text-[#666666] leading-relaxed font-medium">
            <strong>Reason for block:</strong> Target repository <code className="bg-[#fff4da] border border-[#18181b] px-1 py-0.5 rounded font-mono text-[11px] text-[#18181b]">org/internal-tools</code> is not registered on the organization allowlist (<code className="bg-[#fff4da] border border-[#18181b] px-1 py-0.5 rounded font-mono text-[11px] text-[#18181b]">ALLOWED_REPOS</code>).
          </p>
        </div>
      </section>

      {retryNotice && (
        <div className="p-3 bg-[#ebdbb7] border-2 border-[#18181b] rounded-lg text-xs text-[#18181b] font-bold shadow-[2px_2px_0px_#18181b]">
          {retryNotice}
        </div>
      )}

      {/* Main 2-Column Horizontal Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT COLUMN: Original Request Audit Details (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <section className="card-canvas-elevated p-4 space-y-3">
            <h2 className="text-sm font-extrabold text-[#18181b] font-geist pb-2 border-b border-[#e5e5e5]">
              Original Request Audit Details
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                <span className="text-[#666666] font-medium">Submitted repository:</span>
                <span className="font-mono text-[#d31611] font-bold">org/internal-tools</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                <span className="text-[#666666] font-medium">Issue URL:</span>
                <span className="font-mono text-[#18181b]">https://github.com/org/internal-tools/issues/5</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                <span className="text-[#666666] font-medium">Policy check outcome:</span>
                <span className="badge-accent">Rejected by Guardrail Code Invariant</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#e5e5e5]">
                <span className="text-[#666666] font-medium">Sandbox container created:</span>
                <span className="font-bold text-[#18181b]">None (Aborted before spawn)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#666666] font-medium">Timestamp:</span>
                <span className="text-[#18181b] font-mono">10:41:02 UTC</span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Retry with Permitted Repository (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <section className="card-canvas-elevated p-6 space-y-4">
            <div className="border-b-2 border-[#18181b] pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#d31611]">
                Recovery Action
              </span>
              <h2 className="text-base font-extrabold text-[#18181b] font-geist mt-0.5">
                Retry with Authorized Repository
              </h2>
              <p className="text-xs text-[#666666] mt-0.5 font-medium">
                Switch to an authorized repository on your allowlist to re-attempt execution.
              </p>
            </div>

            <form onSubmit={handleRetry} className="space-y-4">
              <div>
                <label htmlFor="retry-repo-input" className="block text-xs font-bold text-[#18181b] mb-1.5">
                  Authorized Repository Name:
                </label>
                <input
                  id="retry-repo-input"
                  type="text"
                  required
                  value={retryRepo}
                  onChange={(e) => setRetryRepo(e.target.value)}
                  placeholder="priya/shop-api"
                  className="w-full bg-white border-2 border-[#18181b] rounded-md px-3.5 py-2.5 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611] min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">Allowed Repositories:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge-warm cursor-pointer" onClick={() => setRetryRepo('priya/shop-api')}>
                    priya/shop-api
                  </span>
                  <span className="badge-warm cursor-pointer" onClick={() => setRetryRepo('priya/blog')}>
                    priya/blog
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-cta py-3 text-xs text-center block"
              >
                Retry workflow with allowed repo &rarr;
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
