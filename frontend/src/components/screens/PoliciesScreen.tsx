import React from 'react'
import { Lock, Shield, Sliders } from 'lucide-react'
import type { TerminologyMode } from '../../types'
import { formatDualTerm } from '../../utils/terminology'

interface PoliciesScreenProps {
  terminologyMode?: TerminologyMode
}

export const PoliciesScreen: React.FC<PoliciesScreenProps> = ({
  terminologyMode = 'both',
}) => {
  const { primary: secGateTitle, secondary: secGateTech } = formatDualTerm(
    'Security Gate',
    'guardrail',
    terminologyMode
  )

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist">
              Repositories &amp; Governance Policies
            </h1>
            <span className="badge-teal">Enforced by Code</span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">
            Organizational guardrails, retry limits, sensitive path definitions, and approval ceilings.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-warm">
            {secGateTitle} ({secGateTech})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT COLUMN: Organization Allowlist & Path Protections (7 cols) */}
        <section className="lg:col-span-7 card-canvas-elevated p-4 flex flex-col justify-between h-[520px]">
          <div>
            <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0d9488]" />
                <h2 className="text-xs font-extrabold text-[#18181b]">
                  Authorized Repository Allowlist (ALLOWED_REPOS)
                </h2>
              </div>
              <span className="text-[10px] text-[#666666] font-mono">3 configured</span>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="p-3 rounded-lg border-2 border-[#18181b] bg-[#fffdf8] flex items-center justify-between shadow-[2px_2px_0px_#18181b]">
                <div>
                  <p className="font-extrabold text-[#18181b]">core-api</p>
                  <p className="text-[11px] text-[#666666]">Primary Backend Service · Signature &amp; API handling</p>
                </div>
                <span className="badge-teal text-[10px]">Active · Monitored</span>
              </div>

              <div className="p-3 rounded-lg border-2 border-[#18181b] bg-white flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-[#18181b]">priya/shop-api</p>
                  <p className="text-[11px] text-[#666666]">E-commerce API · session handling</p>
                </div>
                <span className="badge-warm text-[10px]">Allowed · Test Repo</span>
              </div>

              <div className="p-3 rounded-lg border-2 border-[#e5e5e5] bg-slate-50 flex items-center justify-between opacity-80">
                <div>
                  <p className="font-extrabold text-[#666666]">org/internal-tools</p>
                  <p className="text-[11px] text-[#666666]">Internal utilities (Restricted from autonomous execution)</p>
                </div>
                <span className="badge-red text-[10px]">Blocked by Policy</span>
              </div>
            </div>
          </div>

          {/* Sensitive Paths Protection */}
          <div className="pt-3 border-t border-[#e5e5e5]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d31611] block mb-1.5">
              Sensitive Protected Paths (Always Forces Human Sign-Off):
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-[#fff4da] border border-[#18181b] text-[#18181b]">
                src/auth/*
              </span>
              <span className="px-2 py-0.5 rounded bg-[#fff4da] border border-[#18181b] text-[#18181b]">
                migrations/*
              </span>
              <span className="px-2 py-0.5 rounded bg-[#fff4da] border border-[#18181b] text-[#18181b]">
                crypto/*
              </span>
              <span className="px-2 py-0.5 rounded bg-[#fff4da] border border-[#18181b] text-[#18181b]">
                .github/workflows/*
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Execution Ceilings & Emergency Brakes (5 cols) */}
        <section className="lg:col-span-5 card-canvas-elevated p-4 flex flex-col justify-between h-[520px]">
          <div>
            <div className="h-10 flex items-center justify-between pb-2 border-b border-[#e5e5e5] shrink-0">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#d97706]" />
                <h2 className="text-xs font-extrabold text-[#18181b]">
                  Deterministic Policy Controls
                </h2>
              </div>
              <span className="badge-amber text-[10px]">Strict Mode</span>
            </div>

            <div className="space-y-3 mt-3 text-xs">
              {/* Emergency Brake Threshold */}
              <div className="p-3 rounded-lg border-2 border-[#18181b] bg-[#fffdf8] space-y-1.5 shadow-[2px_2px_0px_#18181b]">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#18181b] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#d97706]" />
                    Emergency Gate Threshold
                  </span>
                  <span className="badge-amber font-mono font-bold">0.70 (Locked)</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Whenever an agent patch computes a risk score &ge; 0.70, autonomous execution pauses immediately and routes to human sign-off.
                </p>
              </div>

              {/* Retry Limit / Cap */}
              <div className="p-3 rounded-lg border-2 border-[#18181b] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#18181b]">
                    Safe Lab Retry Cap (retry_cap)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#ebdbb7] text-[#18181b] font-bold text-xs border border-[#18181b]">
                    Max 3 Attempts
                  </span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Limits autonomous self-healing test loops in the sandbox. If tests fail 3 times, the agent escalates to the engineer.
                </p>
              </div>

              {/* Mandatory PR Sign-off */}
              <div className="p-3 rounded-lg border-2 border-[#18181b] bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#18181b]">
                    Pull Request Publishing Gate
                  </span>
                  <span className="badge-teal text-[10px]">Human Approval Required</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Autonomous agents cannot merge or push pull requests without explicit engineer authorization.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#fff4da] border border-[#18181b] text-[11px] text-[#18181b] flex items-center justify-between">
            <span className="font-medium">Governance Policy Version:</span>
            <span className="font-mono font-bold">v2.4-enterprise-strict</span>
          </div>
        </section>
      </div>
    </div>
  )
}
