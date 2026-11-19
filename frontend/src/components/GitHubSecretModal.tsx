import React, { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Key, X } from 'lucide-react'

interface GitHubSecretModalProps {
  isOpen: boolean
  onClose: () => void
  currentSecret: string
  currentUsername?: string
  onSaveSecret: (secret: string, username: string) => void
}

export const GitHubSecretModal: React.FC<GitHubSecretModalProps> = ({
  isOpen,
  onClose,
  currentSecret,
  currentUsername = '',
  onSaveSecret,
}) => {
  const [token, setToken] = useState<string>(currentSecret || '')
  const [showToken, setShowToken] = useState<boolean>(false)
  const [validating, setValidating] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [verifiedUser, setVerifiedUser] = useState<string | null>(currentUsername || null)

  useEffect(() => {
    setToken(currentSecret || '')
    setVerifiedUser(currentUsername || null)
    setErrorMessage(null)
  }, [currentSecret, currentUsername, isOpen])

  if (!isOpen) return null

  const handleVerifyAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = token.trim()

    if (!trimmed) {
      setErrorMessage('Please enter your GitHub Personal Access Token to save.')
      return
    }

    setValidating(true)
    setErrorMessage(null)

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${trimmed}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const username = data.login || 'developer'
        setVerifiedUser(username)
        onSaveSecret(trimmed, username)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('agentgate_secret_dismissed', '1')
        }
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setErrorMessage(
          errorData.message ||
            'Invalid GitHub token. Please verify token permissions (requires "repo" scope).'
        )
      }
    } catch {
      // Offline fallback: save token without blocking
      onSaveSecret(trimmed, currentUsername || 'developer')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('agentgate_secret_dismissed', '1')
      }
      onClose()
    } finally {
      setValidating(false)
    }
  }

  const handleUseDefault = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('agentgate_secret_dismissed', '1')
    }
    onClose()
  }

  const handleClearToken = () => {
    setToken('')
    setVerifiedUser(null)
    onSaveSecret('', '')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="secret-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18181b]/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-[#fffdf8] border-2 border-[#18181b] rounded-xl shadow-[6px_6px_0px_#18181b] max-w-lg w-full p-5 sm:p-6 space-y-4 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleUseDefault}
          className="absolute top-4 right-4 text-[#666666] hover:text-[#18181b] p-1 rounded transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#ebdbb7] border-2 border-[#18181b] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#18181b]">
            <Key className="w-5 h-5 text-[#d31611]" />
          </div>
          <div>
            <h2 id="secret-modal-title" className="text-lg sm:text-xl font-extrabold text-[#18181b] font-geist leading-snug">
              Connect GitHub Token
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Required to fetch repository issues and open pull requests.
            </p>
          </div>
        </div>

        {/* Secret Input Form */}
        <form onSubmit={handleVerifyAndSave} className="space-y-3.5 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="github-token-input" className="block text-xs font-extrabold uppercase tracking-wider text-[#18181b]">
              Personal Access Token
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  id="github-token-input"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_..."
                  className="w-full bg-white border-2 border-[#18181b] rounded-lg px-3 py-2 text-xs font-mono text-[#18181b] focus:outline-none focus:border-[#0d9488] shadow-[1px_1px_0px_#18181b]"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="px-3 py-2 rounded-lg border-2 border-[#18181b] bg-white text-xs font-bold hover:bg-[#fffdf8] transition cursor-pointer shadow-[1px_1px_0px_#18181b]"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
              {token && (
                <button
                  type="button"
                  onClick={handleClearToken}
                  className="px-2.5 py-2 rounded-lg border border-[#e5e5e5] text-[#666666] hover:text-[#d31611] text-xs font-bold transition cursor-pointer"
                  title="Clear token"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Helper link for token generation */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=AgentGate%20PAT"
                target="_blank"
                rel="noreferrer"
                className="text-[#0d9488] hover:underline font-bold flex items-center gap-1"
              >
                <span>Generate token on GitHub (needs 'repo' scope)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {verifiedUser && (
                <span className="text-[#0d9488] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>@{verifiedUser}</span>
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-[#fee2e2] border border-[#dc2626] text-xs text-[#991b1b] font-medium">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#e5e5e5]">
            <button
              type="button"
              onClick={handleUseDefault}
              className="py-2 px-3 text-xs font-bold text-[#666666] hover:text-[#18181b] rounded transition cursor-pointer text-center"
            >
              Skip for Now
            </button>

            <button
              type="submit"
              disabled={validating}
              className="py-2 px-5 rounded-md bg-[#d31611] text-white font-bold text-xs border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition cursor-pointer disabled:opacity-50"
            >
              {validating ? 'Verifying...' : 'Save Token'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
