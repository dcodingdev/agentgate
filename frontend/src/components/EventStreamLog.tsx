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
        return 'bg-[#fff4da] text-[#18181b] border-2 border-[#18181b]'
      case 'hitl_paused':
        return 'bg-[#fff4da] text-[#d31611] border-2 border-[#d31611]'
      case 'completed':
        return 'bg-[#ebdbb7] text-[#18181b] border-2 border-[#18181b]'
      case 'rejected':
      case 'error':
        return 'bg-[#fffdf8] text-[#d31611] border-2 border-[#d31611]'
      case 'done':
        return 'bg-white text-[#18181b] border border-[#18181b]'
      default:
        return 'bg-white text-[#666666] border border-[#e5e5e5]'
    }
  }

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="card-canvas-elevated flex flex-col h-[480px] overflow-hidden">
      {/* Log Header */}
      <div className="px-5 py-3.5 border-b-2 border-[#18181b] bg-[#fff4da] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[#d31611]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#18181b] font-geist">SSE Event Stream</h3>
          {isStreaming ? (
            <span className="badge-warm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d31611] animate-ping"></span>
              Live Connected
            </span>
          ) : (
            <span className="badge-warm flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#666666]" />
              Stream Idle
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border-2 border-[#18181b] rounded-md px-2.5 py-1 text-xs font-bold text-[#18181b] focus:outline-none"
          >
            <option value="all">All Events</option>
            <option value="node_update">Node Updates</option>
            <option value="hitl_paused">HITL Paused</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Autoscroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold border-2 border-[#18181b] transition cursor-pointer ${
              autoScroll ? 'bg-[#ebdbb7] text-[#18181b]' : 'bg-white text-[#666666]'
            }`}
          >
            Scroll: {autoScroll ? 'On' : 'Off'}
          </button>

          {/* Clear */}
          <button
            onClick={onClear}
            className="p-1 rounded-md border-2 border-[#18181b] bg-white text-[#18181b] hover:bg-[#fff4da] transition cursor-pointer"
            title="Clear Event Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-[#fffdf8]"
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#666666] space-y-2">
            <Radio className="w-8 h-8 opacity-40 text-[#18181b]" />
            <p className="font-bold">Waiting for Server-Sent Events...</p>
            <p className="text-[11px] font-sans text-[#666666]">
              Agent executions stream state updates here in real time
            </p>
          </div>
        ) : (
          filteredEvents.map((e, idx) => (
            <div
              key={idx}
              className="border-2 border-[#18181b] rounded-lg p-3 bg-white shadow-[1px_1px_0px_#18181b] transition"
            >
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(idx)}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getEventBadge(e.event)}`}>
                    {e.event}
                  </span>
                  {e.data?.node && (
                    <span className="font-bold text-[#d31611]">
                      [{e.data.node}]
                    </span>
                  )}
                  <span className="text-[#18181b] truncate max-w-md font-medium">
                    {e.data?.message || e.data?.status || (e.data?.sandbox_id ? `Sandbox: ${e.data.sandbox_id}` : '')}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[#666666] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {e.timestamp}
                  </span>
                  {expandedIndex === idx ? (
                    <ChevronDown className="w-4 h-4 text-[#18181b]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#666666]" />
                  )}
                </div>
              </div>

              {/* Collapsible raw data */}
              {expandedIndex === idx && (
                <div className="mt-3 pt-3 border-t-2 border-[#18181b] text-slate-100 bg-[#18181b] p-3 rounded-md overflow-x-auto text-[11px]">
                  <pre>{JSON.stringify(e.data, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 border-t-2 border-[#18181b] bg-[#fff4da] flex items-center justify-between text-[11px] text-[#18181b] font-bold shrink-0 font-mono">
        <span>Recorded: {filteredEvents.length} events</span>
        <span>SSE Endpoint: /runs/&#123;id&#125;/stream</span>
      </div>
    </div>
  )
}
