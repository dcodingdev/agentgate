import React from 'react'
import { CheckCircle2, CircleDot } from 'lucide-react'
import { STAGES_CATALOG, type StageDefinition, type StreamEventPayload, type TerminologyMode } from '../types'
import { formatStageLabel } from '../utils/terminology'

export interface PipelineStepTrackerProps {
  events?: StreamEventPayload[]
  runStateStatus?: string
  currentAttempt?: number
  maxAttempts?: number
  terminologyMode?: TerminologyMode
  className?: string
}

const NODE_TO_STEP_INDEX: Record<string, number> = {
  guardrail: 0,
  supervisor: 1,
  issue_analysis: 2,
  code_search: 2,
  docs_lookup: 2,
  aggregate_research: 2,
  research: 2,
  fix_test: 3,
  sandbox: 3,
  verify: 4,
  reviewer: 5,
  hitl: 6,
  pr_agent: 7,
}

export const PipelineStepTracker: React.FC<PipelineStepTrackerProps> = ({
  events = [],
  runStateStatus,
  currentAttempt = 1,
  maxAttempts = 3,
  terminologyMode = 'both',
  className = '',
}) => {
  // Compute active step index
  let activeIndex = 0

  if (runStateStatus === 'completed') {
    activeIndex = 7
  } else if (runStateStatus === 'paused_hitl') {
    activeIndex = 6 // Human Sign-Off
  } else {
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i]
      const node = ev.data?.node
      if (node && node in NODE_TO_STEP_INDEX) {
        activeIndex = NODE_TO_STEP_INDEX[node]
        break
      }
      if (ev.event === 'hitl_paused' || ev.data?.status === 'paused_hitl') {
        activeIndex = 6 // Human Sign-Off
        break
      }
      if (ev.event === 'completed' || ev.data?.pr_url) {
        activeIndex = 7 // Publish PR
        break
      }
    }
  }

  const steps = STAGES_CATALOG.map((stage: StageDefinition, idx: number) => {
    let status: 'completed' | 'active' | 'remaining' = 'remaining'
    let meta = ''

    if (runStateStatus === 'completed') {
      status = 'completed'
    } else if (idx < activeIndex) {
      status = 'completed'
    } else if (idx === activeIndex) {
      status = 'active'
      if (runStateStatus === 'paused_hitl') {
        meta = 'Action Required'
      } else if (idx === 3) {
        meta = `Attempt ${currentAttempt}/${maxAttempts}`
      } else {
        meta = 'In Progress'
      }
    } else {
      status = 'remaining'
    }

    const { primary, secondary } = formatStageLabel(stage, terminologyMode)
    return {
      stage,
      status,
      meta,
      primary,
      secondary,
      isActive: idx === activeIndex,
    }
  })

  return (
    <section aria-label="Execution pipeline progression" className={`w-full ${className}`}>
      {/* Grid of all 8 steps fitting cleanly across the canvas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 w-full">
        {steps.map((item) => {
          const { stage, status, meta, primary, secondary } = item

          let cardTheme = ''
          let icon = null

          if (status === 'completed') {
            cardTheme =
              'bg-[#ecfdf5] border-2 border-[#059669] text-[#065f46] shadow-[2px_2px_0px_#059669]'
            icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
          } else if (status === 'active') {
            cardTheme =
              'bg-[#fff4da] border-2 border-[#d31611] text-[#18181b] shadow-[3px_3px_0px_#d31611] ring-2 ring-[#d31611]/30'
            icon = (
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d31611] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d31611]"></span>
              </span>
            )
          } else {
            cardTheme =
              'bg-[#f4f4f5] border-2 border-dashed border-[#d4d4d8] text-[#71717a] opacity-80'
            icon = <CircleDot className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
          }

          return (
            <div
              key={stage.step}
              className={`p-2 rounded-xl text-xs flex flex-col justify-between transition-all duration-200 select-none min-h-[64px] ${cardTheme}`}
            >
              {/* Header: Icon & Active Badge (Only shown when active) */}
              <div className="flex items-center justify-between gap-1 pb-1 border-b border-black/10">
                <div className="flex items-center gap-1">
                  {icon}
                </div>
                {meta ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black font-mono tracking-tight uppercase truncate bg-[#d31611] text-white animate-pulse">
                    {meta}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono opacity-50 font-bold uppercase">
                    {status === 'completed' ? 'Done' : 'Queued'}
                  </span>
                )}
              </div>

              {/* Title & Technical detail */}
              <div className="pt-1 space-y-0.5">
                <div className="font-extrabold text-[12px] leading-tight truncate" title={primary}>
                  {primary}
                </div>
                {secondary && (
                  <div className="text-[10px] font-mono opacity-70 truncate" title={secondary}>
                    {secondary}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
