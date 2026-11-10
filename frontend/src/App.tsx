import { useCallback, useEffect, useState } from 'react'
import type {
  CreateRunRequest,
  RunStateResponse,
  ScreenId,
  StreamEventPayload,
} from './types'
import { createRun, getRunState, resumeRun, subscribeToRunEvents } from './services/api'
import { Header } from './components/Header'
import { SetupScreen } from './components/screens/SetupScreen'
import { LiveSandboxScreen } from './components/screens/LiveSandboxScreen'
import { EveryStageScreen } from './components/screens/EveryStageScreen'
import { ApprovalGateScreen } from './components/screens/ApprovalGateScreen'
import { ClarificationScreen } from './components/screens/ClarificationScreen'
import { BlockedScreen } from './components/screens/BlockedScreen'
import { FinishedScreen } from './components/screens/FinishedScreen'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('setup')
  const [threadId, setThreadId] = useState<string | null>(() => {
    return localStorage.getItem('agentgate_active_thread') || null
  })

  const [runState, setRunState] = useState<RunStateResponse | null>(null)
  const [events, setEvents] = useState<StreamEventPayload[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(72)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Session context matching Image 1 & Image 2
  const [activeRepo, setActiveRepo] = useState<string>('priya/shop-api')
  const [activeIssueTitle, setActiveIssueTitle] = useState<string>('Login tokens never expire')
  const [activeIssueNumber, setActiveIssueNumber] = useState<string | number>('60')
  const [sandboxId, setSandboxId] = useState<string>('sbx_8f21')
  const [currentAttempt, setCurrentAttempt] = useState<number>(2)

  // Timer for running badge
  useEffect(() => {
    if (
      currentScreen === 'setup' ||
      currentScreen === 'blocked' ||
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
          setCurrentScreen('blocked')
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

  // Start run handler
  const handleStartRun = async (request: CreateRunRequest) => {
    try {
      setLoading(true)
      setErrorMessage(null)
      setActiveRepo(request.repo)
      setActiveIssueTitle(request.issue_title || 'Autonomous bugfix')

      const match = request.issue_url.match(/issues\/(\d+)/)
      setActiveIssueNumber(match ? match[1] : '60')

      // Check if unapproved repo is passed
      if (request.repo === 'org/internal-tools') {
        setCurrentScreen('blocked')
        setLoading(false)
        return
      }

      const res = await createRun(request)
      setThreadId(res.thread_id)
      setEvents([])
      setElapsedSeconds(0)
      setCurrentScreen('live-sandbox')
    } catch (err: any) {
      setErrorMessage(
        'Backend connection note: Could not reach FastAPI at http://127.0.0.1:8000. ' +
        (err.message || 'Make sure the backend is running.')
      )
      // Still show the live sandbox preview on canvas
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
      setCurrentScreen('blocked')
      return
    }
    try {
      await resumeRun(threadId, { approved: false, feedback: reason })
      setCurrentScreen('blocked')
      syncState(threadId)
    } catch (err) {
      console.error('Failed to resume with rejection:', err)
      setCurrentScreen('blocked')
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

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#1a1918] flex flex-col font-sans selection:bg-[#18533e]/15 selection:text-[#18533e]">
      {/* Single Top Header matching DevPilot specs */}
      <Header
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        onNavigateHome={() => {
          setCurrentScreen('setup')
          setErrorMessage(null)
        }}
        repo={activeRepo}
        issueTitle={activeIssueTitle}
        issueNumber={activeIssueNumber}
        elapsedSeconds={elapsedSeconds}
      />

      {/* 3. Error Banner */}
      {errorMessage && (
        <aside
          role="alert"
          aria-label="System notification"
          className="max-w-3xl mx-auto mt-4 px-4 w-full"
        >
          <div className="p-4 bg-[#fef5ea] border border-[#fae3cd] rounded-xl text-xs text-[#8a5314] flex items-start justify-between gap-3 shadow-xs">
            <div>
              <p className="font-semibold text-[#8a5314]">Canvas Preview Mode Active</p>
              <p className="mt-1 leading-relaxed text-[#52504a]">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#8a5314] hover:text-[#52504a] font-bold px-2 py-1 rounded min-h-[36px]"
              aria-label="Dismiss error notice"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* 4. Active Screen Rendered on Canvas */}
      <main className="flex-1 pb-16">
        {currentScreen === 'setup' && (
          <SetupScreen onStartRun={handleStartRun} loading={loading} />
        )}

        {currentScreen === 'live-sandbox' && (
          <LiveSandboxScreen
            sandboxId={sandboxId}
            currentAttempt={currentAttempt}
            maxAttempts={3}
            events={events}
          />
        )}

        {currentScreen === 'every-stage' && <EveryStageScreen />}

        {currentScreen === 'approval-gate' && (
          <ApprovalGateScreen
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            onReject={handleReject}
          />
        )}

        {currentScreen === 'clarification' && (
          <ClarificationScreen
            onSubmitClarification={(_choice, _notes) => {
              setCurrentScreen('live-sandbox')
            }}
          />
        )}

        {currentScreen === 'blocked' && (
          <BlockedScreen
            onRetryWithRepo={(repo) => {
              setActiveRepo(repo)
              setCurrentScreen('setup')
            }}
          />
        )}

        {currentScreen === 'finished' && (
          <FinishedScreen
            prUrl={runState?.pr_url || 'https://github.com/priya/shop-api/pull/42'}
            repo={activeRepo}
            onStartNewRun={() => setCurrentScreen('setup')}
          />
        )}
      </main>
    </div>
  )
}
