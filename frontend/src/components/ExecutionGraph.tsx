import React from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  FileCode2,
  GitPullRequest,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import type { GraphNodeId, GraphNodeMeta } from '../types'

const NODES_PIPELINE: GraphNodeMeta[] = [
  {
    id: 'guardrail',
    title: '1. Guardrail',
    role: 'Security & Access Gate',
    description: 'Enforces repository authorization, checks allowed_repos policies, and validates prompt safety.',
  },
  {
    id: 'supervisor',
    title: '2. Supervisor',
    role: 'Execution Coordinator',
    description: 'Provisions an isolated E2B code interpreter sandbox and manages multi-agent handoffs.',
  },
  {
    id: 'research',
    title: '3. Research',
    role: 'Root Cause Analysis',
    description: 'Analyzes GitHub issue reproduction details, queries codebase, and identifies target files.',
  },
  {
    id: 'fix_test',
    title: '4. Fix & Patch',
    role: 'Patch Synthesis',
    description: 'Generates unified diff patch, authors regression test cases, and applies diff to sandbox files.',
  },
  {
    id: 'verify',
    title: '5. Verification',
    role: 'Sandbox Test Runner',
    description: 'Executes test suite (pytest) inside sandbox; returns test exit codes, passes, and failure logs.',
  },
  {
    id: 'reviewer',
    title: '6. Reviewer',
    role: 'Risk Assessment',
    description: 'Calculates risk score based on diff size and sensitive logic; determines if HITL sign-off is required.',
  },
  {
    id: 'hitl',
    title: '7. HITL Gate',
    role: 'Human In The Loop',
    description: 'Pauses workflow execution via LangGraph checkpointer awaiting human engineer approval or revision.',
  },
  {
    id: 'pr_agent',
    title: '8. PR Agent',
    role: 'Pull Request Publisher',
    description: 'Pushes fix branch to GitHub repository and opens verified Pull Request.',
  },
]

interface ExecutionGraphProps {
  currentNode?: string | null
  completedNodes: string[]
  status: string
  selectedNode: GraphNodeId | null
  onSelectNode: (node: GraphNodeId) => void
}

export const ExecutionGraph: React.FC<ExecutionGraphProps> = ({
  currentNode,
  completedNodes,
  status,
  selectedNode,
  onSelectNode,
}) => {
  const getNodeIcon = (id: GraphNodeId) => {
    switch (id) {
      case 'guardrail':
        return ShieldCheck
      case 'supervisor':
        return Bot
      case 'research':
        return Search
      case 'fix_test':
        return FileCode2
      case 'verify':
        return CheckCircle
      case 'reviewer':
        return Lock
      case 'hitl':
        return UserCheck
      case 'pr_agent':
        return GitPullRequest
      default:
        return Bot
    }
  }

  const getNodeStatus = (id: GraphNodeId) => {
    if (status === 'paused_hitl' && id === 'hitl') {
      return 'paused'
    }
    if (status === 'rejected' && id === 'guardrail' && completedNodes.length === 0) {
      return 'rejected'
    }
    if (completedNodes.includes(id)) {
      return 'completed'
    }
    if (currentNode === id) {
      return 'active'
    }
    return 'pending'
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>LangGraph Multi-Agent Workflow</span>
            <span className="text-xs font-normal text-slate-400">({status})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Autonomous state transitions with conditional routing, checkpoints, and safety gates
          </p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>HITL Paused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <span>Pending</span>
          </div>
        </div>
      </div>

      {/* Stepper Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {NODES_PIPELINE.map((node) => {
          const Icon = getNodeIcon(node.id)
          const nodeStatus = getNodeStatus(node.id)
          const isSelected = selectedNode === node.id

          let statusClass = 'border-slate-800/80 bg-slate-950/40 text-slate-400 hover:border-slate-700'
          let iconClass = 'text-slate-500 bg-slate-800/40'

          if (nodeStatus === 'completed') {
            statusClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
            iconClass = 'text-emerald-400 bg-emerald-500/10'
          } else if (nodeStatus === 'active') {
            statusClass = 'border-indigo-500 bg-indigo-950/30 text-indigo-200 ring-2 ring-indigo-500/30'
            iconClass = 'text-indigo-400 bg-indigo-500/20 animate-spin'
          } else if (nodeStatus === 'paused') {
            statusClass = 'border-amber-500 bg-amber-950/30 text-amber-200 ring-2 ring-amber-500/40'
            iconClass = 'text-amber-400 bg-amber-500/20 animate-bounce'
          } else if (nodeStatus === 'rejected') {
            statusClass = 'border-rose-500 bg-rose-950/30 text-rose-300 ring-2 ring-rose-500/40'
            iconClass = 'text-rose-400 bg-rose-500/20'
          }

          if (isSelected) {
            statusClass += ' ring-2 ring-white/50'
          }

          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden group cursor-pointer ${statusClass}`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconClass}`}>
                  {nodeStatus === 'active' ? (
                    <Loader2 className="w-4 h-4" />
                  ) : nodeStatus === 'paused' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {nodeStatus === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              </div>

              <div>
                <p className="font-semibold text-xs text-white leading-snug">{node.title}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{node.role}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Node Details Drawer/Banner */}
      {selectedNode && (
        <div className="mt-3 p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl flex items-start justify-between gap-4 text-xs animate-in fade-in duration-150">
          <div>
            <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px]">
              Node Overview: {selectedNode}
            </span>
            <p className="text-slate-300 mt-0.5">
              {NODES_PIPELINE.find((n) => n.id === selectedNode)?.description}
            </p>
          </div>
          <button
            onClick={() => onSelectNode(null as any)}
            className="text-slate-500 hover:text-slate-300 px-2 py-1 rounded text-[11px] hover:bg-slate-800/40"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

