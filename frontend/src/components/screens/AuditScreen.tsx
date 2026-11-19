import React from 'react'
import { Activity, CheckCircle, ShieldCheck, Terminal } from 'lucide-react'
import type { TerminologyMode } from '../../types'
import { formatDualTerm } from '../../utils/terminology'

interface AuditScreenProps {
  terminologyMode?: TerminologyMode
  onStartNewRun?: () => void
}

export const AuditScreen: React.FC<AuditScreenProps> = ({
  terminologyMode = 'both',
  onStartNewRun,
}) => {
  const records: any[] = []

  const { primary: signOffTitle } = formatDualTerm(
    'Human Sign-Off',
    'hitl',
    terminologyMode
  )

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] font-geist">
            Activity &amp; Audit Trail
          </h1>
          <p className="text-sm text-[#555555] mt-0.5 font-medium">
            Complete cryptographic trace history of agent actions, sandbox executions, and human authorizations.
          </p>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#666666]">Total Runs</span>
            <p className="text-lg font-black text-[#18181b]">{records.length}</p>
          </div>
          <Activity className="w-5 h-5 text-[#0d9488]" />
        </div>

        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#666666]">Avg Pass Rate</span>
            <p className="text-lg font-black text-[#18181b]">—</p>
          </div>
          <CheckCircle className="w-5 h-5 text-[#0d9488]" />
        </div>

        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#666666]">Total Tokens</span>
            <p className="text-lg font-black text-[#18181b]">0</p>
          </div>
          <Terminal className="w-5 h-5 text-[#d97706]" />
        </div>

        <div className="card-canvas-elevated p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-extrabold text-[#666666]">{signOffTitle} Intercepts</span>
            <p className="text-lg font-black text-[#d31611]">0</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#d31611]" />
        </div>
      </div>

      {/* Audit Log Table or Empty State */}
      <section className="card-canvas-elevated p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e5e5e5]">
          <h2 className="text-sm font-extrabold text-[#18181b] font-geist">
            Recent Autonomous Execution Records
          </h2>
          <span className="text-xs text-[#666666] font-mono">
            {records.length} Records
          </span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-white rounded-lg border border-[#e5e5e5]">
            <div className="w-12 h-12 rounded-xl bg-[#fff4da] border border-[#18181b] mx-auto flex items-center justify-center shadow-[2px_2px_0px_#18181b]">
              <Activity className="w-6 h-6 text-[#0d9488]" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-[#18181b] text-sm">No Audit History Recorded</p>
              <p className="text-xs text-[#666666] max-w-md mx-auto">
                Execution records, sandbox traces, and human sign-off decisions will appear here as you run tasks.
              </p>
            </div>
            {onStartNewRun && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartNewRun}
                  className="btn-cta text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Launch First Run &rarr;</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 overflow-x-auto">
            {records.map((rec) => (
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
                          ? 'badge-teal text-xs'
                          : rec.statusColor === 'amber'
                          ? 'badge-amber text-xs'
                          : 'badge-red text-xs'
                      }
                    >
                      {rec.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#18181b] font-medium max-w-xl truncate">
                    {rec.issue}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
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
        )}
      </section>
    </div>
  )
}
