import React, { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Radio,
  Terminal,
  Trash2,
} from 'lucide-react'
import type { StreamEventPayload } from '../types'

interface EventStreamLogProps {
  events: StreamEventPayload[]
  isStreaming: boolean
  onClear: () => void
}

export const EventStreamLog: React.FC<EventStreamLogProps> = ({ events, isStreaming, onClear }) => {
  const [autoScroll, setAutoScroll] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events, autoScroll])

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true
    return e.event === filterType
  })

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'node_update':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
      case 'hitl_paused':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      case 'rejected':
      case 'error':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      case 'done':
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col h-[480px] shadow-sm overflow-hidden">
      {/* Log Header */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">SSE Event Stream</h3>
          {isStreaming ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
              <Radio className="w-3 h-3 text-slate-500" />
              Stream Idle
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Events ({events.length})</option>
            <option value="node_update">Node Updates</option>
            <option value="hitl_paused">HITL Pauses</option>
            <option value="completed">Completed</option>
            <option value="error">Errors</option>
          </select>

          {/* Auto Scroll Toggle */}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
            />
            <span>Auto-scroll</span>
          </label>

          {/* Clear */}
          <button
            onClick={onClear}
            title="Clear Event Log"
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800/60 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs bg-slate-950/30 select-text"
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-10">
            <Clock className="w-6 h-6 opacity-40" />
            <p className="text-xs">Waiting for agent execution events...</p>
            <p className="text-[11px] text-slate-600">Events from /runs/:id/stream will appear here in real time</p>
          </div>
        ) : (
          filteredEvents.map((item, index) => {
            const isExpanded = expandedIndex === index
            return (
              <div
                key={index}
                className="group border border-slate-800/60 hover:border-slate-700/80 rounded-xl bg-slate-950/60 p-2.5 transition"
              >
                <div
                  onClick={() => toggleExpand(index)}
                  className="flex items-start justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 shrink-0">{item.timestamp}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getEventBadge(
                        item.event
                      )}`}
                    >
                      {item.event}
                    </span>
                    {item.data.node && (
                      <span className="text-slate-300 font-semibold text-[11px]">
                        [{item.data.node}]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="text-slate-500 group-hover:text-slate-300">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message preview */}
                <div className="mt-1 text-slate-300 text-xs break-all">
                  {item.data.message || item.data.error || item.data.reason || (
                    <span className="text-slate-500 italic">Payload received</span>
                  )}
                </div>

                {/* Meta badges */}
                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                  {item.data.status && (
                    <span className="text-slate-400">status: <span className="text-slate-200">{item.data.status}</span></span>
                  )}
                  {item.data.risk_score !== undefined && (
                    <span className="text-slate-400">risk: <span className="text-amber-400 font-semibold">{item.data.risk_score}</span></span>
                  )}
                  {item.data.pr_url && (
                    <span className="text-emerald-400 font-semibold truncate max-w-xs">{item.data.pr_url}</span>
                  )}
                </div>

                {/* Expandable JSON details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    <pre className="text-[11px] text-slate-400 overflow-x-auto p-2 bg-slate-900 rounded-lg">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
