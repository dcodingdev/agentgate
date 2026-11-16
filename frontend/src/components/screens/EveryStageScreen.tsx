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
            Autonomous background orchestration on the left; active foreground sandbox verification on the right.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-warm text-[11px]">LangGraph Checkpoint State</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT COLUMN: Background Agents (4 cols) */}
        <aside
          aria-label="Background agents"
          className="lg:col-span-4 space-y-4 select-none lg:sticky lg:top-6"
        >
          <div className="border-b border-[#e5e5e5] pb-2">
            <h2 className="text-base font-extrabold text-[#18181b] font-geist">Background Agents</h2>
            <p className="text-xs text-[#666666] mt-0.5 font-medium">
              Operate autonomously with no human blocking.
            </p>
          </div>

          <div className="space-y-3">
            {/* Guardrail Card */}
            <div className="card-canvas-elevated p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">Guardrail</span>
                <span className="badge-warm">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#18181b] font-bold flex items-center justify-between">
                <span>Status: Done</span>
                <span className="text-[#666666] font-normal font-mono">0.8s</span>
              </div>
            </div>

            {/* Supervisor Card */}
            <div className="card-canvas-elevated p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">Supervisor</span>
                <span className="badge-warm">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#18181b] font-bold flex items-center justify-between">
                <span>Status: Active</span>
                <span className="text-[#666666] font-normal">hybrid judgment</span>
              </div>
            </div>

            {/* Parallel Research Card */}
            <div className="card-canvas-elevated p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">Parallel Research</span>
                <span className="badge-warm">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#18181b] font-bold flex items-center justify-between">
                <span>Status: Done</span>
                <span className="text-[#666666] font-normal">fan-out via Send</span>
              </div>
            </div>

            {/* PR Agent Card */}
            <div className="card-canvas-elevated p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181b]">PR Publisher</span>
                <span className="badge-warm">
                  Background
                </span>
              </div>
              <div className="text-xs text-[#18181b] font-bold flex items-center justify-between">
                <span>Status: Waiting</span>
                <span className="text-[#666666] font-normal">runs after HITL</span>
              </div>
            </div>
          </div>

          {/* Token usage footer */}
          <div className="bg-[#fff4da] border-2 border-[#18181b] rounded-lg p-3 text-xs text-[#18181b] font-mono flex items-center justify-between shadow-[2px_2px_0px_#18181b]">
            <span className="font-bold">11.2k tokens · $0.03</span>
            <span className="text-[#d31611] font-bold underline cursor-pointer">View trace &rarr;</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Foreground Verification & Human Panels (8 cols) */}
        <main className="lg:col-span-8 space-y-5">
          {/* Foreground Panel 1: Sandbox */}
          <section
            aria-labelledby="sandbox-stage-title"
            className="card-canvas-elevated p-6 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
              <h2 id="sandbox-stage-title" className="text-base font-extrabold text-[#18181b] font-geist">
                Sandbox Execution · E2B sbx_8f21
              </h2>
              <span className="badge-warm">
                Status: Done · attempt 2 of 3
              </span>
            </div>

            {/* Dark terminal box */}
            <div className="bg-[#18181b] text-slate-100 rounded-lg p-4 font-mono text-xs leading-relaxed space-y-1 select-text border-2 border-[#18181b]">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-[#d31611] font-bold">$</span>
                <span>git apply patch_v2.diff &amp;&amp; pytest -q</span>
              </div>
              <div className="text-[#4ade80] flex items-center gap-3 pt-0.5 font-bold">
                <span>26 passed in 3.1s</span>
                <span className="text-slate-400 font-normal">
                  # baseline 24, plus 2 new tests
                </span>
              </div>
            </div>
          </section>

          {/* 2-Column Horizontal Split for Reviewer & Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Foreground Panel 2: Verify and security */}
            <section
              aria-labelledby="verify-stage-title"
              className="card-canvas-elevated p-5 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
                <h2 id="verify-stage-title" className="text-sm font-extrabold text-[#18181b] font-geist">
                  Verify &amp; Security
                </h2>
                <span className="badge-accent">
                  Running
                </span>
              </div>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#18181b]">Baseline tests</span>
                  <span className="font-bold text-[#18181b]">Done · clean</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#18181b]">Coverage</span>
                  <span className="font-bold text-[#18181b]">+1.8%</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#e5e5e5]">
                  <span className="text-[#18181b]">Linter</span>
                  <span className="font-bold text-[#18181b]">Done · clean</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#18181b]">SAST Scanner</span>
                  <span className="text-[#d31611] font-bold animate-pulse">Running...</span>
                </div>
              </div>
            </section>

            {/* Foreground Panel 3: Reviewer */}
            <section
              aria-labelledby="reviewer-stage-title"
              className="card-canvas-elevated p-5 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
                <h2 id="reviewer-stage-title" className="text-sm font-extrabold text-[#18181b] font-geist">
                  PR Quality Reviewer
                </h2>
                <span className="badge-warm">
                  Waiting
                </span>
              </div>

              <p className="text-xs text-[#666666] leading-relaxed">
                Executes when Verify finishes. Evaluates candidate diff risk score against the 0.70 threshold.
              </p>

              <div className="p-3 bg-[#fffdf8] border-2 border-[#18181b] rounded-md text-xs font-mono text-[#18181b]">
                Deterministic Risk Threshold: &ge; 0.70 forces HITL gate
              </div>
            </section>
          </div>

          {/* Foreground Panel 4: Human approval */}
          <section
            aria-labelledby="approval-waiting-title"
            className="bg-[#fffdf8] border-2 border-dashed border-[#18181b] rounded-xl p-6 space-y-2 shadow-[2px_2px_0px_#18181b]"
          >
            <div className="flex items-center justify-between">
              <h2 id="approval-waiting-title" className="text-base font-extrabold text-[#18181b] font-geist">
                Human Approval Gate (HITL)
              </h2>
              <span className="badge-warm">
                Interrupt Point
              </span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed font-medium">
              Pauses execution via LangGraph checkpointer if risk is high (score &ge; 0.70). Otherwise PR agent publishes directly without interruption.
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
