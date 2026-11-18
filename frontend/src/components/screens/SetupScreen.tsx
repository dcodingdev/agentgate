import React, { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
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
}

interface IssuePreset {
  id: string
  label: string
  repo: string
  url: string
  title: string
  description: string
  acceptanceCriteria: string[]
  securityClassification: string
  securityLevel: 'critical' | 'high' | 'standard' | 'blocked'
}

const ISSUE_PRESETS: IssuePreset[] = [
  {
    id: '493',
    label: '#493 · Ed25519 Signature Support',
    repo: 'priya/shop-api',
    url: 'https://github.com/priya/shop-api/issues/493',
    title: 'Support Ed25519 asymmetric signatures for client tokens',
    description:
      'Migrate legacy signature verification in src/crypto/signatures.py to support Ed25519 (RFC 8037) asymmetric key signatures for client tokens.',
    acceptanceCriteria: [
      "Parse and validate 'EdDSA' algorithm in token header",
      'Verify token signatures using Ed25519 public keys from JWKS',
      'Pass all regression unit and concurrency tests in isolated sandbox',
    ],
    securityClassification: 'Tier-1 Critical · Cryptography',
    securityLevel: 'critical',
  },
  {
    id: '60',
    label: '#60 · Token Expiration',
    repo: 'priya/shop-api',
    url: 'https://github.com/priya/shop-api/issues/60',
    title: 'Login tokens never expire after user authentication',
    description:
      'Authentication session tokens remain valid indefinitely. Enforce strict UTC expiration checking and activity timestamps in session.py.',
    acceptanceCriteria: [
      'Enforce SESSION_MAX_AGE_SECONDS (3600s)',
      'Add regression test in tests/test_session.py',
    ],
    securityClassification: 'Tier-2 High Risk · Session Management',
    securityLevel: 'high',
  },
  {
    id: '5',
    label: '#5 · DB Migration (Blocked)',
    repo: 'org/internal-tools',
    url: 'https://github.com/org/internal-tools/issues/5',
    title: 'Database migration script failure on Postgres 16',
    description:
      'Migration script fails with table lock contention in internal tools repository.',
    acceptanceCriteria: ['Re-order foreign key constraints'],
    securityClassification: 'Blocked · Repository Not On Organization Allowlist',
    securityLevel: 'blocked',
  },
]

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStartRun,
  loading = false,
  terminologyMode = 'both',
}) => {
  // Dual-vocabulary labels
  const { primary: secGateTitle } = formatDualTerm(
    'Security Check',
    'guardrail',
    terminologyMode
  )
  const { primary: safeLabTitle, secondary: safeLabTech } = formatDualTerm(
    'Patch & Test',
    'fix_test',
    terminologyMode
  )

  // Selection states
  const [selectedPreset, setSelectedPreset] = useState<IssuePreset>(ISSUE_PRESETS[0])
  const [selectedRepo, setSelectedRepo] = useState<string>(ISSUE_PRESETS[0].repo)
  const [issueUrl, setIssueUrl] = useState<string>(ISSUE_PRESETS[0].url)
  const [customGuidance, setCustomGuidance] = useState<string>(
    'Ensure backward compatibility with existing RSA keys while adding Ed25519 support.'
  )

  // Policy states
  const [autoOpenPr, setAutoOpenPr] = useState<boolean>(false)
  const [retryCap, setRetryCap] = useState<number>(3)
  const policyThreshold = 0.7 // Locked policy threshold

  // Accordion toggle states (both closed by default to avoid vertical scrolling)
  const [showGuidance, setShowGuidance] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // Individual user GitHub API Key state (saved in browser localStorage)
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem('agentgate_github_token') || ''
  })
  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('agentgate_github_username')) || ''
  })
  const [showToken, setShowToken] = useState<boolean>(false)

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

  const handleSelectPreset = (preset: IssuePreset) => {
    setSelectedPreset(preset)
    setSelectedRepo(preset.repo)
    setIssueUrl(preset.url)
  }

  const handleStart = () => {
    onStartRun({
      repo: selectedRepo,
      issue_url: issueUrl,
      issue_title: selectedPreset.title,
      issue_description: selectedPreset.description,
      retry_cap: retryCap,
      policy_threshold: policyThreshold,
      auto_open_pr: autoOpenPr,
      team_lead_guidance: customGuidance,
      github_token: githubToken.trim() || undefined,
    })
  }

  const isBlockedRepo = selectedRepo === 'org/internal-tools'

  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-3 space-y-3 animate-in fade-in duration-200">
      {/* 1. Compact Header */}
      <div className="pb-2 border-b-2 border-[#18181b]">
        <h1 className="text-lg sm:text-xl font-extrabold text-[#18181b] tracking-[-0.03em] font-geist">
          Start Autonomous Run
        </h1>
        <p className="text-xs text-[#666666] font-medium">
          Select a target issue and launch deterministic agent resolution.
        </p>
      </div>

      {/* 2. Compact Target Issue Selection & Overview Card */}
      <section className="card-canvas-elevated p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-[#18181b] uppercase tracking-wider">
            Target Issue
          </span>
          <span className="text-[11px] font-mono font-bold text-[#666666]">
            {selectedRepo}
          </span>
        </div>

        {/* Quick Issue Preset Selectors */}
        <div className="flex flex-wrap gap-1.5">
          {ISSUE_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md border transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-2 border-[#18181b] bg-[#fff4da] text-[#18181b] shadow-[1px_1px_0px_#18181b]'
                    : 'border-[#e5e5e5] bg-white text-[#666666] hover:border-[#18181b]'
                }`}
              >
                <span>{preset.label}</span>
                {preset.securityLevel === 'critical' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d31611]"></span>
                )}
                {preset.securityLevel === 'blocked' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#991b1b]"></span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Issue Preview Card */}
        <div className="p-2.5 rounded-lg border border-[#18181b] bg-[#fffdf8] space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#18181b] font-geist truncate">
              {selectedPreset.title}
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                selectedPreset.securityLevel === 'critical'
                  ? 'bg-[#fee2e2] text-[#991b1b] border-[#dc2626]'
                  : selectedPreset.securityLevel === 'blocked'
                  ? 'bg-slate-200 text-slate-800 border-slate-400'
                  : 'bg-[#fef3c7] text-[#92400e] border-[#d97706]'
              }`}
            >
              {selectedPreset.securityClassification}
            </span>
          </div>

          <p className="text-xs text-[#666666] leading-relaxed line-clamp-2">
            {selectedPreset.description}
          </p>

          {/* Acceptance Criteria (Compact Flex Row) */}
          <div className="pt-1.5 border-t border-[#e5e5e5] flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#18181b]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#666666]">
              Criteria:
            </span>
            {selectedPreset.acceptanceCriteria.map((crit, idx) => (
              <span key={idx} className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-[#0d9488] shrink-0" />
                <span>{crit}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Optional Guidance (Closed by default - click to expand) */}
      <section className="card-canvas-elevated overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowGuidance(!showGuidance)}
          className="w-full px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-[#fffdf8] transition text-left"
        >
          <div className="flex items-center gap-2">
            {showGuidance ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#18181b]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#18181b]" />
            )}
            <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className="text-xs font-extrabold text-[#18181b]">
              Optional Guidance
            </span>
          </div>

          <span className="text-[10px] text-[#666666] font-mono">
            {customGuidance.trim() ? 'Directives Configured' : 'None (Click to add)'}
          </span>
        </button>

        {showGuidance && (
          <div className="px-3.5 pb-2.5 pt-1 border-t border-[#e5e5e5] bg-[#fffdf8] space-y-1.5 animate-in fade-in duration-150">
            <p className="text-[11px] text-[#666666]">
              Steer the agent's research and code generation strategy before decomposition:
            </p>
            <textarea
              rows={2}
              value={customGuidance}
              onChange={(e) => setCustomGuidance(e.target.value)}
              placeholder="E.g., Ensure backward compatibility with existing RSA keys..."
              className="w-full bg-white border border-[#18181b] rounded-md p-2 text-xs text-[#18181b] focus:outline-none focus:border-[#0d9488]"
            />
          </div>
        )}
      </section>

      {/* 4. Advanced Settings & Personal Credentials (Closed by default) */}
      <section className="card-canvas-elevated overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-[#fffdf8] transition text-left"
        >
          <div className="flex items-center gap-2">
            {showAdvanced ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#18181b]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#18181b]" />
            )}
            <span className="text-xs font-extrabold text-[#18181b]">
              Advanced Settings &amp; Personal Credentials
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-[#666666]">Retry: {retryCap}</span>
            <span className="text-[#666666]">·</span>
            <span className="text-[#666666]">
              {autoOpenPr ? 'Auto-PR: On' : 'Auto-PR: Off'}
            </span>
            <span className="text-[#666666]">·</span>
            <span className="text-[#0d9488] font-bold">
              {githubToken ? 'Custom Token' : 'Server Default'}
            </span>
          </div>
        </button>

        {showAdvanced && (
          <div className="p-3.5 border-t border-[#e5e5e5] bg-[#fffdf8] grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
            {/* Panel A: Execution Policies */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#18181b]">
                Execution Policies
              </span>

              {/* Policy 1: Auto-open PR */}
              <div className="p-2 rounded-lg border border-[#e5e5e5] bg-white flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#18181b]">Auto-Open Pull Request</p>
                  <p className="text-[10px] text-[#666666]">Requires manual sign-off when off</p>
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
              <div className="p-2 rounded-lg border border-[#e5e5e5] bg-white flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#18181b]">
                    {safeLabTitle} Retry Limit{safeLabTech ? ` (${safeLabTech})` : ''}
                  </p>
                  <p className="text-[10px] text-[#666666]">Max self-healing test loops</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRetryCap(Math.max(1, retryCap - 1))}
                    className="w-5 h-5 rounded border border-[#18181b] bg-[#fffdf8] flex items-center justify-center font-bold cursor-pointer text-xs"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-xs">
                    {retryCap}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRetryCap(Math.min(5, retryCap + 1))}
                    className="w-5 h-5 rounded border border-[#18181b] bg-[#fffdf8] flex items-center justify-center font-bold cursor-pointer text-xs"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel B: GitHub Secret */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#18181b] flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#0d9488]" />
                  GitHub Secret (Token)
                </span>
                <span className="text-[10px] font-mono text-[#0d9488] font-bold">
                  {githubUsername ? `● @${githubUsername}` : githubToken ? '● Custom Secret' : 'Server Default'}
                </span>
              </div>

              <p className="text-[10px] text-[#666666]">
                Stored locally in browser. Uses GitHub Secret to authenticate repository and open PRs.
              </p>

              <div className="flex items-center gap-1.5 pt-0.5">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-white border border-[#18181b] rounded px-2 py-1 text-xs font-mono text-[#18181b] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="px-2 py-1 rounded border border-[#18181b] bg-white text-xs font-bold hover:bg-[#fffdf8] transition cursor-pointer"
                >
                  {showToken ? 'Hide' : 'Show'}
                </button>
                {githubToken && (
                  <button
                    type="button"
                    onClick={() => handleTokenChange('')}
                    className="px-2 py-1 rounded border border-[#e5e5e5] text-[#666666] hover:text-[#d31611] text-xs font-bold cursor-pointer"
                    title="Clear token"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. Minimal Launch Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Readiness Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {isBlockedRepo ? (
            <div className="flex items-center gap-1.5 text-[#d31611] font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Restricted Repository: Security Gate will block.</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#0d9488] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Sandboxes &amp; LLM Gateway Ready</span>
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className={`py-2 px-7 text-center text-xs font-black transition cursor-pointer shadow-[2px_2px_0px_#18181b] ${
            isBlockedRepo ? 'btn-warm opacity-80' : 'btn-cta'
          }`}
        >
          {loading ? (
            'Dispatching autonomous agents...'
          ) : isBlockedRepo ? (
            `Test ${secGateTitle} (Will Block)`
          ) : (
            'Start Autonomous Run \u2192'
          )}
        </button>
      </div>
    </div>
  )
}
