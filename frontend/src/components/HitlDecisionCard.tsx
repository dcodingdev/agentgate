import React, { useState } from 'react'
import {
  AlertOctagon,
  Check,
  FileCode,
  Loader2,
  MessageSquare,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import { resumeRun } from '../services/api'

interface HitlDecisionCardProps {
  threadId: string
  riskScore: number
  riskReasons: string[]
  patchDiff?: string
  onResumed: () => void
}

export const HitlDecisionCard: React.FC<HitlDecisionCardProps> = ({
  threadId,
  riskScore,
  riskReasons,
  patchDiff,
  onResumed,
}) => {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDecision = async (approved: boolean, isRevision: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      await resumeRun(threadId, {
        approved,
        feedback: isRevision ? feedback || 'Please refine the patch to address core logic risk.' : null,
      })
      onResumed()
    } catch (err: any) {
      setError(err.message || 'Failed to submit decision')
    } finally {
      setLoading(false)
    }
  }

  const isHighRisk = riskScore >= 0.7
  const riskPercentage = Math.round(riskScore * 100)

  return (
    <div className="bg-gradient-to-b from-amber-950/20 to-slate-900/90 border-2 border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden animate-in fade-in duration-300">
      <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Human-In-The-Loop Sign-Off Required</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Action Needed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              LangGraph checkpointer paused execution at the HITL gate. Verify changes before pull request generation.
            </p>
          </div>
        </div>

        {/* Risk Score Meter */}
        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 shrink-0">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Calculated Risk</div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-black ${
                  isHighRisk ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {riskScore.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">/ 1.0</span>
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isHighRisk ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(10, riskPercentage))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Risk Factors */}
      {riskReasons && riskReasons.length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <span>Identified Risk Factors:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {riskReasons.map((reason, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-950/70 border border-slate-800 text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>{reason}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Patch Diff Viewer */}
      {patchDiff && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Proposed Patch Diff</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">unified diff</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 font-mono text-xs overflow-x-auto max-h-48 text-slate-300">
            {patchDiff.split('\n').map((line, idx) => {
              let lineClass = 'text-slate-400'
              if (line.startsWith('+') && !line.startsWith('+++')) {
                lineClass = 'text-emerald-400 bg-emerald-950/20 px-1 rounded'
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                lineClass = 'text-rose-400 bg-rose-950/20 px-1 rounded'
              } else if (line.startsWith('@@')) {
                lineClass = 'text-indigo-400 font-semibold'
              }
              return (
                <div key={idx} className={lineClass}>
                  {line || '\u00A0'}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Human Guidance / Feedback Input */}
      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>Engineer Revision Instructions (Optional):</span>
        </label>
        <input
          type="text"
          placeholder="E.g., Add null-check on event handler before committing, or write additional unit tests."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {/* Decision Buttons */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-3">
        <button
          onClick={() => handleDecision(false, false)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject &amp; Abort</span>
        </button>

        <button
          onClick={() => handleDecision(false, true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition disabled:opacity-50"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Request Revision</span>
        </button>

        <button
          onClick={() => handleDecision(true, false)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>Approve &amp; Open PR</span>
        </button>
      </div>
    </div>
  )
}

