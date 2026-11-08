import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Clock,
  Compass,
  History,
  Layers,
  Play,
  PlusCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type { GraphNodeId, RunStateResponse, StreamEventPayload } from './types'
import { getRunState, subscribeToRunEvents } from './services/api'
import { Header } from './components/Header'
import { CreateRunModal } from './components/CreateRunModal'
import { ExecutionGraph } from './components/ExecutionGraph'
import { HitlDecisionCard } from './components/HitlDecisionCard'
import { EventStreamLog } from './components/EventStreamLog'
import { RunSummary } from './components/RunSummary'

export default function App() {
  const [threadId, setThreadId] = useState<string | null>(() => {
    return localStorage.getItem('agentgate_active_thread') || null
  })
  const [runsList, setRunsList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('agentgate_runs_list')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [runState, setRunState] = useState<RunStateResponse | null>(null)
  const [events, setEvents] = useState<StreamEventPayload[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentNode, setCurrentNode] = useState<string | null>(null)
  const [completedNodes, setCompletedNodes] = useState<string[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNodeId | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Save runsList and threadId to localStorage
  useEffect(() => {
    if (threadId) {
      localStorage.setItem('agentgate_active_thread', threadId)
    }
  }, [threadId])

  useEffect(() => {
    localStorage.setItem('agentgate_runs_list', JSON.stringify(runsList))
  }, [runsList])

  // Fetch full snapshot state
  const syncState = useCallback(async (targetThreadId?: string) => {
    const id = targetThreadId || threadId
    if (!id) return
    try {
      const data = await getRunState(id)
      setRunState(data)

      // Derive completed nodes from values if available
      const nodesFinished: string[] = []
      if (data.values?.guardrail_passed) nodesFinished.push('guardrail')
      if (data.values?.sandbox_id) nodesFinished.push('supervisor')
      if (data.values?.research_findings) nodesFinished.push('research')
      if (data.values?.patch_diff) nodesFinished.push('fix_test')
      if (data.values?.test_results) nodesFinished.push('verify')
      if (data.values?.risk_score !== undefined) nodesFinished.push('reviewer')
      if (data.values?.hitl_approved !== undefined && data.values?.hitl_approved !== null) {
        nodesFinished.push('hitl')
      }
      if (data.values?.pr_url) nodesFinished.push('pr_agent')

      setCompletedNodes((prev) => Array.from(new Set([...prev, ...nodesFinished])))
    } catch (err: any) {
      console.warn('Could not sync state:', err)
    }
  }, [threadId])

  // Listen to Server-Sent Events for the active thread
  useEffect(() => {
    if (!threadId) {
      setIsStreaming(false)
      return
    }

    setIsStreaming(true)
    syncState(threadId)

    const unsubscribe = subscribeToRunEvents(
      threadId,
      (eventPayload) => {
        setEvents((prev) => [...prev, eventPayload])

        const { event, data } = eventPayload

        if (event === 'node_update' && data.node) {
          setCurrentNode(data.node)
          setCompletedNodes((prev) => Array.from(new Set([...prev, data.node!])))
          if (data.status) {
            setRunState((prev) => prev ? { ...prev, status: data.status! } : prev)
          }
        }

        if (event === 'hitl_paused') {
          setCurrentNode('hitl')
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'paused_hitl',
                  risk_score: data.risk_score ?? prev.risk_score,
                }
              : null
          )
        }

        if (event === 'completed') {
          setCurrentNode(null)
          setCompletedNodes((prev) => Array.from(new Set([...prev, 'pr_agent'])))
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'completed',
                  pr_url: data.pr_url ?? prev.pr_url,
                }
              : null
          )
        }

        if (event === 'rejected') {
          setCurrentNode(null)
          setRunState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'rejected',
                }
              : null
          )
        }

        if (event === 'error') {
          setErrorBanner(data.error || 'Agent execution error encountered.')
        }

        if (event === 'done') {
          setIsStreaming(false)
          syncState(threadId)
        }
      },
      () => {
        setIsStreaming(false)
      },
      (err) => {
        console.warn('SSE stream notice:', err)
        setIsStreaming(false)
      }
    )

    return () => {
      unsubscribe()
      setIsStreaming(false)
    }
  }, [threadId, syncState])

  const handleRunCreated = (newThreadId: string) => {
    setRunsList((prev) => [newThreadId, ...prev.filter((id) => id !== newThreadId)])
    setThreadId(newThreadId)
    setEvents([])
    setCompletedNodes([])
    setCurrentNode('guardrail')
    setErrorBanner(null)
  }

  const handleSelectRun = (id: string) => {
    if (id === threadId) return
    setThreadId(id)
    setEvents([])
    setCompletedNodes([])
    setCurrentNode(null)
    setErrorBanner(null)
  }

  const handleDecisionResumed = () => {
    syncState(threadId!)
    setIsStreaming(true)
  }

  // Derive risk factors & candidate diff
  const riskScore = runState?.risk_score ?? (events.find((e) => e.data.risk_score !== undefined)?.data.risk_score || 0.0)
  const riskReasons = runState?.values?.risk_reasons || ['Changes touch critical core logic', 'Potential regression risk']
  const patchDiff = runState?.values?.patch_diff || (events.find((e) => e.data.node === 'fix_test')?.data.message?.includes('---') ? events.find((e) => e.data.node === 'fix_test')?.data.message : `--- a/src/core/session.py\n+++ b/src/core/session.py\n@@ -10,3 +10,4 @@\n+    # Fix memory leak on loop termination\n+    await session.cleanup()`)

  const isHitlPaused = runState?.status === 'paused_hitl' || events.some((e) => e.event === 'hitl_paused' && runState?.status !== 'completed' && runState?.status !== 'rejected')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Header */}
      <Header onOpenCreate={() => setIsModalOpen(true)} activeThreadId={threadId} />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Banner */}
        {errorBanner && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-xs text-rose-400 hover:text-white px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Runs Switcher bar & Launch Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <History className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
              Run Sessions:
            </span>

            {runsList.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No runs launched yet</span>
            ) : (
              runsList.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelectRun(id)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition shrink-0 flex items-center gap-1.5 ${
                    id === threadId
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Activity className="w-3 h-3 text-indigo-300" />
                  <span>{id}</span>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {threadId && (
              <button
                onClick={() => syncState(threadId)}
                title="Fetch latest snapshot"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Run</span>
            </button>
          </div>
        </div>

        {/* Hero Welcome if no active run */}
        {!threadId && (
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 border border-slate-800 rounded-3xl p-10 text-center max-w-2xl mx-auto space-y-6 shadow-2xl mt-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-500/25">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome to AgentGate SWE Platform
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                An enterprise-grade autonomous SWE agent system powered by LangGraph, E2B cloud sandbox, and Human-In-The-Loop safety guardrails.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <Layers className="w-4 h-4 text-indigo-400 mb-2" />
                <h4 className="text-xs font-bold text-white">8-Node StateGraph</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Orchestrated from guardrails to verified pull request generation.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <Compass className="w-4 h-4 text-emerald-400 mb-2" />
                <h4 className="text-xs font-bold text-white">E2B Sandboxing</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Patches applied and verified inside isolated containers.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                <Clock className="w-4 h-4 text-amber-400 mb-2" />
                <h4 className="text-xs font-bold text-white">HITL Review</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Risk score evaluation with human approval gates.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Your First SWE Run</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Run Workflow & Live Visualizers */}
        {threadId && (
          <div className="space-y-6">
            {/* LangGraph Pipeline Stepper */}
            <ExecutionGraph
              currentNode={currentNode}
              completedNodes={completedNodes}
              status={runState?.status || 'running'}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />

            {/* HITL Sign-off Station (Appears when paused for human review) */}
            {isHitlPaused && (
              <HitlDecisionCard
                threadId={threadId}
                riskScore={riskScore}
                riskReasons={riskReasons}
                patchDiff={patchDiff}
                onResumed={handleDecisionResumed}
              />
            )}

            {/* Run Summary Card */}
            <RunSummary runState={runState} onRefresh={() => syncState(threadId)} />

            {/* Real-time SSE Stream Terminal */}
            <EventStreamLog
              events={events}
              isStreaming={isStreaming}
              onClear={() => setEvents([])}
            />
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <CreateRunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRunCreated={handleRunCreated}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        AgentGate Autonomous SWE Platform &bull; Powered by LangGraph, E2B, MCP &bull; FastAPI Backend
      </footer>
    </div>
  )
}
