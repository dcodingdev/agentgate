import { useCallback, useEffect, useState } from 'react'
import type {
  CreateRunRequest,
  GraphNodeId,
  RunStateResponse,
  ScreenId,
  StreamEventPayload,
  TerminologyMode,
} from './types'
import { createRun, getRunState, resumeRun, subscribeToRunEvents } from './services/api'
import { TopAppBar } from './components/TopAppBar'
import { LeftNavRail } from './components/LeftNavRail'
import { ExecutionGraph } from './components/ExecutionGraph'
import { SetupScreen } from './components/screens/SetupScreen'
import { LiveSandboxScreen } from './components/screens/LiveSandboxScreen'
import { EveryStageScreen } from './components/screens/EveryStageScreen'
import { ApprovalGateScreen } from './components/screens/ApprovalGateScreen'
import { ClarificationScreen } from './components/screens/ClarificationScreen'
import { BlockedScreen } from './components/screens/BlockedScreen'
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
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(72)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Session context matching Image 1 & Image 2
  const [activeRepo, setActiveRepo] = useState<string>('priya/shop-api')
  const [activeIssueTitle, setActiveIssueTitle] = useState<string>('Login tokens never expire')
  const [activeIssueNumber, setActiveIssueNumber] = useState<string | number>('60')
  const [sandboxId, setSandboxId] = useState<string>('sbx_8f21')
  const [currentAttempt, setCurrentAttempt] = useState<number>(2)
  const [showWorkflowGraph, setShowWorkflowGraph] = useState<boolean>(false)
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNodeId | null>(null)
  const terminologyMode: TerminologyMode = 'plain' // Permanently Plain mode

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
    <div className="min-h-screen bg-[#fffdf8] text-[#18181b] flex flex-col font-sans selection:bg-[#fff4da] selection:text-[#d31611]">
      {/* 1. Sleek Top Application Bar */}
      <TopAppBar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => {
          setCurrentScreen(screen)
          setErrorMessage(null)
        }}
      />

      {/* 2. Workspace Body: Left Navigation Rail + Right Main Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail (Contains Navigation & Workflow Graph Toggle) */}
        <LeftNavRail
          currentScreen={currentScreen}
          onSelectScreen={(screen) => {
            setCurrentScreen(screen)
            setErrorMessage(null)
          }}
          activeRunsCount={2}
          pendingSignOffCount={1}
          showWorkflowGraph={showWorkflowGraph}
          onToggleWorkflowGraph={() => setShowWorkflowGraph((prev) => !prev)}
        />

        {/* Right Main Canvas Content */}
        <main className="flex-1 overflow-y-auto bg-[#fffdf8] pb-12">
          {/* LangGraph Multi-Agent Stepper (Toggled on Demand) */}
          {showWorkflowGraph && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
              <ExecutionGraph
                currentNode={
                  runState?.values?.current_node ||
                  (runState?.status === 'paused_hitl'
                    ? 'hitl'
                    : currentScreen === 'live-sandbox'
                    ? 'verify'
                    : currentScreen === 'approval-gate'
                    ? 'hitl'
                    : currentScreen === 'finished'
                    ? 'pr_agent'
                    : currentScreen === 'blocked'
                    ? 'guardrail'
                    : null)
                }
                completedNodes={
                  (runState?.values?.completed_nodes as string[]) ||
                  (currentScreen === 'live-sandbox'
                    ? ['guardrail', 'supervisor', 'research', 'fix_test']
                    : currentScreen === 'approval-gate'
                    ? ['guardrail', 'supervisor', 'research', 'fix_test', 'verify', 'reviewer']
                    : currentScreen === 'finished'
                    ? ['guardrail', 'supervisor', 'research', 'fix_test', 'verify', 'reviewer', 'hitl', 'pr_agent']
                    : currentScreen === 'clarification'
                    ? ['guardrail', 'supervisor']
                    : currentScreen === 'blocked'
                    ? []
                    : [])
                }
                status={
                  runState?.status ||
                  (currentScreen === 'approval-gate'
                    ? 'paused_hitl'
                    : currentScreen === 'finished'
                    ? 'completed'
                    : currentScreen === 'blocked'
                    ? 'rejected'
                    : currentScreen === 'clarification'
                    ? 'waiting'
                    : currentScreen === 'setup'
                    ? 'idle'
                    : 'running')
                }
                selectedNode={selectedGraphNode}
                onSelectNode={setSelectedGraphNode}
              />
            </section>
          )}

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
            />
          )}

          {currentScreen === 'every-stage' && <EveryStageScreen />}

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
              prUrl={runState?.pr_url || `https://github.com/${activeRepo}/pull/61`}
              repo={activeRepo}
              prNumber={activeIssueNumber}
              onStartNewRun={() => setCurrentScreen('setup')}
            />
          )}

          {currentScreen === 'policies' && (
            <PoliciesScreen terminologyMode={terminologyMode} />
          )}

          {currentScreen === 'audit' && (
            <AuditScreen terminologyMode={terminologyMode} />
          )}
        </main>
      </div>
    </div>
  )
}
