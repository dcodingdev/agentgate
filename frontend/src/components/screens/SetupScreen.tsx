import React, { useState } from 'react'
import type { CreateRunRequest, RepoOption } from '../../types'

interface SetupScreenProps {
  onStartRun: (request: CreateRunRequest) => void
  loading?: boolean
}

const REPO_OPTIONS: RepoOption[] = [
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

const QUICK_PRESETS = [
  {
    label: '#60 · Token Expiration',
    repo: 'priya/shop-api',
    url: 'https://github.com/priya/shop-api/issues/60',
    title: 'Login tokens never expire',
  },
  {
    label: '#12 · RSS XML Bug',
    repo: 'priya/blog',
    url: 'https://github.com/priya/blog/issues/12',
    title: 'RSS feed generation produces malformed XML',
  },
  {
    label: '#5 · DB Migration (Blocked)',
    repo: 'org/internal-tools',
    url: 'https://github.com/org/internal-tools/issues/5',
    title: 'Database migration script failure',
  },
]

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartRun, loading = false }) => {
  const [e2bStatus] = useState<string>('Connected')
  const [llmStatus] = useState<string>('Connected')
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(true)
  const [githubToken, setGithubToken] = useState<string>('token_stored_on_server')
  const [tokenInput, setTokenInput] = useState<string>('')

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRepo, setSelectedRepo] = useState<string>('priya/shop-api')
  const [issueUrl, setIssueUrl] = useState<string>('https://github.com/priya/shop-api/issues/60')

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (tokenInput.trim().length >= 8) {
      setGithubToken(tokenInput.trim())
      setIsTokenVerified(true)
      setTokenInput('')
    }
  }

  const handleIssueUrlChange = (url: string) => {
    setIssueUrl(url)
    const match = url.match(/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)/)
    if (match && match[1]) {
      const extractedRepo = match[1]
      setSelectedRepo(extractedRepo)
    }
  }

  const handleSelectRepo = (repo: RepoOption) => {
    if (repo.status === 'not-allowed') return
    setSelectedRepo(repo.name)
    if (repo.defaultIssueUrl) {
      setIssueUrl(repo.defaultIssueUrl)
    }
  }

  const sanitizeRepo = (raw: string): string => {
    return raw
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/^github\.com\//i, '')
      .replace(/\/+$/, '')
  }

  const handleStart = () => {
    const clean = sanitizeRepo(selectedRepo)
    const activeRepo = REPO_OPTIONS.find((r) => r.name === clean)
    onStartRun({
      repo: clean,
      issue_url: issueUrl,
      issue_title: activeRepo?.defaultIssueTitle || `Resolve issue in ${clean}`,
      issue_description: 'Autonomous resolution of reported bug and test verification.',
    })
  }

  const cleanSearch = sanitizeRepo(searchQuery)
  const cleanSelected = sanitizeRepo(selectedRepo)

  const customRepoOption: RepoOption | null =
    cleanSearch.includes('/') &&
    !REPO_OPTIONS.some((r) => r.name.toLowerCase() === cleanSearch.toLowerCase())
      ? {
          name: cleanSearch,
          status: 'allowed',
          statusLabel: 'Custom repo · allowed',
          defaultIssueUrl: `https://github.com/${cleanSearch}/issues/1`,
          defaultIssueTitle: `Resolve issue in ${cleanSearch}`,
        }
      : cleanSelected && !REPO_OPTIONS.some((r) => r.name === cleanSelected)
      ? {
          name: cleanSelected,
          status: 'allowed',
          statusLabel: 'Custom repo · allowed',
          defaultIssueUrl: issueUrl,
          defaultIssueTitle: `Resolve issue in ${cleanSelected}`,
        }
      : null

  const filteredRepos = [
    ...(customRepoOption ? [customRepoOption] : []),
    ...REPO_OPTIONS.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  ]

  const isFormValid = isTokenVerified && selectedRepo && issueUrl.trim().length > 0
  const activeRepoObj = REPO_OPTIONS.find((r) => r.name === selectedRepo)

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Compact Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#18181b]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist leading-tight">
            Launch Autonomous SWE Run
          </h1>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">
            Link a GitHub issue and choose an authorized repository to dispatch the multi-agent workflow.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="badge-warm text-[11px]">LangGraph Multi-Agent</span>
          <span className="badge-warm text-[11px]">E2B MicroVMs</span>
        </div>
      </div>

      {/* 2-Column Horizontal Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT COLUMN: Issue Input & Repository Whitelist (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Target GitHub Issue */}
          <section
            aria-labelledby="issue-heading"
            className="card-canvas-elevated p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e5e5]">
              <h2 id="issue-heading" className="text-xs font-extrabold text-[#18181b] tracking-tight font-geist uppercase">
                1. Target GitHub Issue
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#666666] font-bold">Presets:</span>
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedRepo(preset.repo)
                      setIssueUrl(preset.url)
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border border-[#18181b] transition cursor-pointer ${
                      issueUrl === preset.url
                        ? 'bg-[#fff4da] text-[#18181b] shadow-[1px_1px_0px_#18181b]'
                        : 'bg-white text-[#666666] hover:bg-[#fffdf8]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="issue-url-input" className="block text-[11px] font-bold text-[#18181b] mb-1">
                Issue URL:
              </label>
              <input
                id="issue-url-input"
                type="url"
                required
                value={issueUrl}
                onChange={(e) => handleIssueUrlChange(e.target.value)}
                placeholder="https://github.com/org/repo/issues/60"
                className="w-full bg-white border-2 border-[#18181b] rounded-md px-3 py-2 text-xs text-[#18181b] placeholder-[#666666] focus:outline-none focus:border-[#d31611]"
              />
            </div>
          </section>

          {/* Repository Selection */}
          <section
            aria-labelledby="repo-heading"
            className="card-canvas-elevated p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e5e5]">
              <h2 id="repo-heading" className="text-xs font-extrabold text-[#18181b] tracking-tight font-geist uppercase">
                2. Whitelisted Repository
              </h2>
              <span className="text-[10px] text-[#666666] font-mono">
                ALLOWED_REPOS
              </span>
            </div>

            <div>
              <input
                id="repo-search-input"
                type="text"
                placeholder="Search or enter custom repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-[#18181b] rounded-md px-3 py-1.5 text-xs text-[#18181b] placeholder-[#666666] focus:outline-none focus:border-[#d31611]"
              />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredRepos.map((repo) => {
                const isSelected = selectedRepo === repo.name
                const isAllowed = repo.status !== 'not-allowed'

                let rowStyle = 'border border-[#e5e5e5] hover:border-[#18181b] bg-white'
                if (isSelected) {
                  rowStyle = 'border-2 border-[#18181b] bg-[#fff4da] shadow-[1px_1px_0px_#18181b]'
                } else if (!isAllowed) {
                  rowStyle = 'border border-[#e5e5e5] bg-[#fffdf8] opacity-60 cursor-not-allowed'
                }

                return (
                  <div
                    key={repo.name}
                    onClick={() => handleSelectRepo(repo)}
                    className={`rounded-md p-2.5 flex items-center justify-between text-xs transition select-none ${
                      isAllowed ? 'cursor-pointer' : 'cursor-not-allowed'
                    } ${rowStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border border-[#18181b] flex items-center justify-center ${
                          isSelected ? 'bg-[#d31611]' : 'bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <span
                        className={`font-bold ${
                          isSelected ? 'text-[#18181b]' : !isAllowed ? 'text-[#666666]' : 'text-[#18181b]'
                        }`}
                      >
                        {repo.name}
                      </span>
                    </div>

                    <div className="text-[11px]">
                      {repo.status === 'test-allowed' ? (
                        <span className="badge-warm text-[10px]">{repo.statusLabel}</span>
                      ) : repo.status === 'allowed' ? (
                        <span className="text-[#666666] font-semibold">{repo.statusLabel}</span>
                      ) : (
                        <span className="badge-accent text-[10px]">{repo.statusLabel}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Credentials & Launch Control Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Execution Credentials */}
          <section
            aria-labelledby="credentials-heading"
            className="card-canvas-elevated p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#e5e5e5]">
              <h2 id="credentials-heading" className="text-xs font-extrabold text-[#18181b] tracking-tight font-geist uppercase">
                3. Execution Credentials
              </h2>
              <span className="badge-warm text-[10px]">Server Verified</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#e5e5e5]">
              <div>
                <p className="font-bold text-[#18181b]">E2B Cloud Sandbox</p>
                <p className="text-[10px] text-[#666666]">Firecracker MicroVM</p>
              </div>
              <span className="badge-warm text-[10px]">{e2bStatus}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#e5e5e5]">
              <div>
                <p className="font-bold text-[#18181b]">LLM Provider</p>
                <p className="text-[10px] text-[#666666]">Gemini 2.5 Flash</p>
              </div>
              <span className="badge-warm text-[10px]">{llmStatus}</span>
            </div>

            {isTokenVerified ? (
              <div className="flex items-center justify-between text-xs py-1">
                <div>
                  <p className="font-bold text-[#18181b]">GitHub Token</p>
                  <p className="text-[10px] text-[#666666] font-mono">({githubToken.slice(0, 14)}...)</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="badge-warm text-[10px]">Connected</span>
                  <button
                    type="button"
                    onClick={() => setIsTokenVerified(false)}
                    className="text-[10px] font-bold text-[#d31611] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyToken} className="flex gap-1.5 pt-1">
                <input
                  type="password"
                  required
                  placeholder="ghp_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="flex-1 bg-white border border-[#18181b] rounded px-2 py-1 text-xs"
                />
                <button type="submit" className="btn-cta text-xs py-1 px-2.5">
                  Verify
                </button>
              </form>
            )}
          </section>

          {/* Launch Action Summary Card */}
          <section className="bg-[#fff4da] border-2 border-[#18181b] rounded-xl p-4 shadow-[3px_3px_0px_#18181b] space-y-3">
            <div className="border-b-2 border-[#18181b] pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#d31611]">
                Launch Control
              </span>
              <h3 className="text-base font-extrabold text-[#18181b] font-geist mt-0.5">
                Ready to Dispatch Agent
              </h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-0.5 border-b border-[#18181b]/20">
                <span className="text-[#666666] font-medium">Selected Repo:</span>
                <span className="font-bold text-[#18181b] font-mono">{selectedRepo}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#18181b]/20">
                <span className="text-[#666666] font-medium">Issue Target:</span>
                <span className="font-bold text-[#18181b] truncate max-w-[200px]">
                  {activeRepoObj?.defaultIssueTitle || issueUrl}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#666666] font-medium">Safety Gate:</span>
                <span className="font-bold text-[#18181b]">Mandatory HITL Review</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={!isFormValid || loading}
              className={`w-full py-2.5 text-center text-xs font-extrabold transition cursor-pointer ${
                isFormValid && !loading ? 'btn-cta' : 'btn-warm opacity-50 cursor-not-allowed'
              }`}
            >
              {loading ? 'Starting autonomous run...' : 'Start SWE run &rarr;'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
