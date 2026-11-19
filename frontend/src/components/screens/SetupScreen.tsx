import React, { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Key,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { CreateRunRequest, TerminologyMode } from '../../types'
import { formatDualTerm } from '../../utils/terminology'

interface SetupScreenProps {
  onStartRun: (request: CreateRunRequest) => void
  loading?: boolean
  terminologyMode?: TerminologyMode
  githubToken?: string
  githubUsername?: string
  onOpenSecretModal?: () => void
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartRun,
  loading = false,
  terminologyMode = 'both',
  githubToken: propGithubToken,
  githubUsername: propGithubUsername,
  onOpenSecretModal,
}) => {
  // Dual-vocabulary labels
  const { primary: safeLabTitle, secondary: safeLabTech } = formatDualTerm(
    'Patch & Test',
    'fix_test',
    terminologyMode
  )

  // Single Target GitHub Issue Input State (No samples, no presets)
  const [issueUrl, setIssueUrl] = useState<string>('')
  const [repo, setRepo] = useState<string>('')
  const [issueNumber, setIssueNumber] = useState<string>('')
  const [issueTitle, setIssueTitle] = useState<string>('')
  const [issueDescription, setIssueDescription] = useState<string>('')
  const [issueLabels, setIssueLabels] = useState<string[]>([])
  const [fetchingIssue, setFetchingIssue] = useState<boolean>(false)

  // Optional guidance & advanced settings
  const [customGuidance, setCustomGuidance] = useState<string>('')
  const [autoOpenPr, setAutoOpenPr] = useState<boolean>(false)
  const [retryCap, setRetryCap] = useState<number>(3)
  const policyThreshold = 0.7 // Locked policy threshold

  // Accordion toggle states (both closed by default)
  const [showGuidance, setShowGuidance] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // Individual user GitHub API Key state
  const [githubToken, setGithubToken] = useState<string>(() => {
    return (
      propGithubToken ||
      (typeof window !== 'undefined' && localStorage.getItem('agentgate_github_token')) ||
      ''
    )
  })
  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return (
      propGithubUsername ||
      (typeof window !== 'undefined' && localStorage.getItem('agentgate_github_username')) ||
      ''
    )
  })
  const [showToken, setShowToken] = useState<boolean>(false)

  // Sync token from props
  useEffect(() => {
    if (propGithubToken !== undefined) {
      setGithubToken(propGithubToken)
    }
  }, [propGithubToken])

  useEffect(() => {
    if (propGithubUsername !== undefined) {
      setGithubUsername(propGithubUsername)
    }
  }, [propGithubUsername])

  const handleTokenChange = (val: string) => {
    setGithubToken(val)
    if (val.trim()) {
      localStorage.setItem('agentgate_github_token', val.trim())
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${val.trim()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.login) {
            setGithubUsername(data.login)
            localStorage.setItem('agentgate_github_username', data.login)
          }
        })
        .catch(() => {})
    } else {
      localStorage.removeItem('agentgate_github_token')
      localStorage.removeItem('agentgate_github_username')
      setGithubUsername('')
    }
  }

  // Parse GitHub Issue URL and auto-fetch issue details
  const handleUrlChange = (url: string) => {
    setIssueUrl(url)
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i)
    if (match) {
      const detectedRepo = `${match[1]}/${match[2]}`
      const num = match[3]
      setRepo(detectedRepo)
      setIssueNumber(num)

      // Fetch live issue info from GitHub
      setFetchingIssue(true)
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      }
      if (githubToken.trim()) {
        headers.Authorization = `Bearer ${githubToken.trim()}`
      }
      fetch(`https://api.github.com/repos/${detectedRepo}/issues/${num}`, { headers })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.title) {
            setIssueTitle(data.title)
            setIssueDescription(data.body || '')
            if (Array.isArray(data.labels)) {
              setIssueLabels(
                data.labels
                  .map((l: any) => (typeof l === 'string' ? l : l.name))
                  .filter(Boolean)
              )
            }
          }
        })
        .catch(() => {})
        .finally(() => setFetchingIssue(false))
    } else {
      const repoMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/i)
      if (repoMatch) {
        setRepo(`${repoMatch[1]}/${repoMatch[2]}`)
      } else {
        setRepo('')
      }
      setIssueNumber('')
      setIssueTitle('')
      setIssueDescription('')
      setIssueLabels([])
    }
  }

  const handleStart = () => {
    if (!githubToken.trim()) {
      if (onOpenSecretModal) onOpenSecretModal()
      return
    }
    if (!issueUrl.trim()) return
    const derivedRepo =
      repo || (issueUrl.match(/github\.com\/([^/]+\/[^/]+)/)?.[1]) || 'custom/repo'
    onStartRun({
      repo: derivedRepo,
      issue_url: issueUrl.trim(),
      issue_title: issueTitle.trim() || (issueNumber ? `Issue #${issueNumber}` : 'Autonomous issue resolution'),
      issue_description: issueDescription.trim(),
      retry_cap: retryCap,
      policy_threshold: policyThreshold,
      auto_open_pr: autoOpenPr,
      team_lead_guidance: customGuidance.trim() || undefined,
      github_token: githubToken.trim() || undefined,
    })
  }

  const hasSecret = Boolean(githubToken.trim())
  const isValidUrl = Boolean(issueUrl.trim())

  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 space-y-4 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="pb-3 border-b-2 border-[#18181b]">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181b] font-geist">
          Start Autonomous Run
        </h1>
        <p className="text-sm text-[#555555] font-medium mt-0.5">
          Enter a target GitHub issue to launch deterministic agent resolution.
        </p>
      </div>

      {/* Secret Key Notice if not inserted */}
      {!hasSecret && (
        <aside
          role="alert"
          className="p-3.5 bg-[#fef3c7] border-2 border-[#d97706] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[2px_2px_0px_#d97706]"
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-[#d97706] shrink-0" />
            <span className="font-bold text-[#18181b]">
              GitHub Secret Required: Insert your personal access token to authorize real repository testing and pull request synthesis.
            </span>
          </div>
          {onOpenSecretModal && (
            <button
              type="button"
              onClick={onOpenSecretModal}
              className="px-3.5 py-1.5 bg-[#18181b] text-white rounded-md font-bold text-xs hover:bg-[#d31611] transition cursor-pointer shrink-0 text-center"
            >
              Insert Secret Key &rarr;
            </button>
          )}
        </aside>
      )}

      {/* 2. Single Target GitHub Issue Input Card (No presets, no sample modes) */}
      <section className="card-canvas-elevated p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="issue-url-input"
            className="text-sm font-extrabold text-[#18181b] uppercase tracking-wider"
          >
            GitHub Issue URL
          </label>
          {repo && (
            <span className="text-xs font-mono font-bold text-[#0d9488] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded">
              {repo}
            </span>
          )}
        </div>

        <div>
          <input
            id="issue-url-input"
            type="url"
            value={issueUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://github.com/owner/repository/issues/123"
            className="w-full bg-white border-2 border-[#18181b] rounded-lg px-3.5 py-2.5 text-sm sm:text-base font-mono text-[#18181b] focus:outline-none focus:border-[#0d9488] shadow-[2px_2px_0px_#18181b]"
          />
          <p className="text-xs text-[#666666] mt-1.5">
            Paste any GitHub issue link. The repository, issue number, and context are automatically resolved.
          </p>
        </div>

        {/* Live Detected / Fetched Issue Info Card */}
        {issueUrl.trim() && (
          <div className="p-3 rounded-lg border border-[#18181b] bg-[#fffdf8] space-y-1.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold font-mono text-xs sm:text-sm text-[#18181b]">
                  {repo || 'Detecting repository...'}
                </span>
                {issueNumber && (
                  <span className="badge-teal text-xs">Issue #{issueNumber}</span>
                )}
              </div>
              {fetchingIssue && (
                <span className="text-xs text-[#666666] font-mono animate-pulse">
                  Fetching issue details from GitHub...
                </span>
              )}
            </div>

            {issueTitle && (
              <h2 className="text-sm font-bold text-[#18181b] font-geist">
                {issueTitle}
              </h2>
            )}

            {issueLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {issueLabels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-white border border-[#e5e5e5] text-[11px] font-mono text-[#555555]"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Optional Guidance (Closed by default - click to expand) */}
      <section className="card-canvas-elevated overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowGuidance(!showGuidance)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#fffdf8] transition text-left"
        >
          <div className="flex items-center gap-2">
            {showGuidance ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#18181b]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#18181b]" />
            )}
            <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className="text-sm font-extrabold text-[#18181b]">
              Optional Guidance
            </span>
          </div>

          <span className="text-xs text-[#666666] font-mono">
            {customGuidance.trim() ? 'Directives Configured' : 'None (Click to add)'}
          </span>
        </button>

        {showGuidance && (
          <div className="px-3.5 pb-2.5 pt-1 border-t border-[#e5e5e5] bg-[#fffdf8] space-y-1.5 animate-in fade-in duration-150">
            <p className="text-xs text-[#555555]">
              Steer the agent's research and code generation strategy:
            </p>
            <textarea
              rows={2}
              value={customGuidance}
              onChange={(e) => setCustomGuidance(e.target.value)}
              placeholder="E.g., Ensure backward compatibility with existing configuration..."
              className="w-full bg-white border border-[#18181b] rounded-md p-2 text-sm text-[#18181b] focus:outline-none focus:border-[#0d9488]"
            />
          </div>
        )}
      </section>

      {/* 4. Advanced Settings & Personal Credentials (Closed by default) */}
      <section className="card-canvas-elevated overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#fffdf8] transition text-left"
        >
          <div className="flex items-center gap-2">
            {showAdvanced ? (
              <ChevronDown className="w-4 h-4 text-[#18181b]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#18181b]" />
            )}
            <span className="text-sm font-extrabold text-[#18181b]">
              Advanced Settings &amp; Personal Credentials
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#666666]">Retry: {retryCap}</span>
            <span className="text-[#666666]">·</span>
            <span className="text-[#666666]">
              {autoOpenPr ? 'Auto-PR: On' : 'Auto-PR: Off'}
            </span>
            <span className="text-[#666666]">·</span>
            <span className="text-[#0d9488] font-bold">
              {githubUsername ? `@${githubUsername}` : githubToken ? 'Connected' : 'Not Set'}
            </span>
          </div>
        </button>

        {showAdvanced && (
          <div className="p-3.5 border-t border-[#e5e5e5] bg-[#fffdf8] grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in duration-150">
            {/* Panel A: Execution Policies */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#18181b]">
                Execution Policies
              </span>

              {/* Policy 1: Auto-open PR */}
              <div className="p-2.5 rounded-lg border border-[#e5e5e5] bg-white flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <p className="font-bold text-[#18181b]">Auto-Open Pull Request</p>
                  <p className="text-xs text-[#666666]">Requires manual sign-off when off</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoOpenPr(!autoOpenPr)}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    autoOpenPr ? 'bg-[#0d9488]' : 'bg-[#e5e5e5]'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      autoOpenPr ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Policy 2: Retry Cap */}
              <div className="p-2.5 rounded-lg border border-[#e5e5e5] bg-white flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <p className="font-bold text-[#18181b]">
                    {safeLabTitle} Retry Limit{safeLabTech ? ` (${safeLabTech})` : ''}
                  </p>
                  <p className="text-xs text-[#666666]">Max self-healing test loops</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRetryCap(Math.max(1, retryCap - 1))}
                    className="w-6 h-6 rounded border border-[#18181b] bg-[#fffdf8] flex items-center justify-center font-bold cursor-pointer text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-xs sm:text-sm">
                    {retryCap}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRetryCap(Math.min(5, retryCap + 1))}
                    className="w-6 h-6 rounded border border-[#18181b] bg-[#fffdf8] flex items-center justify-center font-bold cursor-pointer text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel B: GitHub Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#18181b] flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#0d9488]" />
                  GitHub Token
                </span>
                <span className="text-xs font-mono text-[#0d9488] font-bold">
                  {githubUsername ? `● @${githubUsername}` : githubToken ? '● Connected' : 'Not Set'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-white border border-[#18181b] rounded px-2.5 py-1.5 text-xs font-mono text-[#18181b] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="px-2.5 py-1.5 rounded border border-[#18181b] bg-white text-xs font-bold hover:bg-[#fffdf8] transition cursor-pointer"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
                {githubToken && (
                  <button
                    type="button"
                    onClick={() => handleTokenChange('')}
                    className="px-2.5 py-1.5 rounded border border-[#e5e5e5] text-[#666666] hover:text-[#d31611] text-xs font-bold cursor-pointer"
                    title="Clear token"
                  >
                    Clear
                  </button>
                )}
              </div>

              {onOpenSecretModal && (
                <div className="flex items-center justify-end text-xs pt-0.5">
                  <button
                    type="button"
                    onClick={onOpenSecretModal}
                    className="text-[#0d9488] font-bold hover:underline cursor-pointer"
                  >
                    Configure in Modal &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 5. Minimal Launch Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Readiness Indicator */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {!hasSecret ? (
            <div className="flex items-center gap-1.5 text-[#d97706] font-bold">
              <Key className="w-4 h-4" />
              <span>GitHub Secret Required</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#0d9488] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Ready · @{githubUsername || 'token set'}</span>
            </div>
          )}
        </div>

        {/* Start Button */}
        {!hasSecret ? (
          <button
            type="button"
            onClick={onOpenSecretModal}
            className="py-2.5 px-8 text-center text-sm font-black transition cursor-pointer shadow-[2px_2px_0px_#18181b] bg-[#ebdbb7] text-[#18181b] border-2 border-[#18181b] hover:bg-[#d97706] hover:text-white"
          >
            Insert GitHub Secret to Run &rarr;
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !isValidUrl}
            className={`py-2.5 px-8 text-center text-sm font-black transition cursor-pointer shadow-[2px_2px_0px_#18181b] ${
              !isValidUrl
                ? 'bg-[#e5e5e5] text-[#888888] border-2 border-[#888888] cursor-not-allowed shadow-none'
                : 'btn-cta'
            }`}
          >
            {loading ? 'Dispatching autonomous agents...' : 'Start Autonomous Run \u2192'}
          </button>
        )}
      </div>
    </div>
  )
}
