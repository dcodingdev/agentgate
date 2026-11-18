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
    role: 'Hybrid Orchestrator',
    description: 'Evaluates state, decides retry pivots, escalates early, or dispatches parallel research via LangGraph Send.',
  },
  {
    id: 'research',
    title: '3. Parallel Research',
    role: 'Fan-Out: Issue, Code & Docs',
    description: 'LangGraph Send spawns issue_analysis, code_search, and docs_lookup in parallel, joined by aggregate_research.',
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
    role: 'Pull Request Publishing',
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
      case 'issue_analysis':
      case 'code_search':
      case 'docs_lookup':
      case 'aggregate_research':
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
    <div className="card-canvas-elevated p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e5e5e5]">
        <div>
          <h2 className="text-base font-extrabold text-[#18181b] flex items-center gap-2 font-geist">
            <span>LangGraph Multi-Agent Workflow</span>
            <span className="badge-warm">
              {status}
            </span>
          </h2>
          <p className="text-xs text-[#666666] mt-0.5 font-medium">
            Autonomous state transitions with conditional routing, checkpoints, and safety gates
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-[#18181b]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#18181b]"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d31611] animate-pulse"></span>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fff4da] border border-[#18181b]"></span>
            <span>HITL Paused</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e5e5e5] border border-[#18181b]"></span>
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

          let statusClass = 'border-2 border-[#e5e5e5] bg-white text-[#666666] hover:border-[#18181b]'
          let iconClass = 'text-[#666666] bg-[#fffdf8] border border-[#e5e5e5]'

          if (nodeStatus === 'completed') {
            statusClass = 'border-2 border-[#18181b] bg-[#ebdbb7] text-[#18181b] shadow-[2px_2px_0px_#18181b]'
            iconClass = 'text-[#18181b] bg-white border border-[#18181b]'
          } else if (nodeStatus === 'active') {
            statusClass = 'border-2 border-[#18181b] bg-[#fff4da] text-[#d31611] shadow-[2px_2px_0px_#18181b]'
            iconClass = 'text-white bg-[#d31611] border border-[#18181b] animate-spin'
          } else if (nodeStatus === 'paused') {
            statusClass = 'border-2 border-[#d31611] bg-[#fff4da] text-[#d31611] shadow-[2px_2px_0px_#d31611]'
            iconClass = 'text-white bg-[#d31611] border border-[#18181b] animate-bounce'
          } else if (nodeStatus === 'rejected') {
            statusClass = 'border-2 border-[#d31611] bg-[#fffdf8] text-[#d31611] shadow-[2px_2px_0px_#d31611]'
            iconClass = 'text-white bg-[#d31611] border border-[#18181b]'
          }

          if (isSelected) {
            statusClass += ' ring-2 ring-[#d31611]'
          }

          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className={`p-3 rounded-lg text-left flex flex-col justify-between transition relative overflow-hidden group cursor-pointer min-h-[96px] ${statusClass}`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconClass}`}>
                  {nodeStatus === 'active' ? (
                    <Loader2 className="w-4 h-4" />
                  ) : nodeStatus === 'paused' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {nodeStatus === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-[#18181b]" />}
              </div>

              <div>
                <p className="font-extrabold text-xs text-[#18181b] leading-tight font-geist">{node.title}</p>
                <p className="text-[10px] text-[#666666] truncate mt-0.5 font-medium">{node.role}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Node Details Drawer/Banner */}
      {selectedNode && (
        <div className="mt-3 p-4 bg-[#fff4da] border-2 border-[#18181b] rounded-lg flex items-start justify-between gap-4 text-xs animate-in fade-in duration-150 shadow-[2px_2px_0px_#18181b]">
          <div>
            <span className="font-extrabold text-[#d31611] uppercase tracking-wider text-[11px]">
              Node Overview: {selectedNode}
            </span>
            <p className="text-[#18181b] mt-1 font-medium leading-relaxed">
              {NODES_PIPELINE.find((n) => n.id === selectedNode)?.description}
            </p>
          </div>
          <button
            onClick={() => onSelectNode(null as any)}
            className="btn-outline-dark text-xs py-1 px-2.5"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
