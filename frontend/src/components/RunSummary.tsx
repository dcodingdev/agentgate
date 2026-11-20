import React from 'react'
import {
  CheckCircle2,
  ExternalLink,
  GitPullRequest,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import type { RunStateResponse } from '../types'

interface RunSummaryProps {
  runState?: RunStateResponse | null
  onRefresh: () => void
}

export const RunSummary: React.FC<RunSummaryProps> = ({ runState, onRefresh }) => {
  if (!runState) return null

  const { thread_id, status, risk_score, pr_url, values, metadata } = runState

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'completed':
        return 'bg-[#ebdbb7] text-[#18181b] border-2 border-[#18181b]'
      case 'paused_hitl':
        return 'bg-[#fff4da] text-[#d31611] border-2 border-[#d31611]'
      case 'running':
        return 'bg-[#fff4da] text-[#18181b] border-2 border-[#18181b]'
      case 'rejected':
      case 'failed':
        return 'bg-[#fffdf8] text-[#d31611] border-2 border-[#d31611]'
      default:
        return 'bg-white text-[#666666] border border-[#e5e5e5]'
    }
  }

  return (
    <div className="card-canvas-elevated p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-[#666666]">Thread:</span>
          <span className="font-mono font-bold text-sm text-[#18181b]">{thread_id}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="btn-outline-dark text-xs py-1 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#fffdf8] border-2 border-[#18181b] rounded-lg p-3 shadow-[1px_1px_0px_#18181b]">
          <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Repository</span>
          <p className="text-xs font-bold text-[#18181b] truncate mt-0.5">
            {metadata?.repo || values?.repo || 'Target Repository'}
          </p>
        </div>

        <div className="bg-[#fffdf8] border-2 border-[#18181b] rounded-lg p-3 shadow-[1px_1px_0px_#18181b]">
          <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Sandbox VM</span>
          <p className="text-xs font-bold font-mono text-[#18181b] truncate mt-0.5">
            {values?.sandbox_id || 'sbx_8f21'}
          </p>
        </div>

        <div className="bg-[#fffdf8] border-2 border-[#18181b] rounded-lg p-3 shadow-[1px_1px_0px_#18181b]">
          <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Risk Score</span>
          <p
            className={`text-xs font-black mt-0.5 ${
              (risk_score ?? 0) >= 0.7 ? 'text-[#d31611]' : 'text-[#18181b]'
            }`}
          >
            {risk_score !== undefined ? `${(risk_score * 100).toFixed(0)}%` : 'Evaluated'}
          </p>
        </div>

        <div className="bg-[#fffdf8] border-2 border-[#18181b] rounded-lg p-3 shadow-[1px_1px_0px_#18181b]">
          <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Attempts</span>
          <p className="text-xs font-bold text-[#18181b] mt-0.5">
            {values?.test_attempts ?? 2} / {values?.max_test_attempts ?? 3}
          </p>
        </div>
      </div>

      {/* PR Link Banner if available */}
      {pr_url && (
        <div className="bg-[#fff4da] border-2 border-[#18181b] rounded-lg p-3.5 flex items-center justify-between shadow-[2px_2px_0px_#18181b]">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-[#d31611]" />
            <span className="text-xs font-extrabold text-[#18181b]">
              Pull Request Created:
            </span>
            <a
              href={pr_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#d31611] hover:underline font-mono"
            >
              {pr_url}
            </a>
          </div>
          <a
            href={pr_url}
            target="_blank"
            rel="noreferrer"
            className="btn-cta text-xs py-1 px-3 flex items-center gap-1"
          >
            <span>Open PR</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Rejection notice */}
      {status === 'rejected' && (
        <div className="bg-[#fffdf8] border-2 border-[#d31611] rounded-lg p-3.5 flex items-center gap-2.5 text-xs text-[#d31611] font-bold shadow-[2px_2px_0px_#d31611]">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Execution was terminated by human reviewer or safety guardrail.</span>
        </div>
      )}

      {/* Completion notice */}
      {status === 'completed' && !pr_url && (
        <div className="bg-[#ebdbb7] border-2 border-[#18181b] rounded-lg p-3.5 flex items-center gap-2.5 text-xs text-[#18181b] font-bold shadow-[2px_2px_0px_#18181b]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>SWE run completed successfully! Tests verified in sandbox.</span>
        </div>
      )}
    </div>
  )
}
