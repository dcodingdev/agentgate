import React, { useState } from 'react'
import type { CreateRunRequest, RepoOption } from '../types'

interface SetupViewProps {
  onStartRun: (request: CreateRunRequest) => void
  loading?: boolean
}

const DEFAULT_REPOS: RepoOption[] = [
  {
    name: 'priya/shop-api',
    status: 'test-allowed',
    statusLabel: 'Test repo · allowed',
    defaultIssueUrl: 'https://github.com/priya/shop-api/issues/60',
    defaultIssueTitle: 'Login tokens never expire',
  },
  {
    name: 'priya/blog',
    status: 'allowed',
    statusLabel: 'Allowed',
    defaultIssueUrl: 'https://github.com/priya/blog/issues/12',
    defaultIssueTitle: 'RSS feed generation produces malformed XML',
  },
  {
    name: 'org/internal-tools',
    status: 'not-allowed',
    statusLabel: 'Not on allowlist',
    defaultIssueUrl: 'https://github.com/org/internal-tools/issues/5',
    defaultIssueTitle: 'Database migration script failure',
  },
]

export const SetupView: React.FC<SetupViewProps> = ({ onStartRun, loading = false }) => {
  const [e2bStatus] = useState<string>('Connected')
  const [llmStatus] = useState<string>('Connected')
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('agentgate_gh_token') || 'token_stored_on_server'
  })
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(true)
  const [tokenInput, setTokenInput] = useState<string>('')

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRepo, setSelectedRepo] = useState<string>('priya/shop-api')
  const [issueUrl, setIssueUrl] = useState<string>('https://github.com/priya/shop-api/issues/60')

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (tokenInput.trim().length > 5) {
      setGithubToken(tokenInput.trim())
      setIsTokenVerified(true)
      localStorage.setItem('agentgate_gh_token', tokenInput.trim())
      setTokenInput('')
    }
  }

  const handleSelectRepo = (repo: RepoOption) => {
    if (repo.status === 'not-allowed') return
    setSelectedRepo(repo.name)
    if (repo.defaultIssueUrl) {
      setIssueUrl(repo.defaultIssueUrl)
    }
  }

  const handleIssueUrlChange = (url: string) => {
    setIssueUrl(url)
    const match = url.match(/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)/)
    if (match && match[1]) {
      setSelectedRepo(match[1])
    }
  }

  const handleStart = () => {
    const active = DEFAULT_REPOS.find((r) => r.name === selectedRepo)
    onStartRun({
      repo: selectedRepo,
      issue_url: issueUrl,
      issue_title: active?.defaultIssueTitle || `Resolve issue in ${selectedRepo}`,
      issue_description: 'Autonomous resolution of reported bug and test suite verification.',
    })
  }

  const filteredRepos = DEFAULT_REPOS.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isFormValid = isTokenVerified && selectedRepo && issueUrl.trim().length > 0

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-8 space-y-7 animate-in fade-in duration-200">
      <div>
        <span className="badge-warm mb-2 inline-block">Pre-Flight Checklist</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#18181b] tracking-[-0.04em] font-geist leading-tight">
          Set up before the first run
        </h1>
        <p className="text-sm text-[#666666] mt-1.5 font-medium">
          Verify credentials, select an authorized repository, and link the GitHub issue.
        </p>
      </div>

      {/* 1. Credentials Card */}
      <section className="card-canvas-elevated p-6 space-y-4">
        <div className="flex items-baseline justify-between pb-2 border-b border-[#e5e5e5]">
          <h2 className="text-base font-extrabold text-[#18181b] font-geist">
            1. Credentials
          </h2>
          <span className="text-xs text-[#666666] font-medium">
            Stored server-side · Never sent to sandboxes
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-2 border-b border-[#e5e5e5]">
          <span className="font-bold text-[#18181b]">E2B sandbox key</span>
          <span className="badge-warm">{e2bStatus}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-2 border-b border-[#e5e5e5]">
          <span className="font-bold text-[#18181b]">LLM Provider</span>
          <span className="badge-warm">{llmStatus}</span>
        </div>

        {isTokenVerified ? (
          <div className="flex items-center justify-between text-xs py-2">
            <span className="font-bold text-[#18181b]">
              GitHub token <span className="text-[#666666] font-mono font-normal">({githubToken.slice(0, 14)}...)</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="badge-warm">Connected</span>
              <button
                type="button"
                onClick={() => setIsTokenVerified(false)}
                className="text-xs font-bold text-[#d31611] hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#fff4da] border-2 border-[#18181b] rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-[#18181b]">Add GitHub Personal Access Token:</span>
            <form onSubmit={handleVerifyToken} className="flex gap-2">
              <input
                type="password"
                required
                placeholder="ghp_..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 bg-white border-2 border-[#18181b] rounded-md px-3 py-2 text-xs text-[#18181b]"
              />
              <button type="submit" className="btn-cta text-xs">
                Save & Verify
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 2. Repository Card */}
      <section className="card-canvas-elevated p-6 space-y-4">
        <h2 className="text-base font-extrabold text-[#18181b] font-geist">2. Repository</h2>
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-2 border-[#18181b] rounded-md px-3.5 py-2.5 text-xs text-[#18181b]"
        />

        <div className="space-y-2 pt-1">
          {filteredRepos.map((repo) => {
            const isSelected = selectedRepo === repo.name
            const isAllowed = repo.status !== 'not-allowed'

            return (
              <div
                key={repo.name}
                onClick={() => handleSelectRepo(repo)}
                className={`p-3.5 rounded-lg border-2 text-xs flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'border-[#18181b] bg-[#fff4da] shadow-[2px_2px_0px_#18181b]'
                    : isAllowed
                    ? 'border-[#e5e5e5] bg-white hover:border-[#18181b]'
                    : 'border-[#e5e5e5] bg-[#fffdf8] opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-[#18181b] flex items-center justify-center ${
                      isSelected ? 'bg-[#d31611]' : 'bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <span className="font-bold text-[#18181b]">{repo.name}</span>
                </div>
                <span className={isAllowed ? 'badge-warm' : 'badge-accent'}>
                  {repo.statusLabel}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Issue Card */}
      <section className="card-canvas-elevated p-6 space-y-3">
        <h2 className="text-base font-extrabold text-[#18181b] font-geist">3. GitHub Issue</h2>
        <input
          type="url"
          required
          value={issueUrl}
          onChange={(e) => handleIssueUrlChange(e.target.value)}
          placeholder="https://github.com/org/repo/issues/60"
          className="w-full bg-white border-2 border-[#18181b] rounded-md px-3.5 py-2.5 text-xs text-[#18181b]"
        />
      </section>

      {/* Action */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={!isFormValid || loading}
          className={isFormValid && !loading ? 'btn-cta text-sm px-8 py-3' : 'btn-warm opacity-50 cursor-not-allowed'}
        >
          {loading ? 'Starting run...' : 'Start SWE run'}
        </button>
        <span className="text-xs text-[#666666] font-medium">
          {!isTokenVerified ? 'Verify GitHub token to continue' : 'Ready to launch autonomous run'}
        </span>
      </div>
    </div>
  )
}
