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
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'paused_hitl':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'running':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      case 'rejected':
      case 'failed':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-slate-400">Thread:</span>
          <span className="font-mono font-bold text-sm text-indigo-300">{thread_id}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800/60 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* Target Repo & Issue info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Repository</span>
          <p className="font-semibold text-white mt-0.5 truncate">{metadata?.repo || values.repo || 'N/A'}</p>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Issue Target</span>
          {metadata?.issue_url || values.issue_url ? (
            <a
              href={metadata?.issue_url || values.issue_url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
            >
              <span>{metadata?.issue_url || values.issue_url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <p className="text-slate-400 mt-0.5">N/A</p>
          )}
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Evaluated Risk</span>
          <p className="font-semibold text-amber-400 mt-0.5">
            {typeof risk_score === 'number' ? risk_score.toFixed(2) : '0.00'} / 1.00
          </p>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Sandbox ID</span>
          <p className="font-mono text-slate-300 mt-0.5 truncate">{values.sandbox_id || 'Mock E2B'}</p>
        </div>
      </div>

      {/* PR Created Banner */}
      {pr_url && (
        <div className="bg-emerald-950/25 border-2 border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Pull Request Published!</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300">
                  Ready for Review
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated patch applied, verified with pytest, and submitted to GitHub.
              </p>
            </div>
          </div>

          <a
            href={pr_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30 transition shrink-0"
          >
            <span>Open on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Files modified / Test overview */}
      {values.files_changed && values.files_changed.length > 0 && (
        <div className="text-xs space-y-1.5">
          <span className="text-slate-400 font-medium">Target Files Identified by Research Agent:</span>
          <div className="flex flex-wrap gap-2">
            {values.files_changed.map((file: string, idx: number) => (
              <span
                key={idx}
                className="font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Test verification summary */}
      {values.test_results && (
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {values.test_results.status === 'passed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span className="text-slate-300 font-medium">
              Sandbox Test Results: {values.test_results.summary || 'Tests executed'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            exit code: {values.test_results.exit_code ?? 0}
          </span>
        </div>
      )}
    </div>
  )
}

