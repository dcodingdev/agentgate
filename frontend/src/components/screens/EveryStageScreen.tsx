import React from 'react'

export const EveryStageScreen: React.FC = () => {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist leading-tight">
            All Pipeline Stages
          </h1>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">
            Background orchestration logged on the left; active foreground verification and human gates on the right.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-warm text-[11px]">LangGraph Checkpoint State</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* LEFT COLUMN: Background Orchestration Logs (4 cols) */}
        <aside
          aria-label="Background orchestration logs"
          className="lg:col-span-4 card-canvas-elevated p-4 flex flex-col h-[560px]"
        >
          {/* Fixed-height Header */}
          <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
            <div>
              <h2 className="text-xs font-extrabold text-[#18181b] font-geist">
                Background Logs
              </h2>
            </div>
            <span className="badge-warm text-[10px]">Autonomous</span>
          </div>

          <div className="h-8 flex items-center justify-between text-[11px] text-[#666666] font-mono shrink-0">
            <span>guardrail · supervisor · research</span>
            <span>Trace Stream</span>
          </div>

          {/* Dark Logs Inner Container (flex-1 min-h-0 stretching to bottom) */}
          <div className="flex-1 min-h-0 bg-[#18181b] text-slate-300 rounded-lg p-3.5 font-mono text-xs overflow-y-auto border-2 border-[#18181b] space-y-3">
            {/* Guardrail Log Entry */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#60a5fa] font-bold">[guardrail]</span>
                <span className="text-slate-500">0.8s · Done</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Repository allowlist verified (<code className="text-slate-100">priya/shop-api</code>). Prompt injection scan clean.
              </p>
            </div>

            {/* Supervisor Log Entry */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#a78bfa] font-bold">[supervisor]</span>
                <span className="text-slate-500">1.2s · Active</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Evaluated issue #60. Decided parallel research route via LangGraph Send with max 3 retry attempts.
              </p>
            </div>

            {/* Parallel Research Log Entry */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#38bdf8] font-bold">[research]</span>
                <span className="text-slate-500">3.4s · Done</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Fan-out complete: analyzed session.py, located token expiration handler, aggregated docs.
              </p>
            </div>

            {/* PR Publisher Log Entry */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#fb923c] font-bold">[pr_agent]</span>
                <span className="text-slate-500">Waiting for HITL</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Branch prepared: <code className="text-slate-200">agent/fix-session-expiration</code>. Awaits engineer sign-off before git push.
              </p>
            </div>
          </div>

          {/* Token usage footer */}
          <div className="mt-3 bg-[#fff4da] border-2 border-[#18181b] rounded-lg p-2.5 text-xs text-[#18181b] font-mono flex items-center justify-between shadow-[2px_2px_0px_#18181b] shrink-0">
            <span className="font-bold">11.2k tokens · $0.03</span>
            <span className="text-[#d31611] font-bold">Trace #tr_821a</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Foreground Verification & Human Panels (8 cols) */}
        <main className="lg:col-span-8 flex flex-col h-[560px] justify-between">
          {/* Foreground Stage 1: Sandbox Execution */}
          <section
            aria-labelledby="sandbox-stage-title"
            className="h-[150px] card-canvas-elevated p-3.5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e5e5]">
              <h2 id="sandbox-stage-title" className="text-xs font-extrabold text-[#18181b] font-geist">
                1. Sandbox Execution · sbx_8f21
              </h2>
              <span className="badge-warm text-[10px]">
                Status: Attempt 2/3 Active
              </span>
            </div>

            {/* Dark terminal snippet */}
            <div className="bg-[#18181b] text-slate-100 rounded-lg p-2.5 font-mono text-xs leading-relaxed space-y-1 select-text border-2 border-[#18181b]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-[#d31611] font-bold">$</span>
                <span>git apply patch_v2.diff &amp;&amp; pytest -q</span>
              </div>
              <div className="text-[#4ade80] flex items-center gap-2 font-bold text-[11px]">
                <span>✓ 26 passed in 3.1s</span>
                <span className="text-slate-400 font-normal">
                  (24 baseline + 2 regression)
                </span>
              </div>
            </div>
          </section>

          {/* Foreground Stages 2 & 3: Two side-by-side cards with EXACT SAME HEIGHT (h-[225px]) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Side-by-Side Card A: Verify & Security */}
            <section
              aria-labelledby="verify-stage-title"
              className="h-[225px] card-canvas-elevated p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e5e5]">
                <h2 id="verify-stage-title" className="text-xs font-extrabold text-[#18181b] font-geist">
                  2. Verify &amp; Security Scan
                </h2>
                <span className="badge-accent text-[10px]">
                  Running
                </span>
              </div>

              <div className="space-y-1.5 text-xs py-1">
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#666666]">Baseline unit tests:</span>
                  <span className="font-bold text-[#18181b]">24/24 Clean</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#666666]">Regression test suite:</span>
                  <span className="font-bold text-[#18181b]">2/2 Added</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#666666]">Coverage delta:</span>
                  <span className="font-bold text-[#4ade80]">+1.8% lines</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#666666]">SAST Security Scanner:</span>
                  <span className="font-bold text-[#18181b]">0 CVEs detected</span>
                </div>
              </div>

              <div className="p-2 bg-[#fffdf8] border border-[#18181b] rounded text-[11px] font-mono text-[#18181b] flex items-center justify-between">
                <span>Code scan status:</span>
                <span className="text-[#4ade80] font-bold">PASSED</span>
              </div>
            </section>

            {/* Side-by-Side Card B: PR Quality Reviewer (EXACT SAME HEIGHT: h-[225px]) */}
            <section
              aria-labelledby="reviewer-stage-title"
              className="h-[225px] card-canvas-elevated p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e5e5]">
                <h2 id="reviewer-stage-title" className="text-xs font-extrabold text-[#18181b] font-geist">
                  3. PR Quality Reviewer
                </h2>
                <span className="badge-warm text-[10px]">
                  Risk Check
                </span>
              </div>

              <div className="space-y-1.5 text-xs py-1">
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#666666]">Sensitive path:</span>
                  <span className="font-mono font-bold text-[#18181b]">src/auth/session.py</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#666666]">Diff volume:</span>
                  <span className="font-mono font-bold text-[#18181b]">+4 lines / 0 del</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#666666]">Threshold rule:</span>
                  <span className="font-bold text-[#18181b]">Risk &ge; 0.70 &rarr; HITL</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#666666]">Computed risk score:</span>
                  <span className="font-bold text-[#d31611]">0.85 (High Risk)</span>
                </div>
              </div>

              <div className="p-2 bg-[#fff4da] border border-[#18181b] rounded text-[11px] font-mono text-[#d31611] font-bold flex items-center justify-between">
                <span>Mandatory Gate:</span>
                <span>Engineer Approval</span>
              </div>
            </section>
          </div>

          {/* Foreground Stage 4: Human Approval Gate */}
          <section
            aria-labelledby="approval-waiting-title"
            className="h-[140px] bg-[#fffdf8] border-2 border-dashed border-[#18181b] rounded-xl p-3.5 flex flex-col justify-between shadow-[2px_2px_0px_#18181b]"
          >
            <div className="flex items-center justify-between">
              <h2 id="approval-waiting-title" className="text-xs font-extrabold text-[#18181b] font-geist">
                4. Human Approval Gate (HITL Sign-Off)
              </h2>
              <span className="badge-accent text-[10px]">
                Active Interrupt Point
              </span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed font-medium">
              Execution pauses safely via LangGraph checkpointer before pull request submission. The human engineer reviews the patch diff and authorizes publishing.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-[#e5e5e5] text-xs">
              <span className="text-[#666666]">On Approval:</span>
              <span className="font-bold text-[#18181b]">Push branch &amp; open GitHub PR</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
