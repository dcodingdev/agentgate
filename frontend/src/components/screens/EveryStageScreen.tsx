import React from 'react'

export const EveryStageScreen: React.FC = () => {
  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-medium text-[#1a1918]">All Pipeline Stages</h1>
        <p className="text-xs text-[#706c64] mt-0.5">
          Background agents in the left column operate autonomously; foreground stages report live state on the right.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* LEFT COLUMN: Background Agents (Tag: Background) */}
        <aside
          aria-label="Background agents"
          className="w-full lg:w-72 shrink-0 space-y-4 select-none"
        >
          <div>
            <h2 className="text-sm font-semibold text-[#1a1918]">Background agents</h2>
            <p className="text-xs text-[#8c8980] mt-0.5">
              These run on their own and need nothing from you.
            </p>
          </div>

          <div className="space-y-3">
            {/* Guardrail Card */}
            <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Guardrail</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0fb] text-[#4c529e]">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#1b6348] font-medium flex items-center justify-between">
                <span>Status: Done</span>
                <span className="text-[#8c8980] font-normal">passed in 0.8s</span>
              </div>
            </div>

            {/* Supervisor Card */}
            <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Supervisor</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0fb] text-[#4c529e]">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#136340] font-medium flex items-center justify-between">
                <span>Status: Watching</span>
                <span className="text-[#8c8980] font-normal">re-plans on failure</span>
              </div>
            </div>

            {/* Codebase Research Card */}
            <div className="bg-white border border-[#e8e6df] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1a1918]">Codebase research</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#eef0fb] text-[#4c529e]">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#1b6348] font-medium flex items-center justify-between">
                <span>Status: Done</span>
                <span className="text-[#8c8980] font-normal">found auth/session.py</span>
              </div>
            </div>
          </div>

          {/* Token usage footer */}
          <div className="pt-2 text-xs text-[#8c8980] flex items-center gap-1.5">
            <span>11.2k tokens</span>
            <span>·</span>
            <span>$0.03</span>
            <span>·</span>
            <span className="text-[#55524c] underline cursor-pointer">View trace</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Four Foreground Panels */}
        <main className="flex-1 w-full space-y-5">
          {/* Foreground Panel 1: Sandbox */}
          <section
            aria-labelledby="sandbox-stage-title"
            className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 id="sandbox-stage-title" className="text-xs font-semibold text-[#1a1918]">
                Sandbox · E2B sbx_8f21
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0f9f4] text-[#136340] border border-[#d6ede0]">
                Status: Done · attempt 2 of 3
              </span>
            </div>

            {/* Dark terminal box matching Image 2 */}
            <div className="bg-[#18191c] text-slate-100 rounded-xl p-4 font-mono text-xs leading-relaxed space-y-1 select-text">
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
          </section>

          {/* Foreground Panel 2: Verify and security (Running stage with teal border) */}
          <section
            aria-labelledby="verify-stage-title"
            className="bg-white border-2 border-[#18533e] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 id="verify-stage-title" className="text-xs font-semibold text-[#1a1918]">
                Verify and security
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e1f4ec] text-[#136340]">
                Status: Running
              </span>
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between py-1 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Baseline comparison</span>
                <span className="text-[#1b6348] font-medium">Status: Done · no new failures</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Coverage</span>
                <span className="text-[#1b6348] font-medium">Status: Done · +1.8%</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Lint</span>
                <span className="text-[#1b6348] font-medium">Status: Done · clean</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#f7f5ef]">
                <span className="text-[#4a4740]">Security scan</span>
                <span className="text-[#0d9488] font-semibold animate-pulse">
                  Status: Running ...
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#4a4740]">Risk score</span>
                <span className="text-[#8c8980]">Status: Waiting</span>
              </div>
            </div>
          </section>

          {/* Foreground Panel 3: Reviewer */}
          <section
            aria-labelledby="reviewer-stage-title"
            className="bg-white border border-[#e8e6df] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 id="reviewer-stage-title" className="text-xs font-semibold text-[#1a1918]">
                PR quality reviewer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f2f0ea] text-[#6b675e]">
                Status: Waiting
              </span>
            </div>
            <p className="text-xs text-[#8c8980]">
              Starts when Verify finishes. Shows confidence, risk level, and its critique of the diff.
            </p>
          </section>

          {/* Foreground Panel 4: Human approval (Waiting panel) */}
          <section
            aria-labelledby="approval-waiting-title"
            className="bg-white border border-dashed border-[#d8d4ca] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <h2 id="approval-waiting-title" className="text-xs font-semibold text-[#1a1918]">
                Human approval
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f2f0ea] text-[#6b675e]">
                Status: Waiting
              </span>
            </div>
            <p className="text-xs text-[#8c8980] leading-relaxed">
              Opens only if risk is high or confidence is low. Otherwise the PR agent runs directly.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

