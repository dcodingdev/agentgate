import React from 'react'
import { Activity, CheckCircle, ShieldCheck, Terminal } from 'lucide-react'
import type { TerminologyMode } from '../../types'
import { formatDualTerm } from '../../utils/terminology'

interface AuditScreenProps {
  terminologyMode?: TerminologyMode
}

export const AuditScreen: React.FC<AuditScreenProps> = ({
  terminologyMode = 'both',
}) => {
  const { primary: signOffTitle, secondary: signOffTech } = formatDualTerm(
    'Human Sign-Off',
    'hitl',
    terminologyMode
  )

  const AUDIT_RECORDS = [
    {
      id: 'run_493',
      repo: 'auth-service',
      issue: '#493 Support Ed25519 asymmetric signatures for client JWTs',
      status: 'Awaiting Sign-Off',
      statusColor: 'amber',
      duration: '3m 42s',
      tokens: '48,210',
      cost: '$0.18',
      sandbox: 'sbx-8931a',
      riskScore: 0.85,
    },
    {
      id: 'run_060',
      repo: 'priya/shop-api',
      issue: '#60 Login tokens never expire after user authentication',
      status: 'PR Published (#42)',
      statusColor: 'teal',
      duration: '1m 12s',
      tokens: '14,890',
      cost: '$0.05',
      sandbox: 'sbx-8f21',
      riskScore: 0.30,
    },
    {
      id: 'run_005',
      repo: 'org/internal-tools',
      issue: '#5 Database migration script failure',
      status: 'Blocked at Gate',
      statusColor: 'red',
      duration: '0.4s',
      tokens: '120',
      cost: '$0.00',
      sandbox: 'none',
      riskScore: 1.0,
    },
  ]

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist">
              Activity &amp; Audit Trail
            </h1>
            <span className="badge-teal">Immutable Logs</span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">
            Complete cryptographic trace history of agent actions, sandbox executions, and human authorizations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-warm font-mono">LangSmith Trace Sync: OK</span>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-[#666666]">Total Runs</span>
            <p className="text-lg font-black text-[#18181b]">24</p>
          </div>
          <Activity className="w-5 h-5 text-[#0d9488]" />
        </div>

        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-[#666666]">Avg Pass Rate</span>
            <p className="text-lg font-black text-[#18181b]">96.2%</p>
          </div>
          <CheckCircle className="w-5 h-5 text-[#0d9488]" />
        </div>

        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-[#666666]">Total Tokens</span>
            <p className="text-lg font-black text-[#18181b]">128,490</p>
          </div>
          <Terminal className="w-5 h-5 text-[#d97706]" />
        </div>

        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-[#666666]">Human Intercepts</span>
            <p className="text-lg font-black text-[#d31611]">8 Pauses</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#d31611]" />
        </div>
      </div>

      {/* Audit Log Table */}
      <section className="card-canvas-elevated p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <h2 className="text-xs font-extrabold text-[#18181b] font-geist">
            Recent Autonomous Execution Records
          </h2>
          <span className="text-[11px] text-[#666666] font-mono">
            {signOffTitle} ({signOffTech}) Events
          </span>
        </div>

        <div className="space-y-2 overflow-x-auto">
          {AUDIT_RECORDS.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-lg border-2 border-[#18181b] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[1px_1px_0px_#18181b] text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold font-mono text-[#18181b]">{rec.repo}</span>
                  <span className="text-[#666666] font-mono">[{rec.id}]</span>
                  <span
                    className={
                      rec.statusColor === 'teal'
                        ? 'badge-teal text-[10px]'
                        : rec.statusColor === 'amber'
                        ? 'badge-amber text-[10px]'
                        : 'badge-red text-[10px]'
                    }
                  >
                    {rec.status}
                  </span>
                </div>
                <p className="text-xs text-[#18181b] font-medium max-w-xl truncate">
                  {rec.issue}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
                <div className="text-right">
                  <p className="text-[#666666]">Duration: {rec.duration}</p>
                  <p className="text-[#18181b] font-bold">Cost: {rec.cost} ({rec.tokens} tok)</p>
                </div>
                <div className="text-right border-l border-[#e5e5e5] pl-3">
                  <p className="text-[#666666]">Sandbox: #{rec.sandbox}</p>
                  <p
                    className={
                      rec.riskScore >= 0.70 ? 'text-[#d31611] font-bold' : 'text-[#0d9488] font-bold'
                    }
                  >
                    Risk: {rec.riskScore.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
