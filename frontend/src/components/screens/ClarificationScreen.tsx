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
    <div className="max-w-3xl w-full mx-auto px-6 py-8 space-y-7 animate-in fade-in duration-200">
      {/* Attention banner */}
      <div className="bg-[#fef5ea] border border-[#fae3cd] rounded-2xl p-4 text-[#8a5314] flex items-start gap-3">
        <span className="w-5 h-5 rounded-full bg-[#d97706] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
          ?
        </span>
        <div>
          <h1 className="text-sm font-bold text-[#8a5314]">
            Paused: Human Clarification Needed
          </h1>
          <p className="text-xs text-[#7d5019] mt-0.5">
            The research agent identified multiple architectural interpretations. Select an approach to proceed.
          </p>
        </div>
      </div>

      {isSubmitted ? (
        <div className="p-6 bg-[#f0f9f4] border border-[#cbe4d7] rounded-2xl text-center space-y-2">
          <h2 className="text-sm font-bold text-[#18533e]">Clarification Submitted</h2>
          <p className="text-xs text-[#2b6a50]">
            The agent received your architectural choice and resumed patch authoring in the sandbox.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#e8e6df] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6"
        >
          {/* The Question */}
          <div className="space-y-1.5 pb-2 border-b border-[#f2f0ea]">
            <span className="text-[11px] font-semibold text-[#8c8980] uppercase tracking-wider">
              Agent Question
            </span>
            <h2 className="text-base font-semibold text-[#1a1918] leading-snug">
              How should the session expiration TTL be enforced?
            </h2>
            <p className="text-xs text-[#6e6a62] leading-relaxed">
              Issue #60 requests that login tokens must expire, but does not specify whether to employ an inactivity sliding window or a strict calendar expiration.
            </p>
          </div>

          {/* Option buttons */}
          <div className="space-y-3" role="radiogroup" aria-label="Expiration strategy options">
            <span className="text-xs font-semibold text-[#1a1918]">Select approach:</span>
            {OPTIONS.map((opt) => {
              const isSelected = selectedOption === opt.title
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.title)}
                  className={`w-full min-h-[52px] p-4 rounded-xl border text-left transition flex items-start justify-between cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#18533e] bg-[#f8faf8]'
                      : 'border-[#e7e5de] bg-white hover:border-[#cdc9bf]'
                  }`}
                >
                  <div className="pr-3">
                    <p className={`text-xs font-semibold ${isSelected ? 'text-[#18533e]' : 'text-[#2b2926]'}`}>
                      {opt.title}
                    </p>
                    <p className="text-[11px] text-[#706c64] mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected ? 'border-[#18533e] bg-[#18533e]' : 'border-[#c5c1b6] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Optional custom text box */}
          <div className="space-y-2">
            <label htmlFor="clarification-notes" className="block text-xs font-semibold text-[#1a1918]">
              Additional instructions or constraints (Optional):
            </label>
            <textarea
              id="clarification-notes"
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="E.g., Please also ensure error messages returned to clients do not leak internal timestamps."
              className="w-full bg-[#faf9f5] border border-[#dcd8ce] rounded-xl p-3 text-xs text-[#1a1918] placeholder-[#9c978f] focus:outline-none focus:border-[#18533e]"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f2f0ea]">
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#18533e] hover:bg-[#134433] shadow-sm transition cursor-pointer"
            >
              Submit clarification &amp; resume
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

