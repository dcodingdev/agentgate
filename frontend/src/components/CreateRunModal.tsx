import React, { useState } from 'react'
import { AlertCircle, Bug, CheckCircle2, GitBranch, Loader2, Sparkles, X } from 'lucide-react'
import type { CreateRunRequest } from '../types'
import { createRun } from '../services/api'

interface CreateRunModalProps {
  isOpen: boolean
  onClose: () => void
  onRunCreated: (threadId: string) => void
}

const PRESETS = [
  {
    name: 'Memory Leak Bug',
    repo: 'facebook/react',
    issue_url: 'https://github.com/facebook/react/issues/28910',
    title: 'Fix memory leak in component unmount cleanup cycle',
    description: 'DOM listeners attached during mount are not dereferenced when component unmounts prematurely.',
  },
  {
    name: 'Invalid JSON Crash',
    repo: 'fastapi/fastapi',
    issue_url: 'https://github.com/fastapi/fastapi/issues/10432',
    title: 'Handle malformed JSON body payloads without 500 error',
    description: 'Application raises unhandled exception when parsing non-UTF8 characters in incoming JSON stream.',
  },
  {
    name: 'Auth Token Race Condition',
    repo: 'org/backend-service',
    issue_url: 'https://github.com/org/backend-service/issues/402',
    title: 'Race condition during session token rotation',
    description: 'Concurrent refresh requests cause secondary request to fail with invalid signature.',
  },
]

export const CreateRunModal: React.FC<CreateRunModalProps> = ({ isOpen, onClose, onRunCreated }) => {
  const [formData, setFormData] = useState<CreateRunRequest>({
    repo: PRESETS[0].repo,
    issue_url: PRESETS[0].issue_url,
    issue_title: PRESETS[0].title,
    issue_description: PRESETS[0].description,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormData({
      repo: preset.repo,
      issue_url: preset.issue_url,
      issue_title: preset.title,
      issue_description: preset.description,
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.repo || !formData.issue_url) {
      setError('Repository and Issue URL are required.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await createRun(formData)
      onRunCreated(res.thread_id)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to initialize agent run.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Initialize Autonomous SWE Run</h2>
              <p className="text-xs text-slate-400">Launch LangGraph multi-agent bug resolution workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Sample Presets</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`text-left p-2.5 rounded-xl border text-xs transition flex flex-col justify-between ${
                    formData.issue_url === preset.issue_url
                      ? 'border-indigo-500 bg-indigo-500/10 text-white font-medium'
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="font-semibold">{preset.name}</span>
                  <span className="text-[11px] text-slate-500 truncate mt-1">{preset.repo}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Repository & Issue URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Repository <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="owner/repo"
                  value={formData.repo}
                  onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                GitHub Issue URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://github.com/org/repo/issues/42"
                value={formData.issue_url}
                onChange={(e) => setFormData({ ...formData, issue_url: e.target.value })}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Issue Title</label>
            <input
              type="text"
              placeholder="Brief summary of the issue or bug"
              value={formData.issue_title}
              onChange={(e) => setFormData({ ...formData, issue_title: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Issue Description / Reproduction Steps
            </label>
            <textarea
              rows={3}
              placeholder="Describe error logs, stack traces, expected vs actual behavior..."
              value={formData.issue_description}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Pipeline Notice */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-300 font-medium">Automatic Guardrails &amp; Sandbox Execution</p>
              <p className="mt-0.5 text-[11px]">
                AgentGate will sandbox candidate patches using E2B, verify pytest outcomes, and trigger Human-In-The-Loop review if risk exceeds 0.70.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting Workflow...</span>
                </>
              ) : (
                <span>Launch SWE Workflow</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

