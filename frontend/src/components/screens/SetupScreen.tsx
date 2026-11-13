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

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartRun, loading = false }) => {
  // Credential states
  const [e2bStatus] = useState<string>('Connected')
  const [llmStatus] = useState<string>('Connected')
  const [isTokenVerified, setIsTokenVerified] = useState<boolean>(true)
  const [githubToken, setGithubToken] = useState<string>('token_stored_on_server')
  const [tokenInput, setTokenInput] = useState<string>('')

  // Repo & Issue states
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

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-8 space-y-7 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-normal text-[#1a1918] tracking-tight">
          Set up before the first run
        </h1>
        <p className="text-xs text-[#706c64] mt-1">
          Verify sandbox credentials, select an authorized repository, and link the GitHub issue.
        </p>
      </div>

      {/* 1. Credentials Card */}
      <section
        aria-labelledby="credentials-heading"
        className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
      >
        <div className="flex items-baseline justify-between pb-1 border-b border-[#f2f0ea]">
          <h2 id="credentials-heading" className="text-sm font-semibold text-[#1a1918]">
            1. Credentials
          </h2>
          <span className="text-xs text-[#8c8980]">
            Stored on the server, never sent to the sandbox
          </span>
        </div>

        {/* E2B row */}
        <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#f2f0ea]">
          <span className="text-[#302e2b]">E2B sandbox key</span>
          <span className="text-xs font-semibold text-[#1b6348] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1b6348]"></span>
            {e2bStatus}
          </span>
        </div>

        {/* LLM key row */}
        <div className="flex items-center justify-between text-sm py-1.5 border-b border-[#f2f0ea]">
          <span className="text-[#302e2b]">LLM key</span>
          <span className="text-xs font-semibold text-[#1b6348] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1b6348]"></span>
            {llmStatus}
          </span>
        </div>

        {/* GitHub token row: appears as input only if missing */}
        {isTokenVerified ? (
          <div className="flex items-center justify-between text-sm py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[#302e2b]">GitHub token</span>
              <span className="text-xs text-[#8c8980]">
                ({githubToken.slice(0, 14)}...)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#1b6348] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1b6348]"></span>
                Connected
              </span>
              <button
                type="button"
                onClick={() => setIsTokenVerified(false)}
                className="text-xs text-[#6e6a62] hover:text-[#18533e] underline cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#fef5ea] border border-[#fae3cd] rounded-xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#8a5314]">GitHub token</span>
              <span className="text-xs font-bold text-[#8a5314] px-2 py-0.5 rounded bg-[#fde9d2]">
                Status: Missing
              </span>
            </div>
            <p className="text-xs text-[#7d5019] leading-relaxed">
              Fine-grained token with contents and pull requests access for your test repo only.
            </p>
            <form onSubmit={handleVerifyToken} className="flex gap-2 pt-1">
              <label htmlFor="github-token-input" className="sr-only">
                GitHub Token
              </label>
              <input
                id="github-token-input"
                type="password"
                required
                placeholder="github_pat_..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 bg-white border border-[#e5decb] rounded-lg px-3 py-2 text-xs text-[#201e1b] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#18533e] min-h-[44px]"
              />
              <button
                type="submit"
                className="min-h-[44px] bg-[#18533e] hover:bg-[#134433] text-white text-xs font-medium px-4 py-2 rounded-lg transition cursor-pointer"
              >
                Save and verify
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 2. Repository Card */}
      <section
        aria-labelledby="repo-heading"
        className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
      >
        <div>
          <h2 id="repo-heading" className="text-sm font-semibold text-[#1a1918]">
            2. Repository
          </h2>
          <p className="text-xs text-[#8c8980] mt-0.5">
            Search repos (available after the token is verified)
          </p>
        </div>

        {/* Search input with accessible label */}
        <div>
          <label htmlFor="repo-search-input" className="sr-only">
            Search repositories
          </label>
          <input
            id="repo-search-input"
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#e5e2db] rounded-lg px-3.5 py-2.5 text-xs text-[#201e1b] placeholder-[#9c978f] focus:outline-none focus:border-[#18533e] min-h-[44px]"
          />
        </div>

        {/* Repo options */}
        <div className="space-y-2 pt-1">
          {filteredRepos.map((repo) => {
            const isSelected = selectedRepo === repo.name
            const isAllowed = repo.status !== 'not-allowed'

            let rowStyle = 'border border-[#e7e5de] hover:border-[#cdc9bf]'
            if (isSelected) {
              rowStyle = 'border-2 border-[#18533e] bg-[#f8faf8]'
            } else if (!isAllowed) {
              rowStyle = 'border border-[#eeebe5] bg-[#faf8f5] opacity-65 cursor-not-allowed'
            }

            return (
              <div
                key={repo.name}
                onClick={() => handleSelectRepo(repo)}
                className={`min-h-[48px] rounded-xl p-3.5 flex items-center justify-between text-xs transition select-none ${
                  isAllowed ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${rowStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-[#18533e] bg-[#18533e]'
                        : 'border-[#c5c1b6] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-[#18533e]' : !isAllowed ? 'text-[#757168]' : 'text-[#2b2926]'
                    }`}
                  >
                    {repo.name}
                  </span>
                </div>

                <div className="text-xs">
                  {repo.status === 'test-allowed' ? (
                    <span className="text-[#18533e] font-semibold">{repo.statusLabel}</span>
                  ) : repo.status === 'allowed' ? (
                    <span className="text-[#68655e]">{repo.statusLabel}</span>
                  ) : (
                    <span className="text-[#8c8980] italic">
                      {repo.statusLabel} (Safety: Disabled)
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. Issue Card */}
      <section
        aria-labelledby="issue-heading"
        className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3"
      >
        <div>
          <h2 id="issue-heading" className="text-sm font-semibold text-[#1a1918]">
            3. Issue
          </h2>
          <label htmlFor="issue-url-input" className="block text-xs text-[#8c8980] mt-0.5">
            Paste an issue URL, or pick an open issue after connecting
          </label>
        </div>

        <input
          id="issue-url-input"
          type="url"
          required
          value={issueUrl}
          onChange={(e) => handleIssueUrlChange(e.target.value)}
          placeholder="https://github.com/org/repo/issues/60"
          className="w-full bg-white border border-[#e5e2db] rounded-lg px-3.5 py-2.5 text-xs text-[#201e1b] placeholder-[#9c978f] focus:outline-none focus:border-[#18533e] min-h-[44px]"
        />
      </section>

      {/* Bottom Start Action matching Image 1 */}
      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={handleStart}
          disabled={!isFormValid || loading}
          className={`min-h-[44px] px-6 py-2.5 rounded-lg text-xs font-semibold transition ${
            isFormValid && !loading
              ? 'bg-[#18533e] hover:bg-[#134433] text-white shadow-sm cursor-pointer'
              : 'bg-[#d8d4cc] text-[#78746c] cursor-not-allowed'
          }`}
        >
          {loading ? 'Starting run...' : 'Start run'}
        </button>

        <span className="text-xs text-[#6e6a62]">
          {!isTokenVerified
            ? 'Add and verify a GitHub token to continue'
            : 'Ready to launch autonomous SWE workflow'}
        </span>
      </div>
    </div>
  )
}

