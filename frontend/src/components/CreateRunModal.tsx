import React, { useState } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import type { CreateRunRequest } from '../types'
import { createRun } from '../services/api'

interface CreateRunModalProps {
  isOpen: boolean
  onClose: () => void
  onRunCreated: (threadId: string) => void
}

const PRESETS = [
  {
    name: 'Token Expiration Bug',
    repo: 'owner/repo',
    issue_url: 'https://github.com/owner/repo/issues/1',
    title: 'Login tokens never expire',
    description: 'System fails to validate UTC expiration timestamps during session verification.',
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
      setError(err.message || 'Failed to create run.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181b]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fffdf8] border-2 border-[#18181b] rounded-xl max-w-xl w-full p-6 shadow-[6px_6px_0px_#18181b] relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#18181b]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-[#d31611] text-white flex items-center justify-center border border-[#18181b]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-[#18181b] font-geist">
              Launch Autonomous SWE Run
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-[#18181b] font-bold p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#18181b] uppercase tracking-wider">
            Quick Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`text-xs font-bold px-3 py-1.5 rounded-md border-2 border-[#18181b] transition cursor-pointer ${
                  formData.repo === p.repo
                    ? 'bg-[#fff4da] text-[#18181b] shadow-[2px_2px_0px_#18181b]'
                    : 'bg-white text-[#666666] hover:bg-[#fffdf8]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#18181b] mb-1">
              Target Repository (Whitelisted):
            </label>
            <input
              type="text"
              required
              value={formData.repo}
              onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
              placeholder="owner/repository"
              className="w-full bg-white border-2 border-[#18181b] rounded-md px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181b] mb-1">
              GitHub Issue URL:
            </label>
            <input
              type="url"
              required
              value={formData.issue_url}
              onChange={(e) => setFormData({ ...formData, issue_url: e.target.value })}
              placeholder="https://github.com/owner/repository/issues/1"
              className="w-full bg-white border-2 border-[#18181b] rounded-md px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181b] mb-1">
              Issue Title:
            </label>
            <input
              type="text"
              value={formData.issue_title || ''}
              onChange={(e) => setFormData({ ...formData, issue_title: e.target.value })}
              placeholder="Login tokens never expire"
              className="w-full bg-white border-2 border-[#18181b] rounded-md px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#18181b] mb-1">
              Description / Reproduction Context:
            </label>
            <textarea
              rows={3}
              value={formData.issue_description || ''}
              onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
              placeholder="Describe error symptoms, reproduction steps, or bug details..."
              className="w-full bg-white border-2 border-[#18181b] rounded-md px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#d31611]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#fff4da] border-2 border-[#d31611] rounded-md text-xs text-[#d31611] font-bold">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#18181b]">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline-dark text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-cta text-xs py-2 px-5 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Launching Agent...' : 'Launch SWE Agent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
