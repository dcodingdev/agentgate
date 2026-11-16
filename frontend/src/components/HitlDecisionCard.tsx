import React, { useState } from 'react'
import {
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
    <div className="card-canvas-elevated p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#fff4da] border-2 border-[#18181b] flex items-center justify-center text-[#d31611] shadow-[2px_2px_0px_#18181b]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#18181b] flex items-center gap-2 font-geist">
              <span>Human Approval Required</span>
              <span className={isHighRisk ? 'badge-accent' : 'badge-warm'}>
                {isHighRisk ? 'High Risk' : 'Standard Gate'}
              </span>
            </h3>
            <p className="text-xs text-[#666666] font-medium">
              LangGraph checkpointer interrupted workflow before pull request publication
            </p>
          </div>
        </div>

        {/* Risk Pill */}
        <div className="flex items-center gap-2 bg-[#fffdf8] px-3.5 py-1.5 rounded-md border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b]">
          <span className="text-xs font-bold text-[#666666] uppercase tracking-wider">Risk Score:</span>
          <span
            className={`text-sm font-extrabold ${
              isHighRisk ? 'text-[#d31611]' : 'text-[#18181b]'
            }`}
          >
            {riskPercentage}% ({riskScore.toFixed(2)})
          </span>
        </div>
      </div>

      {/* Risk Reasons */}
      {riskReasons && riskReasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-[#18181b] uppercase tracking-wider">
            Risk Analysis Factors
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {riskReasons.map((reason, idx) => (
              <div
                key={idx}
                className="text-xs bg-[#fff4da] border-2 border-[#18181b] rounded-md px-3 py-2 text-[#18181b] font-medium shadow-[1px_1px_0px_#18181b]"
              >
                &bull; {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patch Preview */}
      {patchDiff && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#18181b]">
            <span className="flex items-center gap-1.5 font-geist">
              <FileCode className="w-4 h-4 text-[#d31611]" />
              Synthesized Patch Diff
            </span>
            <span className="text-[11px] font-mono text-[#666666]">unified diff format</span>
          </div>
          <div className="bg-[#18181b] text-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-48 leading-relaxed border-2 border-[#18181b]">
            <pre>{patchDiff}</pre>
          </div>
        </div>
      )}

      {/* Revision Feedback Input */}
      <div className="space-y-2">
        <label
          htmlFor="hitl-feedback-input"
          className="text-xs font-extrabold text-[#18181b] flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#d31611]" />
          Feedback or Revision Instructions (Optional for Approval, Required for Revision):
        </label>
        <textarea
          id="hitl-feedback-input"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="E.g., Please add unit tests covering expired token boundary conditions..."
          rows={3}
          className="w-full bg-white border-2 border-[#18181b] rounded-md p-3 text-xs text-[#18181b] placeholder-[#666666] focus:outline-none focus:border-[#d31611]"
        />
      </div>

      {error && (
        <div className="p-3 bg-[#fff4da] border-2 border-[#d31611] rounded-md text-xs text-[#d31611] font-bold">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#e5e5e5]">
        <button
          onClick={() => handleDecision(false, false)}
          disabled={loading}
          className="w-full sm:w-auto btn-outline-dark text-xs text-[#d31611] flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-4 h-4" />
          Reject &amp; Terminate
        </button>

        <button
          onClick={() => handleDecision(false, true)}
          disabled={loading}
          className="w-full sm:w-auto btn-warm text-xs flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          Request Changes
        </button>

        <button
          onClick={() => handleDecision(true, false)}
          disabled={loading}
          className="w-full sm:w-auto btn-cta text-xs flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Approve &amp; Open PR
        </button>
      </div>
    </div>
  )
}
