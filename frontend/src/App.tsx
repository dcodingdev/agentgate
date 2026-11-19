import { useCallback, useEffect, useState } from 'react'
import type {
  CreateRunRequest,
  RunStateResponse,
  ScreenId,
  StreamEventPayload,
  TerminologyMode,
} from './types'
import { createRun, getRunState, resumeRun, subscribeToRunEvents } from './services/api'
import { TopAppBar } from './components/TopAppBar'
import { LeftNavRail } from './components/LeftNavRail'
import { GitHubSecretModal } from './components/GitHubSecretModal'
import { SetupScreen } from './components/screens/SetupScreen'
import { LiveSandboxScreen } from './components/screens/LiveSandboxScreen'
import { ApprovalGateScreen } from './components/screens/ApprovalGateScreen'
import { FinishedScreen } from './components/screens/FinishedScreen'
import { PoliciesScreen } from './components/screens/PoliciesScreen'
import { AuditScreen } from './components/screens/AuditScreen'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('setup')
  const [threadId, setThreadId] = useState<string | null>(() => {
    return localStorage.getItem('agentgate_active_thread') || null
  })

  const [runState, setRunState] = useState<RunStateResponse | null>(null)
  const [events, setEvents] = useState<StreamEventPayload[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Active session context populated when a run is launched
  const [activeRepo, setActiveRepo] = useState<string>('')
  const [activeIssueTitle, setActiveIssueTitle] = useState<string>('')
  const [activeIssueNumber, setActiveIssueNumber] = useState<string | number>('')
  const [sandboxId, setSandboxId] = useState<string>('sbx-pending')
  const [currentAttempt, setCurrentAttempt] = useState<number>(1)
  const terminologyMode: TerminologyMode = 'plain' // Permanently Plain mode

  // GitHub Secret (PAT) State & Landing Modal
  const [githubToken, setGithubToken] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('agentgate_github_token')) || ''
  })
  const [githubUsername, setGithubUsername] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('agentgate_github_username')) || ''
  })
  const [showSecretModal, setShowSecretModal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const token = localStorage.getItem('agentgate_github_token')
    const dismissed = sessionStorage.getItem('agentgate_secret_dismissed')
    // First thing to ask when landing on website if secret is not set and not dismissed
    return !token && !dismissed
  })

  const handleSaveSecret = (token: string, username: string) => {
    setGithubToken(token)
    setGithubUsername(username)
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('agentgate_github_token', token)
      } else {
        localStorage.removeItem('agentgate_github_token')
      }
      if (username) {
        localStorage.setItem('agentgate_github_username', username)
      } else {
        localStorage.removeItem('agentgate_github_username')
      }
    }
  }

  // Timer for running badge
  useEffect(() => {
    if (
      currentScreen === 'setup' ||
      currentScreen === 'finished' ||
      runState?.status === 'completed' ||
      runState?.status === 'rejected'
    ) {
      return
    }
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [currentScreen, runState?.status])

  // Save active thread to localStorage
  useEffect(() => {
    if (threadId) {
      localStorage.setItem('agentgate_active_thread', threadId)
    }
  }, [threadId])

  // Sync state from backend
  const syncState = useCallback(async (targetThreadId?: string) => {
    const id = targetThreadId || threadId
    if (!id) return
    try {
      const data = await getRunState(id)
      setRunState(data)

      if (data.metadata?.repo) setActiveRepo(data.metadata.repo)
      if (data.values?.issue_title) setActiveIssueTitle(data.values.issue_title)
      if (data.metadata?.issue_url) {
        const match = data.metadata.issue_url.match(/issues\/(\d+)/)
        if (match) setActiveIssueNumber(match[1])
      }
      if (data.values?.sandbox_id) {
        setSandboxId(data.values.sandbox_id)
      }
      if (data.values?.retry_count) {
        setCurrentAttempt(data.values.retry_count + 1)
      }
    } catch (err) {
      console.warn('Could not sync run state:', err)
    }
  }, [threadId])

  // SSE Stream Listener
  useEffect(() => {
    if (!threadId) return

    syncState(threadId)

    const unsubscribe = subscribeToRunEvents(
      threadId,
      (eventPayload) => {
        setEvents((prev) => [...prev, eventPayload])
        const { event, data } = eventPayload

        if (event === 'node_update' && data.status) {
          setRunState((prev) => (prev ? { ...prev, status: data.status! } : prev))
          if (data.sandbox_id) setSandboxId(data.sandbox_id)
        }

        if (event === 'hitl_paused') {
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'paused_hitl',
                  risk_score: data.risk_score ?? prev.risk_score,
                }
              : null
          )
          // Automatically transition to approval gate when HITL pauses
          setCurrentScreen('approval-gate')
        }

        if (event === 'completed') {
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'completed',
                  pr_url: data.pr_url ?? prev.pr_url,
                }
              : null
          )
          setCurrentScreen('finished')
        }

        if (event === 'rejected') {
          setRunState((prev) => (prev ? { ...prev, status: 'rejected' } : null))
          setErrorMessage(data?.reason || 'Run was rejected by policy.')
        }

        if (event === 'done') {
          syncState(threadId)
        }
      },
      () => {},
      (err) => {
        console.warn('Stream notice:', err)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [threadId, syncState])

  // Start run handler - strictly enforces GitHub Secret key
  const handleStartRun = async (request: CreateRunRequest) => {
    if (!githubToken.trim()) {
      setShowSecretModal(true)
      setErrorMessage('GitHub Secret Key required. Please insert your Personal Access Token in the dialog to start a run.')
      return
    }

    try {
      setLoading(true)
      setErrorMessage(null)
      setActiveRepo(request.repo)
      setActiveIssueTitle(request.issue_title || 'Autonomous bugfix')

      const match = request.issue_url.match(/issues\/(\d+)/)
      setActiveIssueNumber(match ? match[1] : '')

      const res = await createRun({
        ...request,
        github_token: githubToken.trim(),
      })
      setThreadId(res.thread_id)
      setEvents([])
      setElapsedSeconds(0)
      setCurrentScreen('live-sandbox')
    } catch (err: any) {
      setErrorMessage(
        'Backend connection note: Could not reach FastAPI at http://127.0.0.1:8000. ' +
        (err.message || 'Make sure the backend is running.')
      )
      // Show the live sandbox on canvas
      setCurrentScreen('live-sandbox')
    } finally {
      setLoading(false)
    }
  }

  // HITL decision handlers
  const handleApprove = async () => {
    if (!threadId) {
      setCurrentScreen('finished')
      return
    }
    try {
      await resumeRun(threadId, { approved: true })
      setCurrentScreen('live-sandbox')
      syncState(threadId)
    } catch (err) {
      console.error('Failed to resume with approval:', err)
      setCurrentScreen('finished')
    }
  }

  const handleReject = async (reason: string) => {
    if (!threadId) {
      setCurrentScreen('live-sandbox')
      return
    }
    try {
      await resumeRun(threadId, { approved: false, feedback: reason })
      setCurrentScreen('live-sandbox')
      syncState(threadId)
    } catch (err) {
      console.error('Failed to resume with rejection:', err)
      setCurrentScreen('live-sandbox')
    }
  }

  const handleRequestChanges = async (feedback: string) => {
    if (!threadId) {
      setCurrentScreen('live-sandbox')
      return
    }
    try {
      await resumeRun(threadId, { approved: false, feedback })
      setCurrentScreen('live-sandbox')
      syncState(threadId)
    } catch (err) {
      console.error('Failed to request changes:', err)
      setCurrentScreen('live-sandbox')
    }
  }

  // Derived execution states for clean new user & active run UX
  const hasActiveRun =
    runState?.status === 'running' ||
    (loading && currentScreen === 'live-sandbox') ||
    Boolean(
      threadId &&
      runState &&
      runState.status !== 'completed' &&
      runState.status !== 'rejected' &&
      runState.status !== 'paused_hitl'
    )
  const hasPendingApproval = Boolean(runState?.status === 'paused_hitl')
  const activeRunsCount = hasActiveRun ? 1 : 0
  const pendingSignOffCount = hasPendingApproval ? 1 : 0

  return (
    <div className="min-h-screen bg-[#fffdf8] text-[#18181b] flex flex-col font-sans selection:bg-[#fff4da] selection:text-[#d31611]">
      {/* 1. Sleek Top Application Bar */}
      <TopAppBar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => {
          setCurrentScreen(screen)
          setErrorMessage(null)
        }}
        githubUsername={githubUsername}
        onOpenSecretModal={() => setShowSecretModal(true)}
      />

      {/* 2. Workspace Body: Left Navigation Rail + Right Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail */}
        <LeftNavRail
          currentScreen={currentScreen}
          onSelectScreen={(screen) => {
            setCurrentScreen(screen)
            setErrorMessage(null)
          }}
          activeRunsCount={activeRunsCount}
          pendingSignOffCount={pendingSignOffCount}
          githubUsername={githubUsername}
          onOpenSecretModal={() => setShowSecretModal(true)}
        />

        {/* Right Main Canvas Content */}
        <main className="flex-1 overflow-y-auto bg-[#fffdf8] pb-12">
          {/* Error Banner */}
          {errorMessage && (
            <aside
              role="alert"
              aria-label="System notification"
              className="max-w-3xl mx-auto mt-4 px-4 w-full"
            >
              <div className="p-4 bg-[#fff4da] border-2 border-[#18181b] rounded-xl text-xs text-[#18181b] flex items-start justify-between gap-3 shadow-[2px_2px_0px_#18181b]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#d31611] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-[#18181b]">
                    !
                  </span>
                  <div>
                    <p className="font-bold text-[#18181b]">Canvas Preview Notice</p>
                    <p className="mt-1 leading-relaxed text-[#666666]">{errorMessage}</p>
                  </div>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-[#18181b] hover:text-[#d31611] font-bold px-2 py-1 rounded min-h-[36px] cursor-pointer"
                  aria-label="Dismiss error notice"
                >
                  ✕
                </button>
              </div>
            </aside>
          )}

          {/* Active Screen Rendered on Main Canvas */}
          {currentScreen === 'setup' && (
            <SetupScreen
              onStartRun={handleStartRun}
              loading={loading}
              terminologyMode={terminologyMode}
              githubToken={githubToken}
              githubUsername={githubUsername}
              onOpenSecretModal={() => setShowSecretModal(true)}
            />
          )}

          {currentScreen === 'live-sandbox' && (
            <LiveSandboxScreen
              sandboxId={sandboxId}
              currentAttempt={currentAttempt}
              maxAttempts={3}
              events={events}
              terminologyMode={terminologyMode}
              repo={activeRepo}
              issueTitle={activeIssueTitle}
              elapsedSeconds={elapsedSeconds}
              hasActiveRun={hasActiveRun}
              onStartNewRun={() => setCurrentScreen('setup')}
            />
          )}

          {currentScreen === 'approval-gate' && (
            <ApprovalGateScreen
              onApprove={handleApprove}
              onRequestChanges={handleRequestChanges}
              onReject={handleReject}
              terminologyMode={terminologyMode}
              repo={activeRepo}
              issueTitle={activeIssueTitle}
              hasPendingApproval={hasPendingApproval}
              onStartNewRun={() => setCurrentScreen('setup')}
            />
          )}

          {currentScreen === 'finished' && (
            <FinishedScreen
              prUrl={runState?.pr_url || (activeRepo ? `https://github.com/${activeRepo}/pull/1` : '')}
              repo={activeRepo}
              prNumber={activeIssueNumber}
              onStartNewRun={() => setCurrentScreen('setup')}
            />
          )}

          {currentScreen === 'policies' && (
            <PoliciesScreen terminologyMode={terminologyMode} />
          )}

          {currentScreen === 'audit' && (
            <AuditScreen
              terminologyMode={terminologyMode}
              onStartNewRun={() => setCurrentScreen('setup')}
            />
          )}
        </main>
      </div>

      {/* GitHub Secret Modal (Prompts on first landing or on demand) */}
      <GitHubSecretModal
        isOpen={showSecretModal}
        onClose={() => setShowSecretModal(false)}
        currentSecret={githubToken}
        currentUsername={githubUsername}
        onSaveSecret={handleSaveSecret}
      />
    </div>
  )
}
