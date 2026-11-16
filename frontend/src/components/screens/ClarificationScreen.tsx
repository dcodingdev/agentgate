import React, { useState } from 'react'

interface ClarificationScreenProps {
  onSubmitClarification?: (choice: string, notes: string) => void
}

export const ClarificationScreen: React.FC<ClarificationScreenProps> = ({
  onSubmitClarification,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    'Sliding window: Expire session 24 hours after last user activity'
  )
  const [customNotes, setCustomNotes] = useState<string>('')
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

  const OPTIONS = [
    {
      id: 'opt1',
      title: 'Sliding window: Expire 24 hours after last user activity',
      description: 'Extends session validity with every active API request; recommended for user session UX.',
    },
    {
      id: 'opt2',
      title: 'Fixed window: Strict 7 days expiration from token issue date',
      description: 'Tokens become invalid after 7 days regardless of activity; recommended for strict security policies.',
    },
    {
      id: 'opt3',
      title: 'Configurable TTL via environment variable (SESSION_TTL_HOURS)',
      description: 'Reads TTL from server configuration with a default fallback of 48 hours.',
    },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
    if (onSubmitClarification) {
      onSubmitClarification(selectedOption, customNotes)
    }
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 space-y-3.5 animate-in fade-in duration-200">
      {/* Attention banner */}
      <div className="bg-[#fff4da] border-2 border-[#18181b] rounded-xl p-3.5 text-[#18181b] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[3px_3px_0px_#18181b]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#d31611] text-white flex items-center justify-center font-black text-xs shrink-0 border border-[#18181b]">
            ?
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#18181b] tracking-tight font-geist">
              Paused: Human Architectural Guidance Required
            </h1>
            <p className="text-[11px] text-[#666666] font-medium">
              Supervisor identified multiple implementations. Select an approach to resume execution.
            </p>
          </div>
        </div>

        <span className="badge-accent text-xs shrink-0">Guidance Required</span>
      </div>

      {isSubmitted ? (
        <div className="p-6 bg-[#ebdbb7] border-2 border-[#18181b] rounded-xl text-center space-y-1.5 shadow-[2px_2px_0px_#18181b]">
          <h2 className="text-base font-extrabold text-[#18181b] font-geist">Clarification Dispatched</h2>
          <p className="text-xs text-[#18181b] font-medium">
            The agent received your architectural preference and resumed patch synthesis inside the sandbox.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT COLUMN: Architectural Choice Options (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <section className="card-canvas-elevated p-4 space-y-3">
              <div className="space-y-1 pb-2.5 border-b border-[#e5e5e5]">
                <span className="text-[11px] font-extrabold text-[#d31611] uppercase tracking-wider">
                  Supervisor Query
                </span>
                <h2 className="text-xl font-extrabold text-[#18181b] leading-snug font-geist">
                  How should the session expiration TTL be enforced?
                </h2>
                <p className="text-xs text-[#666666] leading-relaxed">
                  Issue #60 requests that login tokens must expire, but does not specify whether to employ an inactivity sliding window or a strict calendar expiration.
                </p>
              </div>

              {/* Option cards */}
              <div className="space-y-3" role="radiogroup" aria-label="Expiration strategy options">
                <span className="text-xs font-extrabold text-[#18181b] uppercase tracking-wider">
                  Select Architectural Pattern:
                </span>
                {OPTIONS.map((opt) => {
                  const isSelected = selectedOption === opt.title
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOption(opt.title)}
                      className={`w-full min-h-[58px] p-4 rounded-lg text-left transition flex items-start justify-between cursor-pointer border-2 ${
                        isSelected
                          ? 'border-[#18181b] bg-[#fff4da] shadow-[2px_2px_0px_#18181b]'
                          : 'border-[#e5e5e5] bg-white hover:border-[#18181b]'
                      }`}
                    >
                      <div className="pr-3">
                        <p className="text-xs font-extrabold text-[#18181b]">
                          {opt.title}
                        </p>
                        <p className="text-[11px] text-[#666666] mt-0.5 leading-relaxed font-medium">
                          {opt.description}
                        </p>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border-2 border-[#18181b] shrink-0 mt-0.5 flex items-center justify-center ${
                          isSelected ? 'bg-[#d31611]' : 'bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Instructions & Submit Action (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            <section className="card-canvas-elevated p-6 space-y-5">
              <div className="border-b-2 border-[#18181b] pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#d31611]">
                  Decision Dispatch
                </span>
                <h3 className="text-base font-extrabold text-[#18181b] font-geist mt-0.5">
                  Confirm Guidance
                </h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="clarification-notes" className="block text-xs font-bold text-[#18181b]">
                  Additional Constraints or Code Invariants (Optional):
                </label>
                <textarea
                  id="clarification-notes"
                  rows={4}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="E.g., Please ensure error messages returned to clients do not leak internal timestamps or UTC offsets."
                  className="w-full bg-white border-2 border-[#18181b] rounded-md p-3 text-xs text-[#18181b] placeholder-[#666666] focus:outline-none focus:border-[#d31611]"
                />
              </div>

              <div className="p-3 bg-[#fff4da] border-2 border-[#18181b] rounded-md text-xs text-[#18181b] font-medium leading-relaxed">
                Submitting this selection updates the SWE agent's execution state and triggers patch generation inside the sandbox.
              </div>

              <button
                type="submit"
                className="w-full btn-cta py-3 text-sm text-center block"
              >
                Submit Guidance &amp; Resume Run &rarr;
              </button>
            </section>
          </div>
        </form>
      )}
    </div>
  )
}
